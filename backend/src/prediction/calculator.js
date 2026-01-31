/**
 * Prediction Calculator Module
 *
 * Transforms correlation data into predictions.
 * Per spec 24:
 * - Get today's features from all modules
 * - Find matching correlations from database
 * - Combine using log-odds method
 * - Apply probability bounds (5%-95%)
 */

const config = require('../config');
const correlation = require('../correlation');

/**
 * Calculate prediction for a single outcome
 *
 * @param {Object} todayFeatures - Today's feature values
 * @param {string} outcomeName - Name of the outcome to predict
 * @param {Array} correlations - Pre-computed correlations
 * @returns {Object} Prediction with factors
 */
function calculateOutcomePrediction(todayFeatures, outcomeName, correlations) {
  // Get base rate for this outcome
  const baseRate = correlation.outcomes.getEstimatedBaseRate(outcomeName);

  // Find correlations that match today's features for this outcome
  const matchingCorrelations = correlation.compute.findMatchingCorrelations(
    todayFeatures,
    correlations.filter((c) => c.outcome === outcomeName)
  );

  if (matchingCorrelations.length === 0) {
    return {
      outcome: outcomeName,
      outcomeId: outcomeName,
      outcomeName: correlation.outcomes.formatOutcomeName(outcomeName),
      probability: baseRate,
      confidenceInterval: [baseRate * 0.8, Math.min(1, baseRate * 1.2)],
      sampleSize: 0,
      baseRate,
      lift: 1.0,
      confidence: 'baseline',
      factors: [],
      historicalContext: 'No matching correlations found. Using base rate.',
    };
  }

  // Combine factors using log-odds method
  const combined = combinePredictions(matchingCorrelations, baseRate);

  // Calculate confidence interval from combined factors
  const avgSampleSize = matchingCorrelations.reduce((sum, c) => sum + (c.sample_size || 30), 0) / matchingCorrelations.length;
  const ciWidth = 1 / Math.sqrt(avgSampleSize) * 1.96; // Approximate CI width
  const confidenceLow = Math.max(0.05, combined.probability - ciWidth / 2);
  const confidenceHigh = Math.min(0.95, combined.probability + ciWidth / 2);

  // Determine confidence level
  const confidence = correlation.statistics.getConfidenceLevel(
    avgSampleSize,
    confidenceHigh - confidenceLow,
    matchingCorrelations[0]?.p_value || 0.05
  );

  // Build historical context string
  const historicalContext = buildHistoricalContext(matchingCorrelations, outcomeName);

  return {
    outcome: correlation.outcomes.formatOutcomeName(outcomeName),
    outcomeId: outcomeName,
    probability: combined.probability,
    confidenceInterval: [confidenceLow, confidenceHigh],
    sampleSize: Math.round(avgSampleSize),
    baseRate,
    lift: combined.probability / baseRate,
    confidence,
    factors: combined.factors,
    historicalContext,
  };
}

/**
 * Combine multiple correlations using log-odds method
 * Per spec 24:
 * - combinedLogOdds = log(baseRate / (1-baseRate))
 * - for each factor: combinedLogOdds += log(lift) * weight
 * - weight = log(sampleSize) / 10
 *
 * @param {Array} correlations - Matching correlations
 * @param {number} baseRate - Base rate for outcome
 * @returns {{ probability: number, factors: Array }}
 */
function combinePredictions(correlations, baseRate) {
  if (correlations.length === 0) {
    return { probability: baseRate, factors: [] };
  }

  // Ensure base rate is valid
  const safeBaseRate = Math.max(0.01, Math.min(0.99, baseRate));

  // Start with base rate in log-odds space
  let combinedLogOdds = Math.log(safeBaseRate / (1 - safeBaseRate));

  const factors = correlations.map((corr) => {
    const probability = corr.probability || 0.5;
    const lift = probability / safeBaseRate;
    const sampleSize = corr.sample_size || 30;

    // Weight based on sample size (diminishing returns)
    const weight = Math.log(sampleSize) / 10;

    // Contribution to log-odds
    const contribution = Math.log(lift) * weight;
    combinedLogOdds += contribution;

    return {
      feature: formatFeatureDescription(corr),
      value: formatFeatureValue(corr),
      contribution: Math.round(contribution * 100) / 100,
      standalone: probability,
      sampleSize,
      lift: Math.round(lift * 100) / 100,
      direction: lift > 1 ? 'increases' : 'decreases',
    };
  });

  // Convert back to probability
  let combinedProbability = 1 / (1 + Math.exp(-combinedLogOdds));

  // Apply bounds (5% to 95%)
  combinedProbability = correlation.statistics.boundProbability(combinedProbability);

  // Sort factors by absolute contribution (most impactful first)
  factors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    probability: combinedProbability,
    factors: factors.slice(0, 10), // Top 10 factors
  };
}

