/**
 * API Routes - Main data endpoints
 *
 * Endpoints:
 * - GET /api/current - All current module data + indices
 * - GET /api/history/:module - Historical data for a module
 * - GET /api/predictions - Today's full predictions
 * - GET /api/predictions/:outcome - Specific outcome prediction
 * - GET /api/correlations - Query correlation results
 * - GET /api/patterns - Current pattern matches
 * - POST /api/backtest - Custom backtest query
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { getAllModuleData, getModuleData } = require('../scheduler');
const cache = require('../utils/cache');
const correlation = require('../correlation');
const { extractFeatures } = require('../correlation/features');
const prediction = require('../prediction');

// Module list for validation
const VALID_MODULES = [
  'moon', 'tzolkin', 'dreamspell', 'parasha', 'gematria',
  'astrology', 'solar', 'schumann', 'tarot', 'news',
  'numerology', 'iching', 'cosmic', 'markets', 'geophysical', 'sentiment'
];

// Outcome list for validation
const VALID_OUTCOMES = [
  'spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile',
  'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg',
  'geomag_storm', 'sentiment_drop', 'fear_spike'
];

/**
 * GET /api/current
 * Returns current snapshot of all module data and indices
 */
router.get('/current', async (req, res) => {
  try {
    // Try cache first
    const cached = cache.get('api:current');
    if (cached) {
      return res.json(cached);
    }

    // Gather all module data
    const modules = {};
    for (const moduleName of VALID_MODULES) {
      const snapshot = await db.getLatestSnapshot(moduleName);
      if (snapshot) {
        modules[moduleName] = {
          data: snapshot.data,
          collectedAt: snapshot.collected_at,
        };
      }
    }

    // Get today's daily data
    const dailyData = await db.getDailyData(new Date());

    // Get latest indices
    const indicesResult = await db.query(
      `SELECT solar_geo, astro_events, calendar_sync, calculated_at
       FROM indices_history
       ORDER BY calculated_at DESC
       LIMIT 1`
    );

    const indices = indicesResult.rows[0] || {
      solar_geo: null,
      astro_events: null,
      calendar_sync: null,
    };

    // Calculate data age
    let oldestCollection = new Date();
    for (const mod of Object.values(modules)) {
      if (mod.collectedAt && new Date(mod.collectedAt) < oldestCollection) {
        oldestCollection = new Date(mod.collectedAt);
      }
    }
    const dataAgeMs = Date.now() - oldestCollection.getTime();
    const dataAgeMinutes = Math.floor(dataAgeMs / 60000);
    const dataAge = dataAgeMinutes < 60
      ? `${dataAgeMinutes}m`
      : `${Math.floor(dataAgeMinutes / 60)}h ${dataAgeMinutes % 60}m`;

    const response = {
      timestamp: new Date().toISOString(),
      dataAge,
      modules,
      dailyData,
      indices: {
        solarGeo: {
          value: parseFloat(indices.solar_geo) || null,
          level: getSolarGeoLevel(indices.solar_geo),
        },
        astroEvents: {
          count: indices.astro_events || 0,
          level: getAstroEventsLevel(indices.astro_events),
        },
        calendarSync: {
          score: indices.calendar_sync || 0,
          level: getCalendarSyncLevel(indices.calendar_sync),
        },
      },
    };

    // Cache for 5 minutes
    cache.set('api:current', response, 5 * 60 * 1000);

    res.json(response);
  } catch (err) {
    console.error('Error in /api/current:', err);
    res.status(500).json({ error: 'Failed to fetch current data', message: err.message });
  }
});

/**
 * GET /api/history/:module
 * Returns historical data for a specific module
 */
