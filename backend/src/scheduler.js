/**
 * Scheduler module - Cron job orchestration for data collection
 *
 * Manages scheduled execution of all data collection modules
 * and handles error recovery and status tracking.
 */

const cron = require('node-cron');
const config = require('./config');
const db = require('./db');
const cache = require('./utils/cache');
const logger = require('./utils/logger');
const correlation = require('./correlation');

// Module registry - will be populated dynamically
const modules = new Map();

// Module schedule configurations
const MODULE_SCHEDULES = {
  // Daily modules (00:00 UTC)
  tzolkin: { schedule: config.schedules.daily, type: 'daily' },
  dreamspell: { schedule: config.schedules.daily, type: 'daily' },
  tarot: { schedule: config.schedules.daily, type: 'daily' },
  iching: { schedule: config.schedules.daily, type: 'daily' },
  gematria: { schedule: config.schedules.daily, type: 'daily' },

  // Three-hourly modules
  moon: { schedule: config.schedules.threeHourly, type: 'snapshot' },
  astrology: { schedule: config.schedules.threeHourly, type: 'snapshot' },
  solar: { schedule: config.schedules.threeHourly, type: 'snapshot' },
  schumann: { schedule: config.schedules.threeHourly, type: 'snapshot' },
  cosmic: { schedule: config.schedules.threeHourly, type: 'snapshot' },
  markets: { schedule: config.schedules.threeHourly, type: 'snapshot' },
  geophysical: { schedule: config.schedules.threeHourly, type: 'snapshot' },
  sentiment: { schedule: config.schedules.threeHourly, type: 'snapshot' },
  news: { schedule: config.schedules.threeHourly, type: 'snapshot' },

  // 30-minute modules (planetary hours need frequent updates)
  numerology: { schedule: config.schedules.thirtyMinutes, type: 'snapshot' },

  // Weekly modules (Friday sunset)
  parasha: { schedule: config.schedules.weekly, type: 'weekly' },
};

// Active cron jobs
const activeJobs = new Map();

/**
 * Register a module for scheduling
 * @param {string} name - Module name
 * @param {Object} module - Module with collect() function
 */
function registerModule(name, module) {
  if (typeof module.collect !== 'function') {
    logger.error(`Module ${name} does not have a collect() function`);
    return;
  }
  modules.set(name, module);
  logger.debug(`Registered module: ${name}`);
}

/**
 * Load all modules from the modules directory
 */
async function loadModules() {
  const moduleNames = [
    'moon', 'tzolkin', 'dreamspell', 'parasha', 'gematria',
    'astrology', 'solar', 'schumann', 'tarot', 'news',
    'numerology', 'iching', 'cosmic', 'markets', 'geophysical', 'sentiment'
  ];

  for (const name of moduleNames) {
    try {
      const module = require(`./modules/${name}`);
      registerModule(name, module);
    } catch (err) {
      logger.warn(`Could not load module ${name}:`, err.message);
    }
  }
}

/**
 * Execute a module's collect function with error handling
 * @param {string} name - Module name
 * @returns {Promise<Object|null>} Collected data or null on error
 */
async function executeModule(name) {
  const module = modules.get(name);
  if (!module) {
    logger.error(`Module ${name} not found`);
    return null;
  }

  const startTime = Date.now();

  try {
    const data = await module.collect();
    const responseTime = Date.now() - startTime;

    // Save to database
    const scheduleConfig = MODULE_SCHEDULES[name];
    if (scheduleConfig) {
      if (scheduleConfig.type === 'snapshot') {
        await db.saveSnapshot(name, data);
      }
      // Daily data is handled in bulk by saveDailyModules
    }

    // Update cache
    cache.set(`module:${name}`, data);

    // Log success status
    await db.saveSystemStatus(name, 'success', null, responseTime);

    logger.debug(`Module ${name} collected successfully (${responseTime}ms)`);
    return data;
  } catch (err) {
    const responseTime = Date.now() - startTime;
    logger.error(`Module ${name} collection failed:`, err.message);

    // Log error status
    await db.saveSystemStatus(name, 'error', err.message, responseTime);

    // Return cached data as fallback
    const cached = cache.get(`module:${name}`);
    if (cached) {
      logger.debug(`Using cached data for ${name}`);
      return { ...cached, stale: true };
    }

    return null;
  }
}

/**
 * Execute all daily modules and save to daily_data table
 */
async function executeDailyModules() {
  // These modules calculate once per day and are stored in daily_data
  const dailyModules = ['tzolkin', 'dreamspell', 'tarot', 'iching', 'gematria'];
  const results = {};

  for (const name of dailyModules) {
    results[name] = await executeModule(name);
  }

  // Numerology also goes into daily_data (for universal day number)
  // It runs more frequently as a snapshot for planetary hours, but
  // we include it in daily_data for the once-daily universal day number
  results.numerology = await executeModule('numerology');

  // Save combined daily data
  try {
    await db.saveDailyData(new Date(), results);
    logger.debug('Daily data saved successfully');
  } catch (err) {
    logger.error('Failed to save daily data:', err.message);
  }

  return results;
}

/**
 * Start all scheduled cron jobs
 */
