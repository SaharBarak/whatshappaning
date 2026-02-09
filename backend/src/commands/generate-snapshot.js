#!/usr/bin/env node

/**
 * Generate Snapshot - Standalone script for scheduled execution
 * 
 * Collects all module data, generates AI insight, bundles into a single
 * JSON snapshot, and uploads to Supabase Storage.
 * 
 * Usage: node backend/src/commands/generate-snapshot.js
 * Environment: Requires all the same env vars as the backend server
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { loadModules, executeModule, executeDailyModules, getAllModuleData } = require('../scheduler');
const { gatherModuleData, generateInsight } = require('../routes/insight');
const { uploadSnapshot } = require('../services/snapshot-store');
const logger = require('../utils/logger');

const UPDATE_INTERVAL_HOURS = 1;

async function main() {
  const startTime = Date.now();
  logger.info('=== Snapshot generation started ===');

  try {
    // 1. Load and collect all module data
    logger.info('Loading modules...');
    await loadModules();

    logger.info('Running daily module collection...');
    await executeDailyModules();

    logger.info('Running snapshot module collection...');
    const allModules = await getAllModuleData();

    const moduleCount = Object.keys(allModules).filter(k => allModules[k] != null).length;
    logger.info(`Collected data from ${moduleCount} modules`);

    // 2. Gather module data for insight (same logic as the API route)
    const moduleData = await gatherModuleData();

    // 3. Generate AI insight
    logger.info('Generating AI insight...');
    let insight = null;
    try {
      insight = await generateInsight(moduleData);
      logger.info(`Insight generated — mood: ${insight.mood}`);
    } catch (err) {
      logger.error('Insight generation failed (continuing without):', err.message);
      insight = {
        insight: 'Insight temporarily unavailable.',
        highlights: [],
        guidance: 'Check back soon for updated cosmic guidance.',
        mood: 'reflective',
        generated_at: new Date().toISOString(),
        sources: Object.keys(moduleData),
      };
    }

    // 4. Bundle snapshot
    const now = new Date();
    const nextUpdate = new Date(now.getTime() + UPDATE_INTERVAL_HOURS * 60 * 60 * 1000);

    const snapshot = {
      modules: allModules,
      insight,
      generated_at: now.toISOString(),
      next_update: nextUpdate.toISOString(),
    };

    // 5. Upload to Supabase
    logger.info('Uploading snapshot to Supabase...');
    await uploadSnapshot(snapshot);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.info(`=== Snapshot generation complete (${elapsed}s) ===`);
    process.exit(0);
  } catch (err) {
    logger.error('Snapshot generation failed:', err);
    process.exit(1);
  }
}

main();
