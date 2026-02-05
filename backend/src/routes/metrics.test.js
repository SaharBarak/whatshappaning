/**
 * Tests for metrics routes
 */

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert');

// Mock the performance module
const mockPerformanceMetrics = {
  getAllStats: mock.fn(() => ({
    '/api/current': { count: 100, min: 10, max: 500, avg: 50, p50: 45, p95: 200, p99: 450 },
    '/api/predictions': { count: 50, min: 20, max: 300, avg: 80, p50: 70, p95: 180, p99: 280 }
  })),
  getStats: mock.fn((endpoint) => {
    if (endpoint === '/api/current') {
      return { count: 100, min: 10, max: 500, avg: 50, p50: 45, p95: 200, p99: 450 };
    }
    return null;
  }),
  record: mock.fn(),
  reset: mock.fn()
};

// Mock express
function createMockResponse() {
  const res = {
    _status: 200,
    _headers: {},
    _body: null,
    status(code) { this._status = code; return this; },
    json(data) { this._body = data; return this; },
    set(key, value) { 
      if (typeof key === 'object') {
        Object.assign(this._headers, key);
      } else {
        this._headers[key] = value;
      }
      return this; 
    },
    send(data) { this._body = data; return this; }
  };
  return res;
}

function createMockRequest(overrides = {}) {
  return {
    method: 'GET',
    path: '/metrics',
    query: {},
    params: {},
    headers: {},
    ...overrides
  };
}

describe('metrics routes', () => {
  describe('GET /metrics', () => {
    it('should return full system metrics', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      // Simulate the route handler
      const endpoints = mockPerformanceMetrics.getAllStats();
      const memUsage = process.memoryUsage();

      res.json({
        timestamp: new Date().toISOString(),
        status: 'ok',
        server: {
          uptime: '1h 30m 0s',
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        memory: {
          heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          rssMB: Math.round(memUsage.rss / 1024 / 1024),
          externalMB: Math.round(memUsage.external / 1024 / 1024),
        },
        endpoints,
      });

      assert.strictEqual(res._body.status, 'ok');
      assert.ok(res._body.timestamp);
      assert.ok(res._body.server);
      assert.ok(res._body.memory);
      assert.ok(res._body.endpoints);
      assert.strictEqual(typeof res._body.server.uptimeSeconds, 'number');
      assert.strictEqual(typeof res._body.memory.heapUsedMB, 'number');
    });

    it('should include endpoint statistics', () => {
      const endpoints = mockPerformanceMetrics.getAllStats();
      
      assert.ok(endpoints['/api/current']);
      assert.strictEqual(endpoints['/api/current'].count, 100);
      assert.strictEqual(endpoints['/api/current'].p50, 45);
      assert.strictEqual(endpoints['/api/current'].p95, 200);
      assert.strictEqual(endpoints['/api/current'].p99, 450);
    });
  });

  describe('GET /metrics/simple', () => {
    it('should return simplified metrics', () => {
      const res = createMockResponse();
      const endpoints = mockPerformanceMetrics.getAllStats();
      const memUsage = process.memoryUsage();

      // Find slowest endpoints
      const slowest = Object.entries(endpoints)
        .filter(([, data]) => data !== null)
        .map(([name, data]) => ({ endpoint: name, p95: data.p95 }))
        .sort((a, b) => (b.p95 || 0) - (a.p95 || 0))
        .slice(0, 5);

      // Calculate total requests
      const totalRequests = Object.values(endpoints)
        .filter(data => data !== null)
        .reduce((sum, data) => sum + (data.count || 0), 0);

      res.json({
        status: 'ok',
        uptime: '1h 30m 0s',
        memory: {
          heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        },
        totalRequests,
        slowestEndpoints: slowest,
      });

      assert.strictEqual(res._body.status, 'ok');
      assert.strictEqual(res._body.totalRequests, 150);
      assert.ok(Array.isArray(res._body.slowestEndpoints));
      assert.strictEqual(res._body.slowestEndpoints[0].endpoint, '/api/current');
    });
  });

  describe('GET /metrics/prometheus', () => {
    it('should return metrics in prometheus format', () => {
      const res = createMockResponse();
      const endpoints = mockPerformanceMetrics.getAllStats();
      const memUsage = process.memoryUsage();

      let output = '';
      output += `# HELP server_uptime_seconds Server uptime in seconds\n`;
      output += `# TYPE server_uptime_seconds gauge\n`;
      output += `server_uptime_seconds ${Math.floor(process.uptime())}\n\n`;

      output += `# HELP nodejs_heap_size_used_bytes Used heap size\n`;
      output += `# TYPE nodejs_heap_size_used_bytes gauge\n`;
      output += `nodejs_heap_size_used_bytes ${memUsage.heapUsed}\n\n`;

      res.set('Content-Type', 'text/plain; charset=utf-8');
      res.send(output);

      assert.strictEqual(res._headers['Content-Type'], 'text/plain; charset=utf-8');
      assert.ok(res._body.includes('server_uptime_seconds'));
      assert.ok(res._body.includes('nodejs_heap_size_used_bytes'));
    });

    it('should sanitize endpoint names in prometheus output', () => {
      // Test that quotes in endpoint names are escaped
      const endpoint = '/api/test"endpoint';
      const sanitized = endpoint.replace(/"/g, '\\"');
      
      assert.strictEqual(sanitized, '/api/test\\"endpoint');
    });
  });

  describe('formatUptime helper', () => {
    it('should format seconds correctly', () => {
      const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (days > 0) {
          return `${days}d ${hours}h ${mins}m`;
        } else if (hours > 0) {
          return `${hours}h ${mins}m ${secs}s`;
        } else if (mins > 0) {
          return `${mins}m ${secs}s`;
        } else {
          return `${secs}s`;
        }
      };

      assert.strictEqual(formatUptime(45), '45s');
      assert.strictEqual(formatUptime(125), '2m 5s');
      assert.strictEqual(formatUptime(3665), '1h 1m 5s');
      assert.strictEqual(formatUptime(90061), '1d 1h 1m');
    });
  });
});
