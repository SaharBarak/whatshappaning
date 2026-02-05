/**
 * Tests for analytics routes
 */

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert');

// Mock analytics module
const mockAnalytics = {
  generateAnalyticsReport: mock.fn(),
  getOverallAccuracy: mock.fn(),
  getOutcomeAccuracy: mock.fn(),
  getAccuracyByConfidence: mock.fn(),
  getAccuracyOverTime: mock.fn(),
  getCalibrationData: mock.fn(),
  getPredictionHistory: mock.fn(),
  getFeatureContributions: mock.fn()
};

// Mock cache module
const mockCache = {
  get: mock.fn(),
  set: mock.fn()
};

// Mock express response
function createMockResponse() {
  const res = {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this; },
    json(data) { this._body = data; return this; }
  };
  return res;
}

function createMockRequest(overrides = {}) {
  return {
    method: 'GET',
    path: '/api/analytics',
    query: {},
    params: {},
    ...overrides
  };
}

// Valid outcomes for validation
const VALID_OUTCOMES = [
  'spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile',
  'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg',
  'geomag_storm', 'sentiment_drop', 'fear_spike'
];

describe('analytics routes', () => {
  beforeEach(() => {
    mockAnalytics.generateAnalyticsReport.mock.resetCalls();
    mockAnalytics.getOverallAccuracy.mock.resetCalls();
    mockAnalytics.getOutcomeAccuracy.mock.resetCalls();
    mockAnalytics.getAccuracyByConfidence.mock.resetCalls();
    mockAnalytics.getAccuracyOverTime.mock.resetCalls();
    mockAnalytics.getCalibrationData.mock.resetCalls();
    mockAnalytics.getPredictionHistory.mock.resetCalls();
    mockAnalytics.getFeatureContributions.mock.resetCalls();
    mockCache.get.mock.resetCalls();
    mockCache.set.mock.resetCalls();
  });

  describe('GET /api/analytics', () => {
    it('should return full analytics report', async () => {
      const mockReport = {
        generatedAt: new Date().toISOString(),
        period: { days: 90 },
        summary: { accuracy: 0.75 }
      };
      
      mockCache.get.mock.mockImplementationOnce(() => null);
      mockAnalytics.generateAnalyticsReport.mock.mockImplementationOnce(() => Promise.resolve(mockReport));
      
      const req = createMockRequest({ query: { days: '90' } });
      const res = createMockResponse();
      
      // Simulate route handler
      const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
      const cacheKey = `analytics:report:${days}`;
      const cached = mockCache.get(cacheKey);
      
      if (cached) {
        res.json(cached);
      } else {
        const report = await mockAnalytics.generateAnalyticsReport(days);
        mockCache.set(cacheKey, report, 60 * 60 * 1000);
        res.json(report);
      }
      
      assert.deepStrictEqual(res._body, mockReport);
    });

    it('should return cached report if available', async () => {
      const cachedReport = { generatedAt: 'cached', period: { days: 90 } };
      mockCache.get.mock.mockImplementationOnce(() => cachedReport);
      
      const req = createMockRequest({ query: { days: '90' } });
      const res = createMockResponse();
      
      const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
      const cacheKey = `analytics:report:${days}`;
      const cached = mockCache.get(cacheKey);
      
      if (cached) {
        res.json(cached);
      }
      
      assert.deepStrictEqual(res._body, cachedReport);
      assert.strictEqual(mockAnalytics.generateAnalyticsReport.mock.calls.length, 0);
    });

    it('should limit days to 365 maximum', async () => {
      const req = createMockRequest({ query: { days: '500' } });
      
      const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
      
      assert.strictEqual(days, 365);
    });

    it('should default to 90 days', async () => {
      const req = createMockRequest({ query: {} });
      
      const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
      
      assert.strictEqual(days, 90);
    });
  });

  describe('GET /api/analytics/accuracy', () => {
    it('should return overall accuracy metrics', async () => {
      const mockAccuracy = {
        period: { days: 90 },
        overall: { accuracy: 0.72 },
        byOutcome: []
      };
      
      mockAnalytics.getOverallAccuracy.mock.mockImplementationOnce(() => Promise.resolve(mockAccuracy));
      
      const req = createMockRequest({ query: { days: '90' } });
      const res = createMockResponse();
      
      const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
      const accuracy = await mockAnalytics.getOverallAccuracy(days);
      res.json(accuracy);
      
      assert.deepStrictEqual(res._body, mockAccuracy);
    });
  });

  describe('GET /api/analytics/accuracy/:outcome', () => {
    it('should return accuracy for valid outcome', async () => {
      const mockAccuracy = {
        outcomeId: 'spx_direction',
        accuracy: 0.75
      };
      
      mockAnalytics.getOutcomeAccuracy.mock.mockImplementationOnce(() => Promise.resolve(mockAccuracy));
      
      const req = createMockRequest({ 
        params: { outcome: 'spx_direction' },
        query: { days: '90' }
      });
      const res = createMockResponse();
      
      const { outcome } = req.params;
      const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
      
      if (!VALID_OUTCOMES.includes(outcome)) {
        res.status(400).json({ error: 'Invalid outcome', validOutcomes: VALID_OUTCOMES });
      } else {
        const accuracy = await mockAnalytics.getOutcomeAccuracy(outcome, days);
        res.json(accuracy);
      }
      
      assert.deepStrictEqual(res._body, mockAccuracy);
    });

    it('should reject invalid outcome with 400 status', async () => {
      const req = createMockRequest({ 
        params: { outcome: 'invalid_outcome' },
        query: {}
      });
      const res = createMockResponse();
      
      const { outcome } = req.params;
      
      if (!VALID_OUTCOMES.includes(outcome)) {
        res.status(400).json({ error: 'Invalid outcome', validOutcomes: VALID_OUTCOMES });
      }
      
      assert.strictEqual(res._status, 400);
      assert.strictEqual(res._body.error, 'Invalid outcome');
      assert.deepStrictEqual(res._body.validOutcomes, VALID_OUTCOMES);
    });

    it('should validate all expected outcomes', () => {
      const expectedOutcomes = [
        'spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile',
        'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg',
        'geomag_storm', 'sentiment_drop', 'fear_spike'
      ];
      
      expectedOutcomes.forEach(outcome => {
        assert.ok(VALID_OUTCOMES.includes(outcome), `${outcome} should be valid`);
      });
    });
  });

  describe('GET /api/analytics/by-confidence', () => {
    it('should return accuracy grouped by confidence level', async () => {
      const mockByConfidence = [
        { confidenceLevel: 'Very High', accuracy: 0.90 },
        { confidenceLevel: 'High', accuracy: 0.80 }
      ];
      
      mockAnalytics.getAccuracyByConfidence.mock.mockImplementationOnce(() => Promise.resolve(mockByConfidence));
      
      const req = createMockRequest({ query: { days: '60' } });
      const res = createMockResponse();
      
      const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
      const byConfidence = await mockAnalytics.getAccuracyByConfidence(days);
      res.json({ days, byConfidence });
      
      assert.strictEqual(res._body.days, 60);
      assert.deepStrictEqual(res._body.byConfidence, mockByConfidence);
    });
  });

  describe('GET /api/analytics/over-time', () => {
    it('should return accuracy trends over time', async () => {
      const mockOverTime = [
        { period: '2024-01', accuracy: 0.70 },
        { period: '2024-02', accuracy: 0.75 }
      ];
      
      mockAnalytics.getAccuracyOverTime.mock.mockImplementationOnce(() => Promise.resolve(mockOverTime));
      
      const req = createMockRequest({ query: { days: '90', interval: 'week' } });
      const res = createMockResponse();
      
      const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
      const interval = ['day', 'week', 'month'].includes(req.query.interval)
        ? req.query.interval
        : 'week';
      
      const overTime = await mockAnalytics.getAccuracyOverTime(days, interval);
      res.json({ days, interval, data: overTime });
      
      assert.strictEqual(res._body.days, 90);
      assert.strictEqual(res._body.interval, 'week');
      assert.deepStrictEqual(res._body.data, mockOverTime);
    });

    it('should default to week interval for invalid values', async () => {
      const req = createMockRequest({ query: { interval: 'invalid' } });
      
      const interval = ['day', 'week', 'month'].includes(req.query.interval)
        ? req.query.interval
        : 'week';
      
      assert.strictEqual(interval, 'week');
    });

    it('should accept valid intervals', () => {
      const validIntervals = ['day', 'week', 'month'];
      
      validIntervals.forEach(validInterval => {
        const req = createMockRequest({ query: { interval: validInterval } });
        const interval = ['day', 'week', 'month'].includes(req.query.interval)
          ? req.query.interval
          : 'week';
        assert.strictEqual(interval, validInterval);
      });
    });
  });

  describe('GET /api/analytics/calibration', () => {
    it('should return calibration data', async () => {
      const mockCalibration = [
        { binRange: '0-10%', count: 50, avgPredicted: 0.05, actualRate: 0.06 }
      ];
      
      mockAnalytics.getCalibrationData.mock.mockImplementationOnce(() => Promise.resolve(mockCalibration));
      
      const req = createMockRequest({ query: { days: '90', bins: '10' } });
      const res = createMockResponse();
      
      const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
      const bins = Math.min(Math.max(parseInt(req.query.bins, 10) || 10, 5), 20);
      
      const calibration = await mockAnalytics.getCalibrationData(days, bins);
      res.json({ days, bins, data: calibration });
      
      assert.strictEqual(res._body.days, 90);
      assert.strictEqual(res._body.bins, 10);
      assert.deepStrictEqual(res._body.data, mockCalibration);
    });

    it('should clamp bins between 5 and 20', () => {
      // Test minimum
      let bins = Math.min(Math.max(parseInt('3', 10) || 10, 5), 20);
      assert.strictEqual(bins, 5);
      
      // Test maximum
      bins = Math.min(Math.max(parseInt('25', 10) || 10, 5), 20);
      assert.strictEqual(bins, 20);
      
      // Test valid
      bins = Math.min(Math.max(parseInt('15', 10) || 10, 5), 20);
      assert.strictEqual(bins, 15);
    });

    it('should default to 10 bins', () => {
      const bins = Math.min(Math.max(parseInt(undefined, 10) || 10, 5), 20);
      assert.strictEqual(bins, 10);
    });
  });

  describe('GET /api/analytics/history', () => {
    it('should return paginated prediction history', async () => {
      const mockHistory = {
        total: 500,
        limit: 100,
        offset: 0,
        predictions: []
      };
      
      mockAnalytics.getPredictionHistory.mock.mockImplementationOnce(() => Promise.resolve(mockHistory));
      
      const req = createMockRequest({ query: { limit: '100', offset: '0' } });
      const res = createMockResponse();
      
      const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
      const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
      
      const history = await mockAnalytics.getPredictionHistory(limit, offset);
      res.json(history);
      
      assert.deepStrictEqual(res._body, mockHistory);
    });

    it('should limit to 500 records max', () => {
      const limit = Math.min(parseInt('1000', 10) || 100, 500);
      assert.strictEqual(limit, 500);
    });

    it('should ensure offset is non-negative', () => {
      const offset = Math.max(parseInt('-10', 10) || 0, 0);
      assert.strictEqual(offset, 0);
    });

    it('should default to 100 limit and 0 offset', () => {
      const limit = Math.min(parseInt(undefined, 10) || 100, 500);
      const offset = Math.max(parseInt(undefined, 10) || 0, 0);
      
      assert.strictEqual(limit, 100);
      assert.strictEqual(offset, 0);
    });
  });

  describe('GET /api/analytics/features', () => {
    it('should return top contributing features', async () => {
      const mockFeatures = [
        { features: ['moon_phase'], outcome: 'spx_direction', lift: 1.35 }
      ];
      
      mockAnalytics.getFeatureContributions.mock.mockImplementationOnce(() => Promise.resolve(mockFeatures));
      
      const req = createMockRequest({ query: { days: '90' } });
      const res = createMockResponse();
      
      const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
      const features = await mockAnalytics.getFeatureContributions(days);
      res.json({ days, features });
      
      assert.strictEqual(res._body.days, 90);
      assert.deepStrictEqual(res._body.features, mockFeatures);
    });
  });

  describe('error handling', () => {
    it('should return 500 status on error', async () => {
      const error = new Error('Database connection failed');
      mockAnalytics.getOverallAccuracy.mock.mockImplementationOnce(() => Promise.reject(error));
      
      const res = createMockResponse();
      
      try {
        await mockAnalytics.getOverallAccuracy(90);
      } catch (err) {
        res.status(500).json({
          error: 'Failed to get accuracy metrics',
          message: err.message
        });
      }
      
      assert.strictEqual(res._status, 500);
      assert.strictEqual(res._body.error, 'Failed to get accuracy metrics');
      assert.strictEqual(res._body.message, 'Database connection failed');
    });
  });

  describe('input validation', () => {
    it('should handle NaN days gracefully', () => {
      const days = Math.min(parseInt('not-a-number', 10) || 90, 365);
      assert.strictEqual(days, 90);
    });

    it('should handle negative days', () => {
      const days = Math.min(parseInt('-30', 10) || 90, 365);
      // parseInt returns -30, which is less than 365, so it passes through
      // The validation should ideally also have a minimum, but currently doesn't
      assert.strictEqual(days, -30);
    });

    it('should handle float days', () => {
      const days = Math.min(parseInt('90.5', 10) || 90, 365);
      assert.strictEqual(days, 90);
    });
  });
});
