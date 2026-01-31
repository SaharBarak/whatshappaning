/**
 * Feature Engineering Module
 *
 * Extracts 35+ features from module data for correlation analysis.
 * Per spec 23, features are categorized as:
 * - Cosmic/Esoteric (23 features)
 * - Geophysical (9 features)
 * - Sentiment (4 features)
 *
 * Features are encoded as specified:
 * - Categorical: integer codes
 * - Binary: 0/1
 * - Continuous: raw values
 * - Discrete: integer counts
 */

/**
 * Feature definitions with encoding information
 */
const FEATURE_DEFINITIONS = {
  // Cosmic/Esoteric Features (23)
  moon_phase: { type: 'categorical', range: [0, 7], description: '8 phases (0=new, 4=full)' },
  moon_sign: { type: 'categorical', range: [0, 11], description: 'Zodiac sign (0=Aries)' },
  moon_illumination: { type: 'continuous', range: [0, 100], description: 'Percent illumination' },
  moon_void_of_course: { type: 'binary', description: 'Moon VOC state' },
  tzolkin_tone: { type: 'categorical', range: [1, 13], description: 'Tzolkin tone (1-13)' },
  tzolkin_sign: { type: 'categorical', range: [0, 19], description: 'Tzolkin day sign (0-19)' },
  dreamspell_kin: { type: 'categorical', range: [1, 260], description: 'Dreamspell kin number' },
  dreamspell_wavespell: { type: 'categorical', range: [1, 20], description: 'Wavespell (1-20)' },
  mercury_retrograde: { type: 'binary', description: 'Mercury retrograde status' },
  venus_retrograde: { type: 'binary', description: 'Venus retrograde status' },
  mars_retrograde: { type: 'binary', description: 'Mars retrograde status' },
  planets_retrograde_count: { type: 'discrete', range: [0, 7], description: 'Count of retrograde planets' },
  sun_sign: { type: 'categorical', range: [0, 11], description: 'Sun zodiac sign (0=Aries)' },
  major_aspects_count: { type: 'discrete', range: [0, 20], description: 'Count of major aspects' },
  eclipse_proximity: { type: 'discrete', range: [0, 365], description: 'Days to nearest eclipse' },
  hebrew_day: { type: 'discrete', range: [1, 30], description: 'Hebrew calendar day' },
  hebrew_month: { type: 'categorical', range: [1, 13], description: 'Hebrew month (1-13)' },
  parasha_index: { type: 'categorical', range: [1, 54], description: 'Torah portion index' },
  numerology_day: { type: 'categorical', range: [1, 33], description: 'Numerology day (1-9, 11, 22, 33)' },
  tarot_card: { type: 'categorical', range: [0, 77], description: 'Tarot card index' },
  iching_hexagram: { type: 'categorical', range: [1, 64], description: 'I Ching hexagram number' },
  planetary_hour: { type: 'categorical', range: [0, 6], description: 'Planetary hour ruler (0=Sun)' },
  day_of_week: { type: 'categorical', range: [0, 6], description: 'Day of week (0=Sunday)' },

  // Geophysical Features (9)
  kp_index: { type: 'continuous', range: [0, 9], description: 'Geomagnetic Kp index' },
  ap_index: { type: 'continuous', range: [0, 400], description: 'Ap index' },
  solar_flare_class: { type: 'ordinal', range: [0, 10], description: 'Flare class (A=0 to X10=10)' },
  sunspot_number: { type: 'continuous', range: [0, 300], description: 'Sunspot count' },
  solar_wind_speed: { type: 'continuous', range: [300, 800], description: 'Solar wind km/s' },
  schumann_amplitude: { type: 'continuous', range: [0, 100], description: 'Schumann resonance amplitude' },
  quake_count_24h: { type: 'continuous', range: [0, 500], description: 'Earthquakes in 24h' },
  quake_max_magnitude: { type: 'continuous', range: [0, 9], description: 'Max quake magnitude' },
  quake_energy_log: { type: 'continuous', description: 'Log10 of seismic energy' },

  // Sentiment Features (4)
  fear_greed_cnn: { type: 'continuous', range: [0, 100], description: 'CNN Fear & Greed index' },
  fear_greed_crypto: { type: 'continuous', range: [0, 100], description: 'Crypto Fear & Greed index' },
  vix: { type: 'continuous', range: [10, 80], description: 'VIX volatility index' },
  sentiment_aggregate: { type: 'continuous', range: [0, 100], description: 'Aggregate sentiment score' },
};

