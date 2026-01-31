/**
 * Moon Module - Lunar Phase and Position Data
 *
 * Primary: Swiss Ephemeris (swisseph npm package) for accurate calculations
 * Fallback: Farmsense API (https://api.farmsense.net/v1/moonphases/)
 * Ultimate fallback: Jean Meeus astronomical algorithms
 *
 * Update frequency: Every 3 hours
 */

const {
  MOON_PHASES,
  PLANETS,
  dateToJulian,
  julianToDate,
  getZodiacSign,
  getMoonPhase,
  getPlanetPosition,
  calculateSimpleMoonPhase,
} = require('../utils/astro');

// Try to load swisseph
let swisseph = null;
try {
  swisseph = require('swisseph');
} catch (err) {
  // Will use fallback calculations
}

// Moon phase emoji mapping
const PHASE_EMOJIS = {
  'New': '🌑',
  'New Moon': '🌑',
  'Waxing Crescent': '🌒',
  'First Quarter': '🌓',
  'Waxing Gibbous': '🌔',
  'Full': '🌕',
  'Full Moon': '🌕',
  'Waning Gibbous': '🌖',
  'Last Quarter': '🌗',
  'Waning Crescent': '🌘',
};

// Phase name normalization (for output consistency)
const PHASE_NAMES = {
  'New Moon': 'New',
  'Full Moon': 'Full',
};

/**
 * Normalize phase name for output
 * @param {string} phaseName - Raw phase name
 * @returns {string} Normalized phase name
 */
function normalizePhase(phaseName) {
  return PHASE_NAMES[phaseName] || phaseName;
}

/**
 * Get emoji for a phase
 * @param {string} phaseName - Phase name
 * @returns {string} Emoji
 */
function getPhaseEmoji(phaseName) {
  return PHASE_EMOJIS[phaseName] || PHASE_EMOJIS[normalizePhase(phaseName)] || '🌙';
}

/**
 * Calculate moon data using Swiss Ephemeris
 * @param {Date} date - Date for calculation
 * @returns {Object|null} Moon data or null if swisseph unavailable
 */
function calculateWithSwissEph(date) {
  if (!swisseph) {
    return null;
  }

  try {
    const jd = dateToJulian(date);
    const flags = swisseph.SEFLG_SPEED;

    // Get Sun position
    const sunResult = swisseph.swe_calc_ut(jd, PLANETS.Sun, flags);
    if (sunResult.error) {
      throw new Error(`Sun calculation error: ${sunResult.error}`);
    }

    // Get Moon position
    const moonResult = swisseph.swe_calc_ut(jd, PLANETS.Moon, flags);
    if (moonResult.error) {
      throw new Error(`Moon calculation error: ${moonResult.error}`);
    }

    const sunLong = sunResult.longitude;
    const moonLong = moonResult.longitude;

    // Calculate phase
    const phaseData = getMoonPhase(sunLong, moonLong);

    // Get moon's zodiac sign
    const moonSign = getZodiacSign(moonLong);

    return {
      sunLongitude: sunLong,
      moonLongitude: moonLong,
      phase: phaseData.phase,
      illumination: phaseData.illumination,
      age: phaseData.age,
      angle: phaseData.angle,
      sign: moonSign.name,
      signDegree: moonSign.degree,
    };
  } catch (err) {
    console.error('Swiss Ephemeris calculation failed:', err.message);
    return null;
  }
}

/**
 * Fetch moon data from Farmsense API
 * @param {Date} date - Date for calculation
 * @returns {Promise<Object|null>} Moon data or null on failure
 */
