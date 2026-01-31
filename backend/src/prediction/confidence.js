/**
 * Confidence Assessment Module
 *
 * Determines confidence levels for predictions.
 * Per spec 24:
 * - Very High: n > 200, CI width < 0.15, p < 0.001
 * - High: n > 100, CI width < 0.20, p < 0.01
 * - Medium: n > 50, CI width < 0.30, p < 0.05
 * - Low: n > 30, CI width < 0.40, p < 0.10
 * - Insufficient: n < 30 or p > 0.10
 */

const config = require('../config');

/**
 * Confidence level thresholds
 */
const CONFIDENCE_LEVELS = {
  very_high: {
    minSampleSize: 200,
    maxCIWidth: 0.15,
    maxPValue: 0.001,
    label: 'Very High',
    description: 'Strong statistical support',
    color: '#10b981', // Green
  },
  high: {
    minSampleSize: 100,
    maxCIWidth: 0.20,
    maxPValue: 0.01,
    label: 'High',
    description: 'Good statistical support',
    color: '#22c55e', // Light green
  },
  medium: {
    minSampleSize: 50,
    maxCIWidth: 0.30,
    maxPValue: 0.05,
    label: 'Medium',
    description: 'Moderate statistical support',
    color: '#fbbf24', // Yellow
  },
  low: {
    minSampleSize: 30,
    maxCIWidth: 0.40,
    maxPValue: 0.10,
    label: 'Low',
    description: 'Weak statistical support',
    color: '#f97316', // Orange
  },
  insufficient: {
    minSampleSize: 0,
    maxCIWidth: 1.0,
    maxPValue: 1.0,
    label: 'Insufficient',
    description: 'Not enough data for reliable prediction',
    color: '#ef4444', // Red
  },
  baseline: {
    minSampleSize: 0,
    maxCIWidth: 1.0,
    maxPValue: 1.0,
    label: 'Baseline',
    description: 'No correlated factors, using historical average',
    color: '#6b7280', // Gray
  },
};

/**
 * Determine confidence level for a prediction
 *
 * @param {number} sampleSize - Sample size
 * @param {number} ciWidth - Confidence interval width
 * @param {number} pValue - P-value
 * @returns {string} Confidence level key
 */
function getConfidenceLevel(sampleSize, ciWidth, pValue = 0.05) {
  // Check from highest to lowest
  if (sampleSize < config.stats.minSampleSize || pValue > 0.10) {
    return 'insufficient';
  }

  if (sampleSize > 200 && ciWidth < 0.15 && pValue < 0.001) {
    return 'very_high';
  }

  if (sampleSize > 100 && ciWidth < 0.20 && pValue < 0.01) {
    return 'high';
  }

  if (sampleSize > 50 && ciWidth < 0.30 && pValue < 0.05) {
    return 'medium';
  }

  if (sampleSize > 30 && ciWidth < 0.40 && pValue < 0.10) {
    return 'low';
  }

  return 'insufficient';
}

/**
 * Get confidence level details
 *
 * @param {string} level - Confidence level key
 * @returns {Object} Level details
 */
function getConfidenceLevelDetails(level) {
  return CONFIDENCE_LEVELS[level] || CONFIDENCE_LEVELS.insufficient;
}

/**
 * Calculate confidence score (0-100)
 *
 * @param {number} sampleSize - Sample size
 * @param {number} ciWidth - Confidence interval width
 * @param {number} pValue - P-value
 * @returns {number} Confidence score
 */
function calculateConfidenceScore(sampleSize, ciWidth, pValue = 0.05) {
  // Score components (0-1 each)
  const sampleScore = Math.min(1, sampleSize / 200);
  const ciScore = Math.max(0, 1 - ciWidth / 0.5);
  const pScore = Math.max(0, 1 - pValue / 0.10);

  // Weighted average
  const score = sampleScore * 0.4 + ciScore * 0.3 + pScore * 0.3;

  return Math.round(score * 100);
}

/**
 * Format confidence for display
 *
 * @param {string} level - Confidence level
 * @param {number} sampleSize - Sample size
 * @param {Array} ci - Confidence interval [low, high]
 * @returns {Object} Formatted confidence
 */