function startScheduler() {
  loadModules();

  // Group modules by schedule to avoid duplicate jobs
  const scheduleGroups = {};

  for (const [name, scheduleConfig] of Object.entries(MODULE_SCHEDULES)) {
    const { schedule, type } = scheduleConfig;
    const key = `${schedule}:${type}`;

    if (!scheduleGroups[key]) {
      scheduleGroups[key] = { schedule, type, modules: [] };
    }
    scheduleGroups[key].modules.push(name);
  }

  // Create cron jobs for each schedule group
  for (const [key, group] of Object.entries(scheduleGroups)) {
    const job = cron.schedule(group.schedule, async () => {
      logger.debug(`Running scheduled job: ${key}`);

      if (group.type === 'daily') {
        await executeDailyModules();
      } else {
        for (const moduleName of group.modules) {
          await executeModule(moduleName);
        }
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    activeJobs.set(key, job);
    logger.debug(`Scheduled job ${key}: ${group.modules.join(', ')}`);
  }

  // Schedule daily cleanup
  cron.schedule('0 1 * * *', async () => {
    logger.debug('Running daily data cleanup');
    await db.cleanupOldData();
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Schedule daily historical data update (after daily modules complete)
  // Runs at 00:30 UTC to give daily modules time to complete
  cron.schedule('30 0 * * *', async () => {
    logger.info('Running daily historical data update');
    try {
      await runHistoricalUpdate();
    } catch (err) {
      logger.error('Failed to update historical data:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Schedule weekly correlation recomputation (Sunday 2:00 AM UTC)
  // Per spec 23-CORRELATION-ENGINE: Weekly full refresh
  cron.schedule('0 2 * * 0', async () => {
    logger.info('Running weekly correlation recomputation');
    try {
      await correlation.runFullAnalysis();
      logger.info('Weekly correlation recomputation complete');
    } catch (err) {
      logger.error('Failed to run correlation analysis:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Schedule push notification checks after correlation updates (every 3 hours)
  cron.schedule('30 */3 * * *', async () => {
    try {
      const push = require('./notifications/push');
      if (!push.isConfigured()) return;

      // Check for pattern alerts
      const patterns = await correlation.getPatternMatches();
      if (patterns && patterns.matchCount > 0 && patterns.avgSimilarity > 0.80) {
        const result = await push.sendPatternAlert(patterns);
        logger.info(`Pattern alert: ${result.sent} sent, ${result.skipped} skipped`);
      }
    } catch (err) {
      logger.error('Push notification check failed:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Schedule daily push summary (9:00 AM UTC)
  cron.schedule('0 9 * * *', async () => {
    try {
      const push = require('./notifications/push');
      if (!push.isConfigured()) return;

      // Get prediction summary for daily push
      const apiRoutes = require('./routes/api');
      const predictionEngine = require('./prediction');
      const summary = await predictionEngine.getSummary();
      if (summary) {
        const result = await push.sendDailySummary(summary);
        logger.info(`Daily push summary: ${result.sent} sent, ${result.skipped} skipped`);
      }
    } catch (err) {
      logger.error('Daily push summary failed:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Schedule daily email digest (8:00 AM UTC)
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running daily email digest');
    try {
      const { sendDailyDigest } = require('./email/digest');
      const result = await sendDailyDigest();
      logger.info(`Daily digest complete: ${result.sent} sent, ${result.failed} failed`);
    } catch (err) {
      logger.error('Failed to send daily digest:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Schedule weekly email digest (Monday 8:00 AM UTC)
  cron.schedule('0 8 * * 1', async () => {
    logger.info('Running weekly email digest');
    try {
      const { sendWeeklyDigest } = require('./email/digest');
      const result = await sendWeeklyDigest();
      logger.info(`Weekly digest complete: ${result.sent} sent, ${result.failed} failed`);
    } catch (err) {
      logger.error('Failed to send weekly digest:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  logger.info('Scheduler started');
}

/**
 * Run daily historical data update
 * Gathers all current module data and updates the historical_features table
 * This is called after daily modules complete to ensure today's data is captured
 */
async function runHistoricalUpdate() {
  logger.info('Running historical data update...');

  try {
    // Gather all current module data
    const moduleDataMap = {};
    for (const name of modules.keys()) {
      const data = await getModuleData(name);
      if (data) {
        moduleDataMap[name] = data;
      }
    }

    if (Object.keys(moduleDataMap).length === 0) {
      logger.warn('No module data available for historical update');
      return;
    }

    // Update today's historical record
    await correlation.runDailyUpdate(moduleDataMap);

    logger.info('Historical data update complete');
  } catch (err) {
    logger.error('Historical data update failed:', err.message);
    throw err;
  }
}

/**
 * Run initial data collection on startup
 */
async function runInitialCollection() {
  logger.info('Running initial data collection...');

  // Collect daily modules first
  await executeDailyModules();

  // Collect snapshot modules
  const snapshotModules = Object.entries(MODULE_SCHEDULES)
    .filter(([_, config]) => config.type === 'snapshot')
    .map(([name]) => name);

  for (const name of snapshotModules) {
    await executeModule(name);
  }

  logger.info('Initial data collection complete');
}

/**
 * Stop all scheduled jobs
 */
function stopScheduler() {
  for (const [key, job] of activeJobs) {
    job.stop();
    logger.debug(`Stopped job: ${key}`);
  }
  activeJobs.clear();
}

/**
 * Get current module data (from cache or collect fresh)
 * @param {string} name - Module name
 * @returns {Promise<Object|null>} Module data
 */
async function getModuleData(name) {
  // Check cache first
  const cached = cache.get(`module:${name}`);
  if (cached) {
    return cached;
  }

  // Collect fresh data
  return executeModule(name);
}

/**
 * Get all current module data
 * @returns {Promise<Object>} All module data
 */
async function getAllModuleData() {
  const result = {};

  for (const name of modules.keys()) {
    result[name] = await getModuleData(name);
  }

  return result;
}

module.exports = {
  registerModule,
  executeModule,
  executeDailyModules,
  startScheduler,
  stopScheduler,
  runInitialCollection,
  runHistoricalUpdate,
  getModuleData,
  getAllModuleData,
};
