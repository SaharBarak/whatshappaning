/**
 * Historical Data Module
 *
 * Handles data ingestion, backfill, and historical data management
 * for correlation analysis.
 *
 * Per spec 23:
 * - Data sources: S&P 500 (1950+), Bitcoin (2014+), Earthquakes (2000+), Solar/Kp (1930+)
 * - Build historical_features table with all features + outcomes
 */

const db = require('../db');
const features = require('./features');
const outcomes = require('./outcomes');

/**
 * Load historical features from database
 *
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Historical feature records
 */
async function loadHistoricalFeatures(options = {}) {
  const {
    startDate = null,
    endDate = null,
    limit = null,
  } = options;

  let query = 'SELECT * FROM historical_features WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (startDate) {
    query += ` AND date >= $${paramIndex++}`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND date <= $${paramIndex++}`;
    params.push(endDate);
  }

  query += ' ORDER BY date DESC';

  if (limit) {
    query += ` LIMIT $${paramIndex++}`;
    params.push(limit);
  }

  try {
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error loading historical features:', error.message);
    return [];
  }
}

/**
 * Save a historical feature record
 *
 * @param {Object} record - Feature + outcome record
 * @returns {Promise<boolean>} Success status
 */
async function saveHistoricalFeature(record) {
  const columns = [
    'date',
    // Cosmic/Esoteric
    'moon_phase', 'moon_sign', 'moon_illumination', 'moon_void_of_course',
    'tzolkin_tone', 'tzolkin_sign', 'dreamspell_kin', 'dreamspell_wavespell',
    'mercury_retrograde', 'venus_retrograde', 'mars_retrograde', 'planets_retrograde_count',
    'sun_sign', 'major_aspects_count', 'eclipse_proximity',
    'hebrew_day', 'hebrew_month', 'parasha_index',
    'numerology_day', 'tarot_card', 'iching_hexagram',
    'planetary_hour', 'day_of_week',
    // Geophysical
    'kp_index', 'ap_index', 'solar_flare_class', 'sunspot_number',
    'solar_wind_speed', 'schumann_amplitude',
    'quake_count_24h', 'quake_max_magnitude', 'quake_energy_log',
    // Sentiment
    'fear_greed_cnn', 'fear_greed_crypto', 'vix', 'sentiment_aggregate',
    // Outcomes
    'spx_direction', 'spx_volatile', 'spx_return',
    'btc_direction', 'btc_volatile',
    'vix_spike', 'gold_direction',
    'major_quake', 'quake_above_avg', 'geomag_storm',
    'sentiment_drop', 'fear_spike',
  ];

  const values = columns.map((col) => record[col] ?? null);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const columnList = columns.join(', ');

  // Upsert query
  const updateCols = columns.slice(1).map((col) => `${col} = EXCLUDED.${col}`).join(', ');

  const query = `
    INSERT INTO historical_features (${columnList})
    VALUES (${placeholders})
    ON CONFLICT (date) DO UPDATE SET ${updateCols}
  `;

  try {
    await db.query(query, values);
    return true;
  } catch (error) {
    console.error('Error saving historical feature:', error.message);
    return false;
  }
}

/**
 * Build historical feature record from current module data
 *
 * @param {Date} date - Date for the record
 * @param {Object} moduleData - All module data
 * @param {Object} previousData - Previous day's data (for outcomes)
 * @returns {Object} Historical feature record
 */
async function buildHistoricalRecord(date, moduleData, previousData = {}) {
  // Extract features
  const featureVector = features.extractFeatures(moduleData, date);

  // Calculate outcomes
  const outcomeVector = outcomes.extractOutcomes(moduleData, previousData);

  // Combine
  return {
    ...featureVector,
    ...outcomeVector,
    date: date instanceof Date ? date.toISOString().split('T')[0] : date,
  };
}

/**
 * Update historical record for today
 *
 * @param {Object} moduleData - Current module data
 * @returns {Promise<boolean>}
 */
async function updateTodayRecord(moduleData) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Get yesterday's data for outcome calculation
  let previousData = {};
  try {
    const prevResult = await db.query(
      'SELECT * FROM historical_features WHERE date = $1',
      [yesterday.toISOString().split('T')[0]]
    );
    if (prevResult.rows.length > 0) {
      previousData = prevResult.rows[0];
    }
  } catch (error) {
    console.warn('Could not load previous day data:', error.message);
  }

  const record = await buildHistoricalRecord(today, moduleData, previousData);
  return saveHistoricalFeature(record);
}

/**
 * Get date range of available historical data
 *
 * @returns {Promise<{ earliest: string, latest: string, count: number }>}
 */
async function getDataRange() {
  try {
    const result = await db.query(`
      SELECT
        MIN(date) as earliest,
        MAX(date) as latest,
        COUNT(*) as count
      FROM historical_features
    `);

    return result.rows[0] || { earliest: null, latest: null, count: 0 };
  } catch (error) {
    console.error('Error getting data range:', error.message);
    return { earliest: null, latest: null, count: 0 };
  }
}

/**
 * Get feature statistics for normalization/analysis
 *
 * @param {string} featureName
 * @returns {Promise<{ min: number, max: number, avg: number, stddev: number }>}
 */
async function getFeatureStats(featureName) {
  try {
    const result = await db.query(`
      SELECT
        MIN(${featureName}) as min,
        MAX(${featureName}) as max,
        AVG(${featureName}) as avg,
        STDDEV(${featureName}) as stddev
      FROM historical_features
      WHERE ${featureName} IS NOT NULL
    `);

    return result.rows[0];
  } catch (error) {
    console.error(`Error getting stats for ${featureName}:`, error.message);
    return null;
  }
}

/**
 * Get outcome base rates from historical data
 *
 * @returns {Promise<Object>} Base rates for each outcome
 */
async function getOutcomeBaseRates() {
  const outcomeNames = outcomes.getAllOutcomeNames();
  const rates = {};

  try {
    for (const name of outcomeNames) {
      const result = await db.query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN ${name} = true THEN 1 ELSE 0 END) as positive
        FROM historical_features
        WHERE ${name} IS NOT NULL
      `);

      const row = result.rows[0];
      rates[name] = {
        total: parseInt(row.total, 10),
        positive: parseInt(row.positive, 10),
        rate: row.total > 0 ? row.positive / row.total : 0,
      };
    }
  } catch (error) {
    console.error('Error calculating base rates:', error.message);
  }

  return rates;
}

