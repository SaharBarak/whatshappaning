/**
 * Geophysical Module - Earthquake, Atmospheric, and Tidal Data Collection
 *
 * Collects and analyzes geophysical data from multiple sources:
 * - USGS Earthquake API: Seismic activity worldwide
 * - Open-Meteo API: Atmospheric conditions (UV, pressure)
 * - NOAA/Solar module: Ap index for geomagnetic activity
 *
 * Update frequency: Every 3 hours
 */

const axios = require('axios');

// API endpoints
const USGS_API = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';

// Average seismic energy per 24h (approximate historical average for reference)
const AVERAGE_DAILY_ENERGY = 1e12; // 10^12 joules

// Moon's average distance in km
const MOON_AVERAGE_DISTANCE = 384400;

/**
 * Calculate seismic energy from magnitude using Gutenberg-Richter formula
 * E = 10^(1.5*M + 4.8) joules
 * @param {number} magnitude - Earthquake magnitude
 * @returns {number} Energy in joules
 */
function calculateEnergy(magnitude) {
  return Math.pow(10, 1.5 * magnitude + 4.8);
}

/**
 * Categorize earthquake by magnitude range
 * @param {number} magnitude - Earthquake magnitude
 * @returns {string} Magnitude range key
 */
function getMagnitudeRange(magnitude) {
  if (magnitude >= 6.0) return '6.0+';
  if (magnitude >= 5.0) return '5.0-6.0';
  if (magnitude >= 4.0) return '4.0-5.0';
  if (magnitude >= 3.0) return '3.0-4.0';
  return '2.5-3.0';
}

/**
 * Determine seismic activity level based on M5+ count and total energy
 * @param {Object} byMagnitude - Earthquake counts by magnitude range
 * @param {number} totalEnergy - Total seismic energy in joules
 * @param {boolean} hasM7Plus - Whether there was an M7+ event
 * @returns {string} Activity level
 */
function determineActivityLevel(byMagnitude, totalEnergy, hasM7Plus) {
  // Extreme: M7+ event in 24h
  if (hasM7Plus) {
    return 'Extreme';
  }

  const m5PlusCount = (byMagnitude['5.0-6.0'] || 0) + (byMagnitude['6.0+'] || 0);
  const energyRatio = totalEnergy / AVERAGE_DAILY_ENERGY;

  // High: M5+ > 5 OR energy > 300% avg
  if (m5PlusCount > 5 || energyRatio > 3) {
    return 'High';
  }

  // Elevated: M5+ 3-5, energy 150-300% avg
  if (m5PlusCount >= 3 && m5PlusCount <= 5 && energyRatio >= 1.5 && energyRatio <= 3) {
    return 'Elevated';
  }

  // Normal: M5+ <= 2, energy 50-150% avg
  if (m5PlusCount <= 2 && energyRatio >= 0.5 && energyRatio <= 1.5) {
    return 'Normal';
  }

  // Low: M5+ = 0, energy < 50% avg
  if (m5PlusCount === 0 && energyRatio < 0.5) {
    return 'Low';
  }

  // Default to Normal if doesn't fit other categories
  return 'Normal';
}

/**
 * Get UV level description from UV index
 * @param {number} uvIndex - UV index value
 * @returns {string} UV level description
 */
function getUVLevel(uvIndex) {
  if (uvIndex === null || uvIndex === undefined) return 'Unknown';
  if (uvIndex >= 11) return 'Extreme';
  if (uvIndex >= 8) return 'Very High';
  if (uvIndex >= 6) return 'High';
  if (uvIndex >= 3) return 'Moderate';
  return 'Low';
}

/**
 * Get Ap index level description
 * Based on NOAA geomagnetic activity scale
 * @param {number} apIndex - Ap index value
 * @returns {string} Ap level description
 */
function getApLevel(apIndex) {
  if (apIndex === null || apIndex === undefined) return 'Unknown';
  if (apIndex >= 100) return 'Severe Storm';
  if (apIndex >= 50) return 'Storm';
  if (apIndex >= 30) return 'Active';
  if (apIndex >= 15) return 'Unsettled';
  return 'Quiet';
}

/**
 * Fetch earthquake data from USGS API
 * @returns {Promise<Object>} Seismic data
 */
