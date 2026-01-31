/**
 * Astronomical Calculation Utilities
 *
 * Provides:
 * - Julian Day calculations
 * - Moon phase calculations
 * - Zodiac sign determination
 * - Aspect calculations
 * - Swiss Ephemeris wrapper functions
 */

// Try to load swisseph, but don't fail if not available
let swisseph = null;
try {
  swisseph = require('swisseph');
} catch (err) {
  console.warn('Swiss Ephemeris not available - using fallback calculations');
}

// Zodiac signs
const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', element: 'Fire', start: 0 },
  { name: 'Taurus', symbol: '♉', element: 'Earth', start: 30 },
  { name: 'Gemini', symbol: '♊', element: 'Air', start: 60 },
  { name: 'Cancer', symbol: '♋', element: 'Water', start: 90 },
  { name: 'Leo', symbol: '♌', element: 'Fire', start: 120 },
  { name: 'Virgo', symbol: '♍', element: 'Earth', start: 150 },
  { name: 'Libra', symbol: '♎', element: 'Air', start: 180 },
  { name: 'Scorpio', symbol: '♏', element: 'Water', start: 210 },
  { name: 'Sagittarius', symbol: '♐', element: 'Fire', start: 240 },
  { name: 'Capricorn', symbol: '♑', element: 'Earth', start: 270 },
  { name: 'Aquarius', symbol: '♒', element: 'Air', start: 300 },
  { name: 'Pisces', symbol: '♓', element: 'Water', start: 330 },
];

// Planet codes for Swiss Ephemeris
const PLANETS = {
  Sun: 0,
  Moon: 1,
  Mercury: 2,
  Venus: 3,
  Mars: 4,
  Jupiter: 5,
  Saturn: 6,
  Uranus: 7,
  Neptune: 8,
  Pluto: 9,
  NorthNode: 10, // Mean Node
  Chiron: 15,
};

// Planet symbols
const PLANET_SYMBOLS = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
  NorthNode: '☊',
  SouthNode: '☋',
  Chiron: '⚷',
};

// Aspect definitions
const ASPECTS = [
  { name: 'Conjunction', angle: 0, symbol: '☌', orb: 8 },
  { name: 'Opposition', angle: 180, symbol: '☍', orb: 8 },
  { name: 'Trine', angle: 120, symbol: '△', orb: 8 },
  { name: 'Square', angle: 90, symbol: '□', orb: 7 },
  { name: 'Sextile', angle: 60, symbol: '⚹', orb: 6 },
];

// Moon phases
const MOON_PHASES = [
  { name: 'New Moon', emoji: '🌑', start: 0, end: 45 },
  { name: 'Waxing Crescent', emoji: '🌒', start: 45, end: 90 },
  { name: 'First Quarter', emoji: '🌓', start: 90, end: 135 },
  { name: 'Waxing Gibbous', emoji: '🌔', start: 135, end: 180 },
  { name: 'Full Moon', emoji: '🌕', start: 180, end: 225 },
  { name: 'Waning Gibbous', emoji: '🌖', start: 225, end: 270 },
  { name: 'Last Quarter', emoji: '🌗', start: 270, end: 315 },
  { name: 'Waning Crescent', emoji: '🌘', start: 315, end: 360 },
];

/**
 * Convert a Date to Julian Day number
 * @param {Date} date - JavaScript Date object
 * @returns {number} Julian Day number
 */
function dateToJulian(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  return jdn + (hour - 12) / 24;
}

/**
 * Convert Julian Day to Date
 * @param {number} jd - Julian Day number
 * @returns {Date} JavaScript Date object
 */
function julianToDate(jd) {
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;

  let A;
  if (Z < 2299161) {
    A = Z;
  } else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }

  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const day = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;

  const hours = F * 24;
  const hour = Math.floor(hours);
  const minutes = (hours - hour) * 60;
  const minute = Math.floor(minutes);
  const second = (minutes - minute) * 60;

  return new Date(Date.UTC(year, month - 1, day, hour, minute, Math.floor(second)));
}

/**
 * Get zodiac sign from ecliptic longitude
 * @param {number} longitude - Ecliptic longitude in degrees (0-360)
 * @returns {Object} Zodiac sign info
 */
function getZodiacSign(longitude) {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  const sign = ZODIAC_SIGNS[index];
  const degree = normalized % 30;

  return {
    ...sign,
    index,
    degree: Math.round(degree * 100) / 100,
  };
}

/**
 * Calculate moon phase from sun and moon longitude
 * @param {number} sunLong - Sun's ecliptic longitude
 * @param {number} moonLong - Moon's ecliptic longitude
 * @returns {Object} Moon phase info
 */
function getMoonPhase(sunLong, moonLong) {
  let angle = moonLong - sunLong;
  if (angle < 0) angle += 360;

  const illumination = (1 - Math.cos(angle * Math.PI / 180)) / 2 * 100;

  const phase = MOON_PHASES.find(p =>
    angle >= p.start && angle < p.end
  ) || MOON_PHASES[0];

  const age = angle / 12.19; // Average degrees per day

  return {
    phase: phase.name,
    emoji: phase.emoji,
    angle: Math.round(angle * 100) / 100,
    illumination: Math.round(illumination * 100) / 100,
    age: Math.round(age * 10) / 10,
    phaseIndex: MOON_PHASES.indexOf(phase),
  };
}

