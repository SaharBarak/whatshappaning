/**
 * Prediction Summary Module
 *
 * Generates overall summary from predictions.
 * Per spec 24:
 * - overallTension: "high" | "medium" | "low"
 * - tensionScore: 0.0-10.0
 * - topRisks[]: Array of highest probability negative outcomes
 * - stableFactors[]: Array of stability indicators
 */

const correlation = require('../correlation');

/**
 * Negative outcomes (risks)
 */
const RISK_OUTCOMES = [
  'spx_volatile',
  'btc_volatile',
  'vix_spike',
  'major_quake',
  'geomag_storm',
  'sentiment_drop',
  'fear_spike',
];

/**
 * Positive/neutral outcomes
 */
const STABLE_OUTCOMES = [
  'spx_direction',
  'btc_direction',
  'gold_direction',
];

/**
 * Generate prediction summary
 *
 * @param {Array} predictions - All predictions
 * @param {Array} alerts - Pattern alerts
 * @param {Object} features - Today's features
 * @returns {Object} Summary
 */
function generateSummary(predictions, alerts = [], features = {}) {
  // Calculate tension score
  const tensionScore = calculateTensionScore(predictions, alerts, features);

  // Determine overall tension level
  const overallTension = getTensionLevel(tensionScore);

  // Get top risks
  const topRisks = getTopRisks(predictions);

  // Get stable factors
  const stableFactors = getStableFactors(predictions, features);

  // Generate summary text
  const summaryText = generateSummaryText(overallTension, topRisks, stableFactors);

  return {
    overallTension,
    tensionScore: Math.round(tensionScore * 10) / 10,
    topRisks,
    stableFactors,
    summaryText,
    alertCount: alerts.length,
    predictionCount: predictions.length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate tension score (0-10)
 *
 * @param {Array} predictions - Predictions
 * @param {Array} alerts - Alerts
 * @param {Object} features - Features
 * @returns {number}
 */
function calculateTensionScore(predictions, alerts, features) {
  let score = 5; // Start at neutral

  // Adjust based on risk predictions
  for (const prediction of predictions) {
    if (RISK_OUTCOMES.includes(prediction.outcomeId)) {
      const riskContribution = (prediction.probability - 0.5) * 2;
      // Weight by confidence
      const confidenceWeight = getConfidenceWeight(prediction.confidence);
      score += riskContribution * confidenceWeight;
    }
  }

  // Adjust based on alerts
  for (const alert of alerts) {
    if (alert.alertType === 'historical_match' && alert.matchScore > 0.8) {
      score += 0.5 * alert.matchScore;
    }
  }

  // Adjust based on features
  if (features.mercury_retrograde === 1) score += 0.3;
  if (features.planets_retrograde_count >= 4) score += 0.5;
  if (features.kp_index >= 5) score += 0.5;
  if (features.eclipse_proximity && features.eclipse_proximity <= 7) score += 0.3;

  const fearIndex = features.fear_greed_cnn || features.fear_greed_crypto;
  if (fearIndex) {
    if (fearIndex < 20) score += 0.8;
    if (fearIndex > 80) score += 0.4;
  }

  // Bound to 0-10
  return Math.max(0, Math.min(10, score));
}

/**
 * Get confidence weight
 *
 * @param {string} confidence
 * @returns {number}
 */
function getConfidenceWeight(confidence) {
  const weights = {
    very_high: 1.0,
    high: 0.8,
    medium: 0.5,
    low: 0.3,
    insufficient: 0.1,
    baseline: 0.1,
  };
  return weights[confidence] || 0.3;
}

/**
 * Get tension level from score
 *
 * @param {number} score
 * @returns {string}
 */
function getTensionLevel(score) {
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

/**
 * Get top risk predictions
 *
 * @param {Array} predictions
 * @returns {Array}
 */
function getTopRisks(predictions) {
  const risks = predictions
    .filter((p) => RISK_OUTCOMES.includes(p.outcomeId))
    .filter((p) => p.probability > 0.5)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);

  return risks.map((r) => ({
    outcome: r.outcome,
    outcomeId: r.outcomeId,
    probability: Math.round(r.probability * 100) + '%',
    confidence: r.confidence,
  }));
}

/**
 * Get stable factors
 *
 * @param {Array} predictions
 * @param {Object} features
 * @returns {Array}
 */
function getStableFactors(predictions, features) {
  const stable = [];

  // Check for low-risk predictions
  for (const prediction of predictions) {
    if (RISK_OUTCOMES.includes(prediction.outcomeId) && prediction.probability < 0.35) {
      stable.push({
        factor: `Low ${prediction.outcome.toLowerCase()} probability`,
        probability: Math.round(prediction.probability * 100) + '%',
      });
    }
  }

  // Check for positive features
  if (features.kp_index !== undefined && features.kp_index < 3) {
    stable.push({
      factor: 'Calm geomagnetic conditions',
      value: `Kp=${features.kp_index}`,
    });
  }

  const fearIndex = features.fear_greed_cnn || features.fear_greed_crypto;
  if (fearIndex && fearIndex >= 40 && fearIndex <= 60) {
    stable.push({
      factor: 'Neutral sentiment baseline',
      value: `Fear/Greed=${fearIndex}`,
    });
  }

  if (features.mercury_retrograde === 0 && features.planets_retrograde_count < 2) {
    stable.push({
      factor: 'Minimal retrograde activity',
      value: `${features.planets_retrograde_count || 0} planets retrograde`,
    });
  }

  return stable.slice(0, 3);
}

/**
 * Generate human-readable summary text
 *
 * @param {string} tension
 * @param {Array} risks
 * @param {Array} stable
 * @returns {string}
 */
function generateSummaryText(tension, risks, stable) {
  const parts = [];

  if (tension === 'high') {
    parts.push('Elevated tension indicated.');
  } else if (tension === 'medium') {
    parts.push('Moderate activity levels.');
  } else {
    parts.push('Generally calm conditions.');
  }

  if (risks.length > 0) {
    const riskNames = risks.map((r) => r.outcome.toLowerCase()).join(', ');
    parts.push(`Watch for: ${riskNames}.`);
  }

  if (stable.length > 0) {
    parts.push(`Stability from: ${stable.map((s) => s.factor.toLowerCase()).join(', ')}.`);
  }

  return parts.join(' ');
}

/**
 * Get tension color
 *
 * @param {string} level
 * @returns {string}
 */
function getTensionColor(level) {
  const colors = {
    high: '#ef4444',
    medium: '#fbbf24',
    low: '#10b981',
  };
  return colors[level] || colors.medium;
}

/**
 * Get tension icon
 *
 * @param {string} level
 * @returns {string}
 */
function getTensionIcon(level) {
  const icons = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };
  return icons[level] || icons.medium;
}

/**
 * Format summary for display
 *
 * @param {Object} summary
 * @returns {Object}
 */
function formatSummary(summary) {
  return {
    ...summary,
    color: getTensionColor(summary.overallTension),
    icon: getTensionIcon(summary.overallTension),
    scoreDisplay: `${summary.tensionScore}/10`,
    tensionLabel: summary.overallTension.charAt(0).toUpperCase() + summary.overallTension.slice(1),
  };
}

/**
 * Compare two summaries
 *
 * @param {Object} current
 * @param {Object} previous
 * @returns {Object} Comparison
 */
function compareSummaries(current, previous) {
  if (!previous) {
    return {
      tensionChange: 0,
      direction: 'stable',
      newRisks: current.topRisks,
      resolvedRisks: [],
    };
  }

  const tensionChange = current.tensionScore - previous.tensionScore;

  const prevRiskIds = new Set(previous.topRisks.map((r) => r.outcomeId));
  const currRiskIds = new Set(current.topRisks.map((r) => r.outcomeId));

  const newRisks = current.topRisks.filter((r) => !prevRiskIds.has(r.outcomeId));
  const resolvedRisks = previous.topRisks.filter((r) => !currRiskIds.has(r.outcomeId));

  return {
    tensionChange: Math.round(tensionChange * 10) / 10,
    direction: tensionChange > 0.5 ? 'rising' : tensionChange < -0.5 ? 'falling' : 'stable',
    newRisks,
    resolvedRisks,
  };
}

module.exports = {
  generateSummary,
  calculateTensionScore,
  getTensionLevel,
  getTopRisks,
  getStableFactors,
  generateSummaryText,
  formatSummary,
  compareSummaries,
  getTensionColor,
  getTensionIcon,
  RISK_OUTCOMES,
  STABLE_OUTCOMES,
};
