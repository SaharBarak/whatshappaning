/**
 * Pattern Matching Module
 *
 * Finds historical dates with similar feature profiles.
 * Per spec 23/24:
 * - Pattern match threshold: >80% similarity
 * - Match score: Categorical (exact=1, else=0), Continuous (within 10%=0.5, exact=1)
 * - Used for "similar days in history" analysis
 */

const features = require('./features');
const outcomes = require('./outcomes');

/**
 * Default weights for feature categories
 * Can be adjusted based on domain knowledge
 */
const DEFAULT_WEIGHTS = {
  // Cosmic/Esoteric - higher weight for traditionally significant features
  moon_phase: 2.0,
  moon_sign: 1.0,
  moon_illumination: 0.5,
  moon_void_of_course: 1.5,
  mercury_retrograde: 2.0,
  venus_retrograde: 1.0,
  mars_retrograde: 1.0,
  planets_retrograde_count: 1.5,
  sun_sign: 1.0,
  major_aspects_count: 1.0,
  eclipse_proximity: 2.0,
  tzolkin_tone: 1.0,
  tzolkin_sign: 1.0,
  dreamspell_kin: 0.5, // Low weight due to 260 possible values
  dreamspell_wavespell: 1.0,
  hebrew_day: 0.5,
  hebrew_month: 1.0,
  parasha_index: 1.0,
  numerology_day: 1.0,
  tarot_card: 0.5, // Low weight due to 78 possible values
  iching_hexagram: 0.5, // Low weight due to 64 possible values
  planetary_hour: 0.5,
  day_of_week: 0.5,

  // Geophysical - higher weight for measurable physical phenomena
  kp_index: 2.0,
  ap_index: 1.0,
  solar_flare_class: 2.0,
  sunspot_number: 1.0,
  solar_wind_speed: 1.0,
  schumann_amplitude: 1.5,
  quake_count_24h: 1.0,
  quake_max_magnitude: 1.5,
  quake_energy_log: 1.0,

  // Sentiment - moderate weight
  fear_greed_cnn: 1.5,
  fear_greed_crypto: 1.5,
  vix: 2.0,
  sentiment_aggregate: 1.0,
};

/**
 * Calculate similarity between two feature vectors
 *
 * @param {Object} featuresA - First feature vector
 * @param {Object} featuresB - Second feature vector
 * @param {Object} weights - Feature weights (optional)
 * @returns {{ similarity: number, matches: Object, totalWeight: number }}
 */
function calculateSimilarity(featuresA, featuresB, weights = DEFAULT_WEIGHTS) {
  let weightedScore = 0;
  let totalWeight = 0;
  const matches = {};

  const allFeatures = features.getAllFeatureNames();

  for (const featureName of allFeatures) {
    const valA = featuresA[featureName];
    const valB = featuresB[featureName];
    const weight = weights[featureName] || 1.0;

    // Skip if either value is missing
    if (valA === undefined || valA === null || valB === undefined || valB === null) {
      continue;
    }

    totalWeight += weight;
    const definition = features.getFeatureDefinition(featureName);

    let score = 0;

    if (definition?.type === 'binary') {
      // Binary: exact match only
      score = valA === valB ? 1 : 0;
    } else if (definition?.type === 'categorical' || definition?.type === 'ordinal' || definition?.type === 'discrete') {
      // Categorical: exact match only
      score = valA === valB ? 1 : 0;
    } else if (definition?.type === 'continuous') {
      // Continuous: within 10% = 0.5, exact = 1
      const range = definition.range;
      if (range) {
        const [min, max] = range;
        const rangeSize = max - min;
        const diff = Math.abs(valA - valB);
        const diffPercent = diff / rangeSize;

        if (diffPercent === 0) {
          score = 1;
        } else if (diffPercent <= 0.1) {
          score = 0.5 + 0.5 * (1 - diffPercent / 0.1);
        } else if (diffPercent <= 0.2) {
          score = 0.25;
        } else {
          score = 0;
        }
      } else {
        // No range defined, use relative comparison
        const avg = (Math.abs(valA) + Math.abs(valB)) / 2;
        if (avg === 0) {
          score = valA === valB ? 1 : 0;
        } else {
          const diffPercent = Math.abs(valA - valB) / avg;
          if (diffPercent === 0) {
            score = 1;
          } else if (diffPercent <= 0.1) {
            score = 0.5 + 0.5 * (1 - diffPercent / 0.1);
          } else if (diffPercent <= 0.2) {
            score = 0.25;
          } else {
            score = 0;
          }
        }
      }
    }

    weightedScore += score * weight;
    matches[featureName] = { valueA: valA, valueB: valB, score, weight };
  }

  const similarity = totalWeight > 0 ? weightedScore / totalWeight : 0;

  return {
    similarity,
    matches,
    totalWeight,
    weightedScore,
  };
}

