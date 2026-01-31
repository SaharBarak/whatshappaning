/**
 * Cosmic Module - Cosmic Rays and Meteor Showers
 *
 * Estimates cosmic ray levels based on solar activity (inverse correlation)
 * and provides meteor shower calendar data.
 *
 * Cosmic rays are deflected by solar wind, so high solar activity
 * means lower cosmic ray flux at Earth's surface.
 *
 * Update frequency: Every 3 hours
 */

const solarModule = require('./solar');

// Baseline neutron count (cosmic ray proxy)
const BASELINE_NEUTRON_COUNT = 6750;

// Meteor shower static calendar data
const METEOR_SHOWERS = [
  {
    name: 'Quadrantids',
    startMonth: 1,
    startDay: 1,
    endMonth: 1,
    endDay: 5,
    peakMonth: 1,
    peakDay: 3,
    zhr: 120,
    radiant: 'Bootes',
  },
  {
    name: 'Lyrids',
    startMonth: 4,
    startDay: 16,
    endMonth: 4,
    endDay: 25,
    peakMonth: 4,
    peakDay: 22,
    zhr: 18,
    radiant: 'Lyra',
  },
  {
    name: 'Eta Aquariids',
    startMonth: 4,
    startDay: 19,
    endMonth: 5,
    endDay: 28,
    peakMonth: 5,
    peakDay: 6,
    zhr: 50,
    radiant: 'Aquarius',
  },
  {
    name: 'Perseids',
    startMonth: 7,
    startDay: 17,
    endMonth: 8,
    endDay: 24,
    peakMonth: 8,
    peakDay: 12,
    zhr: 100,
    radiant: 'Perseus',
  },
  {
    name: 'Orionids',
    startMonth: 10,
    startDay: 2,
    endMonth: 11,
    endDay: 7,
    peakMonth: 10,
    peakDay: 21,
    zhr: 20,
    radiant: 'Orion',
  },
  {
    name: 'Leonids',
    startMonth: 11,
    startDay: 6,
    endMonth: 11,
    endDay: 30,
    peakMonth: 11,
    peakDay: 17,
    zhr: 15,
    radiant: 'Leo',
  },
  {
    name: 'Geminids',
    startMonth: 12,
    startDay: 4,
    endMonth: 12,
    endDay: 17,
    peakMonth: 12,
    peakDay: 14,
    zhr: 150,
    radiant: 'Gemini',
  },
  {
    name: 'Ursids',
    startMonth: 12,
    startDay: 17,
    endMonth: 12,
    endDay: 26,
    peakMonth: 12,
    peakDay: 22,
    zhr: 10,
    radiant: 'Ursa Minor',
  },
];

/**
 * Calculate cosmic ray level category based on percentage of baseline
 * @param {number} percent - Percentage of baseline neutron count
 * @returns {string} Level: 'Low', 'Normal', 'Elevated', or 'High'
 */
function getCosmicRayLevel(percent) {
  if (percent < 95) return 'Low';
  if (percent <= 105) return 'Normal';
  if (percent <= 115) return 'Elevated';
  return 'High';
}

/**
 * Calculate cosmic ray trend based on Kp trend
 * Higher Kp = more solar activity = lower cosmic rays
 * So Kp rising = cosmic rays falling
 * @param {string} kpTrend - Kp index trend ('rising', 'falling', 'stable')
 * @returns {string} Cosmic ray trend
 */
function getCosmicRayTrend(kpTrend) {
  if (kpTrend === 'rising') return 'falling';
  if (kpTrend === 'falling') return 'rising';
  return 'stable';
}

/**
 * Estimate cosmic ray neutron count from solar activity
 * High solar activity (high Kp, many sunspots) = lower cosmic rays
 * Formula: neutronCount = 7000 - (kpIndex * 50) - (sunspotNumber * 0.5)
 * @param {number} kpIndex - Current Kp index (0-9)
 * @param {number} sunspotNumber - Current sunspot number
 * @returns {number} Estimated neutron count
 */
function estimateNeutronCount(kpIndex, sunspotNumber) {
  const kp = kpIndex || 3; // Default moderate activity
  const ssn = sunspotNumber || 100; // Default moderate sunspot count

  const neutronCount = 7000 - (kp * 50) - (ssn * 0.5);

  // Clamp to reasonable range (5500-7500)
  return Math.max(5500, Math.min(7500, Math.round(neutronCount)));
}

/**
 * Get date object for a shower date in a specific year
 * @param {number} month - Month (1-12)
 * @param {number} day - Day of month
 * @param {number} year - Year
 * @returns {Date} Date object
 */
function getShowerDate(month, day, year) {
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Check if a date falls within a shower's active period
 * Handles showers that cross year boundaries
 * @param {Date} date - Current date
 * @param {Object} shower - Meteor shower object
 * @returns {boolean} True if shower is currently active
 */
function isShowerActive(date, shower) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  // Simple case: shower doesn't cross year boundary
  if (shower.startMonth <= shower.endMonth) {
    if (month < shower.startMonth || month > shower.endMonth) return false;
    if (month === shower.startMonth && day < shower.startDay) return false;
    if (month === shower.endMonth && day > shower.endDay) return false;
    return true;
  }

  // Shower crosses year boundary (e.g., Dec to Jan)
  // Active if we're after the start OR before the end
  if (month > shower.startMonth || (month === shower.startMonth && day >= shower.startDay)) {
    return true;
  }
  if (month < shower.endMonth || (month === shower.endMonth && day <= shower.endDay)) {
    return true;
  }

  return false;
}

