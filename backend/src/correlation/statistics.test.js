/**
 * Tests for correlation statistics module
 */

const test = require('node:test');
const assert = require('node:assert');
const statistics = require('./statistics');

test('Statistics Module', async (t) => {

  await t.test('wilsonConfidenceInterval', async (t) => {
    await t.test('should calculate CI for 50% probability', () => {
      const result = statistics.wilsonConfidenceInterval(50, 100, 0.95);
      assert.ok(result.low > 0.39, `Low bound should be > 0.39, got ${result.low}`);
      assert.ok(result.high < 0.61, `High bound should be < 0.61, got ${result.high}`);
      assert.ok(Math.abs(result.center - 0.5) < 0.05, 'Center should be near 0.5');
    });

    await t.test('should handle 0 successes', () => {
      const result = statistics.wilsonConfidenceInterval(0, 100, 0.95);
      assert.strictEqual(result.low, 0, 'Low bound should be 0');
      assert.ok(result.high > 0 && result.high < 0.1, 'High bound should be small but positive');
    });

    await t.test('should handle 100% successes', () => {
      const result = statistics.wilsonConfidenceInterval(100, 100, 0.95);
      assert.ok(result.low > 0.9, 'Low bound should be > 0.9');
      // Use approximate comparison due to floating point
      assert.ok(result.high > 0.999, 'High bound should be ~1');
    });

    await t.test('should handle empty sample', () => {
      const result = statistics.wilsonConfidenceInterval(0, 0, 0.95);
      assert.strictEqual(result.low, 0);
      assert.strictEqual(result.high, 1);
      assert.strictEqual(result.center, 0.5);
    });

    await t.test('should handle small samples', () => {
      const result = statistics.wilsonConfidenceInterval(3, 10, 0.95);
      assert.ok(result.low >= 0 && result.low < 0.3);
      assert.ok(result.high > 0.3 && result.high <= 1);
    });
  });

  await t.test('buildContingencyTable', async (t) => {
    const testData = [
      { feature: 1, outcome: true },
      { feature: 1, outcome: true },
      { feature: 1, outcome: false },
      { feature: 0, outcome: true },
      { feature: 0, outcome: false },
      { feature: 0, outcome: false },
    ];

    await t.test('should build correct contingency table', () => {
      const result = statistics.buildContingencyTable(testData, 'feature', 1, 'outcome');

      assert.strictEqual(result.observed.a, 2, 'feature=1, outcome=true should be 2');
      assert.strictEqual(result.observed.b, 1, 'feature=1, outcome=false should be 1');
      assert.strictEqual(result.observed.c, 1, 'feature=0, outcome=true should be 1');
      assert.strictEqual(result.observed.d, 2, 'feature=0, outcome=false should be 2');
    });

    await t.test('should handle threshold conditions', () => {
      const data = [
        { value: 5, outcome: true },
        { value: 6, outcome: true },
        { value: 3, outcome: false },
        { value: 4, outcome: false },
      ];
      const result = statistics.buildContingencyTable(data, 'value', '>=5', 'outcome');

      assert.strictEqual(result.observed.a, 2, 'value>=5, outcome=true');
      assert.strictEqual(result.observed.b, 0, 'value>=5, outcome=false');
      assert.strictEqual(result.observed.c, 0, 'value<5, outcome=true');
      assert.strictEqual(result.observed.d, 2, 'value<5, outcome=false');
    });
  });

  await t.test('calculateChiSquare', async (t) => {
    await t.test('should calculate chi-square statistic', () => {
      const contingency = {
        table: [[10, 5], [5, 10]],
        expected: [[7.5, 7.5], [7.5, 7.5]],
      };
      const chiSq = statistics.calculateChiSquare(contingency);

      // Expected: sum of (O-E)^2/E = (2.5^2/7.5)*4 = 3.33
      assert.ok(Math.abs(chiSq - 3.33) < 0.1, `Chi-square should be ~3.33, got ${chiSq}`);
    });

    await t.test('should return 0 for identical observed and expected', () => {
      const contingency = {
        table: [[10, 10], [10, 10]],
        expected: [[10, 10], [10, 10]],
      };
      const chiSq = statistics.calculateChiSquare(contingency);
      assert.strictEqual(chiSq, 0);
    });
  });

  await t.test('chiSquarePValue', async (t) => {
    await t.test('should return ~0.05 for chi-square of 3.84 with df=1', () => {
      const pValue = statistics.chiSquarePValue(3.84, 1);
      assert.ok(Math.abs(pValue - 0.05) < 0.02, `P-value should be ~0.05, got ${pValue}`);
    });

    await t.test('should return high p-value for low chi-square', () => {
      const pValue = statistics.chiSquarePValue(0.5, 1);
      assert.ok(pValue > 0.4, `P-value should be > 0.4, got ${pValue}`);
    });

    await t.test('should return low p-value for high chi-square', () => {
      const pValue = statistics.chiSquarePValue(10, 1);
      assert.ok(pValue < 0.01, `P-value should be < 0.01, got ${pValue}`);
    });

    await t.test('should handle edge cases', () => {
      assert.strictEqual(statistics.chiSquarePValue(0, 1), 1);
      assert.strictEqual(statistics.chiSquarePValue(-1, 1), 1);
      assert.strictEqual(statistics.chiSquarePValue(1, 0), 1);
    });
  });

  await t.test('conditionalProbability', async (t) => {
    const testData = [
      { feature: 'A', outcome: 1 },
      { feature: 'A', outcome: 1 },
      { feature: 'A', outcome: 0 },
      { feature: 'A', outcome: 0 },
      { feature: 'B', outcome: 1 },
      { feature: 'B', outcome: 0 },
      { feature: 'B', outcome: 0 },
      { feature: 'B', outcome: 0 },
    ];

    await t.test('should calculate correct probability', () => {
      const result = statistics.conditionalProbability(testData, 'feature', 'A', 'outcome');
      assert.strictEqual(result.probability, 0.5, 'P(outcome|A) should be 0.5');
      assert.strictEqual(result.sampleSize, 4);
    });

    await t.test('should calculate different probability for different feature', () => {
      const result = statistics.conditionalProbability(testData, 'feature', 'B', 'outcome');
      assert.strictEqual(result.probability, 0.25, 'P(outcome|B) should be 0.25');
      assert.strictEqual(result.sampleSize, 4);
    });

    await t.test('should handle non-existent feature value', () => {
      const result = statistics.conditionalProbability(testData, 'feature', 'C', 'outcome');
      assert.strictEqual(result.sampleSize, 0);
      assert.strictEqual(result.insufficient, true);
    });
  });

  await t.test('baseRate', async (t) => {
    const testData = [
      { outcome: true },
      { outcome: true },
      { outcome: false },
      { outcome: 1 },
      { outcome: 0 },
    ];

    await t.test('should calculate correct base rate', () => {
      const result = statistics.baseRate(testData, 'outcome');
      assert.strictEqual(result.rate, 0.6, 'Base rate should be 0.6');
      assert.strictEqual(result.count, 3);
      assert.strictEqual(result.total, 5);
    });

    await t.test('should handle empty data', () => {
      const result = statistics.baseRate([], 'outcome');
      assert.strictEqual(result.rate, 0);
      assert.strictEqual(result.total, 0);
    });
  });

  await t.test('calculateLift', async (t) => {
    await t.test('should calculate lift > 1 when probability exceeds base rate', () => {
      const lift = statistics.calculateLift(0.6, 0.5);
      assert.strictEqual(lift, 1.2);
    });

    await t.test('should calculate lift < 1 when probability is below base rate', () => {
      const lift = statistics.calculateLift(0.4, 0.5);
      assert.strictEqual(lift, 0.8);
    });

    await t.test('should handle zero base rate', () => {
      const lift = statistics.calculateLift(0.5, 0);
      assert.strictEqual(lift, Infinity);
    });
  });

  await t.test('testFeatureCombination', async (t) => {
    const testData = [];
    // Generate enough test data - 200 records to ensure combinations have n>=30
    for (let i = 0; i < 200; i++) {
      testData.push({
        feature1: i % 2,
        feature2: Math.floor(i / 50) % 2, // 0 for first 50, 1 for next 50, etc
        outcome: (i % 3 === 0) ? true : false,
      });
    }

    await t.test('should test feature combination', () => {
      const result = statistics.testFeatureCombination(
        testData,
        [{ name: 'feature1', value: 1 }], // Single feature to ensure enough samples
        'outcome'
      );

      assert.ok(result.sampleSize > 0, `Sample size should be > 0, got ${result.sampleSize}`);
      if (!result.insufficient) {
        assert.ok(result.probability >= 0 && result.probability <= 1,
          `Probability should be in [0,1], got ${result.probability}`);
      }
    });

    await t.test('should mark insufficient when sample size is too small', () => {
      const smallData = testData.slice(0, 10);
      const result = statistics.testFeatureCombination(
        smallData,
        [{ name: 'feature1', value: 1 }, { name: 'feature2', value: 1 }],
        'outcome'
      );

      assert.strictEqual(result.insufficient, true);
    });
  });

  await t.test('boundProbability', async (t) => {
    await t.test('should bound probability to min', () => {
      const result = statistics.boundProbability(0.01);
      assert.strictEqual(result, 0.05);
    });

    await t.test('should bound probability to max', () => {
      const result = statistics.boundProbability(0.99);
      assert.strictEqual(result, 0.95);
    });

    await t.test('should not change probability within bounds', () => {
      const result = statistics.boundProbability(0.5);
      assert.strictEqual(result, 0.5);
    });
  });

  await t.test('getConfidenceLevel', async (t) => {
    await t.test('should return very_high for excellent stats', () => {
      const level = statistics.getConfidenceLevel(250, 0.10, 0.0005);
      assert.strictEqual(level, 'very_high');
    });

    await t.test('should return high for good stats', () => {
      const level = statistics.getConfidenceLevel(150, 0.15, 0.005);
      assert.strictEqual(level, 'high');
    });

    await t.test('should return medium for moderate stats', () => {
      const level = statistics.getConfidenceLevel(60, 0.25, 0.03);
      assert.strictEqual(level, 'medium');
    });

    await t.test('should return low for marginal stats', () => {
      const level = statistics.getConfidenceLevel(35, 0.35, 0.08);
      assert.strictEqual(level, 'low');
    });

    await t.test('should return insufficient for poor stats', () => {
      const level = statistics.getConfidenceLevel(20, 0.5, 0.15);
      assert.strictEqual(level, 'insufficient');
    });
  });

  await t.test('benjaminiHochbergCorrection', async (t) => {
    await t.test('should adjust p-values correctly', () => {
      const results = [
        { pValue: 0.01 },
        { pValue: 0.02 },
        { pValue: 0.03 },
        { pValue: 0.04 },
        { pValue: 0.05 },
      ];

      const corrected = statistics.benjaminiHochbergCorrection(results);

      // BH correction: adjusted p = p * n / rank
      assert.ok(corrected[0].adjustedPValue >= corrected[0].pValue);
      assert.ok(corrected.every(r => r.adjustedPValue <= 1));
    });

    await t.test('should handle empty array', () => {
      const result = statistics.benjaminiHochbergCorrection([]);
      assert.deepStrictEqual(result, []);
    });
  });

  await t.test('Module exports', () => {
    assert.ok(typeof statistics.wilsonConfidenceInterval === 'function');
    assert.ok(typeof statistics.buildContingencyTable === 'function');
    assert.ok(typeof statistics.calculateChiSquare === 'function');
    assert.ok(typeof statistics.chiSquarePValue === 'function');
    assert.ok(typeof statistics.chiSquareTest === 'function');
    assert.ok(typeof statistics.conditionalProbability === 'function');
    assert.ok(typeof statistics.baseRate === 'function');
    assert.ok(typeof statistics.calculateLift === 'function');
    assert.ok(typeof statistics.testFeatureCombination === 'function');
    assert.ok(typeof statistics.bonferroniCorrection === 'function');
    assert.ok(typeof statistics.benjaminiHochbergCorrection === 'function');
    assert.ok(typeof statistics.boundProbability === 'function');
    assert.ok(typeof statistics.getConfidenceLevel === 'function');
  });
});
