/**
 * Performance Middleware
 *
 * Provides response time logging, compression, and cache headers
 * for optimal API performance and monitoring.
 */

const zlib = require('zlib');
const crypto = require('crypto');

/**
 * Response time logging middleware
 * Logs request duration and adds X-Response-Time header
 */
function responseTime(req, res, next) {
  const start = process.hrtime.bigint();

  // Add timing header on response finish
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    // Log slow requests (>500ms)
    if (durationMs > 500) {
      console.warn(`[SLOW] ${req.method} ${req.path} took ${durationMs.toFixed(2)}ms`);
    }

    // Always log in development, or for API routes
    if (process.env.NODE_ENV === 'development' || req.path.startsWith('/api')) {
      console.log(`[PERF] ${req.method} ${req.path} ${res.statusCode} ${durationMs.toFixed(2)}ms`);
    }
  });

  // Set response time header
  const originalSend = res.send;
  res.send = function(body) {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    res.set('X-Response-Time', `${durationMs.toFixed(2)}ms`);
    return originalSend.call(this, body);
  };

  next();
}

/**
 * Compression middleware
 * Applies gzip compression to responses larger than threshold
 */
function compression(options = {}) {
  const threshold = options.threshold || 1024; // 1KB default
  const gzipLevel = options.level || 6; // Default gzip compression level

  return function(req, res, next) {
    const acceptEncoding = req.headers['accept-encoding'] || '';

    // Determine best encoding: prefer brotli > gzip
    let encoding = null;
    if (acceptEncoding.includes('br')) {
      encoding = 'br';
    } else if (acceptEncoding.includes('gzip')) {
      encoding = 'gzip';
    }

    // Skip if client doesn't accept any compression
    if (!encoding) {
      return next();
    }

    // Store original methods
    const originalWrite = res.write;
    const originalEnd = res.end;
    let chunks = [];

    // Override write
    res.write = function(chunk, enc) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, enc));
      }
      return true;
    };

    // Override end
    res.end = function(chunk, enc) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, enc));
      }

      const body = Buffer.concat(chunks);

      // Only compress if above threshold and not already compressed
      if (body.length > threshold &&
          !res.getHeader('Content-Encoding') &&
          shouldCompress(res)) {

        const compressCb = (err, compressed) => {
          if (err) {
            // Fall back to uncompressed
            originalEnd.call(res, body);
            return;
          }

          res.setHeader('Content-Encoding', encoding);
          res.setHeader('Content-Length', compressed.length);
          res.setHeader('Vary', 'Accept-Encoding');
          originalEnd.call(res, compressed);
        };

        if (encoding === 'br') {
          zlib.brotliCompress(body, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 4 // Fast brotli for dynamic content
            }
          }, compressCb);
        } else {
          zlib.gzip(body, { level: gzipLevel }, compressCb);
        }
      } else {
        originalEnd.call(res, body);
      }
    };

    next();
  };
}

/**
 * Check if response should be compressed based on content type
 */
function shouldCompress(res) {
  const contentType = res.getHeader('Content-Type') || '';
  const compressibleTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'image/svg+xml'
  ];

  return compressibleTypes.some(type => contentType.includes(type));
}

/**
 * Cache headers middleware for static assets and API responses
 * Adds Cache-Control headers and ETag support for conditional requests.
 */
function cacheHeaders(options = {}) {
  const {
    staticMaxAge = 86400,      // 1 day for static assets
    apiMaxAge = 300,           // 5 minutes for API responses
    staleWhileRevalidate = 60  // 1 minute stale-while-revalidate
  } = options;

  return function(req, res, next) {
    // Skip for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Static assets (CSS, JS, images)
    if (isStaticAsset(req.path)) {
      res.set({
        'Cache-Control': `public, max-age=${staticMaxAge}, immutable`,
        'Vary': 'Accept-Encoding'
      });
    }
    // API routes
    else if (req.path.startsWith('/api')) {
      // Different cache times based on endpoint
      let maxAge = apiMaxAge;

      if (req.path.includes('/current')) {
        maxAge = 60; // 1 minute for current data
      } else if (req.path.includes('/predictions')) {
        maxAge = 900; // 15 minutes for predictions
      } else if (req.path.includes('/correlations')) {
        maxAge = 3600; // 1 hour for correlations
      } else if (req.path.includes('/history') || req.path.includes('/historical')) {
        maxAge = 1800; // 30 minutes for historical data
      } else if (req.path.includes('/patterns')) {
        maxAge = 600; // 10 minutes for patterns
      }

      res.set({
        'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
        'Vary': 'Accept-Encoding'
      });
    }
    // Health endpoints - no cache
    else if (req.path.startsWith('/health')) {
      res.set({
        'Cache-Control': 'no-store'
      });
    }

    // Add ETag support for JSON responses
    const originalJson = res.json;
    res.json = function(body) {
      if (req.method === 'GET' && body) {
        const content = JSON.stringify(body);
        const etag = `"${crypto.createHash('md5').update(content).digest('hex').slice(0, 16)}"`;
        res.set('ETag', etag);

        // Check If-None-Match for conditional request
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch === etag) {
          return res.status(304).end();
        }
      }
      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Check if path is a static asset
 */
function isStaticAsset(path) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ico'];
  return staticExtensions.some(ext => path.endsWith(ext));
}

/**
 * Performance metrics collection
 * Tracks p50, p95, p99 latencies for monitoring
 */
class PerformanceMetrics {
  constructor() {
    this.metrics = new Map();
    this.maxSamples = 1000;
  }

  record(endpoint, durationMs) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }

    const samples = this.metrics.get(endpoint);
    samples.push(durationMs);

    // Keep only recent samples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  getStats(endpoint) {
    const samples = this.metrics.get(endpoint);
    if (!samples || samples.length === 0) {
      return null;
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      count: len,
      min: sorted[0],
      max: sorted[len - 1],
      avg: samples.reduce((a, b) => a + b, 0) / len,
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)]
    };
  }

  getAllStats() {
    const stats = {};
    for (const [endpoint, _] of this.metrics) {
      stats[endpoint] = this.getStats(endpoint);
    }
    return stats;
  }

  reset() {
    this.metrics.clear();
  }
}

// Singleton instance for metrics collection
const performanceMetrics = new PerformanceMetrics();

/**
 * Metrics collection middleware
 * Works with responseTime to collect performance data
 */
function metricsCollector(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    // Normalize endpoint (remove IDs, query params)
    const endpoint = normalizeEndpoint(req.path);
    performanceMetrics.record(endpoint, durationMs);
  });

  next();
}

/**
 * Normalize endpoint for metric grouping
 * e.g., /api/history/moon -> /api/history/:module
 */
function normalizeEndpoint(path) {
  return path
    .replace(/\/api\/history\/[^/]+/, '/api/history/:module')
    .replace(/\/api\/predictions\/[^/]+/, '/api/predictions/:outcome')
    .replace(/\?.*$/, ''); // Remove query params
}

module.exports = {
  responseTime,
  compression,
  cacheHeaders,
  metricsCollector,
  performanceMetrics,
  PerformanceMetrics
};
