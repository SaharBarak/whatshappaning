/**
 * Statistical functions for correlation analysis
 *
 * Implements:
 * - Wilson Confidence Interval (more accurate for proportions)
 * - Chi-Square Test (significance testing)
 * - Conditional Probability
 * - Contingency Tables
 * - p-value calculations
 *
 * Requirements from spec 23:
 * - Minimum sample size: n >= 30
 * - Wilson confidence intervals (not normal approximation)
 * - Chi-square test with p < 0.05
 * - Probability bounds: 5%-95%
 */

const config = require('../config');

/**
 * Wilson score interval for confidence intervals on proportions
 * More accurate than normal approximation, especially for small samples
 * or proportions near 0 or 1
 *
 * @param {number} successes - Number of successes
 * @param {number} total - Total sample size
 * @param {number} confidence - Confidence level (default 0.95)
 * @returns {{ low: number, high: number, center: number }}
 */
function wilsonConfidenceInterval(successes, total, confidence = 0.95) {
  if (total === 0) {
    return { low: 0, high: 1, center: 0.5 };
  }

  // Z-scores for common confidence levels
  const zScores = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };
  const z = zScores[confidence] || 1.96;

  const p = successes / total;
  const n = total;

  const denominator = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denominator;
  const margin = (z / denominator) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));

  return {
    low: Math.max(0, center - margin),
    high: Math.min(1, center + margin),
    center,
  };
}

/**
 * Build a 2x2 contingency table for categorical analysis
 *
 * @param {Array} data - Array of data objects
 * @param {string} featureName - Feature column name
 * @param {*} featureValue - Feature value to test
 * @param {string} outcomeName - Outcome column name
 * @returns {{ table: number[][], rows: number, cols: number, expected: number[][] }}
 */
function buildContingencyTable(data, featureName, featureValue, outcomeName) {
  // For categorical features, we need to handle value matching
  const matchFeature = (row) => {
    const val = row[featureName];
    if (typeof featureValue === 'string' && featureValue.startsWith('>=')) {
      const threshold = parseFloat(featureValue.slice(2));
      return val >= threshold;
    }
    if (typeof featureValue === 'string' && featureValue.startsWith('<=')) {
      const threshold = parseFloat(featureValue.slice(2));
      return val <= threshold;
    }
    if (typeof featureValue === 'string' && featureValue.startsWith('>')) {
      const threshold = parseFloat(featureValue.slice(1));
      return val > threshold;
    }
    if (typeof featureValue === 'string' && featureValue.startsWith('<')) {
      const threshold = parseFloat(featureValue.slice(1));
      return val < threshold;
    }
    return val === featureValue;
  };

  // Count occurrences
  // table[featureMatch][outcomeMatch]
  // 0 = false, 1 = true
  let a = 0; // feature=1, outcome=1
  let b = 0; // feature=1, outcome=0
  let c = 0; // feature=0, outcome=1
  let d = 0; // feature=0, outcome=0

  for (const row of data) {
    const featureMatch = matchFeature(row);
    const outcomeMatch = row[outcomeName] === true || row[outcomeName] === 1;

    if (featureMatch && outcomeMatch) a++;
    else if (featureMatch && !outcomeMatch) b++;
    else if (!featureMatch && outcomeMatch) c++;
    else d++;
  }

  const table = [
    [a, b], // feature = true
    [c, d], // feature = false
  ];

  const total = a + b + c + d;
  const rowTotals = [a + b, c + d];
  const colTotals = [a + c, b + d];

  // Calculate expected frequencies
  const expected = [
    [(rowTotals[0] * colTotals[0]) / total, (rowTotals[0] * colTotals[1]) / total],
    [(rowTotals[1] * colTotals[0]) / total, (rowTotals[1] * colTotals[1]) / total],
  ];

  return {
    table,
    rows: 2,
    cols: 2,
    expected,
    observed: { a, b, c, d },
    totals: { row: rowTotals, col: colTotals, total },
  };
}

