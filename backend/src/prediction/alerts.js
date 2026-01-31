/**
 * Pattern Alerts Module
 *
 * Generates alerts for pattern matches.
 * Per spec 24:
 * - Pattern match detection (>80% similarity)
 * - Historical outcome retrieval for matching dates
 */

const correlation = require('../correlation');

/**
 * Generate pattern alerts from matching historical data
 *
 * @param {Object} todayFeatures - Today's feature values
 * @param {Array} historicalData - Historical feature records
 * @returns {Array} Pattern alerts
 */
async function generatePatternAlerts(todayFeatures, historicalData) {
  const alerts = [];

  // Find pattern matches using correlation module
  const patternAlert = correlation.patterns.generatePatternAlert(
    todayFeatures,
    historicalData,
    { threshold: 0.80 }
  );

  if (patternAlert) {
    alerts.push(formatPatternAlert(patternAlert));
  }

  // Check for specific high-risk patterns
  const specificAlerts = checkSpecificPatterns(todayFeatures);
  alerts.push(...specificAlerts);

  return alerts;
}

/**
 * Format pattern alert for API response
 *
 * @param {Object} alert - Raw pattern alert
 * @returns {Object} Formatted alert
 */
function formatPatternAlert(alert) {
  return {
    alertType: 'historical_match',
    matchScore: Math.round(alert.avgSimilarity * 100) / 100,
    matchingDates: alert.topMatches?.map((m) => m.date) || [],
    description: alert.message,
    commonOutcome: getCommonOutcome(alert.signals),
    outcomeRate: getOutcomeRate(alert.signals),
    sampleSize: alert.matchCount,
    signals: alert.signals || [],
  };
}

/**
 * Get the most common outcome from signals
 *
 * @param {Array} signals - Outcome signals
 * @returns {string}
 */
function getCommonOutcome(signals) {
  if (!signals || signals.length === 0) return 'No clear pattern';

  // Find signal with highest rate
  const strongest = signals.reduce((best, current) => {
    const currentStrength = Math.abs(parseFloat(current.historicalRate) - 50);
    const bestStrength = Math.abs(parseFloat(best.historicalRate) - 50);
    return currentStrength > bestStrength ? current : best;
  }, signals[0]);

  const rate = parseFloat(strongest.historicalRate);
  const direction = rate > 50 ? 'likely' : 'unlikely';

  return `${strongest.description} ${direction}`;
}

/**
 * Get outcome rate from signals
 *
 * @param {Array} signals - Outcome signals
 * @returns {number}
 */
function getOutcomeRate(signals) {
  if (!signals || signals.length === 0) return 0.5;

  const strongest = signals.reduce((best, current) => {
    const currentStrength = Math.abs(parseFloat(current.historicalRate) - 50);
    const bestStrength = Math.abs(parseFloat(best.historicalRate) - 50);
    return currentStrength > bestStrength ? current : best;
  }, signals[0]);

  return parseFloat(strongest.historicalRate) / 100;
}

/**
 * Check for specific high-risk patterns
 *
 * @param {Object} features - Today's features
 * @returns {Array} Specific pattern alerts
 */