/**
 * Find historical dates matching a feature profile
 *
 * @param {Object} targetFeatures - Feature profile to match
 * @param {Array} historicalData - Array of historical feature records
 * @param {Object} options - Matching options
 * @returns {Array} Matching dates with similarity scores
 */
function findMatchingDates(targetFeatures, historicalData, options = {}) {
  const {
    threshold = 0.80, // 80% similarity threshold per spec
    limit = 20,
    weights = DEFAULT_WEIGHTS,
    excludeDate = null, // Exclude today's date if present
  } = options;

  const matches = [];

  for (const record of historicalData) {
    // Skip if this is the target date
    if (excludeDate && record.date === excludeDate) {
      continue;
    }

    const result = calculateSimilarity(targetFeatures, record, weights);

    if (result.similarity >= threshold) {
      matches.push({
        date: record.date,
        similarity: result.similarity,
        matchDetails: result.matches,
        outcomes: extractRecordOutcomes(record),
      });
    }
  }

  // Sort by similarity (descending)
  matches.sort((a, b) => b.similarity - a.similarity);

  return matches.slice(0, limit);
}

/**
 * Extract outcome values from a historical record
 *
 * @param {Object} record
 * @returns {Object}
 */
function extractRecordOutcomes(record) {
  const outcomeNames = outcomes.getAllOutcomeNames();
  const result = {};

  for (const name of outcomeNames) {
    if (record[name] !== undefined) {
      result[name] = record[name];
    }
  }

  return result;
}

/**
 * Analyze outcomes from matching historical dates
 *
 * @param {Array} matches - Array of matching dates with outcomes
 * @returns {Object} Outcome analysis
 */
function analyzeMatchOutcomes(matches) {
  if (matches.length === 0) {
    return { insufficient: true, matchCount: 0 };
  }

  const outcomeNames = outcomes.getAllOutcomeNames();
  const analysis = {};

  for (const outcomeName of outcomeNames) {
    const values = matches
      .filter((m) => m.outcomes[outcomeName] !== undefined)
      .map((m) => ({ value: m.outcomes[outcomeName], similarity: m.similarity }));

    if (values.length === 0) continue;

    // Weighted average based on similarity
    let weightedSum = 0;
    let totalWeight = 0;
    let trueCount = 0;

    for (const v of values) {
      const val = v.value === true || v.value === 1 ? 1 : 0;
      weightedSum += val * v.similarity;
      totalWeight += v.similarity;
      trueCount += val;
    }

    const weightedProbability = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const simpleProbability = trueCount / values.length;

    analysis[outcomeName] = {
      matchCount: values.length,
      occurrences: trueCount,
      simpleProbability,
      weightedProbability,
      description: outcomes.formatOutcomeName(outcomeName),
    };
  }

  return {
    insufficient: matches.length < 5,
    matchCount: matches.length,
    avgSimilarity: matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length,
    outcomes: analysis,
  };
}

/**
 * Group and analyze matches (per spec 23/24)
 *
 * @param {Array} matches - Matching historical dates
 * @returns {Object} Grouped analysis
 */
