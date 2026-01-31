/**
 * Solar Module - Space Weather Data from NOAA SWPC
 *
 * Collects solar and geomagnetic activity data from NOAA's Space Weather
 * Prediction Center (SWPC). Provides Kp index, solar flares, sunspot numbers,
 * solar wind conditions, and geomagnetic storm alerts.
 *
 * Primary data source: NOAA SWPC (no authentication required)
 * Update frequency: Every 3 hours
 */

const axios = require('axios');

// NOAA SWPC API endpoints
const NOAA_ENDPOINTS = {
  kpIndex: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
  solarFlares: 'https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json',
  sunspots: 'https://services.swpc.noaa.gov/json/solar-cycle/sunspots.json',
  geomagneticStorms: 'https://services.swpc.noaa.gov/products/noaa-scales.json',
  solarWind: 'https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json',
};

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

// Cache for fallback when APIs fail
let cache = {
  data: null,
  timestamp: null,
};

/**
 * Kp Index categories
 * @param {number} kp - Kp index value (0-9)
 * @returns {string} Category description
 */
function getKpCategory(kp) {
  if (kp <= 2) return 'Quiet';
  if (kp <= 4) return 'Unsettled';
  if (kp <= 6) return 'Active/Storm';
  return 'Major Storm';
}

/**
 * Determine Kp trend from recent values
 * @param {Array} kpValues - Array of recent Kp values
 * @returns {string} Trend: 'rising', 'falling', or 'stable'
 */
function getKpTrend(kpValues) {
  if (!kpValues || kpValues.length < 2) return 'stable';

  const recent = kpValues.slice(-3);
  if (recent.length < 2) return 'stable';

  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = last - first;

  if (diff > 1) return 'rising';
  if (diff < -1) return 'falling';
  return 'stable';
}

/**
 * Calculate approximate Ap index from Kp values
 * Ap is roughly Kp * 3.2 as a daily average
 * @param {Array} kpValues - Array of Kp values
 * @returns {number} Approximate Ap index
 */
function calculateApIndex(kpValues) {
  if (!kpValues || kpValues.length === 0) return 0;

  // Get last 8 values (24 hours of 3-hour Kp values)
  const dailyValues = kpValues.slice(-8);
  const average = dailyValues.reduce((sum, val) => sum + val, 0) / dailyValues.length;

  return Math.round(average * 3.2);
}

/**
 * Fetch Kp index data from NOAA
 * @returns {Promise<Object>} Kp index data
 */
async function fetchKpIndex() {
  try {
    const response = await axios.get(NOAA_ENDPOINTS.kpIndex, {
      timeout: REQUEST_TIMEOUT,
    });

    const data = response.data;

    // Data format: Array of arrays, first row is header
    // [time_tag, Kp, Kp_fraction, a_running, station_count]
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid Kp index data format');
    }

    // Skip header row, parse Kp values
    const kpEntries = data.slice(1).map(entry => ({
      time: entry[0],
      kp: parseFloat(entry[1]) || 0,
    }));

    // Get latest Kp value
    const latest = kpEntries[kpEntries.length - 1];
    const kpValues = kpEntries.map(e => e.kp);

    return {
      kpIndex: Math.round(latest.kp),
      kpCategory: getKpCategory(latest.kp),
      kpTrend: getKpTrend(kpValues),
      apIndex: calculateApIndex(kpValues),
      kpTime: latest.time,
    };
  } catch (error) {
    console.error('Error fetching Kp index:', error.message);
    return null;
  }
}

/**
 * Parse solar flare class from X-ray flux
 * @param {number} flux - X-ray flux value
 * @returns {string} Flare class (A, B, C, M, X)
 */
function parseFlareClass(flux) {
  if (flux >= 1e-4) return 'X' + (flux / 1e-4).toFixed(1);
  if (flux >= 1e-5) return 'M' + (flux / 1e-5).toFixed(1);
  if (flux >= 1e-6) return 'C' + (flux / 1e-6).toFixed(1);
  if (flux >= 1e-7) return 'B' + (flux / 1e-7).toFixed(1);
  return 'A' + (flux / 1e-8).toFixed(1);
}

/**
 * Fetch solar flare data from NOAA
 * @returns {Promise<Object|null>} Latest solar flare data
 */
