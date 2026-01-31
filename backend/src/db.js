/**
 * Database module - PostgreSQL connection pool and query helpers
 *
 * Provides:
 * - Connection pool management
 * - Snapshot save/retrieve for modules
 * - Daily data management
 * - System status logging
 */

const { Pool } = require('pg');
const config = require('./config');

// Create connection pool
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

/**
 * Execute a query with parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development' && duration > 100) {
      console.log('Slow query:', { text: text.substring(0, 100), duration, rows: result.rowCount });
    }
    return result;
  } catch (err) {
    console.error('Database query error:', { text: text.substring(0, 100), error: err.message });
    throw err;
  }
}

/**
 * Save a module snapshot to the database
 * @param {string} module - Module name
 * @param {Object} data - Module data
 * @returns {Promise<Object>} Inserted row
 */
async function saveSnapshot(module, data) {
  const result = await query(
    'INSERT INTO snapshots (module, data) VALUES ($1, $2) RETURNING id, collected_at',
    [module, JSON.stringify(data)]
  );
  return result.rows[0];
}

/**
 * Get the latest snapshot for a module
 * @param {string} module - Module name
 * @returns {Promise<Object|null>} Latest snapshot or null
 */
async function getLatestSnapshot(module) {
  const result = await query(
    `SELECT data, collected_at
     FROM snapshots
     WHERE module = $1
     ORDER BY collected_at DESC
     LIMIT 1`,
    [module]
  );
  return result.rows[0] || null;
}

/**
 * Get module history for a date range
 * @param {string} module - Module name
 * @param {number} days - Number of days of history
 * @returns {Promise<Array>} Array of snapshots
 */
async function getModuleHistory(module, days = 7) {
  const result = await query(
    `SELECT data, collected_at
     FROM snapshots
     WHERE module = $1
       AND collected_at > NOW() - INTERVAL '${days} days'
     ORDER BY collected_at ASC`,
    [module]
  );
  return result.rows;
}

/**
 * Save or update daily data
 * @param {Date} date - The date
 * @param {Object} data - Data object with tzolkin, dreamspell, etc.
 * @returns {Promise<Object>} Upserted row
 */
async function saveDailyData(date, data) {
  const dateStr = date.toISOString().split('T')[0];
  const result = await query(
    `INSERT INTO daily_data (date, tzolkin, dreamspell, gematria, tarot, numerology, iching, parasha)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (date) DO UPDATE SET
       tzolkin = EXCLUDED.tzolkin,
       dreamspell = EXCLUDED.dreamspell,
       gematria = EXCLUDED.gematria,
       tarot = EXCLUDED.tarot,
       numerology = EXCLUDED.numerology,
       iching = EXCLUDED.iching,
       parasha = EXCLUDED.parasha,
       created_at = NOW()
     RETURNING *`,
    [
      dateStr,
      JSON.stringify(data.tzolkin || {}),
      JSON.stringify(data.dreamspell || {}),
      JSON.stringify(data.gematria || {}),
      JSON.stringify(data.tarot || {}),
      JSON.stringify(data.numerology || {}),
      JSON.stringify(data.iching || {}),
      JSON.stringify(data.parasha || null),
    ]
  );
  return result.rows[0];
}

/**
 * Get daily data for a specific date
 * @param {Date} date - The date
 * @returns {Promise<Object|null>} Daily data or null
 */
async function getDailyData(date) {
  const dateStr = date.toISOString().split('T')[0];
  const result = await query(
    'SELECT * FROM daily_data WHERE date = $1',
    [dateStr]
  );
  return result.rows[0] || null;
}

/**
 * Save index values to history
 * @param {Object} indices - Index values
 * @returns {Promise<Object>} Inserted row
 */
async function saveIndicesHistory(indices) {
  const result = await query(
    `INSERT INTO indices_history (solar_geo, astro_events, calendar_sync)
     VALUES ($1, $2, $3)
     RETURNING id, calculated_at`,
    [indices.solarGeo, indices.astroEvents, indices.calendarSync]
  );
  return result.rows[0];
}

/**
 * Log system status for a module
 * @param {string} module - Module name
 * @param {string} status - Status ('success', 'error', 'timeout')
 * @param {string|null} errorMessage - Error message if failed
 * @param {number|null} responseTimeMs - Response time in milliseconds
 * @returns {Promise<Object>} Inserted row
 */
async function saveSystemStatus(module, status, errorMessage = null, responseTimeMs = null) {
  const result = await query(
    `INSERT INTO system_status (module, status, error_message, response_time_ms)
     VALUES ($1, $2, $3, $4)
     RETURNING id, checked_at`,
    [module, status, errorMessage, responseTimeMs]
  );
  return result.rows[0];
}

/**
 * Get recent system status for health checks
 * @param {number} hours - Hours to look back
 * @returns {Promise<Array>} Array of status records
 */
async function getRecentSystemStatus(hours = 1) {
  const result = await query(
    `SELECT module, status, error_message, response_time_ms, checked_at
     FROM system_status
     WHERE checked_at > NOW() - INTERVAL '${hours} hours'
     ORDER BY checked_at DESC`
  );
  return result.rows;
}

/**
 * Clean up old data based on retention policies
 * @returns {Promise<Object>} Cleanup statistics
 */
async function cleanupOldData() {
  const stats = {};

  // Clean snapshots
  let result = await query(
    `DELETE FROM snapshots WHERE collected_at < NOW() - INTERVAL '${config.retention.snapshots} days'`
  );
  stats.snapshots = result.rowCount;

  // Clean system status
  result = await query(
    `DELETE FROM system_status WHERE checked_at < NOW() - INTERVAL '${config.retention.systemStatus} days'`
  );
  stats.systemStatus = result.rowCount;

  // Clean news themes
  result = await query(
    `DELETE FROM news_themes WHERE analyzed_at < NOW() - INTERVAL '${config.retention.newsThemes} days'`
  );
  stats.newsThemes = result.rowCount;

  // Clean indices history
  result = await query(
    `DELETE FROM indices_history WHERE calculated_at < NOW() - INTERVAL '${config.retention.indicesHistory} days'`
  );
  stats.indicesHistory = result.rowCount;

  console.log('Data cleanup completed:', stats);
  return stats;
}

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connected
 */
async function testConnection() {
  try {
    await query('SELECT 1');
    return true;
  } catch (err) {
    console.error('Database connection test failed:', err.message);
    return false;
  }
}

/**
 * Close the connection pool
 */
async function close() {
  await pool.end();
}

module.exports = {
  query,
  pool,
  saveSnapshot,
  getLatestSnapshot,
  getModuleHistory,
  saveDailyData,
  getDailyData,
  saveIndicesHistory,
  saveSystemStatus,
  getRecentSystemStatus,
  cleanupOldData,
  testConnection,
  close,
};
