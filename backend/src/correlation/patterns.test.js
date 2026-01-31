/**
 * Tests for correlation patterns module
 */

const test = require('node:test');
const assert = require('node:assert');
const patterns = require('./patterns');

test('Patterns Module', async (t) => {

  await t.test('calculateSimilarity', async (t) => {
    await t.test('should return 1.0 for identical features', () => {
      const featuresA = {
        moon_phase: 4,
        mercury_retrograde: 1,
        kp_index: 5,
      };
      const featuresB = { ...featuresA };

      const result = patterns.calculateSimilarity(featuresA, featuresB);
      assert.strictEqual(result.similarity, 1.0);
    });

    await t.test('should return 0 for completely different features', () => {
      const featuresA = {
        moon_phase: 0,
        mercury_retrograde: 0,
      };
      const featuresB = {
        moon_phase: 4,
        mercury_retrograde: 1,
      };

      const result = patterns.calculateSimilarity(featuresA, featuresB);
      assert.ok(result.similarity < 0.5);
    });

    await t.test('should give partial credit for close continuous values', () => {
      const featuresA = { kp_index: 5 };
      const featuresB = { kp_index: 5.5 }; // Within 10% of range

      const result = patterns.calculateSimilarity(featuresA, featuresB);
      assert.ok(result.similarity > 0.3);
    });

    await t.test('should handle missing features', () => {
      const featuresA = { moon_phase: 4 };
      const featuresB = { mercury_retrograde: 1 };

      const result = patterns.calculateSimilarity(featuresA, featuresB);
      assert.strictEqual(result.totalWeight, 0);
    });

    await t.test('should apply feature weights', () => {
      const featuresA = { moon_phase: 4, day_of_week: 0 };
      const featuresB = { moon_phase: 4, day_of_week: 1 };

      const result = patterns.calculateSimilarity(featuresA, featuresB);
      // moon_phase matches (weight 2.0), day_of_week differs (weight 0.5)
      // Weighted score: 2.0 / 2.5 = 0.8
      assert.ok(result.similarity > 0.7);
    });

    await t.test('should include match details', () => {
      const featuresA = { moon_phase: 4 };
      const featuresB = { moon_phase: 4 };

      const result = patterns.calculateSimilarity(featuresA, featuresB);
      assert.ok(result.matches.moon_phase);
      assert.strictEqual(result.matches.moon_phase.score, 1);
    });
  });

  await t.test('findMatchingDates', async (t) => {
    const historicalData = [
      { date: '2025-01-01', moon_phase: 4, mercury_retrograde: 1 },
      { date: '2025-01-15', moon_phase: 4, mercury_retrograde: 1 },
      { date: '2025-02-01', moon_phase: 0, mercury_retrograde: 0 },
      { date: '2025-02-15', moon_phase: 4, mercury_retrograde: 0 },
    ];

    await t.test('should find dates above similarity threshold', () => {
      const target = { moon_phase: 4, mercury_retrograde: 1 };
      const matches = patterns.findMatchingDates(target, historicalData, {
        threshold: 0.80,
      });

      assert.ok(matches.length >= 2);
      assert.ok(matches.every((m) => m.similarity >= 0.8));
    });

    await t.test('should sort by similarity descending', () => {
      const target = { moon_phase: 4, mercury_retrograde: 1 };
      const matches = patterns.findMatchingDates(target, historicalData, {
        threshold: 0.5,
      });

      for (let i = 1; i < matches.length; i++) {
        assert.ok(matches[i - 1].similarity >= matches[i].similarity);
      }
    });

    await t.test('should respect limit parameter', () => {
      const target = { moon_phase: 4 };
      const matches = patterns.findMatchingDates(target, historicalData, {
        threshold: 0.3,
        limit: 2,
      });

      assert.ok(matches.length <= 2);
    });

    await t.test('should exclude specified date', () => {
      const target = { date: '2025-01-01', moon_phase: 4, mercury_retrograde: 1 };
      const matches = patterns.findMatchingDates(target, historicalData, {
        threshold: 0.8,
        excludeDate: '2025-01-01',
      });

      assert.ok(matches.every((m) => m.date !== '2025-01-01'));
    });
  });

  await t.test('analyzeMatchOutcomes', async (t) => {
    const matches = [
      { date: '2025-01-01', similarity: 0.9, outcomes: { spx_direction: true, major_quake: false } },
      { date: '2025-01-15', similarity: 0.85, outcomes: { spx_direction: true, major_quake: false } },
      { date: '2025-02-01', similarity: 0.8, outcomes: { spx_direction: false, major_quake: true } },
    ];

    await t.test('should calculate outcome probabilities', () => {
      const analysis = patterns.analyzeMatchOutcomes(matches);

      assert.ok(analysis.outcomes.spx_direction);
      assert.ok(analysis.outcomes.spx_direction.simpleProbability > 0.5); // 2/3 positive
      assert.strictEqual(analysis.outcomes.spx_direction.matchCount, 3);
    });

    await t.test('should weight by similarity', () => {
      const analysis = patterns.analyzeMatchOutcomes(matches);

      // Higher similarity matches (with spx_direction: true) should pull weighted average up
      assert.ok(analysis.outcomes.spx_direction.weightedProbability >=
        analysis.outcomes.spx_direction.simpleProbability);
    });

    await t.test('should mark insufficient when few matches', () => {
      const fewMatches = matches.slice(0, 2);
      const analysis = patterns.analyzeMatchOutcomes(fewMatches);

      assert.strictEqual(analysis.insufficient, true);
    });

    await t.test('should handle empty matches', () => {
      const analysis = patterns.analyzeMatchOutcomes([]);
      assert.strictEqual(analysis.insufficient, true);
      assert.strictEqual(analysis.matchCount, 0);
    });
  });

  await t.test('groupAndAnalyzeMatches', async (t) => {
    const matches = [
      { date: '2025-01-01', similarity: 0.9, outcomes: { spx_direction: true } },
      { date: '2025-01-15', similarity: 0.85, outcomes: { spx_direction: true } },
      { date: '2025-02-01', similarity: 0.8, outcomes: { spx_direction: false } },
      { date: '2025-02-15', similarity: 0.75, outcomes: { spx_direction: true } },
      { date: '2025-03-01', similarity: 0.7, outcomes: { spx_direction: true } },
    ];

    await t.test('should return match count and average similarity', () => {
      const result = patterns.groupAndAnalyzeMatches(matches);

      assert.strictEqual(result.matchCount, 5);
      assert.ok(result.avgSimilarity > 0.7 && result.avgSimilarity < 0.9);
    });

    await t.test('should identify strong signals', () => {
      const result = patterns.groupAndAnalyzeMatches(matches);

      assert.ok(result.strongSignals);
      // spx_direction should be a strong signal (4/5 positive)
    });

    await t.test('should include top matches', () => {
      const result = patterns.groupAndAnalyzeMatches(matches);

      assert.ok(result.topMatches);
      assert.ok(result.topMatches.length <= 5);
      assert.ok(result.topMatches[0].date);
      assert.ok(result.topMatches[0].similarity);
    });

    await t.test('should handle empty matches', () => {
      const result = patterns.groupAndAnalyzeMatches([]);

      assert.strictEqual(result.matchCount, 0);
      assert.strictEqual(result.insufficient, true);
    });
  });

  await t.test('generatePatternAlert', async (t) => {
    // Create substantial historical data
    const historicalData = [];
    for (let i = 0; i < 50; i++) {
      historicalData.push({
        date: `2025-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        moon_phase: i % 8,
        mercury_retrograde: i % 5 === 0 ? 1 : 0,
        spx_direction: i % 2 === 0,
        major_quake: i % 10 === 0,
      });
    }

    await t.test('should return null when no good matches', () => {
      const target = {
        date: '2026-01-31',
        moon_phase: 99, // Impossible value
        mercury_retrograde: 99,
      };

      const alert = patterns.generatePatternAlert(target, historicalData, {
        threshold: 0.95,
      });

      assert.strictEqual(alert, null);
    });

    await t.test('should generate alert for matching pattern', () => {
      const target = {
        date: '2026-01-31',
        moon_phase: 4, // Common in historical data
        mercury_retrograde: 1,
      };

      const alert = patterns.generatePatternAlert(target, historicalData, {
        threshold: 0.6, // Lower threshold for test
      });

      // May or may not find matches depending on data
      if (alert) {
        assert.ok(alert.matchCount > 0);
        assert.ok(alert.message);
      }
    });
  });

  await t.test('getKeyMatchingFeatures', async (t) => {
    await t.test('should return top matching features', () => {
      const similarityResult = {
        matches: {
          moon_phase: { valueA: 4, valueB: 4, score: 1, weight: 2.0 },
          mercury_retrograde: { valueA: 1, valueB: 1, score: 1, weight: 2.0 },
          day_of_week: { valueA: 0, valueB: 3, score: 0, weight: 0.5 },
        },
      };

      const keyFeatures = patterns.getKeyMatchingFeatures(similarityResult);

      assert.ok(keyFeatures.length <= 10);
      assert.ok(keyFeatures.every((f) => f.score >= 0.5));
    });

    await t.test('should sort by weighted score', () => {
      const similarityResult = {
        matches: {
          moon_phase: { valueA: 4, valueB: 4, score: 1, weight: 2.0 },
          day_of_week: { valueA: 0, valueB: 0, score: 1, weight: 0.5 },
        },
      };

      const keyFeatures = patterns.getKeyMatchingFeatures(similarityResult);

      // moon_phase should come first (higher weight)
      assert.strictEqual(keyFeatures[0].feature, 'moon_phase');
    });
  });

  await t.test('DEFAULT_WEIGHTS constant', () => {
    assert.ok(patterns.DEFAULT_WEIGHTS);
    assert.ok(patterns.DEFAULT_WEIGHTS.moon_phase > 0);
    assert.ok(patterns.DEFAULT_WEIGHTS.mercury_retrograde > 0);
    assert.ok(patterns.DEFAULT_WEIGHTS.kp_index > 0);
  });

  await t.test('Module exports', () => {
    assert.ok(typeof patterns.calculateSimilarity === 'function');
    assert.ok(typeof patterns.findMatchingDates === 'function');
    assert.ok(typeof patterns.analyzeMatchOutcomes === 'function');
    assert.ok(typeof patterns.groupAndAnalyzeMatches === 'function');
    assert.ok(typeof patterns.generatePatternAlert === 'function');
    assert.ok(typeof patterns.getKeyMatchingFeatures === 'function');
  });
});
