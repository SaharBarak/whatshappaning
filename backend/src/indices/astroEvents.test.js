/**
 * Tests for Astronomical Events Index
 */

const test = require('node:test');
const assert = require('node:assert');
const astroEvents = require('./astroEvents.js');

test('Astro Events Index - calculateRetrogradePoints', async (t) => {
  await t.test('should return 0 for no retrogrades', () => {
    const result = astroEvents.calculateRetrogradePoints([]);
    assert.strictEqual(result.points, 0);
    assert.strictEqual(result.events.length, 0);
  });

  await t.test('should return 0 for "None currently"', () => {
    const result = astroEvents.calculateRetrogradePoints(['None currently']);
    assert.strictEqual(result.points, 0);
  });

  await t.test('should return 1 point per planet', () => {
    const result = astroEvents.calculateRetrogradePoints(['Saturn', 'Jupiter']);
    assert.strictEqual(result.points, 2);
    assert.strictEqual(result.events.length, 2);
  });

  await t.test('should give Mercury +1 bonus', () => {
    const result = astroEvents.calculateRetrogradePoints(['Mercury']);
    assert.strictEqual(result.points, 2); // 1 base + 1 bonus
  });

  await t.test('should count multiple retrogrades correctly', () => {
    const result = astroEvents.calculateRetrogradePoints(['Mercury', 'Venus', 'Mars']);
    assert.strictEqual(result.points, 4); // 3 base + 1 Mercury bonus
  });
});

test('Astro Events Index - calculateEclipsePoints', async (t) => {
  await t.test('should return 0 for no eclipse data', () => {
    const result = astroEvents.calculateEclipsePoints(null);
    assert.strictEqual(result.points, 0);
  });

  await t.test('should return 0 for eclipse > 14 days away', () => {
    const result = astroEvents.calculateEclipsePoints({ type: 'Lunar', daysUntil: 30 });
    assert.strictEqual(result.points, 0);
  });

  await t.test('should return 2 points for eclipse within 14 days', () => {
    const result = astroEvents.calculateEclipsePoints({ type: 'Lunar', daysUntil: 12 });
    assert.strictEqual(result.points, 2);
    assert.ok(result.events[0].includes('12 days'));
  });

  await t.test('should return 4 points for eclipse within 3 days', () => {
    const result = astroEvents.calculateEclipsePoints({ type: 'Solar', daysUntil: 2 });
    assert.strictEqual(result.points, 4); // 2 + 2 additional
  });
});

test('Astro Events Index - calculateMajorAspectPoints', async (t) => {
  await t.test('should return 0 for no aspects', () => {
    const result = astroEvents.calculateMajorAspectPoints([]);
    assert.strictEqual(result.points, 0);
  });

  await t.test('should count conjunction between outer planets', () => {
    const result = astroEvents.calculateMajorAspectPoints([
      { planet1: 'Jupiter', planet2: 'Saturn', aspect: 'Conjunction', orb: 2.5 },
    ]);
    assert.strictEqual(result.points, 1);
  });

  await t.test('should count opposition between outer planets', () => {
    const result = astroEvents.calculateMajorAspectPoints([
      { planet1: 'Uranus', planet2: 'Neptune', aspect: 'Opposition', orb: 2.0 },
    ]);
    assert.strictEqual(result.points, 1);
  });

  await t.test('should not count trine/square aspects', () => {
    const result = astroEvents.calculateMajorAspectPoints([
      { planet1: 'Jupiter', planet2: 'Saturn', aspect: 'Trine', orb: 2.0 },
      { planet1: 'Jupiter', planet2: 'Saturn', aspect: 'Square', orb: 2.0 },
    ]);
    assert.strictEqual(result.points, 0);
  });

  await t.test('should not count aspects with orb > 3', () => {
    const result = astroEvents.calculateMajorAspectPoints([
      { planet1: 'Jupiter', planet2: 'Saturn', aspect: 'Conjunction', orb: 5.0 },
    ]);
    assert.strictEqual(result.points, 0);
  });

  await t.test('should not count aspects between inner planets only', () => {
    const result = astroEvents.calculateMajorAspectPoints([
      { planet1: 'Sun', planet2: 'Moon', aspect: 'Conjunction', orb: 1.0 },
    ]);
    assert.strictEqual(result.points, 0);
  });
});