/**
 * Get rolling average for a feature/outcome
 *
 * @param {string} columnName
 * @param {number} days - Number of days for rolling window
 * @returns {Promise<number>}
 */
async function getRollingAverage(columnName, days = 30) {
  try {
    const result = await db.query(`
      SELECT AVG(${columnName}) as avg
      FROM historical_features
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
        AND ${columnName} IS NOT NULL
    `);

    return result.rows[0]?.avg || null;
  } catch (error) {
    console.error(`Error getting rolling average for ${columnName}:`, error.message);
    return null;
  }
}

/**
 * Check if historical data exists for a date range
 *
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<{ exists: boolean, count: number, missingDates: string[] }>}
 */
async function checkDataCoverage(startDate, endDate) {
  try {
    const result = await db.query(`
      SELECT date
      FROM historical_features
      WHERE date >= $1 AND date <= $2
      ORDER BY date
    `, [startDate, endDate]);

    const existingDates = new Set(result.rows.map((r) => r.date.toISOString().split('T')[0]));

    // Generate expected dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const missingDates = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!existingDates.has(dateStr)) {
        missingDates.push(dateStr);
      }
    }

    return {
      exists: missingDates.length === 0,
      count: existingDates.size,
      missingDates,
    };
  } catch (error) {
    console.error('Error checking data coverage:', error.message);
    return { exists: false, count: 0, missingDates: [] };
  }
}

