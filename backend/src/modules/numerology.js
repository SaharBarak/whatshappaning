/**
 * Numerology & Planetary Hours Module
 *
 * Calculates daily Universal Day Number and current Planetary Hour.
 * - Universal Day Number: Date reduced to single digit (preserving master numbers 11, 22)
 * - Planetary Hours: Ancient Chaldean system dividing day into 24 hours ruled by planets
 *
 * Update frequency: Every 30 minutes (for planetary hours)
 */

// Number meanings and vibrations
const NUMBER_MEANINGS = {
  1: {
    vibration: 'Leadership',
    keywords: 'New beginnings, independence, initiative',
    meaning: 'Day of leadership, new beginnings, and taking initiative',
  },
  2: {
    vibration: 'Partnership',
    keywords: 'Balance, cooperation, diplomacy',
    meaning: 'Day of partnership, balance, and cooperation',
  },
  3: {
    vibration: 'Expression',
    keywords: 'Creativity, communication, joy',
    meaning: 'Day of creativity, expression, and joyful communication',
  },
  4: {
    vibration: 'Foundation',
    keywords: 'Stability, hard work, order',
    meaning: 'Day of stability, building foundations, and disciplined work',
  },
  5: {
    vibration: 'Change',
    keywords: 'Freedom, adventure, versatility',
    meaning: 'Day of change, freedom, and unexpected events',
  },
  6: {
    vibration: 'Harmony',
    keywords: 'Love, responsibility, nurturing',
    meaning: 'Day of harmony, love, and nurturing responsibility',
  },
  7: {
    vibration: 'Wisdom',
    keywords: 'Introspection, spirituality, analysis',
    meaning: 'Day of wisdom, introspection, and spiritual insight',
  },
  8: {
    vibration: 'Power',
    keywords: 'Abundance, authority, karma',
    meaning: 'Day of abundance, power, and karmic returns',
  },
  9: {
    vibration: 'Completion',
    keywords: 'Humanitarianism, endings, wisdom',
    meaning: 'Day of completion, humanitarianism, and letting go',
  },
  11: {
    vibration: 'Intuition',
    keywords: 'Master number, spiritual insight, illumination',
    meaning: 'Master number day of intuition, spiritual illumination, and higher consciousness',
  },
  22: {
    vibration: 'Master Builder',
    keywords: 'Master number, manifestation, turning dreams into reality',
    meaning: 'Master number day of manifestation, building dreams into reality',
  },
};

// Planetary data
const PLANETS = {
  Sun: { symbol: '☉', index: 0 },
  Moon: { symbol: '☽', index: 1 },
  Mars: { symbol: '♂', index: 2 },
  Mercury: { symbol: '☿', index: 3 },
  Jupiter: { symbol: '♃', index: 4 },
  Venus: { symbol: '♀', index: 5 },
  Saturn: { symbol: '♄', index: 6 },
};

// Chaldean order sequence for planetary hours
const PLANET_SEQUENCE = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];

// Day rulers (Sunday = 0, Monday = 1, etc.)
const DAY_RULERS = {
  0: 'Sun',      // Sunday
  1: 'Moon',     // Monday
  2: 'Mars',     // Tuesday
  3: 'Mercury',  // Wednesday
  4: 'Jupiter',  // Thursday
  5: 'Venus',    // Friday
  6: 'Saturn',   // Saturday
};

/**
 * Calculate Universal Day Number for a given date
 * @param {Date} date - JavaScript Date
 * @returns {Object} Numerology data
 */
function calculateUniversalDay(date) {
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();

  // Initial sum
  let sum = day + month + year;
  const steps = [`${day} + ${month} + ${year} = ${sum}`];

  // Reduce to single digit (preserve 11, 22, 33 as master numbers)
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    const digits = String(sum).split('');
    const newSum = digits.reduce((a, b) => a + parseInt(b), 0);
    steps.push(`${sum} → ${newSum}`);
    sum = newSum;
  }

  const universalDay = sum;
  const calculation = steps.join(' → ');
  const data = NUMBER_MEANINGS[universalDay];

  return {
    universalDay,
    calculation,
    meaning: data.meaning,
    vibration: data.vibration,
    keywords: data.keywords,
  };
}

/**
 * Get planetary hour information for a given time
 * @param {Date} date - JavaScript Date
 * @returns {Object} Planetary hour data
 */