/**
 * Zodiac sign name to index mapping
 */
const ZODIAC_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

/**
 * Moon phase name to index mapping (8 phases per spec)
 */
const MOON_PHASES = [
  'new', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
  'full', 'waning_gibbous', 'third_quarter', 'waning_crescent',
];

/**
 * Planetary hour rulers (traditional Chaldean order)
 */
const PLANETARY_RULERS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

/**
 * Convert zodiac sign name to index
 * @param {string} signName
 * @returns {number} Index 0-11
 */
function zodiacToIndex(signName) {
  if (typeof signName === 'number') return signName;
  const normalized = String(signName).toLowerCase().trim();
  const idx = ZODIAC_SIGNS.indexOf(normalized);
  return idx >= 0 ? idx : null;
}

/**
 * Convert moon phase name to index
 * @param {string|number} phase
 * @returns {number} Index 0-7
 */
function moonPhaseToIndex(phase) {
  if (typeof phase === 'number') return Math.min(7, Math.max(0, Math.floor(phase)));
  const normalized = String(phase).toLowerCase().replace(/\s+/g, '_').trim();
  const idx = MOON_PHASES.indexOf(normalized);
  return idx >= 0 ? idx : null;
}

/**
 * Convert planetary ruler name to index
 * @param {string} ruler
 * @returns {number} Index 0-6
 */
function planetaryRulerToIndex(ruler) {
  if (typeof ruler === 'number') return ruler;
  const normalized = String(ruler).toLowerCase().trim();
  const idx = PLANETARY_RULERS.indexOf(normalized);
  return idx >= 0 ? idx : null;
}

/**
 * Convert solar flare class to numeric value
 * A=1, B=2, C=3, M=4-13, X=14+
 * Simplified to 0-10 scale per spec
 *
 * @param {string|number} flareClass
 * @returns {number} 0-10 scale
 */
function flareClassToNumeric(flareClass) {
  if (typeof flareClass === 'number') return flareClass;
  if (!flareClass || flareClass === 'none' || flareClass === 'quiet') return 0;

  const str = String(flareClass).toUpperCase();
  const letter = str.charAt(0);
  const number = parseFloat(str.slice(1)) || 1;

  switch (letter) {
    case 'A':
      return 1;
    case 'B':
      return 2;
    case 'C':
      return 3;
    case 'M':
      return 4 + Math.min(number - 1, 5) * 0.5; // M1-M9 maps to 4-8
    case 'X':
      return 8 + Math.min(number, 4) * 0.5; // X1+ maps to 8-10
    default:
      return 0;
  }
}

/**
 * Extract all features from module data snapshots
 *
 * @param {Object} moduleData - Object with module names as keys and data as values
 * @param {Date} date - Date for the features
 * @returns {Object} Feature vector with all 36 features
 */
