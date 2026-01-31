/**
 * Prediction System
 *
 * Main entry point for prediction generation.
 * Per spec 24:
 * - Predictions regenerated every 3 hours
 * - Pattern matching: Real-time on request
 * - Correlation database: Weekly full refresh
 */

const calculator = require('./calculator');
const factors = require('./factors');
const confidence = require('./confidence');
const alerts = require('./alerts');
const suggestions = require('./suggestions');
const summary = require('./summary');
const correlation = require('../correlation');

/**
 * Generate full prediction payload
 *
 * @param {Object} moduleData - Current data from all modules
 * @returns {Promise<Object>} Full prediction response
 */
async function generatePredictions(moduleData) {
  const startTime = Date.now();

  try {
    // Extract today's features
    const todayFeatures = calculator.getTodayFeatures(moduleData);

    // Load correlation results
    const correlations = await correlation.historical.loadCorrelationResults({
      significantOnly: true,
      minSampleSize: 30,
    });

    // Calculate predictions for all outcomes
    const predictions = calculator.calculateAllPredictions(todayFeatures, correlations);

    // Load historical data for pattern matching
    const historicalData = await correlation.historical.loadHistoricalFeatures({
      limit: 500,
    });

    // Generate pattern alerts
    const patternAlerts = await alerts.generatePatternAlerts(todayFeatures, historicalData);

    // Generate suggestions
    const actionSuggestions = suggestions.generateSuggestions(
      predictions,
      patternAlerts,
      todayFeatures
    );

    // Generate summary
    const predictionSummary = summary.generateSummary(
      predictions,
      patternAlerts,
      todayFeatures
    );

    const duration = Date.now() - startTime;

    return {
      date: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      dataAsOf: moduleData._collectedAt || new Date().toISOString(),
      predictions: predictions.map(formatPrediction),
      patternAlerts: alerts.prioritizeAlerts(patternAlerts),
      actionSuggestions: suggestions.formatForApi(actionSuggestions),
      summary: summary.formatSummary(predictionSummary),
      disclaimer: suggestions.DISCLAIMER,
      _meta: {
        correlationsUsed: correlations.length,
        historicalDaysAnalyzed: historicalData.length,
        generationTimeMs: duration,
      },
    };
  } catch (error) {
    console.error('Error generating predictions:', error);
    return {
      date: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      error: 'Failed to generate predictions',
      predictions: [],
      patternAlerts: [],
      actionSuggestions: [],
      summary: {
        overallTension: 'unknown',
        tensionScore: 5,
        topRisks: [],
        stableFactors: [],
      },
      disclaimer: suggestions.DISCLAIMER,
    };
  }
}

/**
 * Get prediction for specific outcome
 *
 * @param {Object} moduleData - Current module data
 * @param {string} outcomeName - Outcome to predict
 * @returns {Promise<Object>} Single prediction
 */
async function getPredictionForOutcome(moduleData, outcomeName) {
  try {
    const todayFeatures = calculator.getTodayFeatures(moduleData);

    const correlations = await correlation.historical.loadCorrelationResults({
      outcome: outcomeName,
      significantOnly: true,
    });

    const prediction = calculator.calculateOutcomePrediction(
      todayFeatures,
      outcomeName,
      correlations
    );

    // Analyze factors
    const factorAnalysis = factors.analyzeFactors(
      prediction.factors,
      prediction.baseRate
    );

    // Assess reliability
    const reliability = confidence.assessReliability(prediction);

    return {
      ...formatPrediction(prediction),
      factorAnalysis,
      reliability,
      recommendation: confidence.getConfidenceRecommendation(reliability.level),
    };
  } catch (error) {
    console.error(`Error getting prediction for ${outcomeName}:`, error);
    return {
      outcome: outcomeName,
      error: 'Failed to generate prediction',
    };
  }
}

/**
 * Format prediction for API response
 *
 * @param {Object} prediction - Raw prediction
 * @returns {Object} Formatted prediction
 */
function formatPrediction(prediction) {
  return {
    outcome: prediction.outcome,
    outcomeId: prediction.outcomeId,
    probability: prediction.probability,
    probabilityDisplay: Math.round(prediction.probability * 100) + '%',
    confidenceInterval: prediction.confidenceInterval,
    confidenceIntervalDisplay:
      `[${Math.round(prediction.confidenceInterval[0] * 100)}%-${Math.round(prediction.confidenceInterval[1] * 100)}%]`,
    sampleSize: prediction.sampleSize,
    baseRate: prediction.baseRate,
    baseRateDisplay: Math.round(prediction.baseRate * 100) + '%',
    lift: Math.round(prediction.lift * 100) / 100,
    confidence: prediction.confidence,
    factors: prediction.factors?.map((f) => ({
      feature: f.feature,
      value: f.value,
      contribution: f.contribution > 0 ? '+' + f.contribution : String(f.contribution),
      standalone: Math.round(f.standalone * 100) + '%',
      sampleSize: f.sampleSize,
      direction: f.direction,
    })) || [],
    historicalContext: prediction.historicalContext,
  };
}

/**
 * Get pattern matches for today
 *
 * @param {Object} moduleData - Current module data
 * @returns {Promise<Object>} Pattern match results
 */
async function getPatternMatches(moduleData) {
  try {
    const todayFeatures = calculator.getTodayFeatures(moduleData);

    const historicalData = await correlation.historical.loadHistoricalFeatures({
      limit: 1000,
    });

    // Find matching dates
    const matches = correlation.patterns.findMatchingDates(
      todayFeatures,
      historicalData,
      { threshold: 0.75, limit: 20 }
    );

    // Analyze matches
    const analysis = correlation.patterns.groupAndAnalyzeMatches(matches);

    // Generate alerts
    const patternAlerts = await alerts.generatePatternAlerts(todayFeatures, historicalData);

    // Calculate average similarity for matches
    const avgSimilarity = matches.length > 0
      ? matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length
      : 0;

    return {
      matchCount: matches.length,
      avgSimilarity: Math.round(avgSimilarity * 100) / 100, // Round to 2 decimal places
      topMatches: matches.slice(0, 10).map((m) => ({
        date: m.date,
        similarity: Math.round(m.similarity * 100) + '%',
        outcomes: m.outcomes,
      })),
      analysis,
      alerts: patternAlerts,
    };
  } catch (error) {
    console.error('Error getting pattern matches:', error);
    return {
      matchCount: 0,
      avgSimilarity: 0,
      topMatches: [],
      analysis: { insufficient: true },
      alerts: [],
    };
  }
}

/**
 * Get prediction summary
 *
 * @param {Object} moduleData - Current module data
 * @returns {Promise<Object>} Summary
 */
async function getSummary(moduleData) {
  const predictions = await generatePredictions(moduleData);
  return predictions.summary;
}

module.exports = {
  // Main functions
  generatePredictions,
  getPredictionForOutcome,
  getPatternMatches,
  getSummary,

  // Sub-modules
  calculator,
  factors,
  confidence,
  alerts,
  suggestions,
  summary,

  // Helpers
  formatPrediction,
};
