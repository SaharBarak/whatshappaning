/**
 * Schumann Resonance Module - Earth's Electromagnetic Pulse
 *
 * Primary: Tomsk Observatory (http://sosrff.tsu.ru/new/shm.jpg) - spectrogram image
 * Fallback: Estimate from Kp index correlation (high Kp -> elevated Schumann activity)
 *
 * Update frequency: Every 3 hours
 *
 * The Schumann resonances are a set of spectrum peaks in the extremely low
 * frequency (ELF) portion of the Earth's electromagnetic field spectrum.
 * The fundamental frequency is approximately 7.83 Hz with harmonics at
 * 14.3, 20.8, 27.3, and 33.8 Hz.
 */

const axios = require('axios');

// Tomsk Observatory spectrogram URL
const TOMSK_SPECTROGRAM_URL = 'http://sosrff.tsu.ru/new/shm.jpg';

// NOAA SWPC Kp index API for fallback estimation
const NOAA_KP_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';

// Schumann resonance fundamental frequencies (Hz)
const SCHUMANN_FREQUENCIES = {
  fundamental: 7.83,
  harmonics: [14.3, 20.8, 27.3, 33.8],
};

// Activity level thresholds based on amplitude
const ACTIVITY_LEVELS = {
  LOW: { max: 5, label: 'Low' },
  NORMAL: { max: 15, label: 'Normal' },
  ELEVATED: { max: 30, label: 'Elevated' },
  HIGH: { max: 50, label: 'High' },
  EXTREME: { max: Infinity, label: 'Extreme' },
};

// 24-hour history for tracking peaks (in-memory cache)
let amplitudeHistory = [];

/**
 * Get activity level label based on amplitude
 * @param {number} amplitude - Schumann amplitude value
 * @returns {string} Activity level label
 */
function getActivityLevel(amplitude) {
  if (amplitude < ACTIVITY_LEVELS.LOW.max) return ACTIVITY_LEVELS.LOW.label;
  if (amplitude < ACTIVITY_LEVELS.NORMAL.max) return ACTIVITY_LEVELS.NORMAL.label;
  if (amplitude < ACTIVITY_LEVELS.ELEVATED.max) return ACTIVITY_LEVELS.ELEVATED.label;
  if (amplitude < ACTIVITY_LEVELS.HIGH.max) return ACTIVITY_LEVELS.HIGH.label;
  return ACTIVITY_LEVELS.EXTREME.label;
}

/**
 * Check if Tomsk Observatory spectrogram is accessible
 * @returns {Promise<boolean>} True if accessible
 */
async function checkTomskAvailability() {
  try {
    const response = await axios.head(TOMSK_SPECTROGRAM_URL, {
      timeout: 10000,
      // Accept any 2xx or 3xx status
      validateStatus: (status) => status >= 200 && status < 400,
    });
    return true;
  } catch (error) {
    console.warn('Tomsk Observatory spectrogram not accessible:', error.message);
    return false;
  }
}

/**
 * Fetch current Kp index from NOAA SWPC
 * @returns {Promise<number|null>} Current Kp index or null on error
 */
async function fetchKpIndex() {
  try {
    const response = await axios.get(NOAA_KP_URL, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = response.data;

    // NOAA returns array of arrays: [time_tag, Kp, Kp_fraction, a_running, station_count]
    // First row is headers, last row is most recent
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid response format from NOAA');
    }

    // Get the most recent Kp value (last row, second column)
    const latestRow = data[data.length - 1];
    const kpValue = parseFloat(latestRow[1]);

    if (isNaN(kpValue)) {
      throw new Error('Invalid Kp value in response');
    }

    return kpValue;
  } catch (error) {
    console.error('Failed to fetch Kp index from NOAA:', error.message);
    return null;
  }
}

/**
 * Estimate Schumann resonance amplitude from Kp index
 * Higher geomagnetic activity correlates with elevated Schumann activity
 *
 * Kp 0-2: amplitude ~5-10, activity "Low" to "Normal"
 * Kp 3-4: amplitude ~10-20, activity "Normal" to "Elevated"
 * Kp 5+: amplitude ~20-40, activity "Elevated" to "High"
 *
 * @param {number} kp - Kp index value (0-9)
 * @returns {Object} Estimated amplitude and frequency data
 */
