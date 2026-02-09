/**
 * Performance Middleware Tests
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { PerformanceMetrics } = require('./performance');

describe('PerformanceMetrics', () => {
  let metrics;

  beforeEach(() => {
    metrics = new PerformanceMetrics();
  });

  it('records and retrieves stats for an endpoint', () => {
    for (let i = 1; i <= 100; i++) {
      metrics.record('/api/current', i);
    }

    const stats = metrics.getStats('/api/current');
    assert.strictEqual(stats.count, 100);
    assert.strictEqual(stats.min, 1);
    assert.strictEqual(stats.max, 100);
    assert.strictEqual(stats.p50, 51);
    assert.strictEqual(stats.p95, 96);
    assert.strictEqual(stats.p99, 100);
  });

  it('returns null for unknown endpoint', () => {
    const stats = metrics.getStats('/unknown');
    assert.strictEqual(stats, null);
  });

  it('respects maxSamples limit', () => {
    for (let i = 0; i < 1500; i++) {
      metrics.record('/api/test', i);
    }

    const stats = metrics.getStats('/api/test');
    assert.strictEqual(stats.count, 1000);
  });

  it('getAllStats returns stats for all endpoints', () => {
    metrics.record('/api/a', 10);
    metrics.record('/api/b', 20);

    const allStats = metrics.getAllStats();
    assert.ok(allStats['/api/a']);
    assert.ok(allStats['/api/b']);
    assert.strictEqual(allStats['/api/a'].avg, 10);
    assert.strictEqual(allStats['/api/b'].avg, 20);
  });

  it('reset clears all metrics', () => {
    metrics.record('/api/test', 10);
    metrics.reset();
    assert.strictEqual(metrics.getStats('/api/test'), null);
  });
});
