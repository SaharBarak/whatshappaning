/**
 * Tests for correlation features module
 */

const test = require('node:test');
const assert = require('node:assert');
const features = require('./features');

test('Features Module', async (t) => {

  await t.test('zodiacToIndex', async (t) => {
    await t.test('should convert zodiac names to indices', () => {
      assert.strictEqual(features.zodiacToIndex('aries'), 0);
      assert.strictEqual(features.zodiacToIndex('taurus'), 1);
      assert.strictEqual(features.zodiacToIndex('pisces'), 11);
    });

    await t.test('should handle case insensitivity', () => {
      assert.strictEqual(features.zodiacToIndex('ARIES'), 0);
      assert.strictEqual(features.zodiacToIndex('Taurus'), 1);
    });

    await t.test('should return number if already a number', () => {
      assert.strictEqual(features.zodiacToIndex(5), 5);
    });

    await t.test('should return null for invalid sign', () => {
      assert.strictEqual(features.zodiacToIndex('invalid'), null);
    });
  });

  await t.test('moonPhaseToIndex', async (t) => {
    await t.test('should convert moon phase names to indices', () => {
      assert.strictEqual(features.moonPhaseToIndex('new'), 0);
      assert.strictEqual(features.moonPhaseToIndex('full'), 4);
      assert.strictEqual(features.moonPhaseToIndex('waning_crescent'), 7);
    });

    await t.test('should handle spaces in phase names', () => {
      assert.strictEqual(features.moonPhaseToIndex('first quarter'), 2);
      assert.strictEqual(features.moonPhaseToIndex('waxing gibbous'), 3);
    });

    await t.test('should return number if already a number', () => {
      assert.strictEqual(features.moonPhaseToIndex(3), 3);
    });

    await t.test('should bound numeric values', () => {
      assert.strictEqual(features.moonPhaseToIndex(10), 7);
      assert.strictEqual(features.moonPhaseToIndex(-1), 0);
    });
  });

  await t.test('flareClassToNumeric', async (t) => {
    await t.test('should convert flare classes correctly', () => {
      assert.strictEqual(features.flareClassToNumeric('A'), 1);
      assert.strictEqual(features.flareClassToNumeric('B'), 2);
      assert.strictEqual(features.flareClassToNumeric('C'), 3);
    });

    await t.test('should handle M-class flares', () => {
      const m1 = features.flareClassToNumeric('M1');
      const m5 = features.flareClassToNumeric('M5');
      assert.ok(m1 >= 4 && m1 < 5);
      assert.ok(m5 > m1);
    });

    await t.test('should handle X-class flares', () => {
      const x1 = features.flareClassToNumeric('X1');
      const x5 = features.flareClassToNumeric('X5');
      assert.ok(x1 >= 8);
      assert.ok(x5 > x1);
    });

    await t.test('should return 0 for none/quiet', () => {
      assert.strictEqual(features.flareClassToNumeric('none'), 0);
      assert.strictEqual(features.flareClassToNumeric('quiet'), 0);
      assert.strictEqual(features.flareClassToNumeric(null), 0);
    });

    await t.test('should return number if already a number', () => {
      assert.strictEqual(features.flareClassToNumeric(5), 5);
    });
  });

  await t.test('extractFeatures', async (t) => {
    await t.test('should extract day of week', () => {
      const date = new Date('2026-01-31'); // Saturday
      const moduleData = {};
      const result = features.extractFeatures(moduleData, date);
      assert.strictEqual(result.day_of_week, 6); // Saturday = 6
    });

    await t.test('should extract moon features', () => {
      const moduleData = {
        moon: {
          phaseIndex: 4,
          sign: 'leo',
          illumination: 100,
          voidOfCourse: true,
        },
      };
      const result = features.extractFeatures(moduleData, new Date());

      assert.strictEqual(result.moon_phase, 4);
      assert.strictEqual(result.moon_sign, 4); // Leo
      assert.strictEqual(result.moon_illumination, 100);
      assert.strictEqual(result.moon_void_of_course, 1);
    });

    await t.test('should extract astrology features', () => {
      const moduleData = {
        astrology: {
          planets: [{ name: 'Sun', sign: 'aquarius' }],
          retrogrades: ['Mercury', { name: 'Venus' }],
          aspects: [1, 2, 3],
        },
      };
      const result = features.extractFeatures(moduleData, new Date());

      assert.strictEqual(result.sun_sign, 10); // Aquarius
      assert.strictEqual(result.mercury_retrograde, 1);
      assert.strictEqual(result.venus_retrograde, 1);
      assert.strictEqual(result.mars_retrograde, 0);
      assert.strictEqual(result.planets_retrograde_count, 2);
      assert.strictEqual(result.major_aspects_count, 3);
    });

    await t.test('should extract solar features', () => {
      const moduleData = {
        solar: {
          kpIndex: 5,
          apIndex: 20,
          flareClass: 'M2',
          sunspotNumber: 100,
          solarWind: { speed: 500 },
        },
      };
      const result = features.extractFeatures(moduleData, new Date());

      assert.strictEqual(result.kp_index, 5);
      assert.strictEqual(result.ap_index, 20);
      assert.ok(result.solar_flare_class > 4);
      assert.strictEqual(result.sunspot_number, 100);
      assert.strictEqual(result.solar_wind_speed, 500);
    });

    await t.test('should handle missing module data gracefully', () => {
      const moduleData = {};
      const result = features.extractFeatures(moduleData, new Date());

      // Should not throw and should have date
      assert.ok(result.date);
      assert.ok(result.day_of_week >= 0 && result.day_of_week <= 6);
    });
  });

  await t.test('getUniqueValues', async (t) => {
    await t.test('should return binary values for binary features', () => {
      const values = features.getUniqueValues([], 'mercury_retrograde');
      assert.deepStrictEqual(values, [0, 1]);
    });

    await t.test('should return range for categorical features', () => {
      const values = features.getUniqueValues([], 'moon_phase');
      assert.deepStrictEqual(values, [0, 1, 2, 3, 4, 5, 6, 7]);
    });

    await t.test('should return empty array for unknown features', () => {
      const values = features.getUniqueValues([], 'unknown_feature');
      assert.deepStrictEqual(values, []);
    });
  });

  await t.test('getContinuousThresholds', async (t) => {
    await t.test('should return thresholds for kp_index', () => {
      const thresholds = features.getContinuousThresholds('kp_index');
      assert.ok(thresholds.includes('>=5'));
      assert.ok(thresholds.includes('>=7'));
    });

    await t.test('should return thresholds for vix', () => {
      const thresholds = features.getContinuousThresholds('vix');
      assert.ok(thresholds.includes('>=20'));
      assert.ok(thresholds.includes('>=30'));
    });

    await t.test('should return empty array for unknown feature', () => {
      const thresholds = features.getContinuousThresholds('unknown');
      assert.deepStrictEqual(thresholds, []);
    });
  });

  await t.test('getAllFeatureNames', async (t) => {
    await t.test('should return all 36 feature names', () => {
      const names = features.getAllFeatureNames();
      assert.ok(names.length >= 36);
      assert.ok(names.includes('moon_phase'));
      assert.ok(names.includes('kp_index'));
      assert.ok(names.includes('fear_greed_cnn'));
    });
  });

  await t.test('getFeatureDefinition', async (t) => {
    await t.test('should return definition for known feature', () => {
      const def = features.getFeatureDefinition('moon_phase');
      assert.strictEqual(def.type, 'categorical');
      assert.deepStrictEqual(def.range, [0, 7]);
    });

    await t.test('should return null for unknown feature', () => {
      const def = features.getFeatureDefinition('unknown');
      assert.strictEqual(def, null);
    });
  });

  await t.test('validateFeatures', async (t) => {
    await t.test('should identify missing features', () => {
      const featureVector = {
        moon_phase: 1,
        kp_index: 3,
      };
      const result = features.validateFeatures(featureVector);

      assert.strictEqual(result.valid, false);
      assert.ok(result.missing.length > 0);
      assert.ok(result.missing.includes('mercury_retrograde'));
    });

    await t.test('should validate complete feature vector', () => {
      const featureVector = {};
      const allNames = features.getAllFeatureNames();
      for (const name of allNames) {
        featureVector[name] = 0; // Set all to 0
      }

      const result = features.validateFeatures(featureVector);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.missing.length, 0);
    });
  });

  await t.test('FEATURE_DEFINITIONS constant', () => {
    assert.ok(features.FEATURE_DEFINITIONS);
    assert.ok(features.FEATURE_DEFINITIONS.moon_phase);
    assert.ok(features.FEATURE_DEFINITIONS.kp_index);
    assert.ok(features.FEATURE_DEFINITIONS.mercury_retrograde);
  });

  await t.test('Module exports', () => {
    assert.ok(typeof features.zodiacToIndex === 'function');
    assert.ok(typeof features.moonPhaseToIndex === 'function');
    assert.ok(typeof features.flareClassToNumeric === 'function');
    assert.ok(typeof features.extractFeatures === 'function');
    assert.ok(typeof features.getUniqueValues === 'function');
    assert.ok(typeof features.getContinuousThresholds === 'function');
    assert.ok(typeof features.getAllFeatureNames === 'function');
    assert.ok(typeof features.getFeatureDefinition === 'function');
    assert.ok(typeof features.validateFeatures === 'function');
  });
});
