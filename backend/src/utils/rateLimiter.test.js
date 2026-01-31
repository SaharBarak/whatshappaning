/**
 * Tests for Rate Limiter middleware
 */

const { describe, it, beforeEach, before, after } = require('node:test');
const assert = require('node:assert/strict');

// Mock config before requiring rateLimiter
const originalConfig = require('../config');

describe('Rate Limiter', () => {
  // Store original config values
  const originalWindowMs = originalConfig.rateLimit.windowMs;
  const originalMax = originalConfig.rateLimit.max;

  before(() => {
    // Set shorter window for faster tests
    originalConfig.rateLimit.windowMs = 1000; // 1 second
    originalConfig.rateLimit.max = 3; // 3 requests
  });

  after(() => {
    // Restore original config
    originalConfig.rateLimit.windowMs = originalWindowMs;
    originalConfig.rateLimit.max = originalMax;
  });

  // Require after config modification
  let rateLimiter, getStats, reset, getClientIp;

  beforeEach(() => {
    // Fresh import and reset for each test
    const limiter = require('./rateLimiter');
    rateLimiter = limiter.rateLimiter;
    getStats = limiter.getStats;
    reset = limiter.reset;
    getClientIp = limiter.getClientIp;
    reset();
  });

  describe('getClientIp', () => {
    it('should get IP from X-Forwarded-For header', () => {
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
        ip: '127.0.0.1',
      };
      assert.equal(getClientIp(req), '192.168.1.1');
    });

    it('should get IP from req.ip when no forwarded header', () => {
      const req = {
        headers: {},
        ip: '10.0.0.5',
      };
      assert.equal(getClientIp(req), '10.0.0.5');
    });

    it('should fall back to connection.remoteAddress', () => {
      const req = {
        headers: {},
        connection: { remoteAddress: '192.168.0.10' },
      };
      assert.equal(getClientIp(req), '192.168.0.10');
    });

    it('should return unknown for missing IP info', () => {
      const req = { headers: {} };
      assert.equal(getClientIp(req), 'unknown');
    });
  });

  describe('rateLimiter middleware', () => {
    function createMockReq(ip) {
      return {
        headers: {},
        ip,
      };
    }

    function createMockRes() {
      const headers = {};
      return {
        headers,
        set: (key, value) => { headers[key] = value; },
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: function(body) {
          this.body = body;
          return this;
        },
      };
    }

    it('should allow requests within limit', () => {
      const req = createMockReq('10.0.0.1');
      const res = createMockRes();
      let nextCalled = false;

      rateLimiter(req, res, () => { nextCalled = true; });

      assert.ok(nextCalled, 'next() should be called');
      assert.equal(res.headers['X-RateLimit-Limit'], 3);
      assert.equal(res.headers['X-RateLimit-Remaining'], 2);
    });

    it('should set rate limit headers', () => {
      const req = createMockReq('10.0.0.2');
      const res = createMockRes();

      rateLimiter(req, res, () => {});

      assert.ok(res.headers['X-RateLimit-Limit']);
      assert.ok(res.headers['X-RateLimit-Remaining'] !== undefined);
      assert.ok(res.headers['X-RateLimit-Reset']);
    });

    it('should decrement remaining count', () => {
      const req = createMockReq('10.0.0.3');

      // First request
      let res = createMockRes();
      rateLimiter(req, res, () => {});
      assert.equal(res.headers['X-RateLimit-Remaining'], 2);

      // Second request
      res = createMockRes();
      rateLimiter(req, res, () => {});
      assert.equal(res.headers['X-RateLimit-Remaining'], 1);

      // Third request
      res = createMockRes();
      rateLimiter(req, res, () => {});
      assert.equal(res.headers['X-RateLimit-Remaining'], 0);
    });

    it('should block requests over limit', () => {
      const req = createMockReq('10.0.0.4');

      // Make 3 allowed requests
      for (let i = 0; i < 3; i++) {
        const res = createMockRes();
        rateLimiter(req, res, () => {});
      }

      // 4th request should be blocked
      const res = createMockRes();
      let nextCalled = false;
      rateLimiter(req, res, () => { nextCalled = true; });

      assert.ok(!nextCalled, 'next() should not be called');
      assert.equal(res.statusCode, 429);
      assert.ok(res.body.error.includes('Too Many'));
      assert.ok(res.headers['Retry-After']);
    });

    it('should track different IPs separately', () => {
      // IP 1 makes 3 requests
      for (let i = 0; i < 3; i++) {
        const req = createMockReq('10.0.0.10');
        const res = createMockRes();
        rateLimiter(req, res, () => {});
      }

      // IP 2 should still have full quota
      const req2 = createMockReq('10.0.0.11');
      const res2 = createMockRes();
      let nextCalled = false;
      rateLimiter(req2, res2, () => { nextCalled = true; });

      assert.ok(nextCalled, 'different IP should not be blocked');
      assert.equal(res2.headers['X-RateLimit-Remaining'], 2);
    });

    it('should reset after window expires', async () => {
      const req = createMockReq('10.0.0.20');

      // Exhaust the limit
      for (let i = 0; i < 4; i++) {
        const res = createMockRes();
        rateLimiter(req, res, () => {});
      }

      // Wait for window to expire (window is 1 second in tests)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be allowed again
      const res = createMockRes();
      let nextCalled = false;
      rateLimiter(req, res, () => { nextCalled = true; });

      assert.ok(nextCalled, 'should be allowed after window reset');
      assert.equal(res.headers['X-RateLimit-Remaining'], 2);
    });
  });

  describe('getStats', () => {
    it('should return rate limit statistics', () => {
      const stats = getStats();

      assert.ok(typeof stats.activeClients === 'number');
      assert.ok(typeof stats.windowMs === 'number');
      assert.ok(typeof stats.maxRequests === 'number');
    });

    it('should track active clients', () => {
      const limiter = require('./rateLimiter');

      // Initial state
      assert.equal(limiter.getStats().activeClients, 0);

      // Make a request
      const req = { headers: {}, ip: '10.0.0.100' };
      const res = { set: () => {} };
      limiter.rateLimiter(req, res, () => {});

      assert.equal(limiter.getStats().activeClients, 1);
    });
  });

  describe('reset', () => {
    it('should clear all rate limit entries', () => {
      const limiter = require('./rateLimiter');

      // Add some entries
      for (let i = 0; i < 5; i++) {
        const req = { headers: {}, ip: `10.0.0.${i}` };
        const res = { set: () => {} };
        limiter.rateLimiter(req, res, () => {});
      }

      assert.equal(limiter.getStats().activeClients, 5);

      // Reset
      limiter.reset();

      assert.equal(limiter.getStats().activeClients, 0);
    });
  });
});
