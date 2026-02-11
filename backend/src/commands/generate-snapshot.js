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
const { generateRuleBasedInsight } = require('../services/insight-engine');
const { uploadSnapshot } = require('../services/snapshot-store');
const { generatePredictions } = require('../prediction');
const { archivePrediction } = require('../analytics');
const logger = require('../utils/logger');

const UPDATE_INTERVAL_HOURS = 1;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

    // Brief pause before Gemini calls
    logger.info('Waiting 5s before insight generation...');
    await sleep(5000);

    // 2. Gather module data for insight (same logic as the API route)
    const moduleData = await gatherModuleData();

    // 3. Generate insight (rule-based first, AI as optional enhancement)
    logger.info('Generating insight...');
    let insight = null;
    try {
      // Try AI insight first if Gemini is available
      insight = await generateInsight(moduleData);
      logger.info(`AI insight generated — mood: ${insight.mood}`);
    } catch (err) {
      logger.warn('AI insight unavailable, using rule-based engine:', err.message?.substring(0, 80));
      // Fall back to rule-based insight (always works, no API needed)
      insight = generateRuleBasedInsight(moduleData);
      logger.info(`Rule-based insight generated — mood: ${insight.mood}`);
    }

    // 4. Generate predictions
    logger.info('Generating predictions...');
    let predictions = null;
    try {
      predictions = await generatePredictions(allModules);
      const predCount = predictions.predictions ? predictions.predictions.length : 0;
      logger.info(`Generated ${predCount} predictions`);

      // Archive predictions to CockroachDB for accuracy tracking
      if (predictions.predictions && predictions.predictions.length > 0) {
        logger.info('Archiving predictions to database...');
        const today = new Date();
        for (const pred of predictions.predictions) {
          try {
            await archivePrediction(
              today,
              pred.outcomeId || pred.outcome,
              pred.probability,
              pred.confidence || 'MEDIUM'
            );
          } catch (archiveErr) {
            logger.warn(`Failed to archive prediction ${pred.outcomeId}: ${archiveErr.message}`);
          }
        }
        logger.info('Predictions archived');
      }
    } catch (err) {
      logger.error('Prediction generation failed (continuing without):', err.message);
      predictions = {
        date: new Date().toISOString().split('T')[0],
        generatedAt: new Date().toISOString(),
        error: 'Prediction generation failed',
        predictions: [],
        patternAlerts: [],
        actionSuggestions: [],
        summary: {},
      };
    }

    // 5. Bundle snapshot
    const now = new Date();
    const nextUpdate = new Date(now.getTime() + UPDATE_INTERVAL_HOURS * 60 * 60 * 1000);

    const snapshot = {
      modules: allModules,
      insight,
      predictions,
      generated_at: now.toISOString(),
      next_update: nextUpdate.toISOString(),
    };

    // 6. Upload to Supabase
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