function calculatePlanetaryHour(date) {
  // Fixed sunrise/sunset for MVP (spec gap workaround)
  const SUNRISE_HOUR = 6;
  const SUNSET_HOUR = 18;

  const utcDate = new Date(date);
  const dayOfWeek = utcDate.getUTCDay();
  const hours = utcDate.getUTCHours();
  const minutes = utcDate.getUTCMinutes();

  // Get day ruler
  const dayRuler = DAY_RULERS[dayOfWeek];
  const daySymbol = PLANETS[dayRuler].symbol;

  // Determine if daytime or nighttime
  const isDay = hours >= SUNRISE_HOUR && hours < SUNSET_HOUR;

  // Calculate hour length (in milliseconds)
  const periodStart = isDay ? SUNRISE_HOUR : SUNSET_HOUR;
  const periodEnd = isDay ? SUNSET_HOUR : SUNRISE_HOUR + 24; // Next sunrise
  const periodLength = periodEnd - periodStart; // Hours in the period
  const hourLength = periodLength / 12; // Each period divided into 12 hours

  // Calculate which planetary hour we're in (0-11)
  const currentHour = hours + minutes / 60;
  const hoursSincePeriodStart = isDay
    ? currentHour - SUNRISE_HOUR
    : (currentHour >= SUNSET_HOUR ? currentHour - SUNSET_HOUR : currentHour + 24 - SUNSET_HOUR);

  const hourIndex = Math.floor(hoursSincePeriodStart / hourLength);

  // Calculate planet index in sequence
  const dayRulerIndex = PLANETS[dayRuler].index;
  const startIndex = PLANET_SEQUENCE.indexOf(dayRuler);
  const offset = isDay ? hourIndex : hourIndex + 12;
  const planetIndex = (startIndex + offset) % 7;

  const currentPlanet = PLANET_SEQUENCE[planetIndex];
  const planetSymbol = PLANETS[currentPlanet].symbol;

  // Calculate hour start and end times
  const hourStartHours = periodStart + (hourIndex * hourLength);
  const hourEndHours = periodStart + ((hourIndex + 1) * hourLength);

  const formatTime = (hourDecimal) => {
    const h = Math.floor(hourDecimal) % 24;
    const m = Math.floor((hourDecimal % 1) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const hourStart = formatTime(hourStartHours);
  const hourEnd = formatTime(hourEndHours);

  return {
    current: currentPlanet,
    symbol: planetSymbol,
    dayRuler,
    daySymbol,
    hourStart,
    hourEnd,
    isDay,
  };
}

/**
 * Calculate both numerology and planetary hour for a date
 * @param {Date} date - JavaScript Date (defaults to now)
 * @returns {Object} Combined numerology and planetary hour data
 */
function calculate(date = new Date()) {
  const numerology = calculateUniversalDay(date);
  const planetaryHour = calculatePlanetaryHour(date);

  return {
    date: date.toISOString().split('T')[0],
    time: date.toISOString(),
    numerology,
    planetaryHour,
  };
}

/**
 * Get numerology and planetary hour for a specific date
 * @param {string} dateStr - Date string (YYYY-MM-DD) or ISO string
 * @returns {Object} Numerology data
 */
function getForDate(dateStr) {
  let date;

  // Handle both YYYY-MM-DD and full ISO strings
  if (dateStr.includes('T')) {
    date = new Date(dateStr);
  } else {
    date = new Date(dateStr + 'T12:00:00Z'); // Use noon to avoid timezone issues
  }

  return calculate(date);
}

/**
 * Get the day name from day of week number
 * @param {number} dayOfWeek - Day of week (0-6)
 * @returns {string} Day name
 */
function getDayName(dayOfWeek) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

/**
 * Get all 24 planetary hours for a specific date
 * @param {Date} date - JavaScript Date
 * @returns {Array} Array of all 24 planetary hours
 */
function getAllPlanetaryHours(date) {
  const SUNRISE_HOUR = 6;
  const SUNSET_HOUR = 18;

  const dayOfWeek = date.getUTCDay();
  const dayRuler = DAY_RULERS[dayOfWeek];
  const startIndex = PLANET_SEQUENCE.indexOf(dayRuler);

  const hours = [];

  // Day hours (12 hours from sunrise to sunset)
  const dayHourLength = (SUNSET_HOUR - SUNRISE_HOUR) / 12;
  for (let i = 0; i < 12; i++) {
    const planetIndex = (startIndex + i) % 7;
    const planet = PLANET_SEQUENCE[planetIndex];
    const hourStart = SUNRISE_HOUR + (i * dayHourLength);
    const hourEnd = SUNRISE_HOUR + ((i + 1) * dayHourLength);

    const formatTime = (hourDecimal) => {
      const h = Math.floor(hourDecimal);
      const m = Math.floor((hourDecimal % 1) * 60);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    hours.push({
      hour: i + 1,
      planet,
      symbol: PLANETS[planet].symbol,
      start: formatTime(hourStart),
      end: formatTime(hourEnd),
      isDay: true,
    });
  }

  // Night hours (12 hours from sunset to sunrise)
  const nightHourLength = (24 - SUNSET_HOUR + SUNRISE_HOUR) / 12;
  for (let i = 0; i < 12; i++) {
    const planetIndex = (startIndex + i + 12) % 7;
    const planet = PLANET_SEQUENCE[planetIndex];
    const hourStart = SUNSET_HOUR + (i * nightHourLength);
    const hourEnd = SUNSET_HOUR + ((i + 1) * nightHourLength);

    const formatTime = (hourDecimal) => {
      const h = Math.floor(hourDecimal) % 24;
      const m = Math.floor((hourDecimal % 1) * 60);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    hours.push({
      hour: i + 13,
      planet,
      symbol: PLANETS[planet].symbol,
      start: formatTime(hourStart),
      end: formatTime(hourEnd),
      isDay: false,
    });
  }

  return hours;
}

/**
 * Module collect function for scheduler
 * @returns {Promise<Object>} Collected data
 */
async function collect() {
  const now = new Date();
  const data = calculate(now);

  // Add additional metadata
  const dayOfWeek = now.getUTCDay();

  return {
    ...data,
    dayOfWeek,
    dayName: getDayName(dayOfWeek),
    collectedAt: now.toISOString(),
  };
}

module.exports = {
  name: 'numerology',
  schedule: '*/30 * * * *', // Every 30 minutes for planetary hours
  collect,
  calculate,
  getForDate,
  calculateUniversalDay,
  calculatePlanetaryHour,
  getAllPlanetaryHours,
  getDayName,
  NUMBER_MEANINGS,
  PLANETS,
  PLANET_SEQUENCE,
  DAY_RULERS,
};
