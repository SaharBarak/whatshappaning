/**
 * In-memory TTL cache module
 *
 * Simple cache with configurable TTL (time-to-live) for each entry.
 * Used to reduce database queries and API calls.
 */

const config = require('../config');

// Cache storage
const cache = new Map();

// Cache entry structure: { value, expiresAt }

/**
 * Set a value in the cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time-to-live in milliseconds (default from config)
 */
function set(key, value, ttl = config.cache.defaultTtl) {
  const expiresAt = Date.now() + ttl;
  cache.set(key, { value, expiresAt });
}

/**
 * Get a value from the cache
 * @param {string} key - Cache key
 * @returns {*} Cached value or undefined if expired/not found
 */
function get(key) {
  const entry = cache.get(key);

  if (!entry) {
    return undefined;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }

  return entry.value;
}

/**
 * Delete a value from the cache
 * @param {string} key - Cache key
 * @returns {boolean} True if deleted, false if not found
 */
function del(key) {
  return cache.delete(key);
}

/**
 * Check if a key exists and is not expired
 * @param {string} key - Cache key
 * @returns {boolean} True if exists and valid
 */
function has(key) {
  const value = get(key);
  return value !== undefined;
}

/**
 * Clear all cache entries
 */
function clear() {
  cache.clear();
}

/**
 * Get the time until a key expires
 * @param {string} key - Cache key
 * @returns {number|null} Milliseconds until expiry or null if not found
 */
function ttl(key) {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  const remaining = entry.expiresAt - Date.now();
  return remaining > 0 ? remaining : null;
}

/**
 * Clean up expired entries
 * Called periodically to prevent memory leaks
 */
function cleanup() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) {
      cache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`Cache cleanup: removed ${cleaned} expired entries`);
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
function stats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  for (const entry of cache.values()) {
    if (now > entry.expiresAt) {
      expired++;
    } else {
      active++;
    }
  }

  return {
    total: cache.size,
    active,
    expired,
  };
}

/**
 * Get or set a value with a factory function
 * @param {string} key - Cache key
 * @param {Function} factory - Async function to create value if not cached
 * @param {number} ttl - Time-to-live in milliseconds
 * @returns {Promise<*>} Cached or newly created value
 */
async function getOrSet(key, factory, ttl = config.cache.defaultTtl) {
  const cached = get(key);

  if (cached !== undefined) {
    return cached;
  }

  const value = await factory();
  set(key, value, ttl);
  return value;
}

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

module.exports = {
  set,
  get,
  del,
  has,
  clear,
  ttl,
  cleanup,
  stats,
  getOrSet,
};