router.get('/history/:module', async (req, res) => {
  try {
    const { module } = req.params;
    const days = Math.min(parseInt(req.query.days, 10) || 7, 90);

    if (!VALID_MODULES.includes(module)) {
      return res.status(400).json({
        error: 'Invalid module',
        validModules: VALID_MODULES,
      });
    }

    const history = await db.getModuleHistory(module, days);

    res.json({
      module,
      days,
      count: history.length,
      data: history.map(row => ({
        data: row.data,
        collectedAt: row.collected_at,
      })),
    });
  } catch (err) {
    console.error('Error in /api/history:', err);
    res.status(500).json({ error: 'Failed to fetch history', message: err.message });
  }
});

/**
 * GET /api/historical/range
 * Returns the date range with available historical data
 */
router.get('/historical/range', async (req, res) => {
  try {
    // Get date range from snapshots
    const snapshotRange = await db.query(`
      SELECT
        MIN(DATE(collected_at)) as min_date,
        MAX(DATE(collected_at)) as max_date,
        COUNT(DISTINCT DATE(collected_at)) as total_days
      FROM snapshots
    `);

    // Get significant dates (pattern matches, notable events)
    const significantDates = await db.query(`
      SELECT DISTINCT DATE(computed_at) as date
      FROM correlation_results
      WHERE is_significant = true AND lift > 1.5
      ORDER BY date DESC
      LIMIT 30
    `);

    res.json({
      range: {
        minDate: snapshotRange.rows[0]?.min_date,
        maxDate: snapshotRange.rows[0]?.max_date,
        totalDays: parseInt(snapshotRange.rows[0]?.total_days) || 0,
      },
      significantDates: significantDates.rows.map(r => r.date),
    });
  } catch (err) {
    console.error('Error in /api/historical/range:', err);
    res.status(500).json({ error: 'Failed to fetch date range', message: err.message });
  }
});

/**
 * GET /api/historical/:date
 * Returns all module data for a specific historical date
 */
router.get('/historical/:date', async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format',
        expected: 'YYYY-MM-DD',
      });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    // Get daily data for that date
    const dailyData = await db.getDailyData(targetDate);

    // Get snapshots closest to that date for each module
    const modules = {};
    for (const moduleName of VALID_MODULES) {
      const result = await db.query(`
        SELECT data, collected_at
        FROM snapshots
        WHERE module = $1
          AND DATE(collected_at) = $2
        ORDER BY collected_at DESC
        LIMIT 1
      `, [moduleName, date]);

      if (result.rows[0]) {
        modules[moduleName] = {
          data: result.rows[0].data,
          collectedAt: result.rows[0].collected_at,
        };
      }
    }

    // Get predictions for that date (if archived)
    let predictions = null;
    try {
      const predResult = await db.query(`
        SELECT outcome_id, predicted_probability, confidence_level, actual_result
        FROM prediction_archive
        WHERE date = $1
      `, [date]);

      if (predResult.rows.length > 0) {
        predictions = predResult.rows.map(row => ({
          outcomeId: row.outcome_id,
          probability: parseFloat(row.predicted_probability),
          confidence: row.confidence_level,
          actual: row.actual_result,
        }));
      }
    } catch (e) {
      // Prediction archive may not exist yet
    }

    res.json({
      date,
      dailyData,
      modules,
      predictions,
      hasData: Object.keys(modules).length > 0 || dailyData !== null,
    });
  } catch (err) {
    console.error('Error in /api/historical/:date:', err);
    res.status(500).json({ error: 'Failed to fetch historical data', message: err.message });
  }
});

/**
 * GET /api/predictions
 * Returns today's full prediction payload using the prediction module
 * with proper log-odds combination and comprehensive factor analysis
 *
 * Query params (all optional):
 * - category: Filter by category (market, geophysical, sentiment)
 * - confidence: Filter by confidence level (high, medium, low, insufficient)
 * - minProbability: Minimum probability threshold (0-1)
 * - maxProbability: Maximum probability threshold (0-1)
 * - search: Search term for outcome names
 */