function extractFeatures(moduleData, date = new Date()) {
  const features = {
    date: date instanceof Date ? date.toISOString().split('T')[0] : date,
  };

  // Day of week (0=Sunday)
  const d = date instanceof Date ? date : new Date(date);
  features.day_of_week = d.getUTCDay();

  // Moon module features
  if (moduleData.moon) {
    const moon = moduleData.moon;
    features.moon_phase = moonPhaseToIndex(moon.phaseIndex ?? moon.phase);
    features.moon_sign = zodiacToIndex(moon.sign);
    features.moon_illumination = moon.illumination ?? null;
    features.moon_void_of_course = moon.voidOfCourse ? 1 : 0;
  }

  // Tzolkin module features
  if (moduleData.tzolkin) {
    const tzolkin = moduleData.tzolkin;
    features.tzolkin_tone = tzolkin.tone ?? null;
    features.tzolkin_sign = tzolkin.daySignNumber ?? tzolkin.daySign ?? null;
    if (typeof features.tzolkin_sign === 'string') {
      // Convert sign name to index if needed
      features.tzolkin_sign = null; // Would need sign mapping
    }
  }

  // Dreamspell module features
  if (moduleData.dreamspell) {
    const ds = moduleData.dreamspell;
    features.dreamspell_kin = ds.kin ?? null;
    features.dreamspell_wavespell = ds.wavespell ?? null;
  }

  // Astrology module features
  if (moduleData.astrology) {
    const astro = moduleData.astrology;

    // Find Sun position
    const sun = astro.planets?.find((p) => p.name === 'Sun' || p.name === 'sun');
    features.sun_sign = sun ? zodiacToIndex(sun.sign) : null;

    // Retrograde planets
    const retrogrades = astro.retrogrades || [];
    features.mercury_retrograde = retrogrades.some(
      (p) => (p.name || p).toLowerCase() === 'mercury'
    )
      ? 1
      : 0;
    features.venus_retrograde = retrogrades.some(
      (p) => (p.name || p).toLowerCase() === 'venus'
    )
      ? 1
      : 0;
    features.mars_retrograde = retrogrades.some(
      (p) => (p.name || p).toLowerCase() === 'mars'
    )
      ? 1
      : 0;
    features.planets_retrograde_count = retrogrades.length;

    // Aspects
    features.major_aspects_count = astro.aspects?.length ?? 0;

    // Eclipse proximity
    if (astro.eclipseInfo) {
      const nextEclipse = astro.eclipseInfo.nextSolar || astro.eclipseInfo.nextLunar;
      if (nextEclipse) {
        const eclipseDate = new Date(nextEclipse.date || nextEclipse);
        const daysDiff = Math.abs(eclipseDate - d) / (1000 * 60 * 60 * 24);
        features.eclipse_proximity = Math.round(daysDiff);
      }
    }
    features.eclipse_proximity = features.eclipse_proximity ?? 365;
  }

  // Gematria module features (contains Hebrew date info)
  if (moduleData.gematria) {
    const gem = moduleData.gematria;
    if (gem.hebrewDate) {
      features.hebrew_day = gem.hebrewDate.day ?? null;
      features.hebrew_month = gem.hebrewDate.month ?? null;
    }
  }

  // Parasha module features
  if (moduleData.parasha) {
    const parasha = moduleData.parasha;
    features.parasha_index = parasha.index ?? parasha.number ?? null;
  }

  // Numerology module features
  if (moduleData.numerology) {
    const num = moduleData.numerology;
    features.numerology_day = num.universalDay ?? num.dayNumber ?? null;
  }

  // Tarot module features
  if (moduleData.tarot) {
    const tarot = moduleData.tarot;
    features.tarot_card = tarot.cardIndex ?? tarot.number ?? null;
  }

  // I Ching module features
  if (moduleData.iching) {
    const iching = moduleData.iching;
    features.iching_hexagram = iching.hexagram ?? iching.number ?? null;
  }

  // Planetary hours (from numerology or separate)
  if (moduleData.numerology?.currentHourRuler) {
    features.planetary_hour = planetaryRulerToIndex(moduleData.numerology.currentHourRuler);
  }

  // Solar module features
  if (moduleData.solar) {
    const solar = moduleData.solar;
    features.kp_index = solar.kpIndex ?? solar.kp ?? null;
    features.ap_index = solar.apIndex ?? solar.ap ?? null;
    features.solar_flare_class = flareClassToNumeric(solar.flareClass);
    features.sunspot_number = solar.sunspotNumber ?? solar.sunspots ?? null;
    features.solar_wind_speed = solar.solarWind?.speed ?? solar.solarWindSpeed ?? null;
  }

  // Schumann module features
  if (moduleData.schumann) {
    features.schumann_amplitude = moduleData.schumann.amplitude ?? null;
  }

  // Geophysical module features
  if (moduleData.geophysical) {
    const geo = moduleData.geophysical;
    features.quake_count_24h = geo.quakeCount ?? geo.count ?? null;
    features.quake_max_magnitude = geo.maxMagnitude ?? null;
    if (geo.totalEnergy) {
      features.quake_energy_log = Math.log10(geo.totalEnergy);
    }
  }

  // Markets module features (for sentiment/VIX)
  if (moduleData.markets) {
    const markets = moduleData.markets;
    features.vix = markets.vix?.value ?? markets.vix?.close ?? null;
    features.fear_greed_crypto = markets.cryptoFearGreed?.value ?? null;
  }

  // Sentiment module features
  if (moduleData.sentiment) {
    const sent = moduleData.sentiment;
    features.fear_greed_cnn = sent.cnnFearGreed ?? sent.fearGreed ?? null;
    features.fear_greed_crypto = features.fear_greed_crypto ?? sent.cryptoFearGreed ?? null;
    features.sentiment_aggregate = sent.aggregate ?? sent.score ?? null;
  }

  return features;
}

