/**
 * Metrics Routes
 *
 * Exposes system performance metrics for monitoring.
 *
 * Endpoints:
 * - GET /metrics - Full system metrics
 * - GET /metrics/simple - Simplified metrics (for health dashboards)
 * - GET /metrics/prometheus - Prometheus format (for APM integration)
 */

const express = require('express');
const router = express.Router();
const { performanceMetrics } = require('../middleware/performance');

/**
 * GET /metrics
 * Returns full system performance metrics
 */
router.get('/', (req, res) => {
  const endpoints = performanceMetrics.getAllStats();
  const memUsage = process.memoryUsage();

  res.json({
    timestamp: new Date().toISOString(),
    status: 'ok',
    server: {
      uptime: formatUptime(process.uptime()),
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
});

/**
 * GET /metrics/simple
 * Returns simplified metrics for quick health checks
 */
router.get('/simple', (req, res) => {
  const endpoints = performanceMetrics.getAllStats();
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
    uptime: formatUptime(process.uptime()),
    memory: {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
    },
    totalRequests,
    slowestEndpoints: slowest,
  });
});

/**
 * GET /metrics/prometheus
 * Returns metrics in Prometheus format (for APM integration)
 */
router.get('/prometheus', (req, res) => {
  const endpoints = performanceMetrics.getAllStats();
  const memUsage = process.memoryUsage();

  let output = '';

  // Server uptime
  output += `# HELP server_uptime_seconds Server uptime in seconds\n`;
  output += `# TYPE server_uptime_seconds gauge\n`;
  output += `server_uptime_seconds ${Math.floor(process.uptime())}\n\n`;

  // Memory metrics
  output += `# HELP nodejs_heap_size_used_bytes Used heap size\n`;
  output += `# TYPE nodejs_heap_size_used_bytes gauge\n`;
  output += `nodejs_heap_size_used_bytes ${memUsage.heapUsed}\n\n`;

  output += `# HELP nodejs_heap_size_total_bytes Total heap size\n`;
  output += `# TYPE nodejs_heap_size_total_bytes gauge\n`;
  output += `nodejs_heap_size_total_bytes ${memUsage.heapTotal}\n\n`;

  output += `# HELP nodejs_rss_bytes Resident set size\n`;
  output += `# TYPE nodejs_rss_bytes gauge\n`;
  output += `nodejs_rss_bytes ${memUsage.rss}\n\n`;

  // Per-endpoint metrics
  output += `# HELP http_request_duration_ms Request duration in milliseconds\n`;
  output += `# TYPE http_request_duration_ms summary\n`;

  for (const [endpoint, data] of Object.entries(endpoints)) {
    if (data === null) continue;

    const sanitizedEndpoint = endpoint.replace(/"/g, '\\"');
    output += `http_request_duration_ms{endpoint="${sanitizedEndpoint}",quantile="0.5"} ${data.p50 || 0}\n`;
    output += `http_request_duration_ms{endpoint="${sanitizedEndpoint}",quantile="0.95"} ${data.p95 || 0}\n`;
    output += `http_request_duration_ms{endpoint="${sanitizedEndpoint}",quantile="0.99"} ${data.p99 || 0}\n`;
  }

  output += `\n# HELP http_requests_total Total HTTP requests per endpoint\n`;
  output += `# TYPE http_requests_total counter\n`;

  for (const [endpoint, data] of Object.entries(endpoints)) {
    if (data === null) continue;

    const sanitizedEndpoint = endpoint.replace(/"/g, '\\"');
    output += `http_requests_total{endpoint="${sanitizedEndpoint}"} ${data.count || 0}\n`;
  }

  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(output);
});

/**
 * Format uptime into human-readable string
 */
function formatUptime(seconds) {
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
}

module.exports = router;
