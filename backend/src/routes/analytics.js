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
 * - GET /api/analytics/dashboard - Enhanced dashboard data (v2)
 * - GET /api/analytics/rolling - Rolling accuracy windows
 * - GET /api/analytics/streaks - Prediction streak analysis
 * - GET /api/analytics/best-worst - Best and worst performing periods
 * - GET /api/analytics/by-category - Accuracy by category
 * - GET /api/analytics/trend - Accuracy trend from snapshots
 * - POST /api/analytics/snapshot - Generate daily snapshot
 */

const express = require('express');
const router = express.Router();
const analytics = require('../analytics');
const accuracyEngine = require('../analytics/accuracy-engine');
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

// =====================================================
// ACCURACY ENGINE V2 ROUTES
// =====================================================

/**
 * GET /api/analytics/dashboard
 * Returns comprehensive dashboard data with all metrics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 90, 365);

    // Try cache first (cache for 30 minutes)
    const cacheKey = `analytics:dashboard:${days}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const dashboard = await accuracyEngine.getDashboardData(days);

    // Cache for 30 minutes
    cache.set(cacheKey, dashboard, 30 * 60 * 1000);

    res.json(dashboard);
  } catch (err) {
    console.error('Error in /api/analytics/dashboard:', err);
    res.status(500).json({
      error: 'Failed to generate dashboard data',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/rolling
 * Returns rolling accuracy for multiple windows
 */
router.get('/rolling', async (req, res) => {
  try {
    const { outcome } = req.query;
    const windows = [7, 30, 90];

    const rolling = await accuracyEngine.getRollingAccuracy(outcome || null, windows);

    res.json({
      outcome: outcome || 'all',
      windows: rolling
    });
  } catch (err) {
    console.error('Error in /api/analytics/rolling:', err);
    res.status(500).json({
      error: 'Failed to get rolling accuracy',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/streaks
 * Returns prediction streak analysis
 */
router.get('/streaks', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
    const { outcome } = req.query;

    const streaks = await accuracyEngine.analyzeStreaks(outcome || null, days);

    res.json({
      days,
      outcome: outcome || 'all',
      ...streaks
    });
  } catch (err) {
    console.error('Error in /api/analytics/streaks:', err);
    res.status(500).json({
      error: 'Failed to analyze streaks',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/best-worst
 * Returns best and worst performing periods
 */
router.get('/best-worst', async (req, res) => {
  try {
    const windowDays = Math.min(Math.max(parseInt(req.query.window, 10) || 7, 3), 30);
    const lookbackDays = Math.min(parseInt(req.query.days, 10) || 90, 365);

    const periods = await accuracyEngine.findBestWorstPeriods(windowDays, lookbackDays);

    res.json(periods);
  } catch (err) {
    console.error('Error in /api/analytics/best-worst:', err);
    res.status(500).json({
      error: 'Failed to find best/worst periods',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/by-category
 * Returns accuracy grouped by prediction category
 */
router.get('/by-category', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 90, 365);

    const byCategory = await accuracyEngine.getAccuracyByCategory(days);

    res.json({
      days,
      categories: byCategory
    });
  } catch (err) {
    console.error('Error in /api/analytics/by-category:', err);
    res.status(500).json({
      error: 'Failed to get category accuracy',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/by-tag
 * Returns accuracy grouped by prediction tags
 */
router.get('/by-tag', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 90, 365);

    const byTag = await accuracyEngine.getAccuracyByTag(days);

    res.json({
      days,
      tags: byTag
    });
  } catch (err) {
    console.error('Error in /api/analytics/by-tag:', err);
    res.status(500).json({
      error: 'Failed to get tag accuracy',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/trend
 * Returns accuracy trend from daily snapshots
 */
router.get('/trend', async (req, res) => {
  try {
    const { outcome } = req.query;
    const periodDays = [7, 30, 90].includes(parseInt(req.query.period, 10))
      ? parseInt(req.query.period, 10)
      : 30;
    const lookbackDays = Math.min(parseInt(req.query.days, 10) || 180, 365);

    const trend = await accuracyEngine.getAccuracyTrend(
      outcome || null,
      periodDays,
      lookbackDays
    );

    res.json({
      outcome: outcome || 'overall',
      periodDays,
      lookbackDays,
      data: trend
    });
  } catch (err) {
    console.error('Error in /api/analytics/trend:', err);
    res.status(500).json({
      error: 'Failed to get accuracy trend',
      message: err.message
    });
  }
});

/**
 * GET /api/analytics/hit-rate
 * Returns hit rate by probability buckets for calibration curve
 */
router.get('/hit-rate', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
    const buckets = Math.min(Math.max(parseInt(req.query.buckets, 10) || 10, 5), 20);

    const hitRate = await accuracyEngine.getHitRateByProbability(days, buckets);

    res.json({
      days,
      buckets,
      data: hitRate
    });
  } catch (err) {
    console.error('Error in /api/analytics/hit-rate:', err);
    res.status(500).json({
      error: 'Failed to get hit rate data',
      message: err.message
    });
  }
});

/**
 * POST /api/analytics/snapshot
 * Generates daily accuracy snapshot (for cron jobs)
 */
router.post('/snapshot', async (req, res) => {
  try {
    const { date } = req.body;
    const snapshotDate = date ? new Date(date) : new Date();

    const result = await accuracyEngine.generateDailySnapshot(snapshotDate);

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('Error in POST /api/analytics/snapshot:', err);
    res.status(500).json({
      error: 'Failed to generate snapshot',
      message: err.message
    });
  }
});

module.exports = router;