/**
 * Format feature description for display
 *
 * @param {Object} corr - Correlation object
 * @returns {string}
 */
function formatFeatureDescription(corr) {
  // Handle direct feature property first
  if (corr.feature) {
    const def = correlation.features.getFeatureDefinition(corr.feature);
    return def?.description || corr.feature.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  if (corr.correlation_type === 'single' || corr.type === 'single') {
    const features = typeof corr.features === 'string' ? JSON.parse(corr.features) : corr.features;
    const featureName = features?.feature;
    if (featureName) {
      const def = correlation.features.getFeatureDefinition(featureName);
      return def?.description || featureName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
  }

  // Combination
  if (corr.name) {
    return corr.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  const features = typeof corr.features === 'string' ? JSON.parse(corr.features) : corr.features;
  if (Array.isArray(features)) {
    return features.map((f) => f.name.replace(/_/g, ' ')).join(' + ');
  }

  return 'Combined factors';
}

/**
 * Format feature value for display
 *
 * @param {Object} corr - Correlation object
 * @returns {string}
 */
function formatFeatureValue(corr) {
  // Handle featureValue first (direct property)
  if (corr.featureValue !== undefined) {
    return String(corr.featureValue);
  }

  // Handle features object/string
  if (!corr.features) {
    return 'Active';
  }

  const features = typeof corr.features === 'string' ? JSON.parse(corr.features) : corr.features;

  if (!features) {
    return 'Active';
  }

  if (features.value !== undefined) {
    return String(features.value);
  }

  if (Array.isArray(features)) {
    return features.map((f) => `${f.name}=${f.value}`).join(', ');
  }

  return 'Active';
}

/**
 * Build historical context string
 *
 * @param {Array} correlations - Matching correlations
 * @param {string} outcomeName - Outcome name
 * @returns {string}
 */
function buildHistoricalContext(correlations, outcomeName) {
  if (correlations.length === 0) {
    return 'No historical data for these conditions.';
  }

  const totalSamples = correlations.reduce((sum, c) => sum + (c.sample_size || 0), 0);
  const avgProbability = correlations.reduce((sum, c) => sum + (c.probability || 0.5), 0) / correlations.length;

  const outcomeDescription = correlation.outcomes.formatOutcomeName(outcomeName);
  const percentage = Math.round(avgProbability * 100);

  return `Based on ${correlations.length} factors with ${totalSamples} total samples, historically ${percentage}% chance of ${outcomeDescription.toLowerCase()}.`;
}

/**
 * Calculate predictions for all outcomes
 *
 * @param {Object} todayFeatures - Today's feature values
 * @param {Array} correlations - All pre-computed correlations
 * @returns {Array} Predictions for all outcomes
 */
function calculateAllPredictions(todayFeatures, correlations) {
  const outcomeNames = correlation.outcomes.getAllOutcomeNames();
  const predictions = [];

  for (const outcomeName of outcomeNames) {
    const prediction = calculateOutcomePrediction(todayFeatures, outcomeName, correlations);
    predictions.push(prediction);
  }

  // Sort by probability (highest first) then by sample size
  predictions.sort((a, b) => {
    const probDiff = b.probability - a.probability;
    if (Math.abs(probDiff) > 0.05) return probDiff;
    return b.sampleSize - a.sampleSize;
  });

  return predictions;
}

/**
 * Get today's features from module data
 *
 * @param {Object} moduleData - Current data from all modules
 * @returns {Object} Feature vector
 */
function getTodayFeatures(moduleData) {
  return correlation.features.extractFeatures(moduleData, new Date());
}

module.exports = {
  calculateOutcomePrediction,
  combinePredictions,
  calculateAllPredictions,
  getTodayFeatures,
  formatFeatureDescription,
  formatFeatureValue,
  buildHistoricalContext,
};
