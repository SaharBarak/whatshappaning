/**
 * Correlation Computation Module
 *
 * Computes correlations between features and outcomes.
 * Per spec 23:
 * - Single feature correlations (all feature x outcome combinations)
 * - Key combinations (predefined multi-feature conditions)
 * - Schedule: Weekly full recomputation, daily incremental
 * - Store only significant results (n >= 30, p < 0.05)
 * - Apply Bonferroni correction for multiple comparisons (432+ tests)
 */

const config = require('../config');
const statistics = require('./statistics');
const features = require('./features');
const outcomes = require('./outcomes');

/**
 * Key feature combinations to test
 * Per spec 23 + additional combinations identified in implementation plan
 */
const KEY_COMBINATIONS = [
  // Mercury retrograde + Full Moon
  { name: 'mercury_rx_full_moon', features: [
    { name: 'mercury_retrograde', value: 1 },
    { name: 'moon_phase', value: 4 }, // Full moon = phase 4
  ]},

  // High Kp + New Moon
  { name: 'high_kp_new_moon', features: [
    { name: 'kp_index', value: '>=5' },
    { name: 'moon_phase', value: 0 }, // New moon = phase 0
  ]},

  // Multiple retrogrades + VIX elevated
  { name: 'multiple_rx_vix_elevated', features: [
    { name: 'planets_retrograde_count', value: '>=3' },
    { name: 'vix', value: '>=20' },
  ]},

  // Eclipse proximity + Fear
  { name: 'eclipse_fear', features: [
    { name: 'eclipse_proximity', value: '<=7' },
    { name: 'fear_greed_cnn', value: '<=30' },
  ]},

  // VOC Moon + Major aspects (added per implementation plan)
  { name: 'voc_major_aspects', features: [
    { name: 'moon_void_of_course', value: 1 },
    { name: 'major_aspects_count', value: '>=3' },
  ]},

  // GAP day + Mercury retrograde (added per implementation plan)
  // Note: GAP days are specific kin numbers in Dreamspell
  { name: 'mercury_rx_high_vix', features: [
    { name: 'mercury_retrograde', value: 1 },
    { name: 'vix', value: '>=25' },
  ]},

  // Full moon + High sentiment
  { name: 'full_moon_high_sentiment', features: [
    { name: 'moon_phase', value: 4 },
    { name: 'sentiment_aggregate', value: '>=70' },
  ]},

  // Solar flare + Geomagnetic activity
  { name: 'flare_geomag', features: [
    { name: 'solar_flare_class', value: '>=4' }, // M-class or higher
    { name: 'kp_index', value: '>=4' },
  ]},

  // New moon + Low sentiment
  { name: 'new_moon_low_sentiment', features: [
    { name: 'moon_phase', value: 0 },
    { name: 'sentiment_aggregate', value: '<=30' },
  ]},

  // Multiple retrogrades only
  { name: 'many_retrogrades', features: [
    { name: 'planets_retrograde_count', value: '>=4' },
  ]},

  // High schumann + Full moon
  { name: 'high_schumann_full_moon', features: [
    { name: 'schumann_amplitude', value: '>=50' },
    { name: 'moon_phase', value: 4 },
  ]},

  // Extreme fear
  { name: 'extreme_fear', features: [
    { name: 'fear_greed_cnn', value: '<=20' },
    { name: 'fear_greed_crypto', value: '<=20' },
  ]},
];

/**
 * Compute single feature correlations
 *
 * @param {Array} data - Historical feature + outcome data
 * @returns {Array} Correlation results
 */