async function fetchEarthquakeData() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const starttime = yesterday.toISOString().split('T')[0];
  const endtime = now.toISOString().split('T')[0];

  const url = `${USGS_API}?format=geojson&starttime=${starttime}&endtime=${endtime}&minmagnitude=2.5`;

  try {
    const response = await axios.get(url, { timeout: 30000 });
    const features = response.data.features || [];

    // Initialize magnitude buckets
    const byMagnitude = {
      '2.5-3.0': 0,
      '3.0-4.0': 0,
      '4.0-5.0': 0,
      '5.0-6.0': 0,
      '6.0+': 0
    };

    let totalEnergy = 0;
    let largest = null;
    let hasM7Plus = false;

    for (const feature of features) {
      const props = feature.properties;
      const geometry = feature.geometry;
      const magnitude = props.mag;

      if (magnitude === null || magnitude === undefined) continue;

      // Categorize by magnitude
      const range = getMagnitudeRange(magnitude);
      byMagnitude[range]++;

      // Calculate energy
      totalEnergy += calculateEnergy(magnitude);

      // Check for M7+
      if (magnitude >= 7.0) {
        hasM7Plus = true;
      }

      // Track largest earthquake
      if (!largest || magnitude > largest.magnitude) {
        largest = {
          magnitude: magnitude,
          location: props.place || 'Unknown',
          time: props.time ? new Date(props.time).toISOString() : null,
          depth: geometry?.coordinates?.[2] || null
        };
      }
    }

    const activityLevel = determineActivityLevel(byMagnitude, totalEnergy, hasM7Plus);

    return {
      count24h: features.length,
      byMagnitude,
      largest,
      totalEnergy,
      activityLevel
    };
  } catch (error) {
    console.error('Failed to fetch earthquake data:', error.message);
    return {
      count24h: null,
      byMagnitude: {
        '2.5-3.0': null,
        '3.0-4.0': null,
        '4.0-5.0': null,
        '5.0-6.0': null,
        '6.0+': null
      },
      largest: null,
      totalEnergy: null,
      activityLevel: 'Unknown',
      error: error.message
    };
  }
}

/**
 * Fetch atmospheric data from Open-Meteo API
 * @returns {Promise<Object>} Atmospheric data
 */
async function fetchAtmosphericData() {
  // Using equator (0,0) as reference point for global data
  const url = `${OPEN_METEO_API}?latitude=0&longitude=0&current=surface_pressure,uv_index`;

  try {
    const response = await axios.get(url, { timeout: 15000 });
    const current = response.data.current || {};

    const uvIndex = current.uv_index;
    const surfacePressure = current.surface_pressure;

    // Determine global pressure status (normal is around 1013.25 hPa at sea level)
    let globalPressure = 'normal';
    if (surfacePressure !== undefined && surfacePressure !== null) {
      if (surfacePressure < 1000) {
        globalPressure = 'low';
      } else if (surfacePressure > 1025) {
        globalPressure = 'high';
      }
    }

    return {
      uvIndex: uvIndex !== undefined ? uvIndex : null,
      uvLevel: getUVLevel(uvIndex),
      surfacePressure: surfacePressure !== undefined ? surfacePressure : null,
      globalPressure
    };
  } catch (error) {
    console.error('Failed to fetch atmospheric data:', error.message);
    return {
      uvIndex: null,
      uvLevel: 'Unknown',
      surfacePressure: null,
      globalPressure: 'unknown',
      error: error.message
    };
  }
}

/**
 * Fetch Ap index data
 * Attempts to get from solar module first, then falls back to NOAA
 * @returns {Promise<Object>} Ap index data
 */
