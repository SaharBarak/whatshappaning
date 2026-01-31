/**
 * Tests for correlation outcomes module
 */

const test = require('node:test');
const assert = require('node:assert');
const outcomes = require('./outcomes');

test('Outcomes Module', async (t) => {

  await t.test('calculateMarketOutcomes', async (t) => {
    await t.test('should calculate SPX outcomes correctly', () => {
      const current = { spx: { close: 5000 } };
      const previous = { spx: { close: 4900 } };
      const result = outcomes.calculateMarketOutcomes(current, previous);

      assert.strictEqual(result.spx_direction, true, 'SPX went up');
      assert.ok(result.spx_return > 0, 'SPX return is positive');
    });

    await t.test('should detect volatile SPX day', () => {
      const current = { spx: { close: 5060 } };
      const previous = { spx: { close: 5000 } };
      const result = outcomes.calculateMarketOutcomes(current, previous);

      // 1.2% change (>1% threshold)
      assert.strictEqual(result.spx_volatile, true, '1.2% move should be volatile');
    });

    await t.test('should not mark small moves as volatile', () => {
      const current = { spx: { close: 5025 } };
      const previous = { spx: { close: 5000 } };
      const result = outcomes.calculateMarketOutcomes(current, previous);

      // 0.5% change
      assert.strictEqual(result.spx_volatile, false, '0.5% move should not be volatile');
    });

    await t.test('should calculate BTC outcomes', () => {
      const current = { btc: { close: 50000 } };
      const previous = { btc: { close: 48000 } };
      const result = outcomes.calculateMarketOutcomes(current, previous);

      assert.strictEqual(result.btc_direction, true);
      assert.strictEqual(result.btc_volatile, true); // >3% move
    });

    await t.test('should detect VIX spike', () => {
      const current = { vix: { close: 22 } };
      const previous = { vix: { close: 20 } };
      const result = outcomes.calculateMarketOutcomes(current, previous);

      assert.strictEqual(result.vix_spike, false); // 10% move
    });

    await t.test('should handle large VIX spike', () => {
      const current = { vix: { close: 24 } };
      const previous = { vix: { close: 20 } };
      const result = outcomes.calculateMarketOutcomes(current, previous);

      assert.strictEqual(result.vix_spike, true); // 20% move
    });

    await t.test('should handle missing data gracefully', () => {
      const result = outcomes.calculateMarketOutcomes({}, {});
      assert.deepStrictEqual(result, {});
    });
  });

  await t.test('calculateGeophysicalOutcomes', async (t) => {
    await t.test('should detect major earthquake', () => {
      const result = outcomes.calculateGeophysicalOutcomes({ maxMagnitude: 6.5 });
      assert.strictEqual(result.major_quake, true);
    });

    await t.test('should not flag moderate earthquake as major', () => {
      const result = outcomes.calculateGeophysicalOutcomes({ maxMagnitude: 5.5 });
      assert.strictEqual(result.major_quake, false);
    });

    await t.test('should detect above average quake count', () => {
      const result = outcomes.calculateGeophysicalOutcomes(
        { quakeCount: 80 },
        { quakeCount: 50 }
      );
      assert.strictEqual(result.quake_above_avg, true);
    });

    await t.test('should detect geomagnetic storm', () => {
      const result = outcomes.calculateGeophysicalOutcomes({ kpIndex: 5 });
      assert.strictEqual(result.geomag_storm, true);
    });

    await t.test('should not flag low Kp as storm', () => {
      const result = outcomes.calculateGeophysicalOutcomes({ kpIndex: 3 });
      assert.strictEqual(result.geomag_storm, false);
    });
  });

  await t.test('calculateSentimentOutcomes', async (t) => {
    await t.test('should detect sentiment drop', () => {
      const current = { aggregate: 40 };
      const previous = { aggregate: 55 };
      const result = outcomes.calculateSentimentOutcomes(current, previous);

      assert.strictEqual(result.sentiment_drop, true);
    });

    await t.test('should not flag small sentiment change', () => {
      const current = { aggregate: 50 };
      const previous = { aggregate: 55 };
      const result = outcomes.calculateSentimentOutcomes(current, previous);

      assert.strictEqual(result.sentiment_drop, false);
    });

    await t.test('should detect fear spike from CNN F&G', () => {
      const result = outcomes.calculateSentimentOutcomes({ cnnFearGreed: 20 });
      assert.strictEqual(result.fear_spike, true);
    });

    await t.test('should not flag moderate fear as spike', () => {
      const result = outcomes.calculateSentimentOutcomes({ cnnFearGreed: 35 });
      assert.strictEqual(result.fear_spike, false);
    });
  });

  await t.test('extractOutcomes', async (t) => {
    await t.test('should extract all outcome types', () => {
      const currentData = {
        markets: {
          spx: { close: 5000 },
          btc: { close: 50000 },
        },
        geophysical: {
          maxMagnitude: 6.0,
          quakeCount: 60,
        },
        solar: {
          kpIndex: 4,
        },
        sentiment: {
          aggregate: 50,
          cnnFearGreed: 45,
        },
      };

      const previousData = {
        markets: {
          spx: { close: 4950 },
          btc: { close: 49000 },
        },
        sentiment: {
          aggregate: 55,
        },
      };

      const result = outcomes.extractOutcomes(currentData, previousData);

      assert.ok('spx_direction' in result);
      assert.ok('major_quake' in result);
      assert.ok('fear_spike' in result);
    });
  });

  await t.test('getAllOutcomeNames', async (t) => {
    await t.test('should return all 11 outcome names', () => {
      const names = outcomes.getAllOutcomeNames();

      // Market outcomes (not counting spx_return as it's continuous)
      assert.ok(names.includes('spx_direction'));
      assert.ok(names.includes('spx_volatile'));
      assert.ok(names.includes('btc_direction'));
      assert.ok(names.includes('btc_volatile'));
      assert.ok(names.includes('vix_spike'));
      assert.ok(names.includes('gold_direction'));

      // Geophysical outcomes
      assert.ok(names.includes('major_quake'));
      assert.ok(names.includes('quake_above_avg'));
      assert.ok(names.includes('geomag_storm'));

      // Sentiment outcomes
      assert.ok(names.includes('sentiment_drop'));
      assert.ok(names.includes('fear_spike'));
    });
  });

  await t.test('getOutcomeDefinition', async (t) => {
    await t.test('should return definition for known outcome', () => {
      const def = outcomes.getOutcomeDefinition('spx_direction');
      assert.strictEqual(def.type, 'binary');
      assert.ok(def.description);
    });

    await t.test('should return null for unknown outcome', () => {
      const def = outcomes.getOutcomeDefinition('unknown');
      assert.strictEqual(def, null);
    });
  });

  await t.test('getEstimatedBaseRate', async (t) => {
    await t.test('should return estimated base rate for outcomes', () => {
      const spxRate = outcomes.getEstimatedBaseRate('spx_direction');
      assert.ok(spxRate > 0.5); // Markets go up more than 50% of days historically

      const quakeRate = outcomes.getEstimatedBaseRate('major_quake');
      assert.ok(quakeRate < 0.5); // Major quakes are rare
    });

    await t.test('should return 0.5 for unknown outcome', () => {
      const rate = outcomes.getEstimatedBaseRate('unknown');
      assert.strictEqual(rate, 0.5);
    });
  });

  await t.test('formatOutcomeName', async (t) => {
    await t.test('should format outcome names for display', () => {
      const formatted = outcomes.formatOutcomeName('spx_direction');
      assert.strictEqual(formatted, 'S&P 500 up day');
    });

    await t.test('should handle unknown outcomes', () => {
      const formatted = outcomes.formatOutcomeName('unknown_outcome');
      assert.ok(formatted.includes('Unknown'));
    });
  });

  await t.test('getOutcomesByCategory', async (t) => {
    await t.test('should return outcomes grouped by category', () => {
      const categories = outcomes.getOutcomesByCategory();

      assert.ok(Array.isArray(categories.market));
      assert.ok(Array.isArray(categories.geophysical));
      assert.ok(Array.isArray(categories.sentiment));

      assert.ok(categories.market.includes('spx_direction'));
      assert.ok(categories.geophysical.includes('major_quake'));
      assert.ok(categories.sentiment.includes('fear_spike'));
    });
  });

  await t.test('calculateAllOutcomes', async (t) => {
    await t.test('should calculate outcomes from flat row data', () => {
      const row = {
        spx_close: 5000,
        btc_close: 50000,
        vix_close: 20,
        quake_max_magnitude: 5.5,
        kp_index: 4,
        fear_greed_cnn: 30,
        sentiment_aggregate: 50,
      };

      const prevRow = {
        spx_close: 4950,
        btc_close: 48500,
        vix_close: 18,
        sentiment_aggregate: 55,
      };

      const result = outcomes.calculateAllOutcomes(row, prevRow);

      assert.strictEqual(result.spx_direction, true);
      assert.strictEqual(result.btc_direction, true);
      assert.strictEqual(result.major_quake, false);
      assert.strictEqual(result.geomag_storm, false);
    });
  });

  await t.test('OUTCOME_DEFINITIONS constant', () => {
    assert.ok(outcomes.OUTCOME_DEFINITIONS);
    assert.ok(outcomes.OUTCOME_DEFINITIONS.spx_direction);
    assert.ok(outcomes.OUTCOME_DEFINITIONS.major_quake);
    assert.ok(outcomes.OUTCOME_DEFINITIONS.fear_spike);
  });

  await t.test('Module exports', () => {
    assert.ok(typeof outcomes.calculateMarketOutcomes === 'function');
    assert.ok(typeof outcomes.calculateGeophysicalOutcomes === 'function');
    assert.ok(typeof outcomes.calculateSentimentOutcomes === 'function');
    assert.ok(typeof outcomes.extractOutcomes === 'function');
    assert.ok(typeof outcomes.calculateAllOutcomes === 'function');
    assert.ok(typeof outcomes.getAllOutcomeNames === 'function');
    assert.ok(typeof outcomes.getOutcomeDefinition === 'function');
    assert.ok(typeof outcomes.getEstimatedBaseRate === 'function');
    assert.ok(typeof outcomes.formatOutcomeName === 'function');
    assert.ok(typeof outcomes.getOutcomesByCategory === 'function');
  });
});