router.get('/predictions', async (req, res) => {
  try {
    // Try cache first (full unfiltered response)
    let response = cache.get('api:predictions');

    if (!response) {
      // Gather current module data
      const moduleDataMap = {};
      for (const moduleName of VALID_MODULES) {
        const snapshot = await db.getLatestSnapshot(moduleName);
        if (snapshot && snapshot.data) {
          moduleDataMap[moduleName] = snapshot.data;
        }
      }

      // Use the prediction module for proper statistical calculation
      response = await prediction.generatePredictions(moduleDataMap);

      // Cache for 3 hours
      cache.set('api:predictions', response, 3 * 60 * 60 * 1000);
    }

    // Apply filters if any query params provided
    const { category, confidence, minProbability, maxProbability, search } = req.query;
    const hasFilters = category || confidence || minProbability || maxProbability || search;

    if (hasFilters && response.predictions) {
      let filtered = [...response.predictions];

      // Category filter (market outcomes, geophysical, sentiment)
      if (category) {
        const categoryMap = {
          market: ['spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile', 'vix_spike', 'gold_direction'],
          geophysical: ['major_quake', 'quake_above_avg', 'geomag_storm'],
          sentiment: ['sentiment_drop', 'fear_spike']
        };
        const validOutcomes = categoryMap[category.toLowerCase()];
        if (validOutcomes) {
          filtered = filtered.filter(p => validOutcomes.includes(p.outcomeId));
        }
      }

      // Confidence filter
      if (confidence) {
        const confidenceLevel = confidence.toLowerCase();
        filtered = filtered.filter(p =>
          p.confidence?.toLowerCase() === confidenceLevel
        );
      }

      // Probability range filters
      if (minProbability) {
        const min = parseFloat(minProbability);
        if (!isNaN(min)) {
          filtered = filtered.filter(p => p.probability >= min);
        }
      }
      if (maxProbability) {
        const max = parseFloat(maxProbability);
        if (!isNaN(max)) {
          filtered = filtered.filter(p => p.probability <= max);
        }
      }

      // Search filter (case-insensitive name match)
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(p =>
          p.name?.toLowerCase().includes(searchLower) ||
          p.outcomeId?.toLowerCase().includes(searchLower)
        );
      }

      // Return filtered response
      return res.json({
        ...response,
        predictions: filtered,
        filtered: true,
        totalCount: response.predictions.length,
        filteredCount: filtered.length
      });
    }

    res.json(response);
  } catch (err) {
    console.error('Error in /api/predictions:', err);
    res.status(500).json({ error: 'Failed to fetch predictions', message: err.message });
  }
});

/**
 * GET /api/predictions/:outcome
 * Returns prediction for a specific outcome using the prediction module
 */
router.get('/predictions/:outcome', async (req, res) => {
  try {
    const { outcome } = req.params;

    if (!VALID_OUTCOMES.includes(outcome)) {
      return res.status(400).json({
        error: 'Invalid outcome',
        validOutcomes: VALID_OUTCOMES,
      });
    }

    // Gather current module data
    const moduleDataMap = {};
    for (const moduleName of VALID_MODULES) {
      const snapshot = await db.getLatestSnapshot(moduleName);
      if (snapshot && snapshot.data) {
        moduleDataMap[moduleName] = snapshot.data;
      }
    }

    // Use the prediction module for proper statistical calculation
    const result = await prediction.getPredictionForOutcome(moduleDataMap, outcome);

    res.json({
      outcome: formatOutcomeName(outcome),
      outcomeId: outcome,
      ...result,
    });
  } catch (err) {
    console.error('Error in /api/predictions/:outcome:', err);
    res.status(500).json({ error: 'Failed to fetch prediction', message: err.message });
  }
});

/**
 * GET /api/correlations
 * Returns all significant correlations for research
 */
