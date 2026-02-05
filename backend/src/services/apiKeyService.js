/**
 * API Key Service
 *
 * Handles API key generation, validation, and management.
 */

const crypto = require('crypto');
const db = require('../db');

/**
 * Generate a new API key
 * Format: wh_sk_<32 random hex chars>
 * @returns {{ keyId: string, secretKey: string }} The key ID and secret key
 */
function generateApiKey() {
  const randomBytes = crypto.randomBytes(16);
  const keyId = `wh_pk_${crypto.randomBytes(8).toString('hex')}`;
  const secretKey = `wh_sk_${randomBytes.toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(secretKey).digest('hex');

  return { keyId, secretKey, keyHash };
}

/**
 * Hash an API key for storage/comparison
 * @param {string} secretKey - The secret key to hash
 * @returns {string} SHA-256 hash of the key
 */
function hashKey(secretKey) {
  return crypto.createHash('sha256').update(secretKey).digest('hex');
}

/**
 * Create a new API key
 * @param {Object} params - Key parameters
 * @param {string} params.name - Key name/description
 * @param {string} [params.tier='free'] - Tier level
 * @param {string} [params.ownerEmail] - Owner email
 * @returns {Promise<Object>} Created key info (includes secret key - only shown once!)
 */
async function createKey({ name, tier = 'free', ownerEmail = null }) {
  const { keyId, secretKey, keyHash } = generateApiKey();

  // Get daily limit based on tier
  const tierLimits = {
    free: 100,
    pro: 10000,
    enterprise: -1, // unlimited
  };
  const dailyLimit = tierLimits[tier] || 100;

  const query = `
    INSERT INTO api_keys (key_id, key_hash, name, tier, owner_email, daily_limit)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, key_id, name, tier, daily_limit, created_at
  `;

  const result = await db.query(query, [keyId, keyHash, name, tier, ownerEmail, dailyLimit]);
  const key = result.rows[0];

  return {
    ...key,
    secretKey, // Only returned on creation - store it safely!
  };
}

/**
 * Validate an API key and return key info if valid
 * @param {string} secretKey - The secret key to validate
 * @returns {Promise<Object|null>} Key info if valid, null otherwise
 */
async function validateKey(secretKey) {
  if (!secretKey || !secretKey.startsWith('wh_sk_')) {
    return null;
  }

  const keyHash = hashKey(secretKey);

  const query = `
    SELECT id, key_id, name, tier, daily_limit, is_active, last_used_at
    FROM api_keys
    WHERE key_hash = $1 AND is_active = TRUE AND revoked_at IS NULL
  `;

  const result = await db.query(query, [keyHash]);

  if (result.rows.length === 0) {
    return null;
  }

  // Update last_used_at
  await db.query(
    'UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = $1',
    [keyHash]
  );

  return result.rows[0];
}

/**
 * Get API key by key_id (public identifier)
 * @param {string} keyId - The public key ID
 * @returns {Promise<Object|null>} Key info if found
 */
async function getKeyById(keyId) {
  const query = `
    SELECT id, key_id, name, tier, daily_limit, is_active, created_at, last_used_at, revoked_at
    FROM api_keys
    WHERE key_id = $1
  `;

  const result = await db.query(query, [keyId]);
  return result.rows[0] || null;
}

/**
 * List all API keys (for admin)
 * @param {Object} [options] - Query options
 * @param {boolean} [options.activeOnly=true] - Only return active keys
 * @param {string} [options.tier] - Filter by tier
 * @param {number} [options.limit=50] - Max results
 * @returns {Promise<Object[]>} List of keys
 */
async function listKeys({ activeOnly = true, tier = null, limit = 50 } = {}) {
  let query = `
    SELECT id, key_id, name, tier, daily_limit, is_active, created_at, last_used_at
    FROM api_keys
    WHERE 1=1
  `;
  const params = [];

  if (activeOnly) {
    query += ' AND is_active = TRUE AND revoked_at IS NULL';
  }

  if (tier) {
    params.push(tier);
    query += ` AND tier = $${params.length}`;
  }

  params.push(limit);
  query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * Revoke an API key
 * @param {string} keyId - The public key ID to revoke
 * @returns {Promise<boolean>} True if revoked
 */
async function revokeKey(keyId) {
  const query = `
    UPDATE api_keys
    SET is_active = FALSE, revoked_at = NOW()
    WHERE key_id = $1 AND revoked_at IS NULL
    RETURNING id
  `;

  const result = await db.query(query, [keyId]);
  return result.rows.length > 0;
}

/**
 * Update API key tier
 * @param {string} keyId - The public key ID
 * @param {string} tier - New tier level
 * @returns {Promise<Object|null>} Updated key info
 */
async function updateKeyTier(keyId, tier) {
  const tierLimits = {
    free: 100,
    pro: 10000,
    enterprise: -1,
  };
  const dailyLimit = tierLimits[tier] || 100;

  const query = `
    UPDATE api_keys
    SET tier = $2, daily_limit = $3
    WHERE key_id = $1 AND revoked_at IS NULL
    RETURNING id, key_id, name, tier, daily_limit, is_active
  `;

  const result = await db.query(query, [keyId, tier, dailyLimit]);
  return result.rows[0] || null;
}

/**
 * Record API usage
 * @param {string} keyId - The public key ID
 * @param {string} endpoint - The endpoint accessed
 * @returns {Promise<void>}
 */
async function recordUsage(keyId, endpoint) {
  // Upsert daily usage
  const upsertQuery = `
    INSERT INTO api_usage (key_id, date, request_count, endpoints_used, last_request_at)
    VALUES ($1, CURRENT_DATE, 1, $2, NOW())
    ON CONFLICT (key_id, date) DO UPDATE SET
      request_count = api_usage.request_count + 1,
      endpoints_used = jsonb_set(
        COALESCE(api_usage.endpoints_used, '{}'),
        ARRAY[$3],
        (COALESCE((api_usage.endpoints_used->>$3)::int, 0) + 1)::text::jsonb
      ),
      last_request_at = NOW()
  `;

  const endpointsJson = JSON.stringify({ [endpoint]: 1 });
  await db.query(upsertQuery, [keyId, endpointsJson, endpoint]);
}

/**
 * Get usage stats for a key
 * @param {string} keyId - The public key ID
 * @param {number} [days=30] - Days of history to include
 * @returns {Promise<Object>} Usage statistics
 */
async function getUsageStats(keyId, days = 30) {
  // Get key info
  const key = await getKeyById(keyId);
  if (!key) {
    return null;
  }

  // Get today's usage
  const todayQuery = `
    SELECT request_count, endpoints_used
    FROM api_usage
    WHERE key_id = $1 AND date = CURRENT_DATE
  `;
  const todayResult = await db.query(todayQuery, [keyId]);
  const todayUsage = todayResult.rows[0] || { request_count: 0, endpoints_used: {} };

  // Get historical usage
  const historyQuery = `
    SELECT date, request_count
    FROM api_usage
    WHERE key_id = $1 AND date >= CURRENT_DATE - $2::int
    ORDER BY date DESC
  `;
  const historyResult = await db.query(historyQuery, [keyId, days]);

  // Calculate totals
  const totalRequests = historyResult.rows.reduce((sum, row) => sum + row.request_count, 0);

  return {
    keyId: key.key_id,
    name: key.name,
    tier: key.tier,
    dailyLimit: key.daily_limit,
    today: {
      used: todayUsage.request_count,
      remaining: key.daily_limit === -1 ? 'unlimited' : Math.max(0, key.daily_limit - todayUsage.request_count),
      endpoints: todayUsage.endpoints_used,
    },
    history: historyResult.rows,
    totalRequests,
    period: `${days} days`,
  };
}

/**
 * Check if key has exceeded daily limit
 * @param {string} keyId - The public key ID
 * @param {number} dailyLimit - The daily limit (-1 for unlimited)
 * @returns {Promise<boolean>} True if limit exceeded
 */
async function isLimitExceeded(keyId, dailyLimit) {
  if (dailyLimit === -1) {
    return false; // Unlimited
  }

  const query = `
    SELECT request_count
    FROM api_usage
    WHERE key_id = $1 AND date = CURRENT_DATE
  `;

  const result = await db.query(query, [keyId]);
  const count = result.rows[0]?.request_count || 0;

  return count >= dailyLimit;
}

module.exports = {
  createKey,
  validateKey,
  getKeyById,
  listKeys,
  revokeKey,
  updateKeyTier,
  recordUsage,
  getUsageStats,
  isLimitExceeded,
  hashKey,
};
