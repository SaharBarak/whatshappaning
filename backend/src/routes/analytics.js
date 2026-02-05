/**
 * Analytics Routes
 *
 * Exposes prediction accuracy and analytics data.
 *
 * Endpoints:
 * - GET /api/analytics - Full analytics report
 * - GET /api/analytics/accuracy - Overall prediction accuracy
 * - GET /api/analytics/accuracy/:outcome - Accuracy for specific outcome
 * - GET /api/analytics/by-confidence - Accuracy grouped by confidence level
 * - GET /api/analytics/over-time - Accuracy trends over time
 * - GET /api/analytics/calibration - Calibration data for reliability diagrams
 * - GET /api/analytics/history - Prediction archive
 * - GET /api/analytics/features - Top contributing features
 * - POST /api/analytics/record - Record actual outcome (admin)
 */

const express = require('express');
const router = express.Router();
const analytics = require('../analytics');
const cache = require('../utils/cache');

/**
 * GET /api/analytics
 * Returns full analytics report
 */
router.get('/', async (req, res) => {
  try {
    // Try cache first (cache for 15 minutes)
    const cached = cache.get('analytics:full');
    if (cached) {
      return res.json(cached);
    }

    const report = await analytics.getFullReport();

    // Cache for 15 minutes
    cache.set('analytics:full', report, 15 * 60 * 1000);

    res.json(report);
  } catch (err) {
    console.error('Error in /api/analytics:', err);
    res.status(500).json({ error: 'Failed to fetch analytics', message: err.message });
  }
});

/**
 * GET /api/analytics/accuracy
 * Returns overall prediction accuracy
 */
router.get('/accuracy', async (req, res) => {
  try {
    const accuracy = await analytics.getOverallAccuracy();
    res.json(accuracy);
  } catch (err) {
    console.error('Error in /api/analytics/accuracy:', err);
    res.status(500).json({ error: 'Failed to fetch accuracy', message: err.message });
  }
});

/**
 * GET /api/analytics/accuracy/:outcome
 * Returns accuracy for a specific outcome
 */
router.get('/accuracy/:outcome', async (req, res) => {
  try {
    const { outcome } = req.params;
    const accuracy = await analytics.getOutcomeAccuracy(outcome);

    if (accuracy.error === 'Invalid outcome') {
      return res.status(400).json(accuracy);
    }

    res.json(accuracy);
  } catch (err) {
    console.error('Error in /api/analytics/accuracy/:outcome:', err);
    res.status(500).json({ error: 'Failed to fetch accuracy', message: err.message });
  }
});

/**
 * GET /api/analytics/by-confidence
 * Returns accuracy grouped by confidence level
 */
router.get('/by-confidence', async (req, res) => {
  try {
    const cached = cache.get('analytics:by-confidence');
    if (cached) {
      return res.json(cached);
    }

    const data = await analytics.getAccuracyByConfidence();

    cache.set('analytics:by-confidence', data, 15 * 60 * 1000);

    res.json(data);
  } catch (err) {
    console.error('Error in /api/analytics/by-confidence:', err);
    res.status(500).json({ error: 'Failed to fetch data', message: err.message });
  }
});

/**
 * GET /api/analytics/over-time
 * Returns accuracy trends over time
 */
router.get('/over-time', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
    const granularity = ['day', 'week', 'month'].includes(req.query.granularity)
      ? req.query.granularity
      : 'day';

    const cacheKey = `analytics:over-time:${days}:${granularity}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const data = await analytics.getAccuracyOverTime(days, granularity);

    cache.set(cacheKey, data, 15 * 60 * 1000);

    res.json(data);
  } catch (err) {
    console.error('Error in /api/analytics/over-time:', err);
    res.status(500).json({ error: 'Failed to fetch data', message: err.message });
  }
});

/**
 * GET /api/analytics/calibration
 * Returns calibration data for reliability diagrams
 */
router.get('/calibration', async (req, res) => {
  try {
    const bins = Math.min(Math.max(parseInt(req.query.bins, 10) || 10, 5), 20);

    const cacheKey = `analytics:calibration:${bins}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const data = await analytics.getCalibrationData(bins);

    cache.set(cacheKey, data, 15 * 60 * 1000);

    res.json(data);
  } catch (err) {
    console.error('Error in /api/analytics/calibration:', err);
    res.status(500).json({ error: 'Failed to fetch data', message: err.message });
  }
});

/**
 * GET /api/analytics/history
 * Returns prediction archive/history
 */
router.get('/history', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const outcome = req.query.outcome;

    const data = await analytics.getPredictionHistory({
      outcome,
      days,
      limit,
      offset,
    });

    res.json(data);
  } catch (err) {
    console.error('Error in /api/analytics/history:', err);
    res.status(500).json({ error: 'Failed to fetch history', message: err.message });
  }
});

/**
 * GET /api/analytics/features
 * Returns top contributing features
 */
router.get('/features', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const outcome = req.query.outcome;

    const cacheKey = `analytics:features:${outcome || 'all'}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const data = await analytics.getTopFeatures({ outcome, limit });

    cache.set(cacheKey, data, 15 * 60 * 1000);

    res.json(data);
  } catch (err) {
    console.error('Error in /api/analytics/features:', err);
    res.status(500).json({ error: 'Failed to fetch features', message: err.message });
  }
});

/**
 * POST /api/analytics/record
 * Record actual outcome for a prediction (admin endpoint)
 */
router.post('/record', async (req, res) => {
  try {
    const { date, outcome, actualValue } = req.body;

    if (!date || !outcome || actualValue === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['date', 'outcome', 'actualValue'],
      });
    }

    if (!analytics.OUTCOMES.includes(outcome)) {
      return res.status(400).json({
        error: 'Invalid outcome',
        validOutcomes: analytics.OUTCOMES,
      });
    }

    const success = await analytics.recordOutcome(date, outcome, actualValue);

    if (success) {
      // Invalidate related caches
      cache.delete('analytics:full');
      cache.delete('analytics:by-confidence');

      res.json({ success: true, message: 'Outcome recorded' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to record outcome' });
    }
  } catch (err) {
    console.error('Error in POST /api/analytics/record:', err);
    res.status(500).json({ error: 'Failed to record outcome', message: err.message });
  }
});

module.exports = router;
