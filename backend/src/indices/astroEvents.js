/**
 * Astronomical Events Index - Count of Active Cosmic Events
 *
 * Aggregates astronomical events (retrogrades, eclipses, aspects, lunar phases)
 * into a single activity score representing current celestial intensity.
 *
 * Points System:
 * - Planet Retrograde: 1 point each
 * - Mercury Retrograde: +1 bonus point
 * - Eclipse within 14 days: 2 points
 * - Eclipse within 3 days: +2 additional points
 * - Major Aspect (outer planets, conjunction/opposition, ≤3° orb): 1 point each
 * - Void of Course Moon: 0.5 points
 * - Full/New Moon within 24 hours: 1 point
 *
 * Update frequency: Every 3 hours
 */

const path = require('path');

// Import the modules we need for data
const astrologyModule = require(path.join(__dirname, '../modules/astrology.js'));
const moonModule = require(path.join(__dirname, '../modules/moon.js'));

// Outer planets for major aspect scoring
const OUTER_PLANETS = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

// Major aspects that count toward the index
const MAJOR_ASPECTS = ['Conjunction', 'Opposition'];

// Maximum orb for major aspects to count
const MAJOR_ASPECT_ORB = 3;

// Activity level thresholds
const LEVELS = [
  { max: 0, level: 'Quiet' },
  { max: 2, level: 'Low' },
  { max: 4, level: 'Active' },
  { max: 6, level: 'Busy' },
  { max: Infinity, level: 'Intense' },
];

/**
 * Get the activity level for a given count
 * @param {number} count - Event count
 * @returns {string} Activity level
 */
function getLevel(count) {
  for (const level of LEVELS) {
    if (count <= level.max) {
      return level.level;
    }
  }
  return 'Intense';
}

/**
 * Check if a phase is New or Full
 * @param {string} phaseName - Moon phase name
 * @returns {boolean} True if New or Full
 */
function isNewOrFullMoon(phaseName) {
  if (!phaseName) return false;
  const normalized = phaseName.toLowerCase();
  return normalized === 'new' || normalized === 'full' ||
         normalized === 'new moon' || normalized === 'full moon';
}

/**
 * Check if Full/New moon is within 24 hours
 * @param {Object} moonData - Moon module data
 * @returns {boolean} True if within 24 hours of exact phase
 */