async function fetchSolarFlares() {
  try {
    const response = await axios.get(NOAA_ENDPOINTS.solarFlares, {
      timeout: REQUEST_TIMEOUT,
    });

    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    // Find the peak flux in recent data
    // Data format: { time_tag, satellite, flux, observed_flux, electron_correction, ... }
    const validEntries = data.filter(entry => entry.flux && entry.flux > 0);

    if (validEntries.length === 0) {
      return null;
    }

    // Find the highest flux in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEntries = validEntries.filter(entry => {
      const entryTime = new Date(entry.time_tag);
      return entryTime >= oneDayAgo;
    });

    if (recentEntries.length === 0) {
      // Use latest entry if no recent flares
      const latest = validEntries[validEntries.length - 1];
      return {
        class: parseFlareClass(latest.flux),
        time: latest.time_tag,
        region: latest.active_region || null,
      };
    }

    // Find peak flux in recent data
    const peakEntry = recentEntries.reduce((max, entry) =>
      entry.flux > max.flux ? entry : max
    );

    return {
      class: parseFlareClass(peakEntry.flux),
      time: peakEntry.time_tag,
      region: peakEntry.active_region || null,
    };
  } catch (error) {
    console.error('Error fetching solar flares:', error.message);
    return null;
  }
}

/**
 * Fetch sunspot number from NOAA
 * @returns {Promise<number|null>} Latest sunspot number
 */
async function fetchSunspotNumber() {
  try {
    const response = await axios.get(NOAA_ENDPOINTS.sunspots, {
      timeout: REQUEST_TIMEOUT,
    });

    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    // Get the latest sunspot number
    // Data format: { time_tag, ssn, smoothed_ssn, ... }
    const latest = data[data.length - 1];

    return latest.ssn !== undefined ? Math.round(latest.ssn) : null;
  } catch (error) {
    console.error('Error fetching sunspot number:', error.message);
    return null;
  }
}

/**
 * Fetch solar wind data from NOAA
 * @returns {Promise<Object|null>} Solar wind data
 */
async function fetchSolarWind() {
  try {
    const response = await axios.get(NOAA_ENDPOINTS.solarWind, {
      timeout: REQUEST_TIMEOUT,
    });

    const data = response.data;

    // Data format: Array of arrays, first row is header
    // [time_tag, density, speed, temperature]
    if (!Array.isArray(data) || data.length < 2) {
      return null;
    }

    // Get latest valid entry
    const entries = data.slice(1).filter(entry =>
      entry[1] !== null && entry[2] !== null
    );

    if (entries.length === 0) {
      return null;
    }

    const latest = entries[entries.length - 1];

    return {
      speed: Math.round(parseFloat(latest[2]) || 0),
      density: parseFloat(latest[1]) ? parseFloat(latest[1]).toFixed(1) : 0,
    };
  } catch (error) {
    console.error('Error fetching solar wind:', error.message);
    return null;
  }
}

/**
 * Fetch geomagnetic storm data from NOAA
 * @returns {Promise<Object>} Geomagnetic storm status
 */
async function fetchGeomagneticStorms() {
  try {
    const response = await axios.get(NOAA_ENDPOINTS.geomagneticStorms, {
      timeout: REQUEST_TIMEOUT,
    });

    const data = response.data;

    // Data format: { 0: { G: {...}, S: {...}, R: {...} }, ... }
    // G = Geomagnetic storms, S = Solar radiation storms, R = Radio blackouts
    if (!data || typeof data !== 'object') {
      return { active: false, level: null };
    }

    // Check current conditions (key "0" is current)
    const current = data['0'];

    if (!current || !current.G) {
      return { active: false, level: null };
    }

    const gLevel = current.G.Scale;

    if (!gLevel || gLevel === 'none' || gLevel === '0') {
      return { active: false, level: null };
    }

    return {
      active: true,
      level: gLevel, // G1, G2, G3, G4, G5
    };
  } catch (error) {
    console.error('Error fetching geomagnetic storms:', error.message);
    return { active: false, level: null };
  }
}

/**
 * Calculate 24-hour forecast probabilities based on current conditions
 * @param {number} kpIndex - Current Kp index
 * @param {Object} latestFlare - Latest flare data
 * @param {number} sunspotNumber - Current sunspot number
 * @returns {Object} Forecast probabilities
 */
function calculateForecast(kpIndex, latestFlare, sunspotNumber) {
  // Base probabilities adjusted by current conditions
  let mFlareProb = 20;
  let xFlareProb = 5;
  let g1StormProb = 10;

  // Adjust M-flare probability based on sunspot activity
  if (sunspotNumber) {
    if (sunspotNumber > 100) mFlareProb += 30;
    else if (sunspotNumber > 50) mFlareProb += 15;
  }

  // Adjust X-flare probability based on recent activity
  if (latestFlare && latestFlare.class) {
    const flareClass = latestFlare.class.charAt(0);
    if (flareClass === 'X') xFlareProb += 20;
    else if (flareClass === 'M') xFlareProb += 10;
  }

  // Adjust storm probability based on Kp index
  if (kpIndex >= 5) g1StormProb += 40;
  else if (kpIndex >= 4) g1StormProb += 20;
  else if (kpIndex >= 3) g1StormProb += 10;

  // Cap probabilities at 95%
  return {
    mFlareProb: Math.min(95, mFlareProb),
    xFlareProb: Math.min(95, xFlareProb),
    g1StormProb: Math.min(95, g1StormProb),
  };
}

