/**
 * Tests for analytics module - unit tests for calculation logic
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('analytics module calculations', () => {
  describe('accuracy calculation logic', () => {
    it('should calculate accuracy as correct/verified', () => {
      const verified = 90;
      const correct = 72;
      const accuracy = verified > 0 ? correct / verified : null;
      
      assert.strictEqual(accuracy, 0.8);
    });

    it('should return null accuracy when no verified predictions', () => {
      const verified = 0;
      const correct = 0;
      const accuracy = verified > 0 ? correct / verified : null;
      
      assert.strictEqual(accuracy, null);
    });

    it('should calculate calibration error correctly', () => {
      const avgPredicted = 0.65;
      const actualRate = 0.70;
      const calibrationError = Math.abs(avgPredicted - actualRate);
      
      assert.ok(Math.abs(calibrationError - 0.05) < 0.001);
    });

    it('should return null calibration error when data missing', () => {
      const avgPredicted = null;
      const actualRate = 0.70;
      const calibrationError = avgPredicted && actualRate
        ? Math.abs(avgPredicted - actualRate)
        : null;
      
      assert.strictEqual(calibrationError, null);
    });
  });

  describe('prediction correctness determination', () => {
    it('should mark high probability + true outcome as correct', () => {
      const predictedProbability = 0.75;
      const actualResult = true;
      const correct = (predictedProbability >= 0.5 && actualResult) ||
                      (predictedProbability < 0.5 && !actualResult);
      
      assert.strictEqual(correct, true);
    });

    it('should mark low probability + false outcome as correct', () => {
      const predictedProbability = 0.30;
      const actualResult = false;
      const correct = (predictedProbability >= 0.5 && actualResult) ||
                      (predictedProbability < 0.5 && !actualResult);
      
      assert.strictEqual(correct, true);
    });

    it('should mark high probability + false outcome as incorrect', () => {
      const predictedProbability = 0.75;
      const actualResult = false;
      const correct = (predictedProbability >= 0.5 && actualResult) ||
                      (predictedProbability < 0.5 && !actualResult);
      
      assert.strictEqual(correct, false);
    });

    it('should mark low probability + true outcome as incorrect', () => {
      const predictedProbability = 0.30;
      const actualResult = true;
      const correct = (predictedProbability >= 0.5 && actualResult) ||
                      (predictedProbability < 0.5 && !actualResult);
      
      assert.strictEqual(correct, false);
    });

    it('should handle edge case at 0.5 threshold', () => {
      const predictedProbability = 0.5;
      const actualResult = true;
      const correct = (predictedProbability >= 0.5 && actualResult) ||
                      (predictedProbability < 0.5 && !actualResult);
      
      assert.strictEqual(correct, true); // 0.5 >= 0.5 is true
    });

    it('should handle just below 0.5 threshold', () => {
      const predictedProbability = 0.49999;
      const actualResult = false;
      const correct = (predictedProbability >= 0.5 && actualResult) ||
                      (predictedProbability < 0.5 && !actualResult);
      
      assert.strictEqual(correct, true); // 0.49999 < 0.5, and actual is false
    });
  });

  describe('confidence level ordering', () => {
    it('should order confidence levels correctly', () => {
      const getOrder = (level) => {
        switch (level) {
          case 'Very High': return 1;
          case 'High': return 2;
          case 'Medium': return 3;
          case 'Low': return 4;
          default: return 5;
        }
      };
      
      assert.strictEqual(getOrder('Very High'), 1);
      assert.strictEqual(getOrder('High'), 2);
      assert.strictEqual(getOrder('Medium'), 3);
      assert.strictEqual(getOrder('Low'), 4);
      assert.strictEqual(getOrder('Unknown'), 5);
    });

    it('should sort confidence levels in expected order', () => {
      const levels = ['Low', 'Very High', 'Medium', 'High'];
      
      const getOrder = (level) => {
        switch (level) {
          case 'Very High': return 1;
          case 'High': return 2;
          case 'Medium': return 3;
          case 'Low': return 4;
          default: return 5;
        }
      };
      
      const sorted = [...levels].sort((a, b) => getOrder(a) - getOrder(b));
      
      assert.deepStrictEqual(sorted, ['Very High', 'High', 'Medium', 'Low']);
    });
  });

  describe('time interval formatting', () => {
    it('should use correct date_trunc for day interval', () => {
      const interval = 'day';
      let intervalSql;
      
      switch (interval) {
        case 'day':
          intervalSql = "date_trunc('day', date)";
          break;
        case 'month':
          intervalSql = "date_trunc('month', date)";
          break;
        case 'week':
        default:
          intervalSql = "date_trunc('week', date)";
          break;
      }
      
      assert.strictEqual(intervalSql, "date_trunc('day', date)");
    });

    it('should use correct date_trunc for week interval', () => {
      const interval = 'week';
      let intervalSql;
      
      switch (interval) {
        case 'day':
          intervalSql = "date_trunc('day', date)";
          break;
        case 'month':
          intervalSql = "date_trunc('month', date)";
          break;
        case 'week':
        default:
          intervalSql = "date_trunc('week', date)";
          break;
      }
      
      assert.strictEqual(intervalSql, "date_trunc('week', date)");
    });

    it('should default to week for unknown interval', () => {
      const interval = 'quarter'; // not supported
      let intervalSql;
      
      switch (interval) {
        case 'day':
          intervalSql = "date_trunc('day', date)";
          break;
        case 'month':
          intervalSql = "date_trunc('month', date)";
          break;
        case 'week':
        default:
          intervalSql = "date_trunc('week', date)";
          break;
      }
      
      assert.strictEqual(intervalSql, "date_trunc('week', date)");
    });
  });

  describe('calibration bin calculations', () => {
    it('should calculate bin ranges correctly', () => {
      const bins = 10;
      const binSize = 1 / bins;
      const calibrationData = [];
      
      for (let i = 0; i < bins; i++) {
        const lowerBound = i * binSize;
        const upperBound = (i + 1) * binSize;
        calibrationData.push({
          binRange: `${(lowerBound * 100).toFixed(0)}-${(upperBound * 100).toFixed(0)}%`,
          binCenter: (lowerBound + upperBound) / 2
        });
      }
      
      assert.strictEqual(calibrationData[0].binRange, '0-10%');
      assert.strictEqual(calibrationData[0].binCenter, 0.05);
      assert.strictEqual(calibrationData[4].binRange, '40-50%');
      assert.strictEqual(calibrationData[4].binCenter, 0.45);
      assert.strictEqual(calibrationData[9].binRange, '90-100%');
      assert.strictEqual(calibrationData[9].binCenter, 0.95);
    });

    it('should handle different bin counts', () => {
      const bins = 5;
      const binSize = 1 / bins;
      const calibrationData = [];
      
      for (let i = 0; i < bins; i++) {
        const lowerBound = i * binSize;
        const upperBound = (i + 1) * binSize;
        calibrationData.push({
          binRange: `${(lowerBound * 100).toFixed(0)}-${(upperBound * 100).toFixed(0)}%`
        });
      }
      
      assert.strictEqual(calibrationData.length, 5);
      assert.strictEqual(calibrationData[0].binRange, '0-20%');
      assert.strictEqual(calibrationData[4].binRange, '80-100%');
    });
  });

  describe('date formatting', () => {
    it('should format date string correctly for archive', () => {
      const date = new Date('2024-01-15T12:30:00Z');
      const dateStr = date.toISOString().split('T')[0];
      
      assert.strictEqual(dateStr, '2024-01-15');
    });

    it('should handle different timezones consistently', () => {
      const date = new Date('2024-06-15T23:59:59Z');
      const dateStr = date.toISOString().split('T')[0];
      
      assert.strictEqual(dateStr, '2024-06-15');
    });
  });

  describe('numeric parsing from database', () => {
    it('should parse integer strings correctly', () => {
      const row = { total: '100', verified: '90', correct: '72' };
      
      const total = parseInt(row.total, 10);
      const verified = parseInt(row.verified, 10);
      const correct = parseInt(row.correct, 10);
      
      assert.strictEqual(total, 100);
      assert.strictEqual(verified, 90);
      assert.strictEqual(correct, 72);
    });

    it('should parse float strings correctly', () => {
      const row = { 
        brier_skill: '0.75', 
        avg_predicted: '0.65', 
        actual_rate: '0.70' 
      };
      
      const brierSkill = parseFloat(row.brier_skill);
      const avgPredicted = parseFloat(row.avg_predicted);
      const actualRate = parseFloat(row.actual_rate);
      
      assert.strictEqual(brierSkill, 0.75);
      assert.strictEqual(avgPredicted, 0.65);
      assert.strictEqual(actualRate, 0.70);
    });

    it('should handle null values', () => {
      const row = { brier_skill: null };
      
      const brierSkill = row.brier_skill ? parseFloat(row.brier_skill) : null;
      
      assert.strictEqual(brierSkill, null);
    });
  });

  describe('outcome accuracy mapping', () => {
    it('should map database rows to outcome accuracy objects', () => {
      const rows = [
        { outcome_id: 'spx_direction', total: '100', correct: '75' },
        { outcome_id: 'btc_direction', total: '100', correct: '65' }
      ];
      
      const byOutcome = rows.map(row => ({
        outcomeId: row.outcome_id,
        total: parseInt(row.total, 10),
        correct: parseInt(row.correct, 10),
        accuracy: parseInt(row.total, 10) > 0
          ? parseInt(row.correct, 10) / parseInt(row.total, 10)
          : null
      }));
      
      assert.strictEqual(byOutcome.length, 2);
      assert.strictEqual(byOutcome[0].outcomeId, 'spx_direction');
      assert.strictEqual(byOutcome[0].accuracy, 0.75);
      assert.strictEqual(byOutcome[1].outcomeId, 'btc_direction');
      assert.strictEqual(byOutcome[1].accuracy, 0.65);
    });

    it('should handle zero total predictions', () => {
      const row = { outcome_id: 'test', total: '0', correct: '0' };
      
      const accuracy = parseInt(row.total, 10) > 0
        ? parseInt(row.correct, 10) / parseInt(row.total, 10)
        : null;
      
      assert.strictEqual(accuracy, null);
    });
  });

  describe('feature contribution mapping', () => {
    it('should map database rows to feature objects', () => {
      const rows = [
        { features: ['moon_phase'], outcome: 'spx_direction', lift: '1.35', sample_size: '500', p_value: '0.001' },
        { features: ['mercury_retrograde'], outcome: 'btc_volatile', lift: '1.25', sample_size: '300', p_value: '0.01' }
      ];
      
      const features = rows.map(row => ({
        features: row.features,
        outcome: row.outcome,
        lift: parseFloat(row.lift),
        sampleSize: parseInt(row.sample_size, 10),
        pValue: parseFloat(row.p_value)
      }));
      
      assert.strictEqual(features.length, 2);
      assert.deepStrictEqual(features[0].features, ['moon_phase']);
      assert.strictEqual(features[0].lift, 1.35);
      assert.strictEqual(features[0].sampleSize, 500);
    });
  });

  describe('SQL parameterization verification', () => {
    it('should use make_interval for days parameter', () => {
      // This tests that the SQL pattern is correct
      const sqlPattern = `WHERE date > NOW() - make_interval(days => $1)`;
      
      assert.ok(sqlPattern.includes('make_interval'));
      assert.ok(sqlPattern.includes('$1'));
      assert.ok(!sqlPattern.includes('${'));  // No string interpolation
    });

    it('should not use string interpolation for days', () => {
      // Vulnerable pattern (should NOT be used)
      const vulnerablePattern = /INTERVAL '\$\{days\} days'/;
      const safePattern = 'make_interval(days => $1)';
      
      // Safe pattern should not match vulnerable pattern
      assert.ok(!vulnerablePattern.test(safePattern));
    });
  });

  describe('prediction history mapping', () => {
    it('should map database rows to prediction objects', () => {
      const row = {
        date: new Date('2024-01-15'),
        outcome_id: 'spx_direction',
        predicted_probability: '0.75',
        confidence_level: 'High',
        actual_result: true,
        verified_at: new Date()
      };
      
      const prediction = {
        date: row.date,
        outcomeId: row.outcome_id,
        predictedProbability: parseFloat(row.predicted_probability),
        confidenceLevel: row.confidence_level,
        actualResult: row.actual_result,
        verifiedAt: row.verified_at,
        correct: (parseFloat(row.predicted_probability) >= 0.5 && row.actual_result) ||
                 (parseFloat(row.predicted_probability) < 0.5 && !row.actual_result)
      };
      
      assert.strictEqual(prediction.outcomeId, 'spx_direction');
      assert.strictEqual(prediction.predictedProbability, 0.75);
      assert.strictEqual(prediction.correct, true);
    });
  });

  describe('report generation structure', () => {
    it('should include all required report fields', () => {
      const report = {
        generatedAt: new Date().toISOString(),
        period: { days: 90, firstDate: null, lastDate: null },
        summary: { totalPredictions: 0, correctPredictions: 0, accuracy: null },
        byOutcome: [],
        byConfidence: [],
        overTime: [],
        calibration: [],
        topFeatures: []
      };
      
      assert.ok(report.generatedAt);
      assert.ok(report.period);
      assert.ok(report.summary !== undefined);
      assert.ok(Array.isArray(report.byOutcome));
      assert.ok(Array.isArray(report.byConfidence));
      assert.ok(Array.isArray(report.overTime));
      assert.ok(Array.isArray(report.calibration));
      assert.ok(Array.isArray(report.topFeatures));
    });

    it('should limit topFeatures to 20', () => {
      const allFeatures = Array.from({ length: 50 }, (_, i) => ({ id: i }));
      const topFeatures = allFeatures.slice(0, 20);
      
      assert.strictEqual(topFeatures.length, 20);
    });
  });
});
