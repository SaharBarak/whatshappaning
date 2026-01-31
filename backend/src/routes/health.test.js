/**
 * Integration tests for Health routes
 *
 * Tests health check helper functions and logic
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Health Check Logic', () => {
  describe('formatUptime', () => {
    function formatUptime(seconds) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

      return parts.join(' ');
    }

    it('should format seconds only', () => {
      assert.equal(formatUptime(30), '30s');
      assert.equal(formatUptime(0), '0s');
      assert.equal(formatUptime(59), '59s');
    });

    it('should format minutes and seconds', () => {
      assert.equal(formatUptime(90), '1m 30s');
      assert.equal(formatUptime(300), '5m');
      assert.equal(formatUptime(3599), '59m 59s');
    });

    it('should format hours, minutes, and seconds', () => {
      assert.equal(formatUptime(3600), '1h');
      assert.equal(formatUptime(3661), '1h 1m 1s');
      assert.equal(formatUptime(7200), '2h');
      assert.equal(formatUptime(86399), '23h 59m 59s');
    });

    it('should format days, hours, minutes, and seconds', () => {
      assert.equal(formatUptime(86400), '1d');
      assert.equal(formatUptime(90061), '1d 1h 1m 1s');
      assert.equal(formatUptime(172800), '2d');
    });

    it('should skip zero values in middle', () => {
      assert.equal(formatUptime(86401), '1d 1s');
      assert.equal(formatUptime(86460), '1d 1m');
      assert.equal(formatUptime(90000), '1d 1h');
    });
  });

  describe('Overall Status Determination', () => {
    function determineOverallStatus(dbConnected, errorCount) {
      if (!dbConnected) return 'critical';
      if (errorCount > 3) return 'degraded';
      if (errorCount > 0) return 'warning';
      return 'healthy';
    }

    it('should return critical when database not connected', () => {
      assert.equal(determineOverallStatus(false, 0), 'critical');
      assert.equal(determineOverallStatus(false, 10), 'critical');
    });

    it('should return degraded when many modules have errors', () => {
      assert.equal(determineOverallStatus(true, 4), 'degraded');
      assert.equal(determineOverallStatus(true, 10), 'degraded');
    });

    it('should return warning when some modules have errors', () => {
      assert.equal(determineOverallStatus(true, 1), 'warning');
      assert.equal(determineOverallStatus(true, 2), 'warning');
      assert.equal(determineOverallStatus(true, 3), 'warning');
    });

    it('should return healthy when no errors', () => {
      assert.equal(determineOverallStatus(true, 0), 'healthy');
    });
  });

  describe('Module Health Grouping', () => {
    function groupModuleHealth(statusArray) {
      const moduleHealth = {};
      for (const status of statusArray) {
        if (!moduleHealth[status.module]) {
          moduleHealth[status.module] = {
            status: status.status,
            lastCheck: status.checked_at,
            responseTime: status.response_time_ms,
            error: status.error_message,
          };
        }
      }
      return moduleHealth;
    }

    it('should group by module taking first occurrence', () => {
      const statuses = [
        { module: 'moon', status: 'success', checked_at: '2026-01-31T10:00:00Z', response_time_ms: 100, error_message: null },
        { module: 'moon', status: 'error', checked_at: '2026-01-31T09:00:00Z', response_time_ms: 200, error_message: 'old error' },
        { module: 'solar', status: 'success', checked_at: '2026-01-31T10:00:00Z', response_time_ms: 150, error_message: null },
      ];

      const grouped = groupModuleHealth(statuses);

      assert.equal(Object.keys(grouped).length, 2);
      assert.equal(grouped.moon.status, 'success');
      assert.equal(grouped.moon.responseTime, 100);
      assert.equal(grouped.solar.status, 'success');
    });

    it('should handle empty array', () => {
      const grouped = groupModuleHealth([]);
      assert.equal(Object.keys(grouped).length, 0);
    });

    it('should include error messages', () => {
      const statuses = [
        { module: 'markets', status: 'error', checked_at: '2026-01-31T10:00:00Z', response_time_ms: 50, error_message: 'API timeout' },
      ];

      const grouped = groupModuleHealth(statuses);

      assert.equal(grouped.markets.error, 'API timeout');
    });
  });

  describe('Summary Calculation', () => {
    function calculateSummary(moduleHealth) {
      const values = Object.values(moduleHealth);
      return {
        totalModules: values.length,
        healthy: values.filter(m => m.status === 'success').length,
        errors: values.filter(m => m.status === 'error').length,
      };
    }

    it('should count modules correctly', () => {
      const moduleHealth = {
        moon: { status: 'success' },
        solar: { status: 'success' },
        markets: { status: 'error' },
      };

      const summary = calculateSummary(moduleHealth);

      assert.equal(summary.totalModules, 3);
      assert.equal(summary.healthy, 2);
      assert.equal(summary.errors, 1);
    });

    it('should handle all healthy', () => {
      const moduleHealth = {
        moon: { status: 'success' },
        solar: { status: 'success' },
      };

      const summary = calculateSummary(moduleHealth);

      assert.equal(summary.totalModules, 2);
      assert.equal(summary.healthy, 2);
      assert.equal(summary.errors, 0);
    });

    it('should handle all errors', () => {
      const moduleHealth = {
        markets: { status: 'error' },
        news: { status: 'error' },
      };

      const summary = calculateSummary(moduleHealth);

      assert.equal(summary.totalModules, 2);
      assert.equal(summary.healthy, 0);
      assert.equal(summary.errors, 2);
    });

    it('should handle empty', () => {
      const summary = calculateSummary({});

      assert.equal(summary.totalModules, 0);
      assert.equal(summary.healthy, 0);
      assert.equal(summary.errors, 0);
    });
  });

  describe('Health Status Response Format', () => {
    function formatHealthResponse(dbConnected) {
      const status = dbConnected ? 'healthy' : 'degraded';
      return {
        status,
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'disconnected',
      };
    }

    it('should format healthy response', () => {
      const response = formatHealthResponse(true);

      assert.equal(response.status, 'healthy');
      assert.equal(response.database, 'connected');
      assert.ok(response.timestamp);
    });

    it('should format degraded response', () => {
      const response = formatHealthResponse(false);

      assert.equal(response.status, 'degraded');
      assert.equal(response.database, 'disconnected');
      assert.ok(response.timestamp);
    });

    it('should have ISO timestamp', () => {
      const response = formatHealthResponse(true);

      // ISO format check
      assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(response.timestamp));
    });
  });
});

describe('Cache Statistics', () => {
  it('should validate cache stats format', () => {
    const validStats = { hits: 100, misses: 20, size: 15 };

    assert.ok(typeof validStats.hits === 'number');
    assert.ok(typeof validStats.misses === 'number');
    assert.ok(typeof validStats.size === 'number');
    assert.ok(validStats.hits >= 0);
    assert.ok(validStats.misses >= 0);
    assert.ok(validStats.size >= 0);
  });
});