/**
 * Calculate days until a shower's peak date
 * @param {Date} now - Current date
 * @param {Object} shower - Meteor shower object
 * @returns {number} Days until peak (negative if past)
 */
function getDaysUntilPeak(now, shower) {
  const year = now.getUTCFullYear();
  let peakDate = getShowerDate(shower.peakMonth, shower.peakDay, year);

  // If peak is in the past this year, check next year
  const daysDiff = Math.floor((peakDate - now) / (1000 * 60 * 60 * 24));

  // If peak was more than 180 days ago, use next year's peak
  if (daysDiff < -180) {
    peakDate = getShowerDate(shower.peakMonth, shower.peakDay, year + 1);
    return Math.floor((peakDate - now) / (1000 * 60 * 60 * 24));
  }

  return daysDiff;
}

/**
 * Format peak date as ISO date string
 * @param {Date} now - Current date
 * @param {Object} shower - Meteor shower object
 * @returns {string} Peak date in YYYY-MM-DD format
 */
function formatPeakDate(now, shower) {
  const year = now.getUTCFullYear();
  const daysUntil = getDaysUntilPeak(now, shower);

  // If peak is far in the past, use next year
  const peakYear = daysUntil < -180 ? year + 1 : year;
  const month = String(shower.peakMonth).padStart(2, '0');
  const day = String(shower.peakDay).padStart(2, '0');

  return `${peakYear}-${month}-${day}`;
}

/**
 * Get currently active meteor showers
 * @param {Date} now - Current date
 * @returns {Array} Array of active shower objects
 */
function getActiveShowers(now) {
  return METEOR_SHOWERS
    .filter(shower => isShowerActive(now, shower))
    .map(shower => ({
      name: shower.name,
      zhr: shower.zhr,
      peakDate: formatPeakDate(now, shower),
      radiant: shower.radiant,
      daysUntilPeak: getDaysUntilPeak(now, shower),
    }));
}

/**
 * Get the next upcoming meteor shower (not currently active)
 * @param {Date} now - Current date
 * @returns {Object|null} Next upcoming shower or null
 */
function getUpcomingShower(now) {
  const activeNames = new Set(
    METEOR_SHOWERS
      .filter(shower => isShowerActive(now, shower))
      .map(shower => shower.name)
  );

  // Find showers that aren't currently active and sort by days until peak
  const upcoming = METEOR_SHOWERS
    .filter(shower => !activeNames.has(shower.name))
    .map(shower => ({
      name: shower.name,
      zhr: shower.zhr,
      peakDate: formatPeakDate(now, shower),
      daysUntilPeak: getDaysUntilPeak(now, shower),
    }))
    .filter(shower => shower.daysUntilPeak > 0)
    .sort((a, b) => a.daysUntilPeak - b.daysUntilPeak);

  return upcoming.length > 0 ? upcoming[0] : null;
}

/**
 * Check if any meteor shower peaks tonight
 * @param {Date} now - Current date
 * @returns {boolean} True if a shower peaks today
 */
function isPeakTonight(now) {
  const activeShowers = getActiveShowers(now);
  return activeShowers.some(shower =>
    shower.daysUntilPeak === 0 || shower.daysUntilPeak === -1
  );
}

/**
 * Collect cosmic ray and meteor shower data
 * @returns {Promise<Object>} Cosmic and meteor shower data
 */
async function collect() {
  const now = new Date();
  const timestamp = now.toISOString();

  // Try to get solar data for cosmic ray estimation
  let kpIndex = null;
  let sunspotNumber = null;
  let kpTrend = null;
  let isEstimated = true;
  let source = 'Estimated from solar activity';

  try {
    // Use the solar module's exported fetch functions
    const [kpData, ssn] = await Promise.all([
      solarModule.fetchKpIndex(),
      solarModule.fetchSunspotNumber(),
    ]);

    if (kpData) {
      kpIndex = kpData.kpIndex;
      kpTrend = kpData.kpTrend;
    }

    if (ssn !== null) {
      sunspotNumber = ssn;
    }

    if (kpIndex !== null || sunspotNumber !== null) {
      source = 'Estimated from NOAA solar data';
    }
  } catch (error) {
    console.error('Error fetching solar data for cosmic ray estimation:', error.message);
  }

  // Calculate cosmic ray values
  const neutronCount = estimateNeutronCount(kpIndex, sunspotNumber);
  const percentOfBaseline = Math.round((neutronCount / BASELINE_NEUTRON_COUNT) * 100);
  const level = getCosmicRayLevel(percentOfBaseline);
  const trend = getCosmicRayTrend(kpTrend || 'stable');

  // Get meteor shower data
  const activeShowers = getActiveShowers(now);
  const upcomingShower = getUpcomingShower(now);
  const peakTonight = isPeakTonight(now);

  return {
    timestamp,
    cosmicRays: {
      neutronCount,
      percentOfBaseline,
      trend,
      level,
      source,
      isEstimated,
    },
    meteorShowers: {
      active: activeShowers,
      upcoming: upcomingShower,
      peakTonight,
    },
    collectedAt: timestamp,
  };
}

module.exports = {
  name: 'cosmic',
  schedule: '0 */3 * * *', // Every 3 hours
  collect,
};
