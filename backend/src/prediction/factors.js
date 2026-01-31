/**
 * Factor Analysis Module
 *
 * Analyzes individual factor contributions to predictions.
 * Per spec 24:
 * - Calculate individual factor contribution
 * - Lift: probability / base_rate
 * - Rank factors by impact
 */

const correlation = require('../correlation');

/**
 * Analyze factors contributing to a prediction
 *
 * @param {Array} factors - Array of factor objects from prediction
 * @param {number} baseRate - Base rate for the outcome
 * @returns {Object} Factor analysis
 */
function analyzeFactors(factors, baseRate) {
  if (!factors || factors.length === 0) {
    return {
      totalContribution: 0,
      dominantFactor: null,
      factorCount: 0,
      positiveFactors: [],
      negativeFactors: [],
      analysis: 'No contributing factors identified.',
    };
  }

  // Separate positive and negative contributions
  const positiveFactors = factors.filter((f) => f.contribution > 0 || f.lift > 1);
  const negativeFactors = factors.filter((f) => f.contribution < 0 || f.lift < 1);

  // Calculate total contribution
  const totalContribution = factors.reduce((sum, f) => sum + (f.contribution || 0), 0);

  // Find dominant factor
  const sortedByImpact = [...factors].sort(
    (a, b) => Math.abs(b.contribution || 0) - Math.abs(a.contribution || 0)
  );
  const dominantFactor = sortedByImpact[0] || null;

  // Generate analysis text
  const analysis = generateFactorAnalysis(positiveFactors, negativeFactors, dominantFactor, baseRate);

  return {
    totalContribution,
    dominantFactor,
    factorCount: factors.length,
    positiveFactors,
    negativeFactors,
    analysis,
  };
}

/**
 * Generate human-readable factor analysis
 *
 * @param {Array} positive - Positive factors
 * @param {Array} negative - Negative factors
 * @param {Object} dominant - Most impactful factor
 * @param {number} baseRate - Base rate
 * @returns {string}
 */
function generateFactorAnalysis(positive, negative, dominant, baseRate) {
  const parts = [];

  if (dominant) {
    const direction = dominant.lift > 1 ? 'increases' : 'decreases';
    parts.push(`${dominant.feature} ${direction} probability by ${Math.abs(dominant.contribution || 0).toFixed(2)} log-odds.`);
  }

  if (positive.length > 0) {
    parts.push(`${positive.length} factor(s) pushing probability higher.`);
  }

  if (negative.length > 0) {
    parts.push(`${negative.length} factor(s) pushing probability lower.`);
  }

  return parts.join(' ') || 'No significant factor contributions.';
}

/**
 * Calculate lift for a factor
 *
 * @param {number} probability - Factor's probability
 * @param {number} baseRate - Base rate
 * @returns {number}
 */
function calculateLift(probability, baseRate) {
  if (baseRate === 0) return probability > 0 ? Infinity : 1;
  return probability / baseRate;
}

/**
 * Rank factors by impact
 *
 * @param {Array} factors - Array of factors
 * @param {string} sortBy - Sort criterion ('contribution', 'lift', 'sampleSize')
 * @returns {Array} Sorted factors
 */
function rankFactors(factors, sortBy = 'contribution') {
  const sorted = [...factors];

  switch (sortBy) {
    case 'lift':
      sorted.sort((a, b) => Math.abs(b.lift - 1) - Math.abs(a.lift - 1));
      break;
    case 'sampleSize':
      sorted.sort((a, b) => (b.sampleSize || 0) - (a.sampleSize || 0));
      break;
    case 'contribution':
    default:
      sorted.sort((a, b) => Math.abs(b.contribution || 0) - Math.abs(a.contribution || 0));
  }

  return sorted;
}

/**
 * Format factor for display
 *
 * @param {Object} factor - Factor object
 * @returns {Object} Formatted factor
 */
