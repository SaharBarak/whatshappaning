/**
 * Tests for prediction calculator module
 */

const test = require('node:test');
const assert = require('node:assert');
const calculator = require('./calculator');

test('Calculator Module', async (t) => {

  await t.test('combinePredictions', async (t) => {
    await t.test('should return base rate when no correlations', () => {
      const result = calculator.combinePredictions([], 0.5);
      assert.strictEqual(result.probability, 0.5);
      assert.deepStrictEqual(result.factors, []);
    });

    await t.test('should combine single correlation', () => {
      const correlations = [{
        probability: 0.7,
        sample_size: 100,
        feature: 'mercury_retrograde',
        featureValue: 1,
      }];
      const result = calculator.combinePredictions(correlations, 0.5);

      assert.ok(result.probability > 0.5, 'Probability should increase with positive lift');
      assert.ok(result.probability <= 0.95, 'Probability should be bounded');
      assert.strictEqual(result.factors.length, 1);
    });

    await t.test('should combine multiple correlations', () => {
      const correlations = [
        { probability: 0.7, sample_size: 100, feature: 'feature1', featureValue: 1 },
        { probability: 0.65, sample_size: 80, feature: 'feature2', featureValue: 1 },
      ];
      const result = calculator.combinePredictions(correlations, 0.5);

      assert.ok(result.probability > 0.5);
      assert.strictEqual(result.factors.length, 2);
    });

    await t.test('should handle negative lift', () => {
      const correlations = [{
        probability: 0.3,
        sample_size: 100,
        feature: 'feature1',
        featureValue: 1,
      }];
      const result = calculator.combinePredictions(correlations, 0.5);

      assert.ok(result.probability < 0.5, 'Probability should decrease with negative lift');
      assert.ok(result.probability >= 0.05, 'Probability should be bounded');
    });

    await t.test('should sort factors by contribution', () => {
      const correlations = [
        { probability: 0.6, sample_size: 50, feature: 'small', featureValue: 1 },
        { probability: 0.9, sample_size: 200, feature: 'large', featureValue: 1 },
      ];
      const result = calculator.combinePredictions(correlations, 0.5);

      // Larger sample with higher probability should have greater contribution
      assert.strictEqual(result.factors[0].feature, 'Large');
    });
  });

  await t.test('getTodayFeatures', async (t) => {
    await t.test('should extract features from module data', () => {
      const moduleData = {
        moon: { phaseIndex: 4, sign: 'leo' },
        astrology: { retrogrades: ['Mercury'] },
        solar: { kpIndex: 3 },
      };

      const features = calculator.getTodayFeatures(moduleData);

      assert.ok(features.date);
      assert.ok(features.day_of_week >= 0 && features.day_of_week <= 6);
    });

    await t.test('should handle empty module data', () => {
      const features = calculator.getTodayFeatures({});

      assert.ok(features.date);
      assert.ok(features.day_of_week >= 0);
    });
  });

  await t.test('formatFeatureDescription', async (t) => {
    await t.test('should format single feature', () => {
      const corr = {
        type: 'single',
        features: { feature: 'mercury_retrograde' },
      };
      const desc = calculator.formatFeatureDescription(corr);

      assert.ok(desc.length > 0);
      assert.ok(!desc.includes('_'));
    });

    await t.test('should format combination name', () => {
      const corr = {
        type: 'combination',
        name: 'high_kp_new_moon',
      };
      const desc = calculator.formatFeatureDescription(corr);

      assert.ok(desc.includes('High'));
      assert.ok(!desc.includes('_'));
    });
  });

  await t.test('formatFeatureValue', async (t) => {
    await t.test('should format simple value', () => {
      const corr = { features: { value: '>=5' } };
      const value = calculator.formatFeatureValue(corr);
      assert.strictEqual(value, '>=5');
    });

    await t.test('should handle featureValue', () => {
      const corr = { featureValue: 1 };
      const value = calculator.formatFeatureValue(corr);
      assert.strictEqual(value, '1');
    });
  });

  await t.test('buildHistoricalContext', async (t) => {
    await t.test('should handle empty correlations', () => {
      const context = calculator.buildHistoricalContext([], 'spx_direction');
      assert.ok(context.includes('No historical data'));
    });

    await t.test('should build context from correlations', () => {
      const correlations = [
        { sample_size: 100, probability: 0.7 },
        { sample_size: 50, probability: 0.65 },
      ];
      const context = calculator.buildHistoricalContext(correlations, 'spx_volatile');

      assert.ok(context.includes('factors'));
      assert.ok(context.includes('samples'));
    });
  });

  await t.test('calculateOutcomePrediction', async (t) => {
    await t.test('should return baseline for no matching correlations', () => {
      const result = calculator.calculateOutcomePrediction(
        { mercury_retrograde: 0 },
        'spx_direction',
        []
      );

      assert.strictEqual(result.confidence, 'baseline');
      assert.ok(result.factors.length === 0);
    });

    await t.test('should calculate prediction with correlations', () => {
      const correlations = [{
        outcome: 'spx_volatile',
        probability: 0.7,
        sample_size: 100,
        p_value: 0.01,
        features: { feature: 'mercury_retrograde', value: 1 },
        type: 'single',
      }];

      const result = calculator.calculateOutcomePrediction(
        { mercury_retrograde: 1 },
        'spx_volatile',
        correlations
      );

      assert.ok(result.probability > 0);
      assert.ok(result.probability <= 1);
      assert.ok(result.factors.length > 0 || result.confidence === 'baseline');
    });
  });

  await t.test('calculateAllPredictions', async (t) => {
    await t.test('should return predictions for all outcomes', () => {
      const predictions = calculator.calculateAllPredictions({}, []);

      assert.ok(predictions.length >= 11); // 11 binary outcomes
      assert.ok(predictions.every((p) => p.outcomeId));
      assert.ok(predictions.every((p) => p.probability >= 0 && p.probability <= 1));
    });

    await t.test('should sort predictions', () => {
      const predictions = calculator.calculateAllPredictions({}, []);

      // Should be sorted by probability (descending)
      for (let i = 1; i < predictions.length; i++) {
        const probDiff = predictions[i - 1].probability - predictions[i].probability;
        // Allow equal probabilities
        assert.ok(probDiff >= -0.05);
      }
    });
  });

  await t.test('Module exports', () => {
    assert.ok(typeof calculator.calculateOutcomePrediction === 'function');
    assert.ok(typeof calculator.combinePredictions === 'function');
    assert.ok(typeof calculator.calculateAllPredictions === 'function');
    assert.ok(typeof calculator.getTodayFeatures === 'function');
    assert.ok(typeof calculator.formatFeatureDescription === 'function');
    assert.ok(typeof calculator.formatFeatureValue === 'function');
    assert.ok(typeof calculator.buildHistoricalContext === 'function');
  });
});
