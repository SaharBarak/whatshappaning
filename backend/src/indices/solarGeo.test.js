/**
 * Tests for Solar-Geo Index
 */

const test = require('node:test');
const assert = require('node:assert');
const solarGeo = require('./solarGeo.js');

test('Solar-Geo Index - normalizeKp', async (t) => {
  await t.test('should normalize Kp 0 to 0', () => {
    assert.strictEqual(solarGeo.normalizeKp(0), 0);
  });

  await t.test('should normalize Kp 9 to 10', () => {
    const result = solarGeo.normalizeKp(9);
    assert.ok(Math.abs(result - 10) < 0.01, `Expected ~10, got ${result}`);
  });

  await t.test('should normalize Kp 4.5 to ~5', () => {
    const result = solarGeo.normalizeKp(4.5);
    assert.ok(result > 4 && result < 6, `Expected ~5, got ${result}`);
  });

  await t.test('should handle null/undefined', () => {
    assert.strictEqual(solarGeo.normalizeKp(null), 0);
    assert.strictEqual(solarGeo.normalizeKp(undefined), 0);
  });
});

test('Solar-Geo Index - normalizeFlare', async (t) => {
  await t.test('should normalize A-class to ~0', () => {
    assert.strictEqual(solarGeo.normalizeFlare('A1.0'), 0.1);
  });

  await t.test('should normalize B-class to ~1', () => {
    const result = solarGeo.normalizeFlare('B5.0');
    assert.ok(result >= 1 && result <= 2, `Expected 1-2, got ${result}`);
  });

  await t.test('should normalize C-class to ~2', () => {
    const result = solarGeo.normalizeFlare('C2.1');
    assert.ok(result >= 2 && result <= 3, `Expected 2-3, got ${result}`);
  });

  await t.test('should normalize M-class to ~5', () => {
    const result = solarGeo.normalizeFlare('M5.2');
    assert.ok(result >= 5 && result <= 6, `Expected 5-6, got ${result}`);
  });

  await t.test('should normalize X-class to ~8+', () => {
    const result = solarGeo.normalizeFlare('X1.4');
    assert.ok(result >= 8, `Expected >=8, got ${result}`);
  });

  await t.test('should cap at 10', () => {
    const result = solarGeo.normalizeFlare('X10.0');
    assert.ok(result <= 10, `Expected <=10, got ${result}`);
  });

  await t.test('should handle null/undefined', () => {
    assert.strictEqual(solarGeo.normalizeFlare(null), 0);
    assert.strictEqual(solarGeo.normalizeFlare(undefined), 0);
  });
});

test('Solar-Geo Index - normalizeSchumann', async (t) => {
  await t.test('should normalize amplitude 10 to 2', () => {
    const result = solarGeo.normalizeSchumann(10);
    assert.strictEqual(result, 2);
  });

  await t.test('should normalize amplitude 50 to 10', () => {
    const result = solarGeo.normalizeSchumann(50);
    assert.strictEqual(result, 10);
  });

  await t.test('should cap at 10', () => {
    const result = solarGeo.normalizeSchumann(100);
    assert.strictEqual(result, 10);
  });

  await t.test('should use default for null', () => {
    const result = solarGeo.normalizeSchumann(null);
    assert.strictEqual(result, 5); // Default middle value
  });
});

test('Solar-Geo Index - normalizeSolarWind', async (t) => {
  await t.test('should normalize 300 km/s to 0', () => {
    const result = solarGeo.normalizeSolarWind(300);
    assert.strictEqual(result, 0);
  });

  await t.test('should normalize 800 km/s to 10', () => {
    const result = solarGeo.normalizeSolarWind(800);
    assert.strictEqual(result, 10);
  });

  await t.test('should normalize 550 km/s to 5', () => {
    const result = solarGeo.normalizeSolarWind(550);
    assert.strictEqual(result, 5);
  });

  await t.test('should cap at 0 for low values', () => {
    const result = solarGeo.normalizeSolarWind(200);
    assert.strictEqual(result, 0);
  });
});

test('Solar-Geo Index - getLevel', async (t) => {
  await t.test('should return Calm for 0-2', () => {
    assert.strictEqual(solarGeo.getLevel(0).level, 'Calm');
    assert.strictEqual(solarGeo.getLevel(2).level, 'Calm');
  });

  await t.test('should return Low for 2-4', () => {
    assert.strictEqual(solarGeo.getLevel(3).level, 'Low');
  });

  await t.test('should return Moderate for 4-6', () => {
    assert.strictEqual(solarGeo.getLevel(5).level, 'Moderate');
  });

  await t.test('should return Elevated for 6-8', () => {
    assert.strictEqual(solarGeo.getLevel(7).level, 'Elevated');
  });

  await t.test('should return High for 8-10', () => {
    assert.strictEqual(solarGeo.getLevel(9).level, 'High');
  });
});

test('Solar-Geo Index - calculateIndex', async (t) => {
  // Clear history before tests
  solarGeo.clearHistory();

  await t.test('should calculate index from mock data', () => {
    const solarData = {
      kpIndex: 3,
      latestFlare: { class: 'C2.1' },
      solarWind: { speed: 423 },
    };
    const schumannData = {
      currentAmplitude: 12,
    };

    const result = solarGeo.calculateIndex(solarData, schumannData);

    assert.ok(result.value >= 0 && result.value <= 10, `Value should be 0-10, got ${result.value}`);
    assert.ok(typeof result.level === 'string', 'Level should be a string');
    assert.ok(typeof result.trend === 'string', 'Trend should be a string');
    assert.strictEqual(result.components.kp, 3);
    assert.strictEqual(result.components.flare, 'C2.1');
  });

  await t.test('should handle missing data gracefully', () => {
    const result = solarGeo.calculateIndex({}, {});

    assert.ok(typeof result.value === 'number', 'Value should be a number');
    assert.ok(typeof result.level === 'string', 'Level should be a string');
  });
});

test('Solar-Geo Index - module exports', async (t) => {
  await t.test('should export required properties', () => {
    assert.strictEqual(solarGeo.name, 'solarGeo');
    assert.strictEqual(solarGeo.schedule, '0 */3 * * *');
    assert.strictEqual(typeof solarGeo.collect, 'function');
    assert.strictEqual(typeof solarGeo.calculateFromData, 'function');
  });
});