function checkSpecificPatterns(features) {
  const alerts = [];

  // Mercury retrograde alert
  if (features.mercury_retrograde === 1) {
    alerts.push({
      alertType: 'astrological',
      matchScore: 1.0,
      matchingDates: [],
      description: 'Mercury is retrograde',
      commonOutcome: 'Communication and technology issues more likely',
      outcomeRate: 0.65,
      sampleSize: 0,
      category: 'timing',
    });
  }

  // Multiple retrogrades alert
  if (features.planets_retrograde_count >= 4) {
    alerts.push({
      alertType: 'astrological',
      matchScore: 1.0,
      matchingDates: [],
      description: `${features.planets_retrograde_count} planets retrograde simultaneously`,
      commonOutcome: 'Period of review and reconsideration',
      outcomeRate: 0.70,
      sampleSize: 0,
      category: 'cosmic',
    });
  }

  // High Kp alert
  if (features.kp_index >= 5) {
    alerts.push({
      alertType: 'geophysical',
      matchScore: 1.0,
      matchingDates: [],
      description: `Geomagnetic storm in progress (Kp=${features.kp_index})`,
      commonOutcome: 'Potential satellite and communication disruptions',
      outcomeRate: 0.75,
      sampleSize: 0,
      category: 'space_weather',
    });
  }

  // Extreme fear alert
  const fearIndex = features.fear_greed_cnn || features.fear_greed_crypto;
  if (fearIndex && fearIndex < 20) {
    alerts.push({
      alertType: 'sentiment',
      matchScore: 1.0,
      matchingDates: [],
      description: `Extreme fear levels (${fearIndex}/100)`,
      commonOutcome: 'Historically often precedes market reversals',
      outcomeRate: 0.60,
      sampleSize: 0,
      category: 'markets',
    });
  }

  // Eclipse proximity alert
  if (features.eclipse_proximity && features.eclipse_proximity <= 7) {
    alerts.push({
      alertType: 'astrological',
      matchScore: 1.0,
      matchingDates: [],
      description: `Eclipse within ${features.eclipse_proximity} days`,
      commonOutcome: 'Period of significant change and revelation',
      outcomeRate: 0.55,
      sampleSize: 0,
      category: 'cosmic',
    });
  }

  // Full moon + void of course
  if (features.moon_phase === 4 && features.moon_void_of_course === 1) {
    alerts.push({
      alertType: 'astrological',
      matchScore: 1.0,
      matchingDates: [],
      description: 'Full Moon during Void of Course period',
      commonOutcome: 'Emotional intensity with unclear outcomes',
      outcomeRate: 0.60,
      sampleSize: 0,
      category: 'timing',
    });
  }

  return alerts;
}

/**
 * Categorize alerts by type
 *
 * @param {Array} alerts - All alerts
 * @returns {Object} Categorized alerts
 */
function categorizeAlerts(alerts) {
  return {
    historical: alerts.filter((a) => a.alertType === 'historical_match'),
    astrological: alerts.filter((a) => a.alertType === 'astrological'),
    geophysical: alerts.filter((a) => a.alertType === 'geophysical'),
    sentiment: alerts.filter((a) => a.alertType === 'sentiment'),
  };
}

/**
 * Get alert severity
 *
 * @param {Object} alert - Alert object
 * @returns {string} Severity level
 */
function getAlertSeverity(alert) {
  if (alert.alertType === 'historical_match' && alert.matchScore > 0.90) {
    return 'high';
  }

  if (alert.outcomeRate > 0.80 || alert.outcomeRate < 0.20) {
    return 'high';
  }

  if (alert.outcomeRate > 0.65 || alert.outcomeRate < 0.35) {
    return 'medium';
  }

  return 'low';
}

/**
 * Prioritize alerts
 *
 * @param {Array} alerts - All alerts
 * @returns {Array} Prioritized alerts
 */
function prioritizeAlerts(alerts) {
  return [...alerts].sort((a, b) => {
    // Historical matches first
    if (a.alertType === 'historical_match' && b.alertType !== 'historical_match') {
      return -1;
    }
    if (b.alertType === 'historical_match' && a.alertType !== 'historical_match') {
      return 1;
    }

    // Then by match score
    return (b.matchScore || 0) - (a.matchScore || 0);
  });
}

/**
 * Format alert for display
 *
 * @param {Object} alert - Alert object
 * @returns {Object} Formatted alert
 */
function formatAlertForDisplay(alert) {
  const severity = getAlertSeverity(alert);

  return {
    ...alert,
    severity,
    icon: getAlertIcon(alert.alertType),
    color: getSeverityColor(severity),
    actionRequired: severity === 'high',
    displayRate: Math.round(alert.outcomeRate * 100) + '%',
  };
}

/**
 * Get icon for alert type
 *
 * @param {string} alertType
 * @returns {string}
 */
function getAlertIcon(alertType) {
  const icons = {
    historical_match: '⚠️',
    astrological: '🌙',
    geophysical: '🌍',
    sentiment: '📊',
  };
  return icons[alertType] || '⚡';
}

/**
 * Get color for severity
 *
 * @param {string} severity
 * @returns {string}
 */
function getSeverityColor(severity) {
  const colors = {
    high: '#ef4444',
    medium: '#f97316',
    low: '#fbbf24',
  };
  return colors[severity] || colors.low;
}

module.exports = {
  generatePatternAlerts,
  formatPatternAlert,
  checkSpecificPatterns,
  categorizeAlerts,
  getAlertSeverity,
  prioritizeAlerts,
  formatAlertForDisplay,
  getAlertIcon,
  getSeverityColor,
};
