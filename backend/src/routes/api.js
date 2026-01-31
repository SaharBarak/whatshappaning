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
 * GET /api/predictions
 * Returns today's full prediction payload
 */
router.get('/predictions', async (req, res) => {
  try {
    // Try cache first
    const cached = cache.get('api:predictions');
    if (cached) {
      return res.json(cached);
    }

    // Get correlation results
    const correlations = await db.query(
      `SELECT * FROM correlation_results
       WHERE is_significant = true
       ORDER BY outcome, probability DESC`
    );

    // Group by outcome
    const predictionsByOutcome = {};
    for (const corr of correlations.rows) {
      if (!predictionsByOutcome[corr.outcome]) {
        predictionsByOutcome[corr.outcome] = [];
      }
      predictionsByOutcome[corr.outcome].push(corr);
    }

    // Build predictions
    const predictions = VALID_OUTCOMES.map(outcome => {
      const factors = predictionsByOutcome[outcome] || [];
      const topFactors = factors.slice(0, 5);

      // Calculate combined probability (simplified)
      const baseRate = factors[0]?.base_rate || 0.5;
      let probability = baseRate;

      if (topFactors.length > 0) {
        const avgLift = topFactors.reduce((sum, f) => sum + parseFloat(f.lift || 1), 0) / topFactors.length;
        probability = Math.min(0.95, Math.max(0.05, baseRate * avgLift));
      }

      return {
        outcome: formatOutcomeName(outcome),
        outcomeId: outcome,
        probability: Math.round(probability * 100) / 100,
        confidenceInterval: topFactors[0]
          ? [parseFloat(topFactors[0].confidence_low), parseFloat(topFactors[0].confidence_high)]
          : [probability - 0.1, probability + 0.1],
        sampleSize: topFactors[0]?.sample_size || 0,
        baseRate: parseFloat(baseRate),
        confidence: getConfidenceLevel(topFactors[0]),
        factors: topFactors.map(f => ({
          feature: JSON.stringify(f.features),
          contribution: parseFloat(f.probability) - parseFloat(f.base_rate || 0.5),
          standalone: parseFloat(f.probability),
          sampleSize: f.sample_size,
        })),
      };
    });

    const response = {
      date: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      predictions,
      patternAlerts: [], // TODO: Implement pattern matching
      actionSuggestions: generateSuggestions(predictions),
      summary: generateSummary(predictions),
      disclaimer: 'These predictions are based on historical statistical correlations and are provided for informational/entertainment purposes only. Past patterns do not guarantee future outcomes. This is not financial, medical, or professional advice.',
    };

    // Cache for 3 hours
    cache.set('api:predictions', response, 3 * 60 * 60 * 1000);

    res.json(response);
  } catch (err) {
    console.error('Error in /api/predictions:', err);
    res.status(500).json({ error: 'Failed to fetch predictions', message: err.message });
  }
});

/**
 * GET /api/predictions/:outcome
 * Returns prediction for a specific outcome
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

    const correlations = await db.query(
      `SELECT * FROM correlation_results
       WHERE outcome = $1 AND is_significant = true
       ORDER BY probability DESC
       LIMIT 10`,
      [outcome]
    );

    res.json({
      outcome: formatOutcomeName(outcome),
      outcomeId: outcome,
      factors: correlations.rows,
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
 * Returns current pattern matches
 */
router.get('/patterns', async (req, res) => {
  try {
    // TODO: Implement pattern matching logic
    res.json({
      patterns: [],
      note: 'Pattern matching will be implemented once sufficient historical data is collected',
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

    // Build query to filter historical features
    // This is a simplified implementation
    const result = await db.query(
      `SELECT COUNT(*) as total,
              COUNT(*) FILTER (WHERE ${outcome} = true) as positive
       FROM historical_features
       WHERE date >= $1 AND date <= $2`,
      [startDate || '2000-01-01', endDate || new Date().toISOString().split('T')[0]]
    );

    const total = parseInt(result.rows[0].total, 10);
    const positive = parseInt(result.rows[0].positive, 10);

    res.json({
      features,
      outcome,
      dateRange: { start: startDate, end: endDate },
      results: {
        totalSamples: total,
        positiveOutcomes: positive,
        probability: total > 0 ? positive / total : 0,
        note: 'Full feature filtering will be implemented in Phase 5',
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

function generateSuggestions(predictions) {
  const suggestions = [];

  // Find high probability negative outcomes
  const volatilePred = predictions.find(p => p.outcomeId === 'spx_volatile');
  if (volatilePred && volatilePred.probability > 0.6) {
    suggestions.push({
      category: 'Markets',
      suggestion: 'Elevated caution',
      reasoning: `${Math.round(volatilePred.probability * 100)}% volatility probability`,
      confidence: volatilePred.confidence,
    });
  }

  // Default favorable suggestions
  suggestions.push({
    category: 'General',
    suggestion: 'Review and planning',
    reasoning: 'Always favorable for reflection and preparation',
    confidence: 'Low',
    disclaimer: 'Based on general patterns',
  });

  return suggestions;
}

function generateSummary(predictions) {
  const highRiskPredictions = predictions.filter(p => p.probability > 0.6);
  const stableIndicators = predictions.filter(p => p.probability < 0.3);

  let tensionScore = 0;
  for (const p of predictions) {
    if (p.outcomeId.includes('volatile') || p.outcomeId.includes('spike') || p.outcomeId.includes('drop')) {
      tensionScore += p.probability * 2;
    }
  }
  tensionScore = Math.min(10, tensionScore);

  return {
    overallTension: tensionScore > 6 ? 'high' : tensionScore > 3 ? 'medium' : 'low',
    tensionScore: Math.round(tensionScore * 10) / 10,
    topRisks: highRiskPredictions.map(p => p.outcome),
    stableFactors: stableIndicators.map(p => `Low ${p.outcome} probability`),
  };
}

module.exports = router;
