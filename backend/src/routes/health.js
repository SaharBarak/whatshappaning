/**
 * Health Check Routes
 *
 * Endpoints:
 * - GET /health - Basic health check
 * - GET /health/detailed - Detailed health with module status
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const cache = require('../utils/cache');

/**
 * GET /health
 * Basic health check - returns 200 if server is running
 */
router.get('/', async (req, res) => {
  const dbConnected = await db.testConnection();

  const status = dbConnected ? 'healthy' : 'degraded';
  const httpStatus = dbConnected ? 200 : 503;

  res.status(httpStatus).json({
    status,
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
  });
});

/**
 * GET /health/detailed
 * Detailed health check with module status
 */
router.get('/detailed', async (req, res) => {
  try {
    // Check database
    const dbConnected = await db.testConnection();

    // Get recent module status
    const moduleStatus = await db.getRecentSystemStatus(1);

    // Group by module, take latest status
    const moduleHealth = {};
    for (const status of moduleStatus) {
      if (!moduleHealth[status.module]) {
        moduleHealth[status.module] = {
          status: status.status,
          lastCheck: status.checked_at,
          responseTime: status.response_time_ms,
          error: status.error_message,
        };
      }
    }

    // Get cache stats
    const cacheStats = cache.stats();

    // Calculate uptime
    const uptime = process.uptime();
    const uptimeFormatted = formatUptime(uptime);

    // Determine overall status
    const errorCount = Object.values(moduleHealth).filter(m => m.status === 'error').length;
    const overallStatus = !dbConnected ? 'critical'
      : errorCount > 3 ? 'degraded'
      : errorCount > 0 ? 'warning'
      : 'healthy';

    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: uptimeFormatted,
      uptimeSeconds: Math.floor(uptime),
      database: {
        connected: dbConnected,
      },
      cache: cacheStats,
      modules: moduleHealth,
      summary: {
        totalModules: Object.keys(moduleHealth).length,
        healthy: Object.values(moduleHealth).filter(m => m.status === 'success').length,
        errors: errorCount,
      },
    });
  } catch (err) {
    console.error('Error in /health/detailed:', err);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: err.message,
    });
  }
});

/**
 * Format uptime in human-readable format
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime
 */
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

module.exports = router;
