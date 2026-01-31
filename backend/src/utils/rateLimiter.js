/**
 * Rate Limiter - In-memory rate limiting middleware
 *
 * Limits requests per IP address within a time window.
 * Uses config settings for windowMs and max requests.
 */

const config = require('../config');

// Store request counts per IP
const requestCounts = new Map();

// Cleanup interval to remove old entries (run every minute)
const CLEANUP_INTERVAL = 60000;

/**
 * Clean up expired rate limit entries
 */
function cleanup() {
  const now = Date.now();
  for (const [key, value] of requestCounts) {
    if (now - value.startTime > config.rateLimit.windowMs) {
      requestCounts.delete(key);
    }
  }
}

// Start cleanup interval
const cleanupInterval = setInterval(cleanup, CLEANUP_INTERVAL);

// Don't prevent process from exiting
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Get client IP from request
 * Handles proxies via X-Forwarded-For header
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIp(req) {
  // Check for forwarded IP (behind proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Take the first IP in the chain (original client)
    return forwarded.split(',')[0].trim();
  }

  // Direct connection
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

/**
 * Rate limiting middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function rateLimiter(req, res, next) {
  const clientIp = getClientIp(req);
  const now = Date.now();

  // Get or create rate limit entry for this IP
  let entry = requestCounts.get(clientIp);

  if (!entry || now - entry.startTime > config.rateLimit.windowMs) {
    // New window, reset counter
    entry = {
      count: 1,
      startTime: now,
    };
    requestCounts.set(clientIp, entry);
  } else {
    // Same window, increment counter
    entry.count++;
  }

  // Calculate remaining requests and reset time
  const remaining = Math.max(0, config.rateLimit.max - entry.count);
  const resetTime = entry.startTime + config.rateLimit.windowMs;
  const resetSeconds = Math.ceil((resetTime - now) / 1000);

  // Set rate limit headers
  res.set('X-RateLimit-Limit', config.rateLimit.max);
  res.set('X-RateLimit-Remaining', remaining);
  res.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

  // Check if limit exceeded
  if (entry.count > config.rateLimit.max) {
    res.set('Retry-After', resetSeconds);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${resetSeconds} seconds.`,
      retryAfter: resetSeconds,
    });
  }

  next();
}

/**
 * Get current rate limit stats (for health checks)
 * @returns {Object} Rate limit statistics
 */
function getStats() {
  return {
    activeClients: requestCounts.size,
    windowMs: config.rateLimit.windowMs,
    maxRequests: config.rateLimit.max,
  };
}

/**
 * Reset rate limits (for testing)
 */
function reset() {
  requestCounts.clear();
}

module.exports = {
  rateLimiter,
  getStats,
  reset,
  getClientIp,
};
