/**
 * Action Suggestions Module
 *
 * Generates actionable suggestions from predictions.
 * Per spec 24:
 * - Favorable/Caution categorization
 * - Required disclaimer
 */

const correlation = require('../correlation');

/**
 * Required disclaimer text
 */
const DISCLAIMER = `DISCLAIMER: These predictions are based on historical statistical correlations and are provided for informational/entertainment purposes only. Past patterns do not guarantee future outcomes. This is not financial, medical, or professional advice. Always consult qualified professionals for important decisions.`;

/**
 * Short disclaimer for inline display
 */
const SHORT_DISCLAIMER = 'Suggestions based on statistical correlations. Not financial advice. Historical patterns ≠ guarantees.';

/**
 * Generate suggestions from predictions and alerts
 *
 * @param {Array} predictions - Array of predictions
 * @param {Array} alerts - Array of alerts
 * @param {Object} features - Today's features
 * @returns {Object} Suggestions with favorable and caution lists
 */
function generateSuggestions(predictions, alerts, features) {
  const favorable = [];
  const caution = [];

  // Analyze predictions for suggestions
  for (const prediction of predictions) {
    const suggestion = analyzePrediction(prediction);
    if (suggestion) {
      if (suggestion.type === 'favorable') {
        favorable.push(suggestion);
      } else {
        caution.push(suggestion);
      }
    }
  }

  // Add feature-based suggestions
  const featureSuggestions = generateFeatureSuggestions(features);
  favorable.push(...featureSuggestions.favorable);
  caution.push(...featureSuggestions.caution);

  // Add alert-based suggestions
  const alertSuggestions = generateAlertSuggestions(alerts);
  caution.push(...alertSuggestions);

  // Deduplicate and prioritize
  return {
    favorable: deduplicateSuggestions(favorable).slice(0, 5),
    caution: deduplicateSuggestions(caution).slice(0, 5),
    disclaimer: DISCLAIMER,
    shortDisclaimer: SHORT_DISCLAIMER,
  };
}

/**
 * Analyze a prediction and generate suggestion
 *
 * @param {Object} prediction - Prediction object
 * @returns {Object|null} Suggestion or null
 */
function analyzePrediction(prediction) {
  const { outcomeId, probability, baseRate, confidence, lift } = prediction;

  // Skip low confidence predictions
  if (confidence === 'insufficient' || confidence === 'baseline') {
    return null;
  }

  // Determine if this is notable
  const isHighProbability = probability > 0.65;
  const isLowProbability = probability < 0.35;
  const isSignificantLift = lift > 1.5 || lift < 0.67;

  if (!isHighProbability && !isLowProbability && !isSignificantLift) {
    return null;
  }

  // Generate suggestion based on outcome type
  return generateOutcomeSuggestion(outcomeId, probability, baseRate, confidence);
}

/**
 * Generate suggestion for specific outcome
 *
 * @param {string} outcomeId - Outcome identifier
 * @param {number} probability - Predicted probability
 * @param {number} baseRate - Base rate
 * @param {string} confidence - Confidence level
 * @returns {Object} Suggestion
 */
function generateOutcomeSuggestion(outcomeId, probability, baseRate, confidence) {
  const suggestions = {
    spx_volatile: {
      high: {
        type: 'caution',
        category: 'Markets',
        suggestion: 'Consider reduced position sizes',
        reasoning: `${Math.round(probability * 100)}% volatility probability`,
      },
      low: {
        type: 'favorable',
        category: 'Markets',
        suggestion: 'Relatively calm market conditions expected',
        reasoning: `Only ${Math.round(probability * 100)}% volatility probability`,
      },
    },
    spx_direction: {
      high: {
        type: 'favorable',
        category: 'Markets',
        suggestion: 'Historical patterns favor market gains',
        reasoning: `${Math.round(probability * 100)}% probability of up day`,
      },
      low: {
        type: 'caution',
        category: 'Markets',
        suggestion: 'Historical patterns suggest market weakness',
        reasoning: `Only ${Math.round(probability * 100)}% probability of up day`,
      },
    },
    major_quake: {
      high: {
        type: 'caution',
        category: 'Geophysical',
        suggestion: 'Elevated seismic activity indicated',
        reasoning: `${Math.round(probability * 100)}% probability of M6+ earthquake`,
      },
      low: null,
    },
    geomag_storm: {
      high: {
        type: 'caution',
        category: 'Space Weather',
        suggestion: 'Potential satellite and GPS disruptions',
        reasoning: `${Math.round(probability * 100)}% geomagnetic storm probability`,
      },
      low: null,
    },
    fear_spike: {
      high: {
        type: 'caution',
        category: 'Sentiment',
        suggestion: 'Extreme fear conditions may persist',
        reasoning: `${Math.round(probability * 100)}% fear spike probability`,
      },
      low: {
        type: 'favorable',
        category: 'Sentiment',
        suggestion: 'Sentiment conditions stable',
        reasoning: `Low probability of fear spike`,
      },
    },
    sentiment_drop: {
      high: {
        type: 'caution',
        category: 'Sentiment',
        suggestion: 'Watch for sentiment deterioration',
        reasoning: `${Math.round(probability * 100)}% probability of sentiment drop`,
      },
      low: null,
    },
  };

  const outcomeConfig = suggestions[outcomeId];
  if (!outcomeConfig) return null;

  const isHigh = probability > 0.55;
  const template = isHigh ? outcomeConfig.high : outcomeConfig.low;

  if (!template) return null;

  return {
    ...template,
    confidence,
    probability,
  };
}