/**
 * Calculate chi-square statistic from contingency table
 *
 * @param {{ table: number[][], expected: number[][] }} contingency
 * @returns {number} Chi-square statistic
 */
function calculateChiSquare(contingency) {
  const { table, expected } = contingency;
  let chiSq = 0;

  for (let i = 0; i < table.length; i++) {
    for (let j = 0; j < table[i].length; j++) {
      const observed = table[i][j];
      const exp = expected[i][j];
      if (exp > 0) {
        chiSq += Math.pow(observed - exp, 2) / exp;
      }
    }
  }

  return chiSq;
}

/**
 * Calculate p-value from chi-square statistic using approximation
 * Uses Wilson-Hilferty approximation for chi-square CDF
 *
 * @param {number} chiSq - Chi-square statistic
 * @param {number} df - Degrees of freedom
 * @returns {number} p-value
 */
function chiSquarePValue(chiSq, df) {
  if (chiSq <= 0) return 1;
  if (df <= 0) return 1;

  // Use incomplete gamma function approximation
  // For a 2x2 table, df = 1
  return 1 - gammaCDF(chiSq / 2, df / 2);
}

/**
 * Regularized incomplete gamma function (CDF of gamma distribution)
 * Used for chi-square p-value calculation
 *
 * @param {number} x - Value
 * @param {number} a - Shape parameter
 * @returns {number} P(X <= x) for gamma distribution
 */
function gammaCDF(x, a) {
  if (x <= 0) return 0;
  if (x >= a + 10 * Math.sqrt(a)) return 1; // Approximation for large x

  // Series expansion for lower incomplete gamma
  let sum = 0;
  let term = 1 / a;
  sum = term;

  for (let n = 1; n < 200; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < 1e-12) break;
  }

  // P(a, x) = x^a * e^(-x) * sum / Gamma(a)
  const logGamma = gammaLn(a);
  const result = Math.exp(a * Math.log(x) - x - logGamma) * sum;

  return Math.min(1, Math.max(0, result));
}

/**
 * Log of gamma function using Lanczos approximation
 *
 * @param {number} x - Input value
 * @returns {number} ln(Gamma(x))
 */
function gammaLn(x) {
  const g = 7;
  const coefficients = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - gammaLn(1 - x);
  }

  x -= 1;
  let a = coefficients[0];
  for (let i = 1; i < g + 2; i++) {
    a += coefficients[i] / (x + i);
  }

  const t = x + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Perform chi-square test for independence
 *
 * @param {Array} data - Array of data objects
 * @param {string} featureName - Feature column name
 * @param {*} featureValue - Feature value to test
 * @param {string} outcomeName - Outcome column name
 * @returns {{ chiSquare: number, df: number, pValue: number, significant: boolean }}
 */
function chiSquareTest(data, featureName, featureValue, outcomeName) {
  const contingency = buildContingencyTable(data, featureName, featureValue, outcomeName);
  const chiSq = calculateChiSquare(contingency);
  const df = (contingency.rows - 1) * (contingency.cols - 1);
  const pValue = chiSquarePValue(chiSq, df);

  return {
    chiSquare: chiSq,
    degreesOfFreedom: df,
    pValue,
    significant: pValue < config.stats.significanceThreshold,
    contingency: contingency.observed,
  };
}

/**
 * Calculate conditional probability P(outcome | feature)
 *
 * @param {Array} data - Array of data objects
 * @param {string} featureName - Feature column name
 * @param {*} featureValue - Feature value to filter on
 * @param {string} outcomeName - Outcome column name
 * @returns {{ probability: number, sampleSize: number, confidenceLow: number, confidenceHigh: number }}
 */