router.get('/correlations', async (req, res) => {
  try {
    const { feature, outcome, minSampleSize = 30, minLift = 1.0 } = req.query;

    let query = `
      SELECT * FROM correlation_results
      WHERE is_significant = true
        AND sample_size >= $1
        AND lift >= $2
    `;
    const params = [parseInt(minSampleSize, 10), parseFloat(minLift)];

    if (outcome && VALID_OUTCOMES.includes(outcome)) {
      params.push(outcome);
      query += ` AND outcome = $${params.length}`;
    }

    // Filter by feature name if provided
    // The features column is JSONB, so we check if the key exists in the object
    if (feature) {
      params.push(feature);
      query += ` AND features ? $${params.length}`;
    }

    query += ' ORDER BY lift DESC, sample_size DESC LIMIT 100';

    const result = await db.query(query, params);

    res.json({
      count: result.rows.length,
      correlations: result.rows,
    });
  } catch (err) {
    console.error('Error in /api/correlations:', err);
    res.status(500).json({ error: 'Failed to fetch correlations', message: err.message });
  }
});

/**
 * GET /api/patterns
 * Returns current pattern matches using the prediction module
 */
router.get('/patterns', async (req, res) => {
  try {
    // Gather current module data
    const moduleDataMap = {};
    for (const moduleName of VALID_MODULES) {
      const snapshot = await db.getLatestSnapshot(moduleName);
      if (snapshot && snapshot.data) {
        moduleDataMap[moduleName] = snapshot.data;
      }
    }

    if (Object.keys(moduleDataMap).length === 0) {
      return res.json({
        patterns: [],
        note: 'No module data available for pattern matching',
      });
    }

    // Use the prediction module for pattern matching
    const result = await prediction.getPatternMatches(moduleDataMap);

    // Also include today's features for transparency
    const todayFeatures = extractFeatures(moduleDataMap, new Date());

    res.json({
      patterns: result.alerts || [],
      todayFeatures: todayFeatures,
      matchCount: result.matchCount,
      avgSimilarity: result.avgSimilarity,
      topMatches: result.topMatches,
      analysis: result.analysis,
      note: result.matchCount === 0
        ? 'No patterns with >80% similarity found. This requires at least 30 historical data points.'
        : undefined,
    });
  } catch (err) {
    console.error('Error in /api/patterns:', err);
    res.status(500).json({ error: 'Failed to fetch patterns', message: err.message });
  }
});

/**
 * POST /api/backtest
 * Run a custom backtest query
 */
router.post('/backtest', async (req, res) => {
  try {
    const { features, outcome, startDate, endDate } = req.body;

    if (!features || !outcome) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['features', 'outcome'],
      });
    }

    if (!VALID_OUTCOMES.includes(outcome)) {
      return res.status(400).json({
        error: 'Invalid outcome',
        validOutcomes: VALID_OUTCOMES,
      });
    }

    // Build query with feature filtering
    // Features object maps column names to values or conditions
    // Supports: exact match, >=, <=, >, < operators for continuous values
    let whereConditions = [`date >= $1`, `date <= $2`];
    const params = [
      startDate || '2000-01-01',
      endDate || new Date().toISOString().split('T')[0],
    ];

    // Add feature conditions
    for (const [featureName, featureValue] of Object.entries(features)) {
      // Validate feature name to prevent SQL injection (only allow alphanumeric and underscore)
      if (!/^[a-z_][a-z0-9_]*$/i.test(featureName)) {
        return res.status(400).json({
          error: 'Invalid feature name',
          feature: featureName,
        });
      }

      if (typeof featureValue === 'string') {
        // Handle comparison operators
        if (featureValue.startsWith('>=')) {
          params.push(parseFloat(featureValue.slice(2)));
          whereConditions.push(`${featureName} >= $${params.length}`);
        } else if (featureValue.startsWith('<=')) {
          params.push(parseFloat(featureValue.slice(2)));
          whereConditions.push(`${featureName} <= $${params.length}`);
        } else if (featureValue.startsWith('>')) {
          params.push(parseFloat(featureValue.slice(1)));
          whereConditions.push(`${featureName} > $${params.length}`);
        } else if (featureValue.startsWith('<')) {
          params.push(parseFloat(featureValue.slice(1)));
          whereConditions.push(`${featureName} < $${params.length}`);
        } else {
          // Exact string match
          params.push(featureValue);
          whereConditions.push(`${featureName} = $${params.length}`);
        }
      } else if (typeof featureValue === 'boolean') {
        params.push(featureValue);
        whereConditions.push(`${featureName} = $${params.length}`);
      } else if (typeof featureValue === 'number') {
        params.push(featureValue);
        whereConditions.push(`${featureName} = $${params.length}`);
      }
    }

    const query = `
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE ${outcome} = true) as positive
      FROM historical_features
      WHERE ${whereConditions.join(' AND ')}
    `;

    const result = await db.query(query, params);

    const total = parseInt(result.rows[0].total, 10);
    const positive = parseInt(result.rows[0].positive, 10);
    const probability = total > 0 ? positive / total : 0;

    // Calculate Wilson confidence interval for the result
    let confidenceInterval = null;
    if (total >= 30) {
      const z = 1.96; // 95% confidence
      const p = probability;
      const n = total;
      const denominator = 1 + z * z / n;
      const center = (p + z * z / (2 * n)) / denominator;
      const spread = (z / denominator) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
      confidenceInterval = [
        Math.max(0, center - spread),
        Math.min(1, center + spread),
      ];
    }

    res.json({
      features,
      outcome,
      dateRange: { start: startDate || '2000-01-01', end: endDate },
      results: {
        totalSamples: total,
        positiveOutcomes: positive,
        probability,
        confidenceInterval,
        sufficient: total >= 30,
      },
    });
  } catch (err) {
    console.error('Error in /api/backtest:', err);
    res.status(500).json({ error: 'Failed to run backtest', message: err.message });
  }
});