/**
 * Generate suggestions based on today's features
 *
 * @param {Object} features - Today's features
 * @returns {{ favorable: Array, caution: Array }}
 */
function generateFeatureSuggestions(features) {
  const favorable = [];
  const caution = [];

  // Mercury retrograde suggestions
  if (features.mercury_retrograde === 1) {
    favorable.push({
      type: 'favorable',
      category: 'Timing',
      suggestion: 'Good for introspection, planning, and review',
      reasoning: 'Mercury retrograde favors reflection',
      confidence: 'low',
      disclaimer: 'Based on astrological correlation only',
    });

    caution.push({
      type: 'caution',
      category: 'Timing',
      suggestion: 'Avoid signing important contracts',
      reasoning: 'Mercury retrograde + communication issues',
      confidence: 'low',
      disclaimer: 'Based on astrological correlation only',
    });
  }

  // Void of course moon
  if (features.moon_void_of_course === 1) {
    caution.push({
      type: 'caution',
      category: 'Timing',
      suggestion: 'Avoid major decisions during void moon',
      reasoning: 'Moon void of course traditionally inauspicious',
      confidence: 'low',
      disclaimer: 'Based on astrological correlation only',
    });
  }

  // Full moon suggestions
  if (features.moon_phase === 4) {
    favorable.push({
      type: 'favorable',
      category: 'Timing',
      suggestion: 'Good for completion and culmination',
      reasoning: 'Full moon energy favors finishing projects',
      confidence: 'low',
    });
  }

  // New moon suggestions
  if (features.moon_phase === 0) {
    favorable.push({
      type: 'favorable',
      category: 'Timing',
      suggestion: 'Good for new beginnings and intentions',
      reasoning: 'New moon favors fresh starts',
      confidence: 'low',
    });
  }

  // High Kp suggestions
  if (features.kp_index >= 5) {
    caution.push({
      type: 'caution',
      category: 'Technology',
      suggestion: 'Potential GPS and satellite disruptions',
      reasoning: `High geomagnetic activity (Kp=${features.kp_index})`,
      confidence: 'medium',
    });
  }

  // Extreme sentiment
  const fearIndex = features.fear_greed_cnn || features.fear_greed_crypto;
  if (fearIndex) {
    if (fearIndex < 20) {
      favorable.push({
        type: 'favorable',
        category: 'Markets',
        suggestion: 'Extreme fear often precedes reversals',
        reasoning: `Fear index at ${fearIndex} (historical bottom signal)`,
        confidence: 'medium',
        disclaimer: 'Not financial advice',
      });
    } else if (fearIndex > 80) {
      caution.push({
        type: 'caution',
        category: 'Markets',
        suggestion: 'Extreme greed may indicate overheated markets',
        reasoning: `Greed index at ${fearIndex} (historical top signal)`,
        confidence: 'medium',
        disclaimer: 'Not financial advice',
      });
    }
  }

  return { favorable, caution };
}

/**
 * Generate suggestions from alerts
 *
 * @param {Array} alerts - Pattern alerts
 * @returns {Array} Caution suggestions
 */
function generateAlertSuggestions(alerts) {
  const suggestions = [];

  for (const alert of alerts) {
    if (alert.alertType === 'historical_match' && alert.matchScore > 0.85) {
      suggestions.push({
        type: 'caution',
        category: 'Pattern Match',
        suggestion: 'Exercise elevated caution',
        reasoning: `${Math.round(alert.matchScore * 100)}% pattern match + ${alert.commonOutcome}`,
        confidence: 'medium',
      });
    }
  }

  return suggestions;
}

/**
 * Deduplicate suggestions by category and type
 *
 * @param {Array} suggestions - Array of suggestions
 * @returns {Array} Deduplicated suggestions
 */
function deduplicateSuggestions(suggestions) {
  const seen = new Set();
  return suggestions.filter((s) => {
    const key = `${s.category}-${s.suggestion}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Format suggestion for display
 *
 * @param {Object} suggestion - Suggestion object
 * @returns {Object} Formatted suggestion
 */
function formatSuggestion(suggestion) {
  return {
    category: suggestion.category,
    suggestion: suggestion.suggestion,
    reasoning: suggestion.reasoning,
    confidence: suggestion.confidence || 'low',
    icon: getCategoryIcon(suggestion.category),
    ...(suggestion.disclaimer && { disclaimer: suggestion.disclaimer }),
  };
}

/**
 * Get icon for category
 *
 * @param {string} category
 * @returns {string}
 */
function getCategoryIcon(category) {
  const icons = {
    Markets: '📈',
    Timing: '⏰',
    Technology: '💻',
    Geophysical: '🌍',
    'Space Weather': '☀️',
    Sentiment: '💭',
    'Pattern Match': '🔮',
  };
  return icons[category] || '💡';
}

/**
 * Format all suggestions for API response
 *
 * @param {Object} suggestions - Suggestions object
 * @returns {Array} Formatted action suggestions
 */
function formatForApi(suggestions) {
  const formatted = [];

  for (const favorable of suggestions.favorable) {
    formatted.push(formatSuggestion({
      ...favorable,
      type: 'favorable',
    }));
  }

  for (const caution of suggestions.caution) {
    formatted.push(formatSuggestion({
      ...caution,
      type: 'caution',
    }));
  }

  return formatted;
}

module.exports = {
  generateSuggestions,
  generateFeatureSuggestions,
  generateAlertSuggestions,
  formatSuggestion,
  formatForApi,
  deduplicateSuggestions,
  getCategoryIcon,
  DISCLAIMER,
  SHORT_DISCLAIMER,
};