test('Astro Events Index - calculateVOCPoints', async (t) => {
  await t.test('should return 0 when VOC is not active', () => {
    const result = astroEvents.calculateVOCPoints({ active: false });
    assert.strictEqual(result.points, 0);
  });

  await t.test('should return 0.5 when VOC is active', () => {
    const result = astroEvents.calculateVOCPoints({ active: true });
    assert.strictEqual(result.points, 0.5);
    assert.strictEqual(result.events[0], 'Moon Void of Course');
  });
});

test('Astro Events Index - isNewOrFullMoon', async (t) => {
  await t.test('should return true for "New"', () => {
    assert.strictEqual(astroEvents.isNewOrFullMoon('New'), true);
  });

  await t.test('should return true for "Full"', () => {
    assert.strictEqual(astroEvents.isNewOrFullMoon('Full'), true);
  });

  await t.test('should return true for "New Moon"', () => {
    assert.strictEqual(astroEvents.isNewOrFullMoon('New Moon'), true);
  });

  await t.test('should return false for other phases', () => {
    assert.strictEqual(astroEvents.isNewOrFullMoon('Waxing Crescent'), false);
    assert.strictEqual(astroEvents.isNewOrFullMoon('First Quarter'), false);
  });
});

test('Astro Events Index - getLevel', async (t) => {
  await t.test('should return Quiet for 0', () => {
    assert.strictEqual(astroEvents.getLevel(0), 'Quiet');
  });

  await t.test('should return Low for 1-2', () => {
    assert.strictEqual(astroEvents.getLevel(1), 'Low');
    assert.strictEqual(astroEvents.getLevel(2), 'Low');
  });

  await t.test('should return Active for 3-4', () => {
    assert.strictEqual(astroEvents.getLevel(3), 'Active');
    assert.strictEqual(astroEvents.getLevel(4), 'Active');
  });

  await t.test('should return Busy for 5-6', () => {
    assert.strictEqual(astroEvents.getLevel(5), 'Busy');
    assert.strictEqual(astroEvents.getLevel(6), 'Busy');
  });

  await t.test('should return Intense for 7+', () => {
    assert.strictEqual(astroEvents.getLevel(7), 'Intense');
    assert.strictEqual(astroEvents.getLevel(10), 'Intense');
  });
});

test('Astro Events Index - calculateIndex', async (t) => {
  await t.test('should calculate index from mock data', () => {
    const astrologyData = {
      retrogrades: ['Saturn', 'Neptune'],
      nextEclipse: { type: 'Lunar', date: '2026-03-03', daysUntil: 31 },
      aspects: [
        { planet1: 'Jupiter', planet2: 'Saturn', aspect: 'Conjunction', orb: 2.0 },
      ],
      voidOfCourseMoon: { active: false },
    };
    const moonData = {
      phase: 'Waxing Gibbous',
      illumination: 67,
    };

    const result = astroEvents.calculateIndex(astrologyData, moonData);

    assert.ok(typeof result.count === 'number', 'Count should be a number');
    assert.ok(typeof result.level === 'string', 'Level should be a string');
    assert.ok(Array.isArray(result.events), 'Events should be an array');
    assert.ok(typeof result.breakdown === 'object', 'Breakdown should be an object');
  });

  await t.test('should handle empty data gracefully', () => {
    const result = astroEvents.calculateIndex({}, {});

    assert.strictEqual(result.count, 0);
    assert.strictEqual(result.level, 'Quiet');
    assert.strictEqual(result.events.length, 0);
  });
});

test('Astro Events Index - module exports', async (t) => {
  await t.test('should export required properties', () => {
    assert.strictEqual(astroEvents.name, 'astroEvents');
    assert.strictEqual(astroEvents.schedule, '0 */3 * * *');
    assert.strictEqual(typeof astroEvents.collect, 'function');
    assert.strictEqual(typeof astroEvents.calculateFromData, 'function');
  });
});