async function fetchFromFarmsense(date) {
  try {
    const timestamp = Math.floor(date.getTime() / 1000);
    const url = `https://api.farmsense.net/v1/moonphases/?d=${timestamp}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Farmsense API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid response from Farmsense API');
    }

    const moonData = data[0];

    // Map Farmsense phase names to our standard names
    const phaseMapping = {
      'New Moon': 'New',
      'Waxing Crescent': 'Waxing Crescent',
      'First Quarter': 'First Quarter',
      'Waxing Gibbous': 'Waxing Gibbous',
      'Full Moon': 'Full',
      'Waning Gibbous': 'Waning Gibbous',
      'Third Quarter': 'Last Quarter',
      'Last Quarter': 'Last Quarter',
      'Waning Crescent': 'Waning Crescent',
    };

    const phaseName = phaseMapping[moonData.Phase] || moonData.Phase;

    return {
      phase: phaseName,
      illumination: Math.round(moonData.Illumination * 100),
      age: moonData.Age || null,
      sign: moonData.Moon || null,
      source: 'farmsense',
    };
  } catch (err) {
    console.error('Farmsense API fetch failed:', err.message);
    return null;
  }
}

/**
 * Calculate moon phase using Jean Meeus algorithms (fallback)
 * @param {Date} date - Date for calculation
 * @returns {Object} Moon data
 */
function calculateWithMeeus(date) {
  // Use the simple moon phase calculation from astro utils
  const phaseData = calculateSimpleMoonPhase(date);

  // Calculate approximate moon sign using simplified lunar node calculation
  // The moon moves about 13.2 degrees per day through the zodiac
  const lunarCycle = 27.321661; // Sidereal month in days
  const knownMoonPosition = {
    date: new Date('2000-01-01T00:00:00Z'),
    longitude: 120.5, // Moon was in Leo on this date
  };

  const daysSinceKnown = (date.getTime() - knownMoonPosition.date.getTime()) / (1000 * 60 * 60 * 24);
  const degreesPerDay = 360 / lunarCycle;
  let moonLongitude = (knownMoonPosition.longitude + (daysSinceKnown * degreesPerDay)) % 360;
  if (moonLongitude < 0) moonLongitude += 360;

  const moonSign = getZodiacSign(moonLongitude);

  return {
    phase: phaseData.phase,
    illumination: Math.round(phaseData.illumination),
    age: phaseData.age,
    angle: phaseData.angle,
    sign: moonSign.name,
    signDegree: moonSign.degree,
    source: 'meeus',
  };
}

/**
 * Calculate the date of the next major moon phase
 * @param {Date} fromDate - Starting date
 * @param {string} targetPhase - Target phase name ('New', 'First Quarter', 'Full', 'Last Quarter')
 * @returns {Object} Next phase info
 */
function calculateNextPhase(fromDate, currentPhase) {
  const lunarCycle = 29.53058867; // Average synodic month in days
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');

  // Calculate current position in lunar cycle
  const daysSinceKnown = (fromDate.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const currentCyclePosition = (daysSinceKnown % lunarCycle + lunarCycle) % lunarCycle;

  // Phase targets (days into cycle)
  const phaseTargets = {
    'New': 0,
    'First Quarter': lunarCycle / 4,
    'Full': lunarCycle / 2,
    'Last Quarter': (3 * lunarCycle) / 4,
  };

  // Determine next phase based on current phase
  const phaseOrder = ['New', 'First Quarter', 'Full', 'Last Quarter'];
  const normalizedCurrent = normalizePhase(currentPhase);

  // Find current phase index (handle partial phase names)
  let currentIndex = -1;
  if (normalizedCurrent.includes('New')) currentIndex = 0;
  else if (normalizedCurrent.includes('Waxing Crescent')) currentIndex = 0;
  else if (normalizedCurrent.includes('First Quarter')) currentIndex = 1;
  else if (normalizedCurrent.includes('Waxing Gibbous')) currentIndex = 1;
  else if (normalizedCurrent.includes('Full')) currentIndex = 2;
  else if (normalizedCurrent.includes('Waning Gibbous')) currentIndex = 2;
  else if (normalizedCurrent.includes('Last Quarter')) currentIndex = 3;
  else if (normalizedCurrent.includes('Waning Crescent')) currentIndex = 3;

  const nextIndex = (currentIndex + 1) % 4;
  const nextPhase = phaseOrder[nextIndex];
  const targetDayInCycle = phaseTargets[nextPhase];

  // Calculate days until next phase
  let daysUntil = targetDayInCycle - currentCyclePosition;
  if (daysUntil <= 0) {
    daysUntil += lunarCycle;
  }

  const nextDate = new Date(fromDate.getTime() + daysUntil * 24 * 60 * 60 * 1000);

  return {
    phase: nextPhase,
    date: nextDate.toISOString(),
  };
}

/**
 * Collect moon data from the best available source
 * @returns {Promise<Object>} Moon data
 */
async function collect() {
  const now = new Date();
  let moonData = null;
  let source = 'unknown';

  // Try Swiss Ephemeris first (most accurate)
  moonData = calculateWithSwissEph(now);
  if (moonData) {
    source = 'swisseph';
  }

  // Try Farmsense API as fallback
  if (!moonData) {
    moonData = await fetchFromFarmsense(now);
    if (moonData) {
      source = 'farmsense';
    }
  }

  // Use Meeus calculations as ultimate fallback
  if (!moonData) {
    moonData = calculateWithMeeus(now);
    source = 'meeus';
  }

  // Normalize phase name for output
  const phaseName = moonData.phase;
  const normalizedPhase = normalizePhase(phaseName);

  // Calculate next phase
  const nextPhase = calculateNextPhase(now, phaseName);

  // Get emoji
  const emoji = getPhaseEmoji(phaseName);

  return {
    phase: normalizedPhase,
    phaseName: normalizedPhase,
    illumination: moonData.illumination,
    age: moonData.age,
    emoji: emoji,
    sign: moonData.sign,
    nextPhase: {
      phase: nextPhase.phase,
      date: nextPhase.date,
    },
    voidOfCourse: {
      active: false,
      start: null,
      end: null,
    },
    collectedAt: now.toISOString(),
    _meta: {
      source: source,
    },
  };
}

/**
 * Calculate moon data for a specific date
 * @param {Date} date - Date to calculate for
 * @returns {Promise<Object>} Moon data
 */
async function calculate(date = new Date()) {
  let moonData = null;
  let source = 'unknown';

  // Try Swiss Ephemeris first
  moonData = calculateWithSwissEph(date);
  if (moonData) {
    source = 'swisseph';
  }

  // Try Farmsense API as fallback
  if (!moonData) {
    moonData = await fetchFromFarmsense(date);
    if (moonData) {
      source = 'farmsense';
    }
  }

  // Use Meeus calculations as ultimate fallback
  if (!moonData) {
    moonData = calculateWithMeeus(date);
    source = 'meeus';
  }

  const phaseName = moonData.phase;
  const normalizedPhase = normalizePhase(phaseName);
  const nextPhase = calculateNextPhase(date, phaseName);
  const emoji = getPhaseEmoji(phaseName);

  return {
    phase: normalizedPhase,
    phaseName: normalizedPhase,
    illumination: moonData.illumination,
    age: moonData.age,
    emoji: emoji,
    sign: moonData.sign,
    nextPhase: {
      phase: nextPhase.phase,
      date: nextPhase.date,
    },
    voidOfCourse: {
      active: false,
      start: null,
      end: null,
    },
    calculatedAt: date.toISOString(),
    _meta: {
      source: source,
    },
  };
}

/**
 * Get moon data for a specific date string
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Promise<Object>} Moon data
 */
async function getForDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00Z'); // Use noon to avoid date boundary issues
  return calculate(date);
}

module.exports = {
  name: 'moon',
  schedule: '0 */3 * * *', // Every 3 hours
  collect,
  calculate,
  getForDate,
};
