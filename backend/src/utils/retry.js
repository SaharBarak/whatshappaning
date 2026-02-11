/**
 * Retry helper with exponential backoff
 * Designed for rate-limited APIs (Gemini, Yahoo Finance, etc.)
 */

const logger = require('./logger');

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options
 * @param {number} options.maxRetries - Max retry attempts (default: 3)
 * @param {number} options.baseDelayMs - Initial delay in ms (default: 15000)
 * @param {number} options.maxDelayMs - Max delay in ms (default: 60000)
 * @param {string} options.label - Label for logging
 * @returns {Promise<*>} Result of fn
 */
async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 15000,
    maxDelayMs = 60000,
    label = 'operation',
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRateLimit = err.message && (
        err.message.includes('429') ||
        err.message.includes('Too Many Requests') ||
        err.message.includes('quota') ||
        err.message.includes('rate')
      );

      // If daily quota is exhausted (limit: 0), don't bother retrying
      const isQuotaExhausted = err.message && (
        err.message.includes('limit: 0') ||
        err.message.includes('FreeTier') ||
        err.message.includes('PerDayPerProject')
      );

      if (isQuotaExhausted) {
        logger.warn(`[${label}] Daily quota exhausted — skipping retries`);
        throw err;
      }

      if (attempt < maxRetries && isRateLimit) {
        // Parse retry delay from error if available
        const retryMatch = err.message.match(/retry in ([\d.]+)s/i);
        const suggestedDelay = retryMatch ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 2000 : null;
        const delay = Math.min(suggestedDelay || baseDelayMs * Math.pow(2, attempt), maxDelayMs);

        logger.info(`[${label}] Rate limited, retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, delay));
      } else if (attempt < maxRetries) {
        // Non-rate-limit error, shorter retry
        const delay = Math.min(baseDelayMs * Math.pow(1.5, attempt), maxDelayMs);
        logger.warn(`[${label}] Failed (attempt ${attempt + 1}/${maxRetries}): ${err.message}`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

module.exports = { withRetry };