/**
 * Collect all solar data from NOAA SWPC
 * @returns {Promise<Object>} Combined solar data
 */
async function collect() {
  const timestamp = new Date().toISOString();

  try {
    // Fetch all data in parallel
    const [kpData, flareData, sunspotNumber, solarWind, geomagneticStorm] = await Promise.all([
      fetchKpIndex(),
      fetchSolarFlares(),
      fetchSunspotNumber(),
      fetchSolarWind(),
      fetchGeomagneticStorms(),
    ]);

    // Check if we got any valid data
    const hasData = kpData || flareData || sunspotNumber || solarWind;

    if (!hasData) {
      // All APIs failed, return cached data with stale flag
      if (cache.data) {
        console.warn('All NOAA APIs failed, returning cached data');
        return {
          ...cache.data,
          stale: true,
          cachedAt: cache.timestamp,
          collectedAt: timestamp,
        };
      }

      // No cache available, return minimal response
      return {
        timestamp,
        error: 'Unable to fetch solar data from NOAA SWPC',
        kpIndex: null,
        kpCategory: null,
        kpTrend: null,
        apIndex: null,
        latestFlare: null,
        sunspotNumber: null,
        solarWind: null,
        geomagneticStorm: { active: false, level: null },
        forecast24h: null,
        collectedAt: timestamp,
      };
    }

    // Calculate forecast based on available data
    const forecast = calculateForecast(
      kpData?.kpIndex || 0,
      flareData,
      sunspotNumber
    );

    const result = {
      timestamp,
      kpIndex: kpData?.kpIndex ?? null,
      kpCategory: kpData?.kpCategory ?? null,
      kpTrend: kpData?.kpTrend ?? null,
      apIndex: kpData?.apIndex ?? null,
      latestFlare: flareData,
      sunspotNumber: sunspotNumber,
      solarWind: solarWind ? {
        speed: solarWind.speed,
        density: parseFloat(solarWind.density),
      } : null,
      geomagneticStorm: geomagneticStorm,
      forecast24h: forecast,
      collectedAt: timestamp,
    };

    // Update cache with successful data
    cache = {
      data: result,
      timestamp,
    };

    return result;
  } catch (error) {
    console.error('Error collecting solar data:', error.message);

    // Return cached data with stale flag on error
    if (cache.data) {
      return {
        ...cache.data,
        stale: true,
        cachedAt: cache.timestamp,
        collectedAt: timestamp,
      };
    }

    // No cache available
    return {
      timestamp,
      error: error.message,
      kpIndex: null,
      kpCategory: null,
      kpTrend: null,
      apIndex: null,
      latestFlare: null,
      sunspotNumber: null,
      solarWind: null,
      geomagneticStorm: { active: false, level: null },
      forecast24h: null,
      collectedAt: timestamp,
    };
  }
}

/**
 * Get current solar data (for API endpoints)
 * @returns {Promise<Object>} Current solar data
 */
async function getCurrent() {
  // Check if cache is fresh (less than 3 hours old)
  if (cache.data && cache.timestamp) {
    const cacheAge = Date.now() - new Date(cache.timestamp).getTime();
    const threeHours = 3 * 60 * 60 * 1000;

    if (cacheAge < threeHours) {
      return cache.data;
    }
  }

  // Cache is stale or doesn't exist, collect fresh data
  return collect();
}

/**
 * Get Kp index category info
 * @param {number} kp - Kp index value
 * @returns {Object} Category information with color
 */
function getKpCategoryInfo(kp) {
  if (kp <= 2) {
    return { category: 'Quiet', color: 'green', level: 0 };
  }
  if (kp <= 4) {
    return { category: 'Unsettled', color: 'yellow', level: 1 };
  }
  if (kp <= 6) {
    return { category: 'Active/Storm', color: 'orange', level: 2 };
  }
  return { category: 'Major Storm', color: 'red', level: 3 };
}

/**
 * Clear the cache (for testing)
 */
function clearCache() {
  cache = {
    data: null,
    timestamp: null,
  };
}

module.exports = {
  name: 'solar',
  schedule: '0 */3 * * *', // Every 3 hours
  collect,
  getCurrent,
  getKpCategory,
  getKpCategoryInfo,
  getKpTrend,
  calculateApIndex,
  clearCache,
  // Expose individual fetch functions for testing/debugging
  fetchKpIndex,
  fetchSolarFlares,
  fetchSunspotNumber,
  fetchSolarWind,
  fetchGeomagneticStorms,
};
