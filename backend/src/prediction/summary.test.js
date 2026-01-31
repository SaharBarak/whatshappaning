/**
 * Tests for prediction summary module
 */

const test = require('node:test');
const assert = require('node:assert');
const summary = require('./summary');

test('Summary Module', async (t) => {

  await t.test('calculateTensionScore', async (t) => {
    await t.test('should start at neutral (5)', () => {
      const score = summary.calculateTensionScore([], [], {});
      assert.ok(score >= 4 && score <= 6);
    });

    await t.test('should increase with high-risk predictions', () => {
      const predictions = [{
        outcomeId: 'spx_volatile',
        probability: 0.8,
        confidence: 'high',
      }];
      const score = summary.calculateTensionScore(predictions, [], {});
      assert.ok(score > 5);
    });

    await t.test('should increase with pattern alerts', () => {
      const alerts = [{
        alertType: 'historical_match',
        matchScore: 0.9,
      }];
      const score = summary.calculateTensionScore([], alerts, {});
      assert.ok(score > 5);
    });

    await t.test('should increase with risk features', () => {
      const features = {
        mercury_retrograde: 1,
        kp_index: 6,
        fear_greed_cnn: 15,
      };
      const score = summary.calculateTensionScore([], [], features);
      assert.ok(score > 5);
    });

    await t.test('should be bounded 0-10', () => {
      const extremePredictions = summary.RISK_OUTCOMES.map((id) => ({
        outcomeId: id,
        probability: 0.95,
        confidence: 'very_high',
      }));
      const score = summary.calculateTensionScore(extremePredictions, [], {});
      assert.ok(score >= 0 && score <= 10);
    });
  });

  await t.test('getTensionLevel', async (t) => {
    await t.test('should return high for score >= 7', () => {
      assert.strictEqual(summary.getTensionLevel(7), 'high');
      assert.strictEqual(summary.getTensionLevel(10), 'high');
    });

    await t.test('should return medium for score 4-7', () => {
      assert.strictEqual(summary.getTensionLevel(4), 'medium');
      assert.strictEqual(summary.getTensionLevel(6.9), 'medium');
    });

    await t.test('should return low for score < 4', () => {
      assert.strictEqual(summary.getTensionLevel(3.9), 'low');
      assert.strictEqual(summary.getTensionLevel(0), 'low');
    });
  });

  await t.test('getTopRisks', async (t) => {
    await t.test('should return top 3 risks', () => {
      const predictions = [
        { outcomeId: 'spx_volatile', outcome: 'Market Volatility', probability: 0.8, confidence: 'high' },
        { outcomeId: 'fear_spike', outcome: 'Fear Spike', probability: 0.7, confidence: 'medium' },
        { outcomeId: 'geomag_storm', outcome: 'Geomagnetic Storm', probability: 0.6, confidence: 'low' },
        { outcomeId: 'major_quake', outcome: 'Major Earthquake', probability: 0.55, confidence: 'low' },
        { outcomeId: 'spx_direction', outcome: 'SPX Up', probability: 0.6, confidence: 'medium' }, // Not a risk
      ];

      const risks = summary.getTopRisks(predictions);

      assert.ok(risks.length <= 3);
      assert.ok(risks.every((r) => summary.RISK_OUTCOMES.includes(r.outcomeId)));
    });

    await t.test('should filter out low probability risks', () => {
      const predictions = [
        { outcomeId: 'spx_volatile', probability: 0.3, confidence: 'high' },
        { outcomeId: 'fear_spike', probability: 0.4, confidence: 'medium' },
      ];

      const risks = summary.getTopRisks(predictions);
      assert.strictEqual(risks.length, 0);
    });
  });

  await t.test('getStableFactors', async (t) => {
    await t.test('should identify low risk predictions', () => {
      const predictions = [
        { outcomeId: 'spx_volatile', outcome: 'Market Volatility', probability: 0.2, confidence: 'high' },
      ];

      const stable = summary.getStableFactors(predictions, {});
      assert.ok(stable.some((s) => s.factor.includes('volatility')));
    });

    await t.test('should identify calm geomagnetic conditions', () => {
      const stable = summary.getStableFactors([], { kp_index: 2 });
      assert.ok(stable.some((s) => s.factor.includes('geomagnetic')));
    });

    await t.test('should identify neutral sentiment', () => {
      const stable = summary.getStableFactors([], { fear_greed_cnn: 50 });
      assert.ok(stable.some((s) => s.factor.includes('sentiment')));
    });
  });

  await t.test('generateSummary', async (t) => {
    await t.test('should generate complete summary', () => {
      const predictions = [
        { outcomeId: 'spx_volatile', outcome: 'Volatility', probability: 0.7, confidence: 'high' },
      ];

      const result = summary.generateSummary(predictions, [], {});

      assert.ok(result.overallTension);
      assert.ok(typeof result.tensionScore === 'number');
      assert.ok(Array.isArray(result.topRisks));
      assert.ok(Array.isArray(result.stableFactors));
      assert.ok(result.summaryText);
      assert.ok(result.timestamp);
    });
  });

  await t.test('generateSummaryText', async (t) => {
    await t.test('should describe high tension', () => {
      const text = summary.generateSummaryText('high', [], []);
      assert.ok(text.includes('Elevated'));
    });

    await t.test('should describe low tension', () => {
      const text = summary.generateSummaryText('low', [], []);
      assert.ok(text.includes('calm'));
    });

    await t.test('should include risk names', () => {
      const risks = [{ outcome: 'Volatility' }];
      const text = summary.generateSummaryText('medium', risks, []);
      assert.ok(text.includes('volatility'));
    });
  });

  await t.test('formatSummary', async (t) => {
    await t.test('should add display properties', () => {
      const sum = {
        overallTension: 'high',
        tensionScore: 7.5,
        topRisks: [],
        stableFactors: [],
        summaryText: 'Test',
      };

      const formatted = summary.formatSummary(sum);

      assert.ok(formatted.color);
      assert.ok(formatted.icon);
      assert.ok(formatted.scoreDisplay);
      assert.ok(formatted.tensionLabel);
    });
  });

  await t.test('compareSummaries', async (t) => {
    await t.test('should handle no previous summary', () => {
      const current = {
        tensionScore: 6,
        topRisks: [{ outcomeId: 'spx_volatile' }],
      };

      const comparison = summary.compareSummaries(current, null);

      assert.strictEqual(comparison.tensionChange, 0);
      assert.strictEqual(comparison.direction, 'stable');
    });

    await t.test('should detect rising tension', () => {
      const current = { tensionScore: 7, topRisks: [] };
      const previous = { tensionScore: 5, topRisks: [] };

      const comparison = summary.compareSummaries(current, previous);

      assert.strictEqual(comparison.direction, 'rising');
      assert.strictEqual(comparison.tensionChange, 2);
    });

    await t.test('should identify new risks', () => {
      const current = { tensionScore: 6, topRisks: [{ outcomeId: 'fear_spike' }] };
      const previous = { tensionScore: 6, topRisks: [] };

      const comparison = summary.compareSummaries(current, previous);

      assert.strictEqual(comparison.newRisks.length, 1);
      assert.strictEqual(comparison.newRisks[0].outcomeId, 'fear_spike');
    });
  });

  await t.test('getTensionColor', () => {
    assert.ok(summary.getTensionColor('high').includes('#'));
    assert.ok(summary.getTensionColor('medium').includes('#'));
    assert.ok(summary.getTensionColor('low').includes('#'));
  });

  await t.test('RISK_OUTCOMES constant', () => {
    assert.ok(Array.isArray(summary.RISK_OUTCOMES));
    assert.ok(summary.RISK_OUTCOMES.includes('spx_volatile'));
    assert.ok(summary.RISK_OUTCOMES.includes('major_quake'));
  });

  await t.test('Module exports', () => {
    assert.ok(typeof summary.generateSummary === 'function');
    assert.ok(typeof summary.calculateTensionScore === 'function');
    assert.ok(typeof summary.getTensionLevel === 'function');
    assert.ok(typeof summary.getTopRisks === 'function');
    assert.ok(typeof summary.getStableFactors === 'function');
    assert.ok(typeof summary.formatSummary === 'function');
    assert.ok(typeof summary.compareSummaries === 'function');
  });
});