// Helper functions

function getSolarGeoLevel(value) {
  if (value === null) return 'Unknown';
  const v = parseFloat(value);
  if (v < 2) return 'Calm';
  if (v < 4) return 'Low';
  if (v < 6) return 'Moderate';
  if (v < 8) return 'Elevated';
  return 'High';
}

function getAstroEventsLevel(count) {
  if (count === null) return 'Unknown';
  if (count === 0) return 'Quiet';
  if (count <= 2) return 'Low';
  if (count <= 4) return 'Active';
  if (count <= 6) return 'Busy';
  return 'Intense';
}

function getCalendarSyncLevel(score) {
  if (score === null) return 'Unknown';
  if (score === 0) return 'None';
  if (score === 1) return 'Low';
  if (score <= 3) return 'Moderate';
  if (score <= 5) return 'High';
  return 'Rare';
}

function getConfidenceLevel(correlation) {
  if (!correlation) return 'Insufficient';

  const n = correlation.sample_size;
  const ciWidth = parseFloat(correlation.confidence_high) - parseFloat(correlation.confidence_low);
  const pValue = parseFloat(correlation.p_value);

  if (n > 200 && ciWidth < 0.15 && pValue < 0.001) return 'Very High';
  if (n > 100 && ciWidth < 0.20 && pValue < 0.01) return 'High';
  if (n > 50 && ciWidth < 0.30 && pValue < 0.05) return 'Medium';
  if (n > 30 && ciWidth < 0.40 && pValue < 0.10) return 'Low';
  return 'Insufficient';
}

function formatOutcomeName(outcomeId) {
  const names = {
    spx_direction: 'S&P 500 Direction',
    spx_volatile: 'Market Volatility',
    btc_direction: 'Bitcoin Direction',
    btc_volatile: 'Bitcoin Volatility',
    vix_spike: 'VIX Spike',
    gold_direction: 'Gold Direction',
    major_quake: 'Major Earthquake (M6+)',
    quake_above_avg: 'Elevated Seismic Activity',
    geomag_storm: 'Geomagnetic Storm',
    sentiment_drop: 'Sentiment Drop',
    fear_spike: 'Fear Spike',
  };
  return names[outcomeId] || outcomeId;
}

module.exports = router;