async function fetchApIndex() {
  // Try to get from solar module first
  try {
    const solarModule = require('./solar');
    if (solarModule && typeof solarModule.getApIndex === 'function') {
      const apData = await solarModule.getApIndex();
      if (apData && apData.apIndex !== null) {
        return {
          apIndex: apData.apIndex,
          apLevel: getApLevel(apData.apIndex),
          source: 'solar_module'
        };
      }
    }
  } catch (error) {
    // Solar module not available, continue to fallback
  }

  // Fallback: Try NOAA API for Ap index
  // Note: NOAA's actual Ap index endpoint may vary
  try {
    const noaaUrl = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';
    const response = await axios.get(noaaUrl, { timeout: 15000 });

    // NOAA returns array with headers as first element
    // Format: [["time_tag","Kp","Kp_fraction","a_running","station_count"], ...]
    if (Array.isArray(response.data) && response.data.length > 1) {
      const latestData = response.data[response.data.length - 1];
      // Ap can be estimated from Kp (a_running is similar to Ap)
      const aRunning = parseFloat(latestData[3]);
      if (!isNaN(aRunning)) {
        return {
          apIndex: Math.round(aRunning),
          apLevel: getApLevel(Math.round(aRunning)),
          source: 'noaa'
        };
      }
    }
  } catch (error) {
    console.error('Failed to fetch Ap index from NOAA:', error.message);
  }

  // Return null values if all sources fail
  return {
    apIndex: null,
    apLevel: 'Unknown',
    source: null,
    error: 'Unable to fetch Ap index from any source'
  };
}

/**
 * Calculate moon distance and tidal information
 * Uses approximate calculation based on lunar orbital mechanics
 * @returns {Object} Tidal data
 */
function calculateTidalData() {
  const now = new Date();

  // Simplified moon distance calculation
  // Moon's orbit has a period of ~27.3 days with perigee ~356,500 km and apogee ~406,700 km
  const LUNAR_PERIOD = 27.321661; // days
  const PERIGEE = 356500; // km
  const APOGEE = 406700; // km

  // Reference perigee date (approximate)
  const referencePerigee = new Date('2024-01-13T00:00:00Z');
  const daysSincePerigee = (now.getTime() - referencePerigee.getTime()) / (24 * 60 * 60 * 1000);
  const phase = (daysSincePerigee % LUNAR_PERIOD) / LUNAR_PERIOD;

  // Distance follows approximately sinusoidal pattern
  const amplitude = (APOGEE - PERIGEE) / 2;
  const midpoint = (APOGEE + PERIGEE) / 2;
  const moonDistance = Math.round(midpoint - amplitude * Math.cos(2 * Math.PI * phase));

  // Determine distance status
  let moonDistanceStatus = 'normal';
  if (moonDistance < 360000) {
    moonDistanceStatus = 'perigee'; // Close to Earth - stronger tidal forces
  } else if (moonDistance > 400000) {
    moonDistanceStatus = 'apogee'; // Far from Earth - weaker tidal forces
  }

  // Extreme tides occur during spring tides (new/full moon near perigee)
  // This is a simplified check - actual extreme tide calculation is more complex
  const extremeToday = moonDistanceStatus === 'perigee';

  return {
    extremeToday,
    moonDistance,
    moonDistanceStatus
  };
}

/**
 * Main collect function for the scheduler
 * Gathers all geophysical data from various sources
 * @returns {Promise<Object>} Complete geophysical data
 */
async function collect() {
  const now = new Date();

  // Fetch data from all sources in parallel
  const [seismicData, atmosphericData, apData] = await Promise.all([
    fetchEarthquakeData(),
    fetchAtmosphericData(),
    fetchApIndex()
  ]);

  // Calculate tidal data locally
  const tidalData = calculateTidalData();

  return {
    timestamp: now.toISOString(),
    seismic: {
      count24h: seismicData.count24h,
      byMagnitude: seismicData.byMagnitude,
      largest: seismicData.largest,
      totalEnergy: seismicData.totalEnergy,
      activityLevel: seismicData.activityLevel
    },
    atmospheric: {
      apIndex: apData.apIndex,
      apLevel: apData.apLevel,
      uvIndex: atmosphericData.uvIndex,
      uvLevel: atmosphericData.uvLevel,
      globalPressure: atmosphericData.globalPressure
    },
    tides: {
      extremeToday: tidalData.extremeToday,
      moonDistance: tidalData.moonDistance,
      moonDistanceStatus: tidalData.moonDistanceStatus
    },
    collectedAt: now.toISOString()
  };
}

module.exports = {
  name: 'geophysical',
  schedule: '0 */3 * * *',
  collect,
  // Export helper functions for testing and external use
  calculateEnergy,
  getMagnitudeRange,
  determineActivityLevel,
  getUVLevel,
  getApLevel,
  fetchEarthquakeData,
  fetchAtmosphericData,
  fetchApIndex,
  calculateTidalData
};