function formatFactor(factor) {
  return {
    feature: factor.feature,
    value: factor.value,
    contribution: factor.contribution
      ? (factor.contribution > 0 ? '+' : '') + factor.contribution.toFixed(2)
      : '0.00',
    contributionPercent: factor.contribution
      ? Math.round(factor.contribution * 100) + '%'
      : '0%',
    standalone: Math.round((factor.standalone || 0.5) * 100) + '%',
    sampleSize: factor.sampleSize || 0,
    lift: factor.lift ? factor.lift.toFixed(2) + 'x' : '1.00x',
    direction: factor.lift > 1 ? '↑' : factor.lift < 1 ? '↓' : '→',
    impact: getImpactLevel(factor.contribution),
  };
}

/**
 * Get impact level description
 *
 * @param {number} contribution - Factor contribution
 * @returns {string}
 */
function getImpactLevel(contribution) {
  const absContribution = Math.abs(contribution || 0);

  if (absContribution >= 0.5) return 'very_high';
  if (absContribution >= 0.3) return 'high';
  if (absContribution >= 0.15) return 'moderate';
  if (absContribution >= 0.05) return 'low';
  return 'minimal';
}

/**
 * Group factors by type/category
 *
 * @param {Array} factors - Array of factors
 * @returns {Object} Grouped factors
 */
function groupFactorsByType(factors) {
  const groups = {
    cosmic: [],
    geophysical: [],
    sentiment: [],
    calendar: [],
    other: [],
  };

  const cosmicFeatures = [
    'moon_phase', 'moon_sign', 'moon_illumination', 'moon_void_of_course',
    'mercury_retrograde', 'venus_retrograde', 'mars_retrograde',
    'planets_retrograde_count', 'sun_sign', 'major_aspects_count',
    'eclipse_proximity', 'tzolkin', 'dreamspell',
  ];

  const geoFeatures = [
    'kp_index', 'ap_index', 'solar_flare', 'sunspot', 'solar_wind',
    'schumann', 'quake', 'earthquake',
  ];

  const sentimentFeatures = [
    'fear_greed', 'vix', 'sentiment', 'market',
  ];

  const calendarFeatures = [
    'hebrew', 'parasha', 'numerology', 'tarot', 'iching',
    'day_of_week', 'planetary_hour',
  ];

  for (const factor of factors) {
    const featureLower = (factor.feature || '').toLowerCase();

    if (cosmicFeatures.some((f) => featureLower.includes(f))) {
      groups.cosmic.push(factor);
    } else if (geoFeatures.some((f) => featureLower.includes(f))) {
      groups.geophysical.push(factor);
    } else if (sentimentFeatures.some((f) => featureLower.includes(f))) {
      groups.sentiment.push(factor);
    } else if (calendarFeatures.some((f) => featureLower.includes(f))) {
      groups.calendar.push(factor);
    } else {
      groups.other.push(factor);
    }
  }

  return groups;
}

/**
 * Calculate combined contribution from multiple factors
 *
 * @param {Array} factors - Factors to combine
 * @returns {number} Combined contribution
 */
function getCombinedContribution(factors) {
  return factors.reduce((sum, f) => sum + (f.contribution || 0), 0);
}

/**
 * Find synergistic factor pairs
 * Factors that commonly appear together and amplify each other
 *
 * @param {Array} factors - Array of factors
 * @returns {Array} Synergistic pairs
 */
function findSynergisticPairs(factors) {
  const pairs = [];

  for (let i = 0; i < factors.length; i++) {
    for (let j = i + 1; j < factors.length; j++) {
      const f1 = factors[i];
      const f2 = factors[j];

      // Check if both push in same direction
      const sameDirection = (f1.lift > 1 && f2.lift > 1) || (f1.lift < 1 && f2.lift < 1);

      if (sameDirection) {
        pairs.push({
          factor1: f1.feature,
          factor2: f2.feature,
          combinedContribution: (f1.contribution || 0) + (f2.contribution || 0),
          direction: f1.lift > 1 ? 'positive' : 'negative',
        });
      }
    }
  }

  // Sort by combined contribution
  pairs.sort((a, b) => Math.abs(b.combinedContribution) - Math.abs(a.combinedContribution));

  return pairs.slice(0, 5);
}

module.exports = {
  analyzeFactors,
  calculateLift,
  rankFactors,
  formatFactor,
  getImpactLevel,
  groupFactorsByType,
  getCombinedContribution,
  findSynergisticPairs,
  generateFactorAnalysis,
};
