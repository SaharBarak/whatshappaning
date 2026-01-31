/**
 * Correlation Engine
 *
 * Main entry point for the correlation analysis system.
 * Exports all correlation functionality for use by other modules.
 *
 * Per spec 23:
 * - Weekly full recomputation (Sunday)
 * - Daily incremental update
 * - Live scoring using cached correlations
 */

const statistics = require('./statistics');
const features = require('./features');
const outcomes = require('./outcomes');
const compute = require('./compute');
const patterns = require('./patterns');
const historical = require('./historical');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Run full correlation analysis
 *
 * @returns {Promise<Object>} Analysis results
 */
async function runFullAnalysis() {
  logger.info('Starting full correlation analysis...');
  const startTime = Date.now();

  try {
    // Load historical data
    const data = await historical.loadHistoricalFeatures();

    if (data.length < config.stats.minSampleSize) {
      logger.warn(`Insufficient data for analysis: ${data.length} records (need ${config.stats.minSampleSize})`);
      return {
        success: false,
        error: 'Insufficient historical data',
        recordCount: data.length,
        required: config.stats.minSampleSize,
      };
    }

    // Clear old correlation results
    const cleared = await historical.clearOldCorrelations();
    logger.debug(`Cleared ${cleared} old correlation results`);

    // Compute all correlations
    const results = compute.computeAllCorrelations(data);

    // Save significant results
    const saved = await historical.saveCorrelationResults(results.results);

    const duration = Date.now() - startTime;

    logger.info(`Correlation analysis complete: ${results.significant} significant from ${results.total} tests (${duration}ms)`);

    return {
      success: true,
      recordCount: data.length,
      testsRun: results.total,
      significant: results.significant,
      saved,
      duration,
    };
  } catch (error) {
    logger.error('Correlation analysis failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Run daily incremental update
 *
 * @param {Object} todayModuleData - Today's module data
 * @returns {Promise<Object>} Update results
 */
async function runDailyUpdate(todayModuleData) {
  logger.debug('Running daily correlation update...');

  try {
    // Update today's historical record
    const updated = await historical.updateTodayRecord(todayModuleData);

    // Load recent historical data for incremental analysis
    const data = await historical.loadHistoricalFeatures({ limit: 365 });

    if (data.length < config.stats.minSampleSize) {
      return {
        success: true,
        recordUpdated: updated,
        analysisSkipped: 'Insufficient data',
      };
    }

    // Run incremental correlation computation
    const results = compute.computeIncrementalCorrelations(data);

    return {
      success: true,
      recordUpdated: updated,
      testsRun: results.total,
      significant: results.significant,
    };
  } catch (error) {
    logger.error('Daily update failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get predictions for today based on correlations
 *
 * @param {Object} todayFeatures - Today's feature values
 * @returns {Promise<Object>} Predictions with factors
 */
async function getPredictions(todayFeatures) {
  try {
    // Load correlation results
    const correlations = await historical.loadCorrelationResults({
      significantOnly: true,
    });

    // Find matching correlations for today's features
    const matching = compute.findMatchingCorrelations(todayFeatures, correlations);

    // Group by outcome
    const grouped = compute.groupByOutcome(matching);

    // Calculate predictions for each outcome
    const predictions = {};
    const outcomeNames = outcomes.getAllOutcomeNames();

    for (const outcomeName of outcomeNames) {
      const outcomeCorrelations = grouped[outcomeName] || [];
      const baseRate = outcomes.getEstimatedBaseRate(outcomeName);

      if (outcomeCorrelations.length === 0) {
        predictions[outcomeName] = {
          probability: baseRate,
          confidence: 'baseline',
          factors: [],
          sampleSize: 0,
        };
        continue;
      }

      // Combine correlations using log-odds method
      let combinedLogOdds = Math.log(baseRate / (1 - baseRate));

      const factors = [];
      for (const corr of outcomeCorrelations) {
        const lift = corr.lift;
        const weight = Math.log(corr.sample_size || 30) / 10;
        combinedLogOdds += Math.log(lift) * weight;

        factors.push({
          description: compute.formatConditionDescription(corr),
          lift: corr.lift,
          probability: corr.probability,
          sampleSize: corr.sample_size,
          direction: lift > 1 ? 'increases' : 'decreases',
        });
      }

      // Convert back to probability
      let probability = 1 / (1 + Math.exp(-combinedLogOdds));

      // Apply bounds
      probability = statistics.boundProbability(probability);

      // Calculate confidence interval width
      const avgSampleSize = outcomeCorrelations.reduce((s, c) => s + (c.sample_size || 0), 0) / outcomeCorrelations.length;
      const ciWidth = outcomeCorrelations.length > 0
        ? Math.abs(outcomeCorrelations[0].confidence_high - outcomeCorrelations[0].confidence_low)
        : 0.5;

      predictions[outcomeName] = {
        probability,
        probabilityDisplay: (probability * 100).toFixed(1) + '%',
        baseRate,
        baseRateDisplay: (baseRate * 100).toFixed(1) + '%',
        confidence: statistics.getConfidenceLevel(avgSampleSize, ciWidth, 0.05),
        factors: factors.slice(0, 5), // Top 5 factors
        factorCount: factors.length,
        description: outcomes.formatOutcomeName(outcomeName),
      };
    }

    return predictions;
  } catch (error) {
    logger.error('Error getting predictions:', error);
    return {};
  }
}

/**
 * Find pattern matches for today
 *
 * @param {Object} todayFeatures - Today's feature values
 * @returns {Promise<Object|null>} Pattern alert or null
 */
async function findPatternMatches(todayFeatures) {
  try {
    const historicalData = await historical.loadHistoricalFeatures({ limit: 1000 });

    if (historicalData.length < 30) {
      return null;
    }

    return patterns.generatePatternAlert(todayFeatures, historicalData, {
      threshold: 0.80,
    });
  } catch (error) {
    logger.error('Error finding pattern matches:', error);
    return null;
  }
}

/**
 * Get correlation summary statistics
 *
 * @returns {Promise<Object>}
 */
async function getSummary() {
  return historical.getCorrelationSummary();
}

module.exports = {
  // Main operations
  runFullAnalysis,
  runDailyUpdate,
  getPredictions,
  findPatternMatches,
  getSummary,

  // Sub-modules (for direct access)
  statistics,
  features,
  outcomes,
  compute,
  patterns,
  historical,
};
