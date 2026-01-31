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
    console.error(`Module ${name} does not have a collect() function`);
    return;
  }
  modules.set(name, module);
  console.log(`Registered module: ${name}`);
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
      console.warn(`Could not load module ${name}:`, err.message);
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
    console.error(`Module ${name} not found`);
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

    console.log(`Module ${name} collected successfully (${responseTime}ms)`);
    return data;
  } catch (err) {
    const responseTime = Date.now() - startTime;
    console.error(`Module ${name} collection failed:`, err.message);

    // Log error status
    await db.saveSystemStatus(name, 'error', err.message, responseTime);

    // Return cached data as fallback
    const cached = cache.get(`module:${name}`);
    if (cached) {
      console.log(`Using cached data for ${name}`);
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
    console.log('Daily data saved successfully');
  } catch (err) {
    console.error('Failed to save daily data:', err.message);
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
      console.log(`Running scheduled job: ${key}`);

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
    console.log(`Scheduled job ${key}: ${group.modules.join(', ')}`);
  }

  // Schedule daily cleanup
  cron.schedule('0 1 * * *', async () => {
    console.log('Running daily data cleanup');
    await db.cleanupOldData();
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('Scheduler started');
}

/**
 * Run initial data collection on startup
 */
async function runInitialCollection() {
  console.log('Running initial data collection...');

  // Collect daily modules first
  await executeDailyModules();

  // Collect snapshot modules
  const snapshotModules = Object.entries(MODULE_SCHEDULES)
    .filter(([_, config]) => config.type === 'snapshot')
    .map(([name]) => name);

  for (const name of snapshotModules) {
    await executeModule(name);
  }

  console.log('Initial data collection complete');
}

/**
 * Stop all scheduled jobs
 */
function stopScheduler() {
  for (const [key, job] of activeJobs) {
    job.stop();
    console.log(`Stopped job: ${key}`);
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
  getModuleData,
  getAllModuleData,
};