/**
 * Load correlation results from database
 *
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
async function loadCorrelationResults(options = {}) {
  const {
    outcome = null,
    significantOnly = true,
    minSampleSize = 30,
    limit = 1000,
  } = options;

  let query = 'SELECT * FROM correlation_results WHERE sample_size >= $1';
  const params = [minSampleSize];
  let paramIndex = 2;

  if (significantOnly) {
    query += ' AND is_significant = true';
  }

  if (outcome) {
    query += ` AND outcome = $${paramIndex++}`;
    params.push(outcome);
  }

  query += ' ORDER BY computed_at DESC, ABS(lift - 1) DESC';
  query += ` LIMIT $${paramIndex++}`;
  params.push(limit);

  try {
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error loading correlation results:', error.message);
    return [];
  }
}

/**
 * Save correlation results to database
 *
 * @param {Array} results - Correlation results to save
 * @returns {Promise<number>} Number of saved results
 */
async function saveCorrelationResults(results) {
  if (!results || results.length === 0) return 0;

  let saved = 0;

  for (const result of results) {
    const query = `
      INSERT INTO correlation_results (
        correlation_type, features, outcome,
        probability, sample_size, confidence_low, confidence_high,
        chi_square, p_value, is_significant, base_rate, lift
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    const values = [
      result.type,
      JSON.stringify(result.type === 'single'
        ? { feature: result.feature, value: result.featureValue }
        : result.features),
      result.outcome,
      result.probability,
      result.sampleSize,
      result.confidenceLow,
      result.confidenceHigh,
      result.chiSquare,
      result.pValue,
      result.significant,
      result.baseRate,
      result.lift,
    ];

    try {
      await db.query(query, values);
      saved++;
    } catch (error) {
      console.error('Error saving correlation result:', error.message);
    }
  }

  return saved;
}

/**
 * Clear old correlation results before recomputation
 *
 * @param {number} daysOld - Remove results older than this
 * @returns {Promise<number>} Number of deleted rows
 */
async function clearOldCorrelations(daysOld = 7) {
  try {
    const result = await db.query(`
      DELETE FROM correlation_results
      WHERE computed_at < NOW() - INTERVAL '${daysOld} days'
    `);
    return result.rowCount;
  } catch (error) {
    console.error('Error clearing old correlations:', error.message);
    return 0;
  }
}

/**
 * Get summary statistics for correlation analysis
 *
 * @returns {Promise<Object>}
 */
async function getCorrelationSummary() {
  try {
    const featureResult = await db.query('SELECT COUNT(*) as count FROM historical_features');
    const corrResult = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_significant THEN 1 ELSE 0 END) as significant,
        AVG(sample_size) as avg_sample_size
      FROM correlation_results
    `);

    const rangeResult = await getDataRange();

    return {
      historicalRecords: parseInt(featureResult.rows[0]?.count || 0, 10),
      dateRange: rangeResult,
      correlations: {
        total: parseInt(corrResult.rows[0]?.total || 0, 10),
        significant: parseInt(corrResult.rows[0]?.significant || 0, 10),
        avgSampleSize: parseFloat(corrResult.rows[0]?.avg_sample_size || 0),
      },
    };
  } catch (error) {
    console.error('Error getting correlation summary:', error.message);
    return null;
  }
}

module.exports = {
  // Data loading
  loadHistoricalFeatures,
  loadCorrelationResults,

  // Data saving
  saveHistoricalFeature,
  saveCorrelationResults,

  // Record building
  buildHistoricalRecord,
  updateTodayRecord,

  // Statistics
  getDataRange,
  getFeatureStats,
  getOutcomeBaseRates,
  getRollingAverage,

  // Maintenance
  checkDataCoverage,
  clearOldCorrelations,
  getCorrelationSummary,
};