function conditionalProbability(data, featureName, featureValue, outcomeName) {
  // Match feature value
  const matchFeature = (row) => {
    const val = row[featureName];
    if (typeof featureValue === 'string' && featureValue.startsWith('>=')) {
      return val >= parseFloat(featureValue.slice(2));
    }
    if (typeof featureValue === 'string' && featureValue.startsWith('<=')) {
      return val <= parseFloat(featureValue.slice(2));
    }
    if (typeof featureValue === 'string' && featureValue.startsWith('>')) {
      return val > parseFloat(featureValue.slice(1));
    }
    if (typeof featureValue === 'string' && featureValue.startsWith('<')) {
      return val < parseFloat(featureValue.slice(1));
    }
    return val === featureValue;
  };

  const filtered = data.filter((d) => matchFeature(d));
  const matches = filtered.filter((d) => d[outcomeName] === true || d[outcomeName] === 1);

  const sampleSize = filtered.length;
  if (sampleSize === 0) {
    return {
      probability: null,
      sampleSize: 0,
      confidenceLow: null,
      confidenceHigh: null,
      insufficient: true,
    };
  }

  const probability = matches.length / sampleSize;
  const ci = wilsonConfidenceInterval(matches.length, sampleSize, config.stats.confidenceLevel);

  return {
    probability,
    sampleSize,
    confidenceLow: ci.low,
    confidenceHigh: ci.high,
    insufficient: sampleSize < config.stats.minSampleSize,
  };
}

/**
 * Calculate base rate for an outcome
 *
 * @param {Array} data - Array of data objects
 * @param {string} outcomeName - Outcome column name
 * @returns {{ rate: number, count: number, total: number }}
 */
function baseRate(data, outcomeName) {
  const positives = data.filter((d) => d[outcomeName] === true || d[outcomeName] === 1);
  return {
    rate: data.length > 0 ? positives.length / data.length : 0,
    count: positives.length,
    total: data.length,
  };
}

/**
 * Calculate lift: how much the probability differs from base rate
 * Lift > 1 means feature increases probability
 * Lift < 1 means feature decreases probability
 *
 * @param {number} probability - Conditional probability
 * @param {number} baseRateValue - Base rate probability
 * @returns {number} Lift value
 */
function calculateLift(probability, baseRateValue) {
  if (baseRateValue === 0) return probability > 0 ? Infinity : 1;
  return probability / baseRateValue;
}

/**
 * Test a combination of features against an outcome
 *
 * @param {Array} data - Array of data objects
 * @param {Array<{ name: string, value: * }>} features - Array of feature conditions
 * @param {string} outcomeName - Outcome column name
 * @returns {Object} Correlation result
 */
function testFeatureCombination(data, features, outcomeName) {
  // Match all feature conditions
  const matchFeature = (row, feature) => {
    const val = row[feature.name];
    const featureValue = feature.value;

    if (typeof featureValue === 'string' && featureValue.startsWith('>=')) {
      return val >= parseFloat(featureValue.slice(2));
    }
    if (typeof featureValue === 'string' && featureValue.startsWith('<=')) {
      return val <= parseFloat(featureValue.slice(2));
    }
    if (typeof featureValue === 'string' && featureValue.startsWith('>')) {
      return val > parseFloat(featureValue.slice(1));
    }
    if (typeof featureValue === 'string' && featureValue.startsWith('<')) {
      return val < parseFloat(featureValue.slice(1));
    }
    return val === featureValue;
  };

  const filtered = data.filter((d) => features.every((f) => matchFeature(d, f)));
  const sampleSize = filtered.length;

  if (sampleSize < config.stats.minSampleSize) {
    return {
      insufficient: true,
      sampleSize,
      features,
      outcome: outcomeName,
    };
  }

  const matches = filtered.filter((d) => d[outcomeName] === true || d[outcomeName] === 1);
  const probability = matches.length / sampleSize;
  const ci = wilsonConfidenceInterval(matches.length, sampleSize, config.stats.confidenceLevel);
  const base = baseRate(data, outcomeName);

  return {
    probability,
    sampleSize,
    confidenceLow: ci.low,
    confidenceHigh: ci.high,
    baseRate: base.rate,
    lift: calculateLift(probability, base.rate),
    insufficient: false,
    features,
    outcome: outcomeName,
  };
}