function formatConfidence(level, sampleSize, ci) {
  const details = getConfidenceLevelDetails(level);

  return {
    level,
    label: details.label,
    description: details.description,
    color: details.color,
    sampleSize,
    confidenceInterval: ci
      ? `[${Math.round(ci[0] * 100)}%-${Math.round(ci[1] * 100)}%]`
      : null,
    ciWidth: ci ? Math.round((ci[1] - ci[0]) * 100) + '%' : null,
  };
}

/**
 * Assess prediction reliability
 *
 * @param {Object} prediction - Prediction object
 * @returns {Object} Reliability assessment
 */
function assessReliability(prediction) {
  const sampleSize = prediction.sampleSize || 0;
  const ci = prediction.confidenceInterval || [0, 1];
  const ciWidth = ci[1] - ci[0];
  const factorCount = prediction.factors?.length || 0;

  const level = getConfidenceLevel(sampleSize, ciWidth, 0.05);
  const score = calculateConfidenceScore(sampleSize, ciWidth, 0.05);

  const concerns = [];

  if (sampleSize < 50) {
    concerns.push('Limited sample size');
  }

  if (ciWidth > 0.30) {
    concerns.push('Wide confidence interval');
  }

  if (factorCount === 0) {
    concerns.push('No correlated factors found');
  }

  if (factorCount === 1) {
    concerns.push('Single factor prediction');
  }

  return {
    level,
    score,
    ...getConfidenceLevelDetails(level),
    concerns,
    reliable: level !== 'insufficient' && level !== 'baseline',
    actionable: level === 'very_high' || level === 'high',
  };
}

/**
 * Get recommendation based on confidence
 *
 * @param {string} level - Confidence level
 * @returns {string} Recommendation text
 */
function getConfidenceRecommendation(level) {
  const recommendations = {
    very_high: 'Strong historical pattern. Consider this factor in decision-making.',
    high: 'Good historical support. Worth monitoring.',
    medium: 'Moderate support. Use as one input among many.',
    low: 'Weak support. Exercise caution interpreting this prediction.',
    insufficient: 'Not enough data. Do not rely on this prediction.',
    baseline: 'No correlated factors. This is just the historical average.',
  };

  return recommendations[level] || recommendations.insufficient;
}

/**
 * Compare confidence levels
 *
 * @param {string} level1 - First level
 * @param {string} level2 - Second level
 * @returns {number} -1, 0, or 1
 */
function compareConfidenceLevels(level1, level2) {
  const order = ['insufficient', 'baseline', 'low', 'medium', 'high', 'very_high'];
  const idx1 = order.indexOf(level1);
  const idx2 = order.indexOf(level2);

  if (idx1 < idx2) return -1;
  if (idx1 > idx2) return 1;
  return 0;
}

/**
 * Aggregate confidence from multiple factors
 *
 * @param {Array} factors - Array of factors with confidence info
 * @returns {Object} Aggregated confidence
 */
function aggregateConfidence(factors) {
  if (!factors || factors.length === 0) {
    return { level: 'insufficient', score: 0 };
  }

  // Calculate weighted average sample size
  const totalSampleSize = factors.reduce((sum, f) => sum + (f.sampleSize || 0), 0);
  const avgSampleSize = totalSampleSize / factors.length;

  // Calculate average CI width (estimate)
  const avgCIWidth = 1 / Math.sqrt(avgSampleSize) * 1.96;

  const level = getConfidenceLevel(avgSampleSize, avgCIWidth, 0.05);
  const score = calculateConfidenceScore(avgSampleSize, avgCIWidth, 0.05);

  return {
    level,
    score,
    totalSampleSize,
    factorCount: factors.length,
    ...getConfidenceLevelDetails(level),
  };
}

module.exports = {
  // Core functions
  getConfidenceLevel,
  getConfidenceLevelDetails,
  calculateConfidenceScore,

  // Formatting
  formatConfidence,

  // Assessment
  assessReliability,
  getConfidenceRecommendation,

  // Comparison and aggregation
  compareConfidenceLevels,
  aggregateConfidence,

  // Constants
  CONFIDENCE_LEVELS,
};
