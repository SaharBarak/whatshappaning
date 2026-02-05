/**
 * API Key Authentication Middleware
 *
 * Validates API keys and enforces tier-based rate limits.
 * Keys should be passed in the Authorization header:
 *   Authorization: Bearer wh_sk_xxxxx
 *
 * Or via X-API-Key header:
 *   X-API-Key: wh_sk_xxxxx
 */

const apiKeyService = require('../services/apiKeyService');

// Per-minute rate limits by tier (in-memory tracking)
const minuteRateLimits = new Map();
const MINUTE_WINDOW = 60000; // 1 minute in ms

// Tier limits (requests per minute)
const TIER_MINUTE_LIMITS = {
  free: 10,
  pro: 100,
  enterprise: -1, // unlimited
};

/**
 * Clean up expired rate limit entries
 */
function cleanupMinuteLimits() {
  const now = Date.now();
  for (const [key, value] of minuteRateLimits) {
    if (now - value.startTime > MINUTE_WINDOW) {
      minuteRateLimits.delete(key);
    }
  }
}

// Cleanup every minute
setInterval(cleanupMinuteLimits, MINUTE_WINDOW);

/**
 * Extract API key from request
 * @param {Object} req - Express request object
 * @returns {string|null} API key or null
 */
function extractApiKey(req) {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = req.headers['x-api-key'];
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check query parameter (less secure, but convenient for testing)
  if (req.query.api_key) {
    return req.query.api_key;
  }

  return null;
}

/**
 * Check per-minute rate limit
 * @param {string} keyId - API key ID
 * @param {string} tier - Key tier
 * @returns {Object} { allowed: boolean, remaining: number, resetIn: number }
 */
function checkMinuteRateLimit(keyId, tier) {
  const limit = TIER_MINUTE_LIMITS[tier] || 10;

  if (limit === -1) {
    return { allowed: true, remaining: -1, resetIn: 0 };
  }

  const now = Date.now();
  let entry = minuteRateLimits.get(keyId);

  if (!entry || now - entry.startTime > MINUTE_WINDOW) {
    entry = { count: 1, startTime: now };
    minuteRateLimits.set(keyId, entry);
    return { allowed: true, remaining: limit - 1, resetIn: 60 };
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  const resetIn = Math.ceil((entry.startTime + MINUTE_WINDOW - now) / 1000);

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining, resetIn };
}

/**
 * API Key authentication middleware
 * @param {Object} options - Middleware options
 * @param {boolean} [options.required=true] - Whether API key is required
 * @returns {Function} Express middleware
 */
function apiKeyAuth(options = {}) {
  const { required = true } = options;

  return async (req, res, next) => {
    const apiKey = extractApiKey(req);

    if (!apiKey) {
      if (required) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'API key required. Include in Authorization header (Bearer wh_sk_xxx) or X-API-Key header.',
        });
      }
      // Not required, proceed without key
      req.apiKey = null;
      return next();
    }

    try {
      // Validate the key
      const keyInfo = await apiKeyService.validateKey(apiKey);

      if (!keyInfo) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or revoked API key.',
        });
      }

      // Check daily limit
      const dailyExceeded = await apiKeyService.isLimitExceeded(keyInfo.key_id, keyInfo.daily_limit);
      if (dailyExceeded) {
        return res.status(429).json({
          error: 'Daily Limit Exceeded',
          message: `You have exceeded your daily limit of ${keyInfo.daily_limit} requests. Resets at midnight UTC.`,
          tier: keyInfo.tier,
          limit: keyInfo.daily_limit,
        });
      }

      // Check per-minute rate limit
      const minuteLimit = checkMinuteRateLimit(keyInfo.key_id, keyInfo.tier);
      if (!minuteLimit.allowed) {
        res.set('Retry-After', minuteLimit.resetIn);
        return res.status(429).json({
          error: 'Rate Limit Exceeded',
          message: `Too many requests. Try again in ${minuteLimit.resetIn} seconds.`,
          retryAfter: minuteLimit.resetIn,
        });
      }

      // Set rate limit headers
      const tierLimits = TIER_MINUTE_LIMITS[keyInfo.tier] || 10;
      res.set('X-RateLimit-Limit', tierLimits === -1 ? 'unlimited' : tierLimits);
      res.set('X-RateLimit-Remaining', minuteLimit.remaining === -1 ? 'unlimited' : minuteLimit.remaining);
      res.set('X-RateLimit-Reset', Math.ceil((Date.now() + minuteLimit.resetIn * 1000) / 1000));

      // Record usage
      const endpoint = req.baseUrl + req.path;
      await apiKeyService.recordUsage(keyInfo.key_id, endpoint);

      // Attach key info to request
      req.apiKey = keyInfo;

      next();
    } catch (error) {
      console.error('API key auth error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to validate API key.',
      });
    }
  };
}

/**
 * Optional API key middleware - validates if provided, continues if not
 */
const optionalApiKeyAuth = apiKeyAuth({ required: false });

/**
 * Required API key middleware
 */
const requireApiKeyAuth = apiKeyAuth({ required: true });

module.exports = {
  apiKeyAuth,
  optionalApiKeyAuth,
  requireApiKeyAuth,
  extractApiKey,
};