/**
 * Apply Bonferroni correction for multiple comparisons
 *
 * @param {number} pValue - Original p-value
 * @param {number} numTests - Number of tests being performed
 * @returns {number} Corrected p-value
 */
function bonferroniCorrection(pValue, numTests) {
  return Math.min(1, pValue * numTests);
}

/**
 * Apply Benjamini-Hochberg FDR correction
 *
 * @param {Array<{ pValue: number }>} results - Array of results with p-values
 * @returns {Array} Results with adjusted p-values
 */
function benjaminiHochbergCorrection(results) {
  if (!results.length) return results;

  // Sort by p-value
  const sorted = results
    .map((r, i) => ({ ...r, originalIndex: i }))
    .sort((a, b) => a.pValue - b.pValue);

  const n = sorted.length;

  // Calculate adjusted p-values
  sorted.forEach((r, i) => {
    const rank = i + 1;
    r.adjustedPValue = (r.pValue * n) / rank;
  });

  // Ensure monotonicity (cumulative minimum from right to left)
  for (let i = n - 2; i >= 0; i--) {
    sorted[i].adjustedPValue = Math.min(sorted[i].adjustedPValue, sorted[i + 1].adjustedPValue);
  }

  // Cap at 1
  sorted.forEach((r) => {
    r.adjustedPValue = Math.min(1, r.adjustedPValue);
  });

  // Restore original order
  const result = new Array(n);
  sorted.forEach((r) => {
    result[r.originalIndex] = {
      ...r,
      significant: r.adjustedPValue < config.stats.significanceThreshold,
    };
    delete result[r.originalIndex].originalIndex;
  });

  return result;
}

/**
 * Bound probability to valid range [5%, 95%]
 *
 * @param {number} probability - Raw probability
 * @returns {number} Bounded probability
 */
function boundProbability(probability) {
  const { min, max } = config.stats.probabilityBounds;
  return Math.min(max, Math.max(min, probability));
}

/**
 * Determine confidence level based on sample size, CI width, and p-value
 * Per spec 24:
 * - Very High: n > 200, CI width < 0.15, p < 0.001
 * - High: n > 100, CI width < 0.20, p < 0.01
 * - Medium: n > 50, CI width < 0.30, p < 0.05
 * - Low: n > 30, CI width < 0.40, p < 0.10
 * - Insufficient: n < 30 or p > 0.10
 *
 * @param {number} sampleSize
 * @param {number} ciWidth - Confidence interval width
 * @param {number} pValue
 * @returns {string} Confidence level
 */
function getConfidenceLevel(sampleSize, ciWidth, pValue) {
  if (sampleSize < 30 || pValue > 0.10) return 'insufficient';
  if (sampleSize > 200 && ciWidth < 0.15 && pValue < 0.001) return 'very_high';
  if (sampleSize > 100 && ciWidth < 0.20 && pValue < 0.01) return 'high';
  if (sampleSize > 50 && ciWidth < 0.30 && pValue < 0.05) return 'medium';
  if (sampleSize > 30 && ciWidth < 0.40 && pValue < 0.10) return 'low';
  return 'insufficient';
}

module.exports = {
  // Core statistical functions
  wilsonConfidenceInterval,
  buildContingencyTable,
  calculateChiSquare,
  chiSquarePValue,
  chiSquareTest,
  conditionalProbability,

  // Derived calculations
  baseRate,
  calculateLift,
  testFeatureCombination,

  // Multiple comparison corrections
  bonferroniCorrection,
  benjaminiHochbergCorrection,

  // Helpers
  boundProbability,
  getConfidenceLevel,

  // Internals (exported for testing)
  gammaCDF,
  gammaLn,
};
