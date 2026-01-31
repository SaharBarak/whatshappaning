/**
 * Solar-Geo Index - Combined Solar and Geomagnetic Activity Measure
 *
 * Aggregates solar and geomagnetic data into a single index representing
 * the overall space weather impact on Earth.
 *
 * Formula: Kp(40%) + Flare(30%) + Schumann(20%) + Wind(10%)
 *
 * Update frequency: Every 3 hours
 */

const path = require('path');

// Import the modules we need for data
const solarModule = require(path.join(__dirname, '../modules/solar.js'));
const schumannModule = require(path.join(__dirname, '../modules/schumann.js'));

// Component weights
const WEIGHTS = {
  kp: 0.4,
  flare: 0.3,
  schumann: 0.2,
  wind: 0.1,
};

// Level thresholds and labels
const LEVELS = [
  { max: 2, level: 'Calm', color: 'green' },
  { max: 4, level: 'Low', color: 'lightgreen' },
  { max: 6, level: 'Moderate', color: 'yellow' },
  { max: 8, level: 'Elevated', color: 'orange' },
  { max: 10, level: 'High', color: 'red' },
];

// In-memory cache for trend calculation
let historyCache = [];
const HISTORY_WINDOW = 24; // Keep 24 entries (24 * 3 hours = 72 hours of data)

/**
 * Normalize Kp index to 0-10 scale
 * Kp ranges from 0-9, so we scale it to 0-10
 * @param {number} kp - Kp index (0-9)
 * @returns {number} Normalized value (0-10)
 */
function normalizeKp(kp) {
  if (kp === null || kp === undefined) return 0;
  return Math.min(10, Math.max(0, (kp / 9) * 10));
}

/**
 * Normalize solar flare class to 0-10 scale
 * Flare classes: A=0, B=1, C=2, M=5, X=8, plus fractional part
 * @param {string} flareClass - Flare classification (e.g., "C2.1", "M5.2", "X1.4")
 * @returns {number} Normalized value (0-10)
 */
function normalizeFlare(flareClass) {
  if (!flareClass || typeof flareClass !== 'string') return 0;

  const classLetter = flareClass.charAt(0).toUpperCase();
  const intensity = parseFloat(flareClass.substring(1)) || 0;

  let baseValue;
  switch (classLetter) {
    case 'A':
      baseValue = 0;
      break;
    case 'B':
      baseValue = 1;
      break;
    case 'C':
      baseValue = 2;
      break;
    case 'M':
      baseValue = 5;
      break;
    case 'X':
      baseValue = 8;
      break;
    default:
      return 0;
  }

  // Add fractional part (intensity / 10, capped to keep under next level)
  const fractional = Math.min(intensity / 10, 2);
  return Math.min(10, baseValue + fractional);
}

/**
 * Normalize Schumann amplitude to 0-10 scale
 * Normal amplitude is around 10, elevated is 30+, high is 50+
 * @param {number} amplitude - Schumann amplitude
 * @returns {number} Normalized value (0-10)
 */
function normalizeSchumann(amplitude) {
  if (amplitude === null || amplitude === undefined) return 5; // Default to middle value
  // Scale: amplitude / 50 * 10, capped at 10
  return Math.min(10, Math.max(0, (amplitude / 50) * 10));
}

/**
 * Normalize solar wind speed to 0-10 scale
 * Typical range: 300-800 km/s
 * @param {number} speed - Solar wind speed in km/s
 * @returns {number} Normalized value (0-10)
 */
function normalizeSolarWind(speed) {
  if (speed === null || speed === undefined) return 2; // Default to low value
  // Scale: (speed - 300) / 500 * 10
  const normalized = ((speed - 300) / 500) * 10;
  return Math.min(10, Math.max(0, normalized));
}

/**
 * Get the level label for a given index value
 * @param {number} value - Index value (0-10)
 * @returns {Object} Level information
 */
function getLevel(value) {
  for (const level of LEVELS) {
    if (value <= level.max) {
      return { level: level.level, color: level.color };
    }
  }
  return { level: 'High', color: 'red' };
}

/**
 * Calculate trend from history
 * @param {number} currentValue - Current index value
 * @returns {string} Trend: 'rising', 'falling', or 'stable'
 */
