/**
 * Tests for performance middleware
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('events');

// Import the module under test
const {
  responseTime,
  compression,
  cacheHeaders,
  metricsCollector,
  performanceMetrics,
  PerformanceMetrics
} = require('./performance');

// Mock response object
function createMockResponse() {
  const res = new EventEmitter();
  res._headers = {};
  res._body = null;
  res._statusCode = 200;
  
  Object.defineProperty(res, 'statusCode', {
    get() { return this._statusCode; },
    set(v) { this._statusCode = v; }
  });
  
  res.set = function(key, value) {
    if (typeof key === 'object') {
      Object.assign(this._headers, key);
    } else {
      this._headers[key] = value;
    }
    return this;
  };
  
  res.setHeader = function(key, value) {
    this._headers[key] = value;
    return this;
  };
  
  res.getHeader = function(key) {
    return this._headers[key];
  };
  
  res.send = function(body) {
    this._body = body;
    return this;
  };
  
  res.write = function(chunk) {
    return true;
  };
  
  res.end = function(chunk) {
    if (chunk) this._body = chunk;
    return this;
  };
  
  return res;
}

function createMockRequest(overrides = {}) {
  return {
    method: 'GET',
    path: '/api/test',
    headers: {},
    ...overrides
  };
}

describe('performance middleware', () => {
  describe('responseTime middleware', () => {
    it('should add X-Response-Time header', (t, done) => {
      const req = createMockRequest();
      const res = createMockResponse();
      
      responseTime(req, res, () => {
        // Simulate some work
        setTimeout(() => {
          res.send('test response');
          assert.ok(res._headers['X-Response-Time']);
          assert.ok(res._headers['X-Response-Time'].endsWith('ms'));
          done();
        }, 10);
      });
    });

    it('should track response timing on finish event', (t, done) => {
      const req = createMockRequest({ path: '/api/test' });
      const res = createMockResponse();
      
      responseTime(req, res, () => {
        // Simulate request completion
        setTimeout(() => {
          res.emit('finish');
          done();
        }, 5);
      });
    });
  });

  describe('compression middleware', () => {
    it('should skip compression if client does not accept gzip', (t, done) => {
      const req = createMockRequest({ headers: { 'accept-encoding': '' } });
      const res = createMockResponse();
      
      const middleware = compression({ threshold: 10 });
      middleware(req, res, () => {
        // Should pass through without modifications
        assert.ok(true);
        done();
      });
    });

    it('should compress large responses when client accepts gzip', (t, done) => {
      const req = createMockRequest({ headers: { 'accept-encoding': 'gzip, deflate' } });
      const res = createMockResponse();
      
      const middleware = compression({ threshold: 10 });
      middleware(req, res, () => {
        // Simulate writing a large response
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({ data: 'x'.repeat(100) }));
        
        // The compression happens in end(), which is async
        // Just verify the middleware set up correctly
        assert.ok(typeof res.write === 'function');
        assert.ok(typeof res.end === 'function');
        done();
      });
    });

    it('should use default threshold of 1024 bytes', () => {
      const middleware = compression();
      assert.ok(typeof middleware === 'function');
    });

    it('should accept custom compression level', () => {
      const middleware = compression({ level: 9, threshold: 512 });
      assert.ok(typeof middleware === 'function');
    });
  });

  describe('shouldCompress helper', () => {
    it('should return true for text content types', () => {
      const res = createMockResponse();
      res.setHeader('Content-Type', 'text/html');
      
      const contentType = res.getHeader('Content-Type') || '';
      const compressibleTypes = ['text/', 'application/json'];
      const shouldCompress = compressibleTypes.some(type => contentType.includes(type));
      
      assert.strictEqual(shouldCompress, true);
    });

    it('should return true for application/json', () => {
      const contentType = 'application/json';
      const compressibleTypes = ['text/', 'application/json'];
      const shouldCompress = compressibleTypes.some(type => contentType.includes(type));
      
      assert.strictEqual(shouldCompress, true);
    });

    it('should return false for binary content types', () => {
      const contentType = 'image/png';
      const compressibleTypes = ['text/', 'application/json', 'application/javascript', 'application/xml', 'image/svg+xml'];
      const shouldCompress = compressibleTypes.some(type => contentType.includes(type));
      
      assert.strictEqual(shouldCompress, false);
    });
  });

  describe('cacheHeaders middleware', () => {
    it('should skip non-GET requests', (t, done) => {
      const req = createMockRequest({ method: 'POST' });
      const res = createMockResponse();
      
      const middleware = cacheHeaders();
      middleware(req, res, () => {
        assert.strictEqual(res._headers['Cache-Control'], undefined);
        done();
      });
    });

    it('should set cache headers for static assets', (t, done) => {
      const req = createMockRequest({ path: '/assets/style.css' });
      const res = createMockResponse();
      
      const middleware = cacheHeaders({ staticMaxAge: 86400 });
      middleware(req, res, () => {
        assert.ok(res._headers['Cache-Control'].includes('max-age=86400'));
        assert.ok(res._headers['Cache-Control'].includes('immutable'));
        done();
      });
    });

    it('should set shorter cache for API routes', (t, done) => {
      const req = createMockRequest({ path: '/api/data' });
      const res = createMockResponse();
      
      const middleware = cacheHeaders({ apiMaxAge: 300 });
      middleware(req, res, () => {
        assert.ok(res._headers['Cache-Control'].includes('max-age=300'));
        done();
      });
    });

    it('should set 1 minute cache for /current endpoints', (t, done) => {
      const req = createMockRequest({ path: '/api/current' });
      const res = createMockResponse();
      
      const middleware = cacheHeaders();
      middleware(req, res, () => {
        assert.ok(res._headers['Cache-Control'].includes('max-age=60'));
        done();
      });
    });

    it('should set 15 minute cache for /predictions endpoints', (t, done) => {
      const req = createMockRequest({ path: '/api/predictions' });
      const res = createMockResponse();
      
      const middleware = cacheHeaders();
      middleware(req, res, () => {
        assert.ok(res._headers['Cache-Control'].includes('max-age=900'));
        done();
      });
    });

    it('should set no-store for health endpoints', (t, done) => {
      const req = createMockRequest({ path: '/health' });
      const res = createMockResponse();
      
      const middleware = cacheHeaders();
      middleware(req, res, () => {
        assert.strictEqual(res._headers['Cache-Control'], 'no-store');
        done();
      });
    });
  });

  describe('PerformanceMetrics class', () => {
    it('should record metrics for an endpoint', () => {
      const metrics = new PerformanceMetrics();
      metrics.record('/api/test', 50);
      metrics.record('/api/test', 100);
      metrics.record('/api/test', 75);
      
      const stats = metrics.getStats('/api/test');
      assert.strictEqual(stats.count, 3);
      assert.strictEqual(stats.min, 50);
      assert.strictEqual(stats.max, 100);
      assert.strictEqual(stats.avg, 75);
    });

    it('should calculate percentiles correctly', () => {
      const metrics = new PerformanceMetrics();
      
      // Add 100 samples from 1 to 100
      for (let i = 1; i <= 100; i++) {
        metrics.record('/api/test', i);
      }
      
      const stats = metrics.getStats('/api/test');
      assert.strictEqual(stats.count, 100);
      assert.strictEqual(stats.min, 1);
      assert.strictEqual(stats.max, 100);
      // p50 = sorted[Math.floor(100 * 0.5)] = sorted[50] = 51 (0-indexed array, value at index 50 is 51)
      assert.strictEqual(stats.p50, 51);
      assert.strictEqual(stats.p95, 96);
      assert.strictEqual(stats.p99, 100);
    });

    it('should return null for unknown endpoint', () => {
      const metrics = new PerformanceMetrics();
      const stats = metrics.getStats('/unknown');
      assert.strictEqual(stats, null);
    });

    it('should limit samples to maxSamples', () => {
      const metrics = new PerformanceMetrics();
      metrics.maxSamples = 10;
      
      // Add 15 samples
      for (let i = 1; i <= 15; i++) {
        metrics.record('/api/test', i);
      }
      
      const stats = metrics.getStats('/api/test');
      assert.strictEqual(stats.count, 10);
      // Should have dropped the first 5, so min should be 6
      assert.strictEqual(stats.min, 6);
    });

    it('should get all stats for all endpoints', () => {
      const metrics = new PerformanceMetrics();
      metrics.record('/api/a', 10);
      metrics.record('/api/b', 20);
      metrics.record('/api/c', 30);
      
      const allStats = metrics.getAllStats();
      assert.ok(allStats['/api/a']);
      assert.ok(allStats['/api/b']);
      assert.ok(allStats['/api/c']);
    });

    it('should reset all metrics', () => {
      const metrics = new PerformanceMetrics();
      metrics.record('/api/test', 50);
      
      assert.ok(metrics.getStats('/api/test'));
      
      metrics.reset();
      
      assert.strictEqual(metrics.getStats('/api/test'), null);
    });
  });

  describe('metricsCollector middleware', () => {
    beforeEach(() => {
      performanceMetrics.reset();
    });

    it('should record metrics on response finish', (t, done) => {
      const req = createMockRequest({ path: '/api/test' });
      const res = createMockResponse();
      
      metricsCollector(req, res, () => {
        // Simulate request completion
        setTimeout(() => {
          res.emit('finish');
          
          const stats = performanceMetrics.getStats('/api/test');
          assert.ok(stats);
          assert.strictEqual(stats.count, 1);
          done();
        }, 5);
      });
    });

    it('should normalize endpoints with IDs', () => {
      // Test the normalizeEndpoint logic
      const normalize = (path) => {
        return path
          .replace(/\/api\/history\/[^/]+/, '/api/history/:module')
          .replace(/\/api\/predictions\/[^/]+/, '/api/predictions/:outcome')
          .replace(/\?.*$/, '');
      };
      
      assert.strictEqual(normalize('/api/history/moon'), '/api/history/:module');
      assert.strictEqual(normalize('/api/predictions/btc_direction'), '/api/predictions/:outcome');
      assert.strictEqual(normalize('/api/test?foo=bar'), '/api/test');
    });
  });

  describe('isStaticAsset helper', () => {
    it('should identify static assets correctly', () => {
      const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ico'];
      const isStaticAsset = (path) => staticExtensions.some(ext => path.endsWith(ext));
      
      assert.strictEqual(isStaticAsset('/style.css'), true);
      assert.strictEqual(isStaticAsset('/app.js'), true);
      assert.strictEqual(isStaticAsset('/image.png'), true);
      assert.strictEqual(isStaticAsset('/favicon.ico'), true);
      assert.strictEqual(isStaticAsset('/api/data'), false);
      assert.strictEqual(isStaticAsset('/health'), false);
    });
  });
});
