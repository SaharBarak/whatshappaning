/**
 * Analytics Routes - Prediction Accuracy Dashboard API
 *
 * Endpoints:
 * - GET /api/analytics - Full analytics report
 * - GET /api/analytics/accuracy - Overall accuracy metrics
 * - GET /api/analytics/accuracy/:outcome - Accuracy for specific outcome
 * - GET /api/analytics/by-confidence - Accuracy by confidence level
 * - GET /api/analytics/over-time - Accuracy trends over time
 * - GET /api/analytics/calibration - Calibration data for reliability diagrams
 * - GET /api/analytics/history - Historical prediction archive
 * - GET /api/analytics/features - Top contributing features
 */

const express = require('express');
const router = express.Router();
const analytics = require('../analytics');
const cache = require('../utils/cache');

// Valid outcomes for validation
const VALID_OUTCOMES = [
  'spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile',
  'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg',
  'geomag_storm', 'sentiment_drop', 'fear_spike'
];

/**
 * GET /api/analytics
 * Returns complete analytics report with all metrics
 */
router.get('/', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 90, 365);

    // Try cache first (cache for 1 hour)
    const cacheKey = `analytics:report:${days}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const report = await analytics.generateAnalyticsReport(days);

    // Cache for 1 hour
    cache.set(cacheKey, report, 60 * 60 * 1000);

    res.json(report);
  } catch (err) {
    console.error('Error in /api/analytics:', err);
    res.status(500).json({
      error: 'Failed to generate analytics report',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/accuracy
 * Returns overall accuracy summary
 */
router.get('/accuracy', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 90, 365);

    const accuracy = await analytics.getOverallAccuracy(days);

    res.json(accuracy);
  } catch (err) {
    console.error('Error in /api/analytics/accuracy:', err);
    res.status(500).json({
      error: 'Failed to get accuracy metrics',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/accuracy/:outcome
 * Returns accuracy for a specific outcome
 */
router.get('/accuracy/:outcome', async (req, res) => {
  try {
    const { outcome } = req.params;
    const days = Math.min(parseInt(req.query.days, 10) || 90, 365);

    if (!VALID_OUTCOMES.includes(outcome)) {
      return res.status(400).json({
        error: 'Invalid outcome',
        validOutcomes: VALID_OUTCOMES
      });
    }

    const accuracy = await analytics.getOutcomeAccuracy(outcome, days);

    res.json(accuracy);
  } catch (err) {
    console.error('Error in /api/analytics/accuracy/:outcome:', err);
    res.status(500).json({
      error: 'Failed to get outcome accuracy',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/by-confidence
 * Returns accuracy grouped by confidence level
 */
router.get('/by-confidence', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 90, 365);

    const byConfidence = await analytics.getAccuracyByConfidence(days);

    res.json({
      days,
      byConfidence
    });
  } catch (err) {
    console.error('Error in /api/analytics/by-confidence:', err);
    res.status(500).json({
      error: 'Failed to get confidence accuracy',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/over-time
 * Returns accuracy trends over time
 */
router.get('/over-time', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
    const interval = ['day', 'week', 'month'].includes(req.query.interval)
      ? req.query.interval
      : 'week';

    const overTime = await analytics.getAccuracyOverTime(days, interval);

    res.json({
      days,
      interval,
      data: overTime
    });
  } catch (err) {
    console.error('Error in /api/analytics/over-time:', err);
    res.status(500).json({
      error: 'Failed to get accuracy over time',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/calibration
 * Returns calibration data for reliability diagrams
 */
router.get('/calibration', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
    const bins = Math.min(Math.max(parseInt(req.query.bins, 10) || 10, 5), 20);

    const calibration = await analytics.getCalibrationData(days, bins);

    res.json({
      days,
      bins,
      data: calibration
    });
  } catch (err) {
    console.error('Error in /api/analytics/calibration:', err);
    res.status(500).json({
      error: 'Failed to get calibration data',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/history
 * Returns historical prediction archive
 */
router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const history = await analytics.getPredictionHistory(limit, offset);

    res.json(history);
  } catch (err) {
    console.error('Error in /api/analytics/history:', err);
    res.status(500).json({
      error: 'Failed to get prediction history',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/features
 * Returns top contributing features
 */
router.get('/features', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 90, 365);

    const features = await analytics.getFeatureContributions(days);

    res.json({
      days,
      features
    });
  } catch (err) {
    console.error('Error in /api/analytics/features:', err);
    res.status(500).json({
      error: 'Failed to get feature contributions',
      message: err.message
    });
  }
});

module.exports = router;