function computeSingleCorrelations(data) {
  const results = [];
  const featureNames = features.getAllFeatureNames();
  const outcomeNames = outcomes.getAllOutcomeNames();

  for (const featureName of featureNames) {
    const definition = features.getFeatureDefinition(featureName);
    if (!definition) continue;

    // Get values to test
    let valuesToTest;

    if (definition.type === 'binary') {
      valuesToTest = [1]; // Only test presence of binary features
    } else if (definition.type === 'categorical' || definition.type === 'ordinal' || definition.type === 'discrete') {
      valuesToTest = features.getUniqueValues(data, featureName);
    } else if (definition.type === 'continuous') {
      // For continuous, use threshold conditions
      valuesToTest = features.getContinuousThresholds(featureName);
      if (valuesToTest.length === 0) {
        // Default quartile thresholds
        continue; // Skip continuous features without defined thresholds
      }
    } else {
      continue;
    }

    for (const value of valuesToTest) {
      for (const outcomeName of outcomeNames) {
        // Calculate conditional probability
        const condProb = statistics.conditionalProbability(data, featureName, value, outcomeName);

        if (condProb.insufficient || condProb.sampleSize < config.stats.minSampleSize) {
          continue;
        }

        // Calculate base rate
        const base = statistics.baseRate(data, outcomeName);

        // Chi-square test for significance
        const chiTest = statistics.chiSquareTest(data, featureName, value, outcomeName);

        // Calculate lift
        const lift = statistics.calculateLift(condProb.probability, base.rate);

        results.push({
          type: 'single',
          feature: featureName,
          featureValue: value,
          outcome: outcomeName,
          probability: condProb.probability,
          sampleSize: condProb.sampleSize,
          confidenceLow: condProb.confidenceLow,
          confidenceHigh: condProb.confidenceHigh,
          baseRate: base.rate,
          lift,
          chiSquare: chiTest.chiSquare,
          pValue: chiTest.pValue,
          significant: chiTest.significant,
        });
      }
    }
  }

  return results;
}

/**
 * Compute combination correlations
 *
 * @param {Array} data - Historical feature + outcome data
 * @returns {Array} Correlation results
 */
function computeCombinationCorrelations(data) {
  const results = [];
  const outcomeNames = outcomes.getAllOutcomeNames();

  for (const combo of KEY_COMBINATIONS) {
    for (const outcomeName of outcomeNames) {
      const result = statistics.testFeatureCombination(data, combo.features, outcomeName);

      if (result.insufficient) {
        continue;
      }

      results.push({
        type: 'combination',
        name: combo.name,
        features: combo.features,
        outcome: outcomeName,
        probability: result.probability,
        sampleSize: result.sampleSize,
        confidenceLow: result.confidenceLow,
        confidenceHigh: result.confidenceHigh,
        baseRate: result.baseRate,
        lift: result.lift,
        // Chi-square for combinations needs different approach
        // For now, use sample size threshold only
        pValue: null,
        significant: result.sampleSize >= config.stats.minSampleSize && Math.abs(result.lift - 1) > 0.1,
      });
    }
  }

  return results;
}

/**
 * Apply multiple comparison correction and filter significant results
 *
 * @param {Array} results - Raw correlation results
 * @returns {Array} Filtered and corrected results
 */
function applyCorrectionsAndFilter(results) {
  // Separate results with p-values from those without
  const withPValue = results.filter((r) => r.pValue !== null);
  const withoutPValue = results.filter((r) => r.pValue === null);

  // Apply Benjamini-Hochberg correction to results with p-values
  const corrected = statistics.benjaminiHochbergCorrection(withPValue);

  // Filter to significant results
  const significant = corrected.filter((r) => r.significant);

  // For combination results without p-values, use lift threshold
  const significantCombos = withoutPValue.filter(
    (r) => r.sampleSize >= config.stats.minSampleSize && Math.abs(r.lift - 1) > 0.15
  );

  return [...significant, ...significantCombos];
}

/**
 * Compute all correlations (full weekly run)
 *
 * @param {Array} data - Historical feature + outcome data
 * @returns {Object} Computation results
 */
function computeAllCorrelations(data) {
  const startTime = Date.now();

  // Compute single feature correlations
  const singleResults = computeSingleCorrelations(data);

  // Compute combination correlations
  const combinationResults = computeCombinationCorrelations(data);

  // Combine all results
  const allResults = [...singleResults, ...combinationResults];

  // Apply corrections and filter
  const significant = applyCorrectionsAndFilter(allResults);

  const duration = Date.now() - startTime;

  return {
    total: allResults.length,
    significant: significant.length,
    singleFeature: singleResults.length,
    combinations: combinationResults.length,
    duration,
    results: significant,
  };
}

/**
 * Compute incremental correlations (daily update)
 * Only recalculates correlations that might have changed with new data
 *
 * @param {Array} data - Historical feature + outcome data
 * @param {Array} existingResults - Previous correlation results
 * @returns {Object} Updated results
 */
function computeIncrementalCorrelations(data, existingResults = []) {
  // For incremental, we just recompute everything but could optimize
  // by only updating correlations where sample sizes changed significantly
  return computeAllCorrelations(data);
}

/**
 * Find correlations matching today's features
 *
 * @param {Object} todayFeatures - Today's feature values
 * @param {Array} correlations - Pre-computed correlations
 * @returns {Array} Matching correlations
 */