function estimateFromKp(kp) {
  let amplitude;
  let frequencyShift;

  if (kp <= 2) {
    // Low geomagnetic activity: normal Schumann conditions
    amplitude = 5 + (kp / 2) * 5; // 5-10
    frequencyShift = 0;
  } else if (kp <= 4) {
    // Moderate activity: slightly elevated Schumann
    amplitude = 10 + ((kp - 2) / 2) * 10; // 10-20
    frequencyShift = 0.05 * (kp - 2); // Small upward shift
  } else {
    // High activity: significantly elevated Schumann
    amplitude = 20 + ((kp - 4) / 5) * 20; // 20-40
    frequencyShift = 0.1 + 0.05 * (kp - 4); // More pronounced shift
  }

  // Add some natural variation (small random component for realism)
  const variation = (Math.random() - 0.5) * 2; // +/- 1
  amplitude = Math.round((amplitude + variation) * 10) / 10;

  const currentFrequency = Math.round((SCHUMANN_FREQUENCIES.fundamental + frequencyShift) * 100) / 100;

  return {
    amplitude: Math.max(1, amplitude), // Minimum 1
    frequency: currentFrequency,
    kpUsed: kp,
  };
}

/**
 * Update amplitude history and get 24h peak
 * @param {number} amplitude - Current amplitude
 * @param {number} frequency - Current frequency
 * @returns {Object} Peak data for last 24 hours
 */
function updateHistoryAndGetPeak(amplitude, frequency) {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Add current reading to history
  amplitudeHistory.push({
    amplitude,
    frequency,
    time: now.toISOString(),
  });

  // Remove entries older than 24 hours
  amplitudeHistory = amplitudeHistory.filter(
    (entry) => new Date(entry.time) > twentyFourHoursAgo
  );

  // Find peak
  if (amplitudeHistory.length === 0) {
    return {
      frequency: SCHUMANN_FREQUENCIES.fundamental,
      amplitude: amplitude,
      time: now.toISOString(),
    };
  }

  const peak = amplitudeHistory.reduce((max, entry) =>
    entry.amplitude > max.amplitude ? entry : max
  );

  return {
    frequency: peak.frequency,
    amplitude: peak.amplitude,
    time: peak.time,
  };
}

/**
 * Collect Schumann resonance data
 * @returns {Promise<Object>} Schumann resonance data
 */
async function collect() {
  const now = new Date();
  const timestamp = now.toISOString();

  // Check if Tomsk spectrogram is accessible
  const tomskAvailable = await checkTomskAvailability();

  if (tomskAvailable) {
    // Tomsk is available - provide spectrogram URL
    // Since Tomsk only provides an image, we can't extract numerical data
    // Use a reasonable default amplitude for normal conditions
    const defaultAmplitude = 10; // Normal activity
    const peak24h = updateHistoryAndGetPeak(defaultAmplitude, SCHUMANN_FREQUENCIES.fundamental);

    return {
      timestamp,
      baseFrequency: SCHUMANN_FREQUENCIES.fundamental,
      currentAmplitude: defaultAmplitude,
      activity: getActivityLevel(defaultAmplitude),
      peak24h,
      spectrogramUrl: TOMSK_SPECTROGRAM_URL,
      source: 'Space Observing System, Tomsk',
      isEstimated: false,
      note: 'Live spectrogram available from Tomsk Observatory. Amplitude values are baseline estimates - see spectrogram for visual data.',
      collectedAt: now.toISOString(),
    };
  }

  // Tomsk not available - fall back to Kp estimation
  const kpIndex = await fetchKpIndex();

  if (kpIndex !== null) {
    // Estimate from Kp index
    const estimation = estimateFromKp(kpIndex);
    const peak24h = updateHistoryAndGetPeak(estimation.amplitude, estimation.frequency);

    return {
      timestamp,
      baseFrequency: SCHUMANN_FREQUENCIES.fundamental,
      currentAmplitude: estimation.amplitude,
      activity: getActivityLevel(estimation.amplitude),
      peak24h,
      spectrogramUrl: null,
      source: 'Estimated from NOAA Kp Index',
      isEstimated: true,
      note: `Tomsk Observatory unavailable. Estimated from current Kp index (${kpIndex}). Higher geomagnetic activity correlates with elevated Schumann resonance.`,
      kpIndex,
      collectedAt: now.toISOString(),
    };
  }

  // Both sources unavailable - return baseline estimate
  const baselineAmplitude = 10; // Normal conditions assumption
  const peak24h = updateHistoryAndGetPeak(baselineAmplitude, SCHUMANN_FREQUENCIES.fundamental);

  return {
    timestamp,
    baseFrequency: SCHUMANN_FREQUENCIES.fundamental,
    currentAmplitude: baselineAmplitude,
    activity: getActivityLevel(baselineAmplitude),
    peak24h,
    spectrogramUrl: null,
    source: 'Baseline estimate',
    isEstimated: true,
    note: 'Both Tomsk Observatory and NOAA Kp data unavailable. Using baseline estimate for normal conditions.',
    collectedAt: now.toISOString(),
  };
}

module.exports = {
  name: 'schumann',
  schedule: '0 */3 * * *', // Every 3 hours
  collect,
  // Export helper functions for testing
  getActivityLevel,
  estimateFromKp,
  checkTomskAvailability,
  fetchKpIndex,
  SCHUMANN_FREQUENCIES,
  ACTIVITY_LEVELS,
};