function groupAndAnalyzeMatches(matches) {
  if (matches.length === 0) {
    return {
      matchCount: 0,
      insufficient: true,
      message: 'No matching historical dates found',
    };
  }

  // Analyze outcome distributions
  const outcomeAnalysis = analyzeMatchOutcomes(matches);

  // Find the strongest outcome signals
  const strongSignals = Object.entries(outcomeAnalysis.outcomes || {})
    .filter(([_, data]) => data.matchCount >= 5)
    .map(([name, data]) => ({
      outcome: name,
      ...data,
      strength: Math.abs(data.weightedProbability - 0.5), // Distance from 50%
    }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);

  // Get date distribution
  const dates = matches.map((m) => m.date).sort();
  const dateRange = dates.length > 0 ? {
    earliest: dates[0],
    latest: dates[dates.length - 1],
  } : null;

  return {
    matchCount: matches.length,
    avgSimilarity: outcomeAnalysis.avgSimilarity,
    insufficient: outcomeAnalysis.insufficient,
    dateRange,
    strongSignals,
    allOutcomes: outcomeAnalysis.outcomes,
    topMatches: matches.slice(0, 5).map((m) => ({
      date: m.date,
      similarity: (m.similarity * 100).toFixed(1) + '%',
    })),
  };
}

/**
 * Generate pattern alert if similarity is high enough
 *
 * @param {Object} targetFeatures - Today's features
 * @param {Array} historicalData - Historical data
 * @param {Object} options
 * @returns {Object|null} Pattern alert or null
 */
function generatePatternAlert(targetFeatures, historicalData, options = {}) {
  const { threshold = 0.85 } = options;

  const matches = findMatchingDates(targetFeatures, historicalData, {
    threshold,
    limit: 10,
    excludeDate: targetFeatures.date,
  });

  if (matches.length === 0) {
    return null;
  }

  const analysis = groupAndAnalyzeMatches(matches);

  if (analysis.insufficient || analysis.matchCount < 3) {
    return null;
  }

  // Generate alert text
  const topSignals = analysis.strongSignals.filter((s) => s.strength > 0.15);

  if (topSignals.length === 0) {
    return null;
  }

  const alert = {
    type: 'pattern_match',
    matchCount: analysis.matchCount,
    avgSimilarity: analysis.avgSimilarity,
    topMatches: analysis.topMatches,
    signals: topSignals.map((s) => ({
      outcome: s.outcome,
      description: s.description,
      historicalRate: (s.weightedProbability * 100).toFixed(0) + '%',
      sampleSize: s.matchCount,
      direction: s.weightedProbability > 0.5 ? 'likely' : 'unlikely',
    })),
    message: `Found ${analysis.matchCount} similar days in history (avg ${(analysis.avgSimilarity * 100).toFixed(0)}% match)`,
  };

  return alert;
}

/**
 * Get key matching features between today and a historical date
 *
 * @param {Object} similarityResult - Result from calculateSimilarity
 * @returns {Array} Key matching features
 */
function getKeyMatchingFeatures(similarityResult) {
  const { matches } = similarityResult;

  return Object.entries(matches)
    .filter(([_, data]) => data.score >= 0.5)
    .sort((a, b) => b[1].weight * b[1].score - a[1].weight * a[1].score)
    .slice(0, 10)
    .map(([name, data]) => ({
      feature: name,
      description: features.getFeatureDefinition(name)?.description || name,
      todayValue: data.valueA,
      matchValue: data.valueB,
      score: data.score,
    }));
}

module.exports = {
  // Core functions
  calculateSimilarity,
  findMatchingDates,
  analyzeMatchOutcomes,
  groupAndAnalyzeMatches,

  // Alerts
  generatePatternAlert,

  // Helpers
  getKeyMatchingFeatures,
  extractRecordOutcomes,

  // Constants
  DEFAULT_WEIGHTS,
};