/**
 * Get unique values for a categorical feature from data
 *
 * @param {Array} data - Array of feature objects
 * @param {string} featureName - Feature name
 * @returns {Array} Unique values
 */
function getUniqueValues(data, featureName) {
  const definition = FEATURE_DEFINITIONS[featureName];
  if (!definition) return [];

  // For categorical/ordinal/discrete with defined ranges, use the range
  if (definition.range) {
    const [min, max] = definition.range;
    const values = [];
    for (let i = min; i <= max; i++) {
      values.push(i);
    }
    return values;
  }

  // For binary
  if (definition.type === 'binary') {
    return [0, 1];
  }

  // For continuous, get actual unique values from data
  const seen = new Set();
  for (const row of data) {
    if (row[featureName] !== null && row[featureName] !== undefined) {
      seen.add(row[featureName]);
    }
  }
  return Array.from(seen).sort((a, b) => a - b);
}

/**
 * Bin continuous feature values into categories
 *
 * @param {number} value - Feature value
 * @param {string} featureName - Feature name
 * @param {Object} options - Binning options
 * @returns {string} Bin label (e.g., 'low', 'medium', 'high')
 */
function binContinuousFeature(value, featureName, options = {}) {
  const definition = FEATURE_DEFINITIONS[featureName];
  if (!definition || !definition.range) return String(value);

  const [min, max] = definition.range;
  const normalized = (value - min) / (max - min);

  // Default quartile binning
  if (normalized <= 0.25) return 'low';
  if (normalized <= 0.5) return 'medium_low';
  if (normalized <= 0.75) return 'medium_high';
  return 'high';
}

/**
 * Generate thresholds for continuous feature testing
 * Returns threshold conditions like '>=5', '<25' etc.
 *
 * @param {string} featureName
 * @returns {Array<string>} Threshold conditions
 */
function getContinuousThresholds(featureName) {
  const thresholds = {
    kp_index: ['>=5', '>=7', '<3'],
    vix: ['>=20', '>=30', '<15'],
    fear_greed_cnn: ['<=25', '>=75', '<=40', '>=60'],
    fear_greed_crypto: ['<=25', '>=75', '<=40', '>=60'],
    moon_illumination: ['>=95', '<=5', '>=50'],
    schumann_amplitude: ['>=50', '>=75'],
    quake_max_magnitude: ['>=6', '>=5'],
    quake_count_24h: ['>=100', '>=200'],
    eclipse_proximity: ['<=7', '<=14', '<=30'],
    planets_retrograde_count: ['>=3', '>=4'],
    major_aspects_count: ['>=5', '>=3'],
  };

  return thresholds[featureName] || [];
}

/**
 * Get all feature names
 * @returns {string[]} Array of feature names
 */
function getAllFeatureNames() {
  return Object.keys(FEATURE_DEFINITIONS);
}

/**
 * Get feature definition
 * @param {string} name
 * @returns {Object|null}
 */
function getFeatureDefinition(name) {
  return FEATURE_DEFINITIONS[name] || null;
}

/**
 * Validate a feature vector has required features
 * @param {Object} features
 * @returns {{ valid: boolean, missing: string[] }}
 */
function validateFeatures(features) {
  const missing = [];
  for (const name of getAllFeatureNames()) {
    if (features[name] === undefined || features[name] === null) {
      missing.push(name);
    }
  }
  return {
    valid: missing.length === 0,
    missing,
  };
}

module.exports = {
  // Feature definitions
  FEATURE_DEFINITIONS,
  ZODIAC_SIGNS,
  MOON_PHASES,
  PLANETARY_RULERS,

  // Converters
  zodiacToIndex,
  moonPhaseToIndex,
  planetaryRulerToIndex,
  flareClassToNumeric,

  // Core functions
  extractFeatures,
  getUniqueValues,
  binContinuousFeature,
  getContinuousThresholds,

  // Helpers
  getAllFeatureNames,
  getFeatureDefinition,
  validateFeatures,
};