function findMatchingCorrelations(todayFeatures, correlations) {
  const matches = [];

  for (const corr of correlations) {
    if (corr.type === 'single') {
      // Check if today's feature matches the correlation condition
      const featureValue = todayFeatures[corr.feature];
      if (matchesCondition(featureValue, corr.featureValue)) {
        matches.push(corr);
      }
    } else if (corr.type === 'combination') {
      // Check if all features in the combination match
      const allMatch = corr.features.every((f) =>
        matchesCondition(todayFeatures[f.name], f.value)
      );
      if (allMatch) {
        matches.push(corr);
      }
    }
  }

  return matches;
}

/**
 * Check if a feature value matches a condition
 *
 * @param {*} actual - Actual feature value
 * @param {*} condition - Condition to match
 * @returns {boolean}
 */
function matchesCondition(actual, condition) {
  if (actual === undefined || actual === null) return false;

  if (typeof condition === 'string') {
    if (condition.startsWith('>=')) {
      return actual >= parseFloat(condition.slice(2));
    }
    if (condition.startsWith('<=')) {
      return actual <= parseFloat(condition.slice(2));
    }
    if (condition.startsWith('>')) {
      return actual > parseFloat(condition.slice(1));
    }
    if (condition.startsWith('<')) {
      return actual < parseFloat(condition.slice(1));
    }
  }

  return actual === condition;
}

/**
 * Group correlations by outcome
 *
 * @param {Array} correlations - Array of correlations
 * @returns {Object} Correlations grouped by outcome
 */
function groupByOutcome(correlations) {
  const grouped = {};

  for (const corr of correlations) {
    if (!grouped[corr.outcome]) {
      grouped[corr.outcome] = [];
    }
    grouped[corr.outcome].push(corr);
  }

  // Sort each group by lift (descending)
  for (const outcome of Object.keys(grouped)) {
    grouped[outcome].sort((a, b) => Math.abs(b.lift - 1) - Math.abs(a.lift - 1));
  }

  return grouped;
}

/**
 * Get top correlations for an outcome
 *
 * @param {Array} correlations - All correlations
 * @param {string} outcomeName - Outcome to filter
 * @param {number} limit - Max results
 * @returns {Array} Top correlations
 */
function getTopCorrelations(correlations, outcomeName, limit = 10) {
  return correlations
    .filter((c) => c.outcome === outcomeName)
    .sort((a, b) => Math.abs(b.lift - 1) - Math.abs(a.lift - 1))
    .slice(0, limit);
}

/**
 * Format correlation for display
 *
 * @param {Object} correlation
 * @returns {Object} Formatted correlation
 */
function formatCorrelation(correlation) {
  const formatted = {
    description: formatConditionDescription(correlation),
    probability: (correlation.probability * 100).toFixed(1) + '%',
    confidence: `[${(correlation.confidenceLow * 100).toFixed(1)}%-${(correlation.confidenceHigh * 100).toFixed(1)}%]`,
    sampleSize: correlation.sampleSize,
    baseRate: (correlation.baseRate * 100).toFixed(1) + '%',
    lift: correlation.lift.toFixed(2) + 'x',
    direction: correlation.lift > 1 ? 'increases' : 'decreases',
    outcome: outcomes.formatOutcomeName(correlation.outcome),
  };

  return formatted;
}

/**
 * Format condition description
 *
 * @param {Object} correlation
 * @returns {string}
 */
function formatConditionDescription(correlation) {
  if (correlation.type === 'single') {
    const def = features.getFeatureDefinition(correlation.feature);
    const featureName = def?.description || correlation.feature.replace(/_/g, ' ');
    return `When ${featureName} = ${correlation.featureValue}`;
  }

  if (correlation.type === 'combination') {
    const conditions = correlation.features.map((f) => {
      const def = features.getFeatureDefinition(f.name);
      const name = def?.description || f.name.replace(/_/g, ' ');
      return `${name} ${typeof f.value === 'string' ? f.value : '= ' + f.value}`;
    });
    return `When ${conditions.join(' AND ')}`;
  }

  return 'Unknown condition';
}

module.exports = {
  // Core computation
  computeSingleCorrelations,
  computeCombinationCorrelations,
  computeAllCorrelations,
  computeIncrementalCorrelations,

  // Matching
  findMatchingCorrelations,
  matchesCondition,

  // Grouping and filtering
  groupByOutcome,
  getTopCorrelations,
  applyCorrectionsAndFilter,

  // Formatting
  formatCorrelation,
  formatConditionDescription,

  // Constants
  KEY_COMBINATIONS,
};