function isPhaseWithin24Hours(moonData) {
  // Check current phase first
  if (isNewOrFullMoon(moonData.phase)) {
    // If illumination is near extremes, we're close to exact phase
    const illum = moonData.illumination;
    if (illum !== undefined) {
      // New moon: ~0%, Full moon: ~100%
      if (illum <= 2 || illum >= 98) {
        return true;
      }
    }
  }

  // Check next phase timing
  if (moonData.nextPhase && moonData.nextPhase.date) {
    const now = new Date();
    const nextPhaseDate = new Date(moonData.nextPhase.date);
    const hoursUntil = (nextPhaseDate - now) / (1000 * 60 * 60);

    // If next major phase is within 24 hours
    if (hoursUntil > 0 && hoursUntil <= 24) {
      const nextPhase = moonData.nextPhase.phase;
      if (isNewOrFullMoon(nextPhase)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Count retrograde planets and calculate points
 * @param {Array} retrogrades - Array of retrograde planet names
 * @returns {Object} Points and event description
 */
function calculateRetrogradePoints(retrogrades) {
  if (!retrogrades || !Array.isArray(retrogrades) || retrogrades.length === 0) {
    return { points: 0, events: [] };
  }

  let points = 0;
  const events = [];

  for (const planet of retrogrades) {
    if (planet === 'None currently') continue;

    points += 1;
    events.push(`${planet} retrograde`);

    // Mercury gets bonus point
    if (planet === 'Mercury') {
      points += 1;
    }
  }

  return { points, events };
}

/**
 * Calculate eclipse proximity points
 * @param {Object} nextEclipse - Eclipse data from astrology module
 * @returns {Object} Points and event description
 */
function calculateEclipsePoints(nextEclipse) {
  if (!nextEclipse || nextEclipse.daysUntil === null || nextEclipse.daysUntil === undefined) {
    return { points: 0, events: [] };
  }

  const days = nextEclipse.daysUntil;
  let points = 0;
  const events = [];

  if (days <= 14) {
    points += 2;
    events.push(`${nextEclipse.type} Eclipse in ${days} days`);

    if (days <= 3) {
      points += 2; // Additional 2 points for imminent eclipse
    }
  }

  return { points, events };
}

/**
 * Count major aspects between outer planets
 * @param {Array} aspects - Array of aspect objects
 * @returns {Object} Points and event descriptions
 */
function calculateMajorAspectPoints(aspects) {
  if (!aspects || !Array.isArray(aspects)) {
    return { points: 0, events: [] };
  }

  let points = 0;
  const events = [];

  for (const aspect of aspects) {
    // Check if both planets are outer planets
    const planet1IsOuter = OUTER_PLANETS.includes(aspect.planet1);
    const planet2IsOuter = OUTER_PLANETS.includes(aspect.planet2);

    // At least one planet should be outer for it to count
    if (!planet1IsOuter && !planet2IsOuter) continue;

    // Check if it's a major aspect
    if (!MAJOR_ASPECTS.includes(aspect.aspect)) continue;

    // Check orb
    if (aspect.orb > MAJOR_ASPECT_ORB) continue;

    points += 1;
    events.push(`${aspect.planet1} ${aspect.aspect.toLowerCase()} ${aspect.planet2} (${aspect.orb}°)`);
  }

  return { points, events };
}

/**
 * Calculate void of course moon points
 * @param {Object} vocMoon - VOC Moon data from astrology or moon module
 * @returns {Object} Points and event description
 */
function calculateVOCPoints(vocMoon) {
  if (!vocMoon || !vocMoon.active) {
    return { points: 0, events: [] };
  }

  return {
    points: 0.5,
    events: ['Moon Void of Course'],
  };
}

/**
 * Calculate lunar phase points
 * @param {Object} moonData - Moon module data
 * @returns {Object} Points and event description
 */
function calculateLunarPhasePoints(moonData) {
  if (!moonData) {
    return { points: 0, events: [] };
  }

  if (isPhaseWithin24Hours(moonData)) {
    const phaseName = isNewOrFullMoon(moonData.phase) ? moonData.phase : moonData.nextPhase?.phase;
    return {
      points: 1,
      events: [`${phaseName || 'Lunar'} Moon peak`],
    };
  }

  return { points: 0, events: [] };
}

/**
 * Calculate the Astronomical Events index from module data
 * @param {Object} astrologyData - Data from astrology module
 * @param {Object} moonData - Data from moon module
 * @returns {Object} Astro Events index result
 */
function calculateIndex(astrologyData, moonData) {
  // Calculate all component points
  const retrograde = calculateRetrogradePoints(astrologyData?.retrogrades);
  const eclipse = calculateEclipsePoints(astrologyData?.nextEclipse);
  const aspects = calculateMajorAspectPoints(astrologyData?.aspects);
  const voc = calculateVOCPoints(astrologyData?.voidOfCourseMoon || moonData?.voidOfCourse);
  const lunar = calculateLunarPhasePoints(moonData);

  // Sum total points
  const totalPoints = retrograde.points + eclipse.points + aspects.points + voc.points + lunar.points;

  // Round to nearest integer for the count
  const count = Math.round(totalPoints);

  // Combine all events
  const events = [
    ...retrograde.events,
    ...eclipse.events,
    ...aspects.events,
    ...voc.events,
    ...lunar.events,
  ];

  // Get level
  const level = getLevel(count);

  return {
    count,
    exactScore: Math.round(totalPoints * 10) / 10, // Keep precise score for transparency
    events,
    level,
    breakdown: {
      retrogrades: { points: retrograde.points, count: retrograde.events.length },
      eclipse: { points: eclipse.points, active: eclipse.events.length > 0 },
      majorAspects: { points: aspects.points, count: aspects.events.length },
      voidOfCourse: { points: voc.points, active: voc.events.length > 0 },
      lunarPhase: { points: lunar.points, active: lunar.events.length > 0 },
    },
  };
}

/**
 * Collect data and calculate the Astronomical Events index
 * @returns {Promise<Object>} Astro Events index data
 */
async function collect() {
  const now = new Date();
  const timestamp = now.toISOString();

  try {
    // Collect data from both modules in parallel
    const [astrologyData, moonData] = await Promise.all([
      astrologyModule.collect(),
      moonModule.collect(),
    ]);

    // Calculate the index
    const indexResult = calculateIndex(astrologyData, moonData);

    return {
      timestamp,
      ...indexResult,
      collectedAt: now.toISOString(),
    };
  } catch (error) {
    console.error('Error calculating Astro Events index:', error.message);

    // Return a default/error state
    return {
      timestamp,
      count: 0,
      events: [],
      level: 'Unknown',
      error: error.message,
      collectedAt: now.toISOString(),
    };
  }
}

/**
 * Calculate index from pre-fetched data (for API efficiency)
 * @param {Object} astrologyData - Pre-fetched astrology data
 * @param {Object} moonData - Pre-fetched moon data
 * @returns {Object} Astro Events index data
 */
function calculateFromData(astrologyData, moonData) {
  const now = new Date();
  const indexResult = calculateIndex(astrologyData, moonData);

  return {
    timestamp: now.toISOString(),
    ...indexResult,
    collectedAt: now.toISOString(),
  };
}

module.exports = {
  name: 'astroEvents',
  schedule: '0 */3 * * *', // Every 3 hours
  collect,
  calculateFromData,
  calculateIndex,
  // Export helper functions for testing
  getLevel,
  calculateRetrogradePoints,
  calculateEclipsePoints,
  calculateMajorAspectPoints,
  calculateVOCPoints,
  calculateLunarPhasePoints,
  isNewOrFullMoon,
  isPhaseWithin24Hours,
  OUTER_PLANETS,
  MAJOR_ASPECTS,
  LEVELS,
};
