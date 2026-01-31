/**
 * Tests for Calendar Sync Index
 */

const test = require('node:test');
const assert = require('node:assert');
const calendarSync = require('./calendarSync.js');

test('Calendar Sync Index - checkGAPDay', async (t) => {
  await t.test('should return 2 points for GAP day', () => {
    const result = calendarSync.checkGAPDay({ isGAP: true });
    assert.strictEqual(result.points, 2);
    assert.ok(result.events[0].includes('Galactic Activation Portal'));
  });

  await t.test('should return 0 for non-GAP day', () => {
    const result = calendarSync.checkGAPDay({ isGAP: false });
    assert.strictEqual(result.points, 0);
  });

  await t.test('should handle null/undefined', () => {
    const result = calendarSync.checkGAPDay(null);
    assert.strictEqual(result.points, 0);
  });
});

test('Calendar Sync Index - checkWavespellStart', async (t) => {
  await t.test('should return 1 point for tone 1', () => {
    const result = calendarSync.checkWavespellStart({ tone: 1, wavespellSeal: 'Red Dragon' });
    assert.strictEqual(result.points, 1);
    assert.ok(result.events[0].includes('Wavespell begins'));
  });

  await t.test('should return 0 for other tones', () => {
    const result = calendarSync.checkWavespellStart({ tone: 7, wavespellSeal: 'Red Dragon' });
    assert.strictEqual(result.points, 0);
  });
});

test('Calendar Sync Index - checkRoshChodesh', async (t) => {
  await t.test('should return 1 point for day 1', () => {
    const result = calendarSync.checkRoshChodesh({ hebrewDate: '1 Shevat 5786' });
    assert.strictEqual(result.points, 1);
    assert.ok(result.events[0].includes('Rosh Chodesh'));
  });

  await t.test('should return 1 point for day 30', () => {
    const result = calendarSync.checkRoshChodesh({ hebrewDate: '30 Tevet 5786' });
    assert.strictEqual(result.points, 1);
  });

  await t.test('should return 0 for other days', () => {
    const result = calendarSync.checkRoshChodesh({ hebrewDate: '15 Shevat 5786' });
    assert.strictEqual(result.points, 0);
  });

  await t.test('should handle missing hebrewDate', () => {
    const result = calendarSync.checkRoshChodesh({ hebrewDate: null });
    assert.strictEqual(result.points, 0);
  });
});

test('Calendar Sync Index - checkNumberSync', async (t) => {
  await t.test('should return 1 point for matching tones', () => {
    const result = calendarSync.checkNumberSync(
      { tone: 7 },
      { tone: 7 },
      { hebrewDate: '15 Shevat' }
    );
    assert.strictEqual(result.points, 1);
    assert.ok(result.events[0].includes('Number 7'));
  });

  await t.test('should return 0 for non-matching numbers', () => {
    const result = calendarSync.checkNumberSync(
      { tone: 3 },
      { tone: 5 },
      { hebrewDate: '15 Shevat' }
    );
    assert.strictEqual(result.points, 0);
  });

  await t.test('should match Hebrew day with tones if <= 13', () => {
    const result = calendarSync.checkNumberSync(
      { tone: 7 },
      { tone: 5 },
      { hebrewDate: '7 Shevat' }
    );
    assert.strictEqual(result.points, 1);
    assert.ok(result.events[0].includes('Hebrew day'));
  });
});

test('Calendar Sync Index - getLevel', async (t) => {
  await t.test('should return None for 0', () => {
    assert.strictEqual(calendarSync.getLevel(0), 'None');
  });

  await t.test('should return Low for 1', () => {
    assert.strictEqual(calendarSync.getLevel(1), 'Low');
  });

  await t.test('should return Moderate for 2-3', () => {
    assert.strictEqual(calendarSync.getLevel(2), 'Moderate');
    assert.strictEqual(calendarSync.getLevel(3), 'Moderate');
  });

  await t.test('should return High for 4-5', () => {
    assert.strictEqual(calendarSync.getLevel(4), 'High');
    assert.strictEqual(calendarSync.getLevel(5), 'High');
  });

  await t.test('should return Rare Convergence for 6+', () => {
    assert.strictEqual(calendarSync.getLevel(6), 'Rare Convergence');
    assert.strictEqual(calendarSync.getLevel(10), 'Rare Convergence');
  });
});

test('Calendar Sync Index - generateNote', async (t) => {
  await t.test('should return null for score 0', () => {
    assert.strictEqual(calendarSync.generateNote(0, []), null);
  });

  await t.test('should return appropriate note for score 1', () => {
    const note = calendarSync.generateNote(1, ['test']);
    assert.ok(note.includes('Minor'));
  });

  await t.test('should return appropriate note for score 3', () => {
    const note = calendarSync.generateNote(3, ['test', 'test2']);
    assert.ok(note.includes('Multiple'));
  });

  await t.test('should return appropriate note for high scores', () => {
    const note = calendarSync.generateNote(6, ['test']);
    assert.ok(note.includes('Rare'));
  });
});

test('Calendar Sync Index - calculateIndex', async (t) => {
  await t.test('should calculate index from mock data', () => {
    const dreamspellData = {
      isGAP: true,
      tone: 1,
      wavespellSeal: 'Red Dragon',
    };
    const tzolkinData = {
      tone: 7,
      daySign: 'Imix',
    };
    const parashaData = {
      name: 'Bereishit',
      hebrewDate: '1 Shevat 5786',
    };
    const moonData = {
      phase: 'Waxing Gibbous',
      illumination: 67,
    };

    const result = calendarSync.calculateIndex(dreamspellData, tzolkinData, parashaData, moonData);

    assert.ok(typeof result.score === 'number', 'Score should be a number');
    assert.ok(typeof result.level === 'string', 'Level should be a string');
    assert.ok(Array.isArray(result.convergences), 'Convergences should be an array');
    assert.ok(result.score >= 3, 'Should have at least 3 points (GAP + wavespell + Rosh Chodesh)');
  });

  await t.test('should handle empty data gracefully', () => {
    const result = calendarSync.calculateIndex({}, {}, {}, {});

    assert.strictEqual(result.score, 0);
    assert.strictEqual(result.level, 'None');
    assert.strictEqual(result.convergences.length, 0);
  });
});

test('Calendar Sync Index - module exports', async (t) => {
  await t.test('should export required properties', () => {
    assert.strictEqual(calendarSync.name, 'calendarSync');
    assert.strictEqual(calendarSync.schedule, '0 0 * * *');
    assert.strictEqual(typeof calendarSync.collect, 'function');
    assert.strictEqual(typeof calendarSync.calculateFromData, 'function');
  });
});