function calculateTrend(currentValue) {
  if (historyCache.length < 2) return 'stable';

  // Compare current value to value from ~24 hours ago (8 entries ago for 3-hour intervals)
  const compareIndex = Math.max(0, historyCache.length - 8);
  const pastValue = historyCache[compareIndex].value;

  const diff = currentValue - pastValue;

  if (diff >= 0.5) return 'rising';
  if (diff <= -0.5) return 'falling';
  return 'stable';
}

/**
 * Update history cache with new value
 * @param {number} value - Current index value
 */
function updateHistory(value) {
  const now = new Date().toISOString();

  historyCache.push({ value, timestamp: now });

  // Keep only the most recent entries
  if (historyCache.length > HISTORY_WINDOW) {
    historyCache = historyCache.slice(-HISTORY_WINDOW);
  }
}

/**
 * Calculate the Solar-Geo index from module data
 * @param {Object} solarData - Data from solar module
 * @param {Object} schumannData - Data from schumann module
 * @returns {Object} Solar-Geo index result
 */
function calculateIndex(solarData, schumannData) {
  // Extract raw values
  const kpRaw = solarData?.kpIndex ?? null;
  const flareRaw = solarData?.latestFlare?.class ?? null;
  const schumannRaw = schumannData?.currentAmplitude ?? null;
  const windRaw = solarData?.solarWind?.speed ?? null;

  // Normalize each component
  const kpNorm = normalizeKp(kpRaw);
  const flareNorm = normalizeFlare(flareRaw);
  const schumannNorm = normalizeSchumann(schumannRaw);
  const windNorm = normalizeSolarWind(windRaw);

  // Calculate weighted average
  const value = (
    kpNorm * WEIGHTS.kp +
    flareNorm * WEIGHTS.flare +
    schumannNorm * WEIGHTS.schumann +
    windNorm * WEIGHTS.wind
  );

  // Round to one decimal place
  const roundedValue = Math.round(value * 10) / 10;

  // Get level
  const levelInfo = getLevel(roundedValue);

  // Calculate trend
  const trend = calculateTrend(roundedValue);

  // Update history
  updateHistory(roundedValue);

  return {
    value: roundedValue,
    level: levelInfo.level,
    color: levelInfo.color,
    components: {
      kp: kpRaw,
      flare: flareRaw,
      schumann: schumannRaw,
      wind: windRaw,
    },
    normalized: {
      kp: Math.round(kpNorm * 10) / 10,
      flare: Math.round(flareNorm * 10) / 10,
      schumann: Math.round(schumannNorm * 10) / 10,
      wind: Math.round(windNorm * 10) / 10,
    },
    trend,
  };
}

/**
 * Collect data and calculate the Solar-Geo index
 * @returns {Promise<Object>} Solar-Geo index data
 */
async function collect() {
  const now = new Date();
  const timestamp = now.toISOString();

  try {
    // Collect data from both modules in parallel
    const [solarData, schumannData] = await Promise.all([
      solarModule.collect(),
      schumannModule.collect(),
    ]);

    // Calculate the index
    const indexResult = calculateIndex(solarData, schumannData);

    return {
      timestamp,
      ...indexResult,
      collectedAt: now.toISOString(),
    };
  } catch (error) {
    console.error('Error calculating Solar-Geo index:', error.message);

    // Return a default/error state
    return {
      timestamp,
      value: null,
      level: 'Unknown',
      color: 'gray',
      components: {
        kp: null,
        flare: null,
        schumann: null,
        wind: null,
      },
      trend: 'stable',
      error: error.message,
      collectedAt: now.toISOString(),
    };
  }
}

/**
 * Calculate index from pre-fetched data (for API efficiency)
 * @param {Object} solarData - Pre-fetched solar data
 * @param {Object} schumannData - Pre-fetched schumann data
 * @returns {Object} Solar-Geo index data
 */
function calculateFromData(solarData, schumannData) {
  const now = new Date();
  const indexResult = calculateIndex(solarData, schumannData);

  return {
    timestamp: now.toISOString(),
    ...indexResult,
    collectedAt: now.toISOString(),
  };
}

/**
 * Clear history cache (for testing)
 */
function clearHistory() {
  historyCache = [];
}

module.exports = {
  name: 'solarGeo',
  schedule: '0 */3 * * *', // Every 3 hours
  collect,
  calculateFromData,
  calculateIndex,
  // Export helper functions for testing
  normalizeKp,
  normalizeFlare,
  normalizeSchumann,
  normalizeSolarWind,
  getLevel,
  clearHistory,
  WEIGHTS,
  LEVELS,
};