/**
 * Calculate aspect between two bodies
 * @param {number} long1 - First body's longitude
 * @param {number} long2 - Second body's longitude
 * @returns {Object|null} Aspect info or null if no aspect
 */
function findAspect(long1, long2) {
  let angle = Math.abs(long1 - long2);
  if (angle > 180) angle = 360 - angle;

  for (const aspect of ASPECTS) {
    const orb = Math.abs(angle - aspect.angle);
    if (orb <= aspect.orb) {
      const applying = isAspectApplying(long1, long2, aspect.angle);
      return {
        name: aspect.name,
        symbol: aspect.symbol,
        exactAngle: aspect.angle,
        actualAngle: Math.round(angle * 100) / 100,
        orb: Math.round(orb * 100) / 100,
        applying,
      };
    }
  }

  return null;
}

/**
 * Determine if aspect is applying (forming) or separating
 * Simplified calculation based on angular distance to exact aspect
 * @param {number} long1 - First body's longitude
 * @param {number} long2 - Second body's longitude
 * @param {number} aspectAngle - The aspect angle (0, 60, 90, 120, 180)
 * @returns {boolean} True if applying
 */
function isAspectApplying(long1, long2, aspectAngle) {
  // Calculate actual angle between the two bodies
  let angle = Math.abs(long1 - long2);
  if (angle > 180) angle = 360 - angle;

  // Simplified: if actual angle is less than exact aspect angle, consider it applying
  // For conjunction (0°), if normalized difference suggests bodies are approaching
  if (aspectAngle === 0) {
    const diff = ((long1 - long2 + 360) % 360);
    return diff > 180 || diff < 10;
  }

  return angle < aspectAngle;
}

/**
 * Calculate planet position using Swiss Ephemeris
 * @param {Date} date - Date for calculation
 * @param {number} planet - Planet code
 * @returns {Object} Planet position
 */
function getPlanetPosition(date, planet) {
  if (!swisseph) {
    // Fallback: return approximate position
    return {
      longitude: 0,
      latitude: 0,
      distance: 0,
      speed: 0,
      retrograde: false,
      error: 'Swiss Ephemeris not available',
    };
  }

  const jd = dateToJulian(date);
  const flags = swisseph.SEFLG_SPEED;

  try {
    const result = swisseph.swe_calc_ut(jd, planet, flags);

    if (result.error) {
      throw new Error(result.error);
    }

    const longitude = result.longitude;
    const sign = getZodiacSign(longitude);

    return {
      longitude,
      latitude: result.latitude,
      distance: result.distance,
      speed: result.longitudeSpeed,
      retrograde: result.longitudeSpeed < 0,
      sign: sign.name,
      signSymbol: sign.symbol,
      degree: sign.degree,
    };
  } catch (err) {
    console.error(`Error calculating ${planet}:`, err);
    return {
      longitude: 0,
      error: err.message,
    };
  }
}

/**
 * Get all planet positions for a date
 * @param {Date} date - Date for calculation
 * @returns {Object} All planet positions
 */
function getAllPlanetPositions(date) {
  const positions = {};

  for (const [name, code] of Object.entries(PLANETS)) {
    positions[name] = {
      ...getPlanetPosition(date, code),
      symbol: PLANET_SYMBOLS[name],
    };
  }

  return positions;
}

/**
 * Find all aspects between planets
 * @param {Object} positions - Planet positions object
 * @returns {Array} Array of aspects
 */
function findAllAspects(positions) {
  const aspects = [];
  const planetNames = Object.keys(positions);

  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const planet1 = planetNames[i];
      const planet2 = planetNames[j];

      if (positions[planet1].longitude && positions[planet2].longitude) {
        const aspect = findAspect(positions[planet1].longitude, positions[planet2].longitude);

        if (aspect) {
          aspects.push({
            planet1,
            planet2,
            symbol1: PLANET_SYMBOLS[planet1],
            symbol2: PLANET_SYMBOLS[planet2],
            ...aspect,
          });
        }
      }
    }
  }

  return aspects;
}

/**
 * Get retrograde planets
 * @param {Object} positions - Planet positions object
 * @returns {Array} Names of retrograde planets
 */
function getRetrogrades(positions) {
  return Object.entries(positions)
    .filter(([_, pos]) => pos.retrograde)
    .map(([name]) => name);
}

/**
 * Calculate simple moon phase without ephemeris
 * Uses a simple astronomical algorithm
 * @param {Date} date - Date to calculate
 * @returns {Object} Moon phase info
 */
function calculateSimpleMoonPhase(date) {
  // Known new moon: January 6, 2000 at 18:14 UTC
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const lunarCycle = 29.53058867; // Average synodic month in days

  const daysSinceKnown = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const cycles = daysSinceKnown / lunarCycle;
  const phase = (cycles - Math.floor(cycles)) * 360;

  return getMoonPhase(0, phase);
}

module.exports = {
  ZODIAC_SIGNS,
  PLANETS,
  PLANET_SYMBOLS,
  ASPECTS,
  MOON_PHASES,
  dateToJulian,
  julianToDate,
  getZodiacSign,
  getMoonPhase,
  findAspect,
  getPlanetPosition,
  getAllPlanetPositions,
  findAllAspects,
  getRetrogrades,
  calculateSimpleMoonPhase,
};
