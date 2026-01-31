/**
 * Simple logging utility with log levels based on NODE_ENV
 *
 * In production: Only logs warnings and errors
 * In development: Logs all messages including debug and info
 */

const config = require('../config');

const isProduction = config.nodeEnv === 'production';

/**
 * Log debug messages (development only)
 * @param {...any} args - Arguments to log
 */
function debug(...args) {
  if (!isProduction) {
    console.log('[DEBUG]', ...args);
  }
}

/**
 * Log info messages (development only)
 * @param {...any} args - Arguments to log
 */
function info(...args) {
  if (!isProduction) {
    console.log('[INFO]', ...args);
  }
}

/**
 * Log warning messages (always)
 * @param {...any} args - Arguments to log
 */
function warn(...args) {
  console.warn('[WARN]', ...args);
}

/**
 * Log error messages (always)
 * @param {...any} args - Arguments to log
 */
function error(...args) {
  console.error('[ERROR]', ...args);
}

module.exports = {
  debug,
  info,
  warn,
  error,
};
