/**
 * Outcome Targets Module
 *
 * Defines and calculates 12 binary outcomes for correlation analysis.
 * Per spec 23:
 * - Market Outcomes (6): spx_direction, spx_volatile, btc_direction, btc_volatile, vix_spike, gold_direction
 * - Geophysical Outcomes (3): major_quake, quake_above_avg, geomag_storm
 * - Sentiment Outcomes (2): sentiment_drop, fear_spike
 *
 * Note: spx_return (continuous) excluded per DECISION 4 (binary outcomes only for MVP)
 */

/**
 * Outcome definitions with thresholds
 */
const OUTCOME_DEFINITIONS = {
  // Market Outcomes (7)
  spx_direction: {
    type: 'binary',
    description: 'S&P 500 up day',
    calculation: 'close > previous_close',
    baseRateEstimate: 0.53, // Historical ~53% up days
  },
  spx_volatile: {
    type: 'binary',
    description: 'S&P 500 volatile day (|return| > 1%)',
    calculation: 'abs(return) > 0.01',
    baseRateEstimate: 0.25,
  },
  btc_direction: {
    type: 'binary',
    description: 'Bitcoin up day',
    calculation: 'close > previous_close',
    baseRateEstimate: 0.50,
  },
  btc_volatile: {
    type: 'binary',
    description: 'Bitcoin volatile day (|return| > 3%)',
    calculation: 'abs(return) > 0.03',
    baseRateEstimate: 0.35,
  },
  vix_spike: {
    type: 'binary',
    description: 'VIX spike (up > 10%)',
    calculation: 'vix_change > 0.10',
    baseRateEstimate: 0.10,
  },
  gold_direction: {
    type: 'binary',
    description: 'Gold up day',
    calculation: 'close > previous_close',
    baseRateEstimate: 0.51,
  },

  // Geophysical Outcomes (3)
  major_quake: {
    type: 'binary',
    description: 'Major earthquake (M6+) within 24h',
    calculation: 'max_magnitude >= 6.0',
    baseRateEstimate: 0.15,
  },
  quake_above_avg: {
    type: 'binary',
    description: 'Earthquake count above 30-day average',
    calculation: 'quake_count > 30day_avg',
    baseRateEstimate: 0.50,
  },
  geomag_storm: {
    type: 'binary',
    description: 'Geomagnetic storm (Kp >= 5)',
    calculation: 'kp_index >= 5',
    baseRateEstimate: 0.08,
  },

  // Sentiment Outcomes (2)
  sentiment_drop: {
    type: 'binary',
    description: 'Sentiment aggregate drops > 10 points',
    calculation: 'sentiment_change < -10',
    baseRateEstimate: 0.10,
  },
  fear_spike: {
    type: 'binary',
    description: 'Fear spike (Fear/Greed index < 25)',
    calculation: 'fear_greed < 25',
    baseRateEstimate: 0.15,
  },
};

/**
 * Calculate market outcomes from price data
 *
 * @param {Object} currentPrices - Today's market data
 * @param {Object} previousPrices - Previous day's market data
 * @returns {Object} Market outcomes
 */
function calculateMarketOutcomes(currentPrices, previousPrices) {
  const outcomes = {};

  // S&P 500 outcomes
  if (currentPrices.spx && previousPrices.spx) {
    const spxReturn = (currentPrices.spx.close - previousPrices.spx.close) / previousPrices.spx.close;
    outcomes.spx_direction = currentPrices.spx.close > previousPrices.spx.close;
    outcomes.spx_volatile = Math.abs(spxReturn) > 0.01;
    outcomes.spx_return = spxReturn; // Keep for reference even though not used in binary analysis
  }

  // Bitcoin outcomes
  if (currentPrices.btc && previousPrices.btc) {
    const btcReturn = (currentPrices.btc.close - previousPrices.btc.close) / previousPrices.btc.close;
    outcomes.btc_direction = currentPrices.btc.close > previousPrices.btc.close;
    outcomes.btc_volatile = Math.abs(btcReturn) > 0.03;
  }

  // VIX outcomes
  if (currentPrices.vix && previousPrices.vix) {
    const vixChange = (currentPrices.vix.close - previousPrices.vix.close) / previousPrices.vix.close;
    outcomes.vix_spike = vixChange > 0.10;
  }

  // Gold outcomes
  if (currentPrices.gold && previousPrices.gold) {
    outcomes.gold_direction = currentPrices.gold.close > previousPrices.gold.close;
  }

  return outcomes;
}

/**
 * Calculate geophysical outcomes
 *
 * @param {Object} geoData - Current geophysical data
 * @param {Object} historicalAvg - 30-day averages
 * @returns {Object} Geophysical outcomes
 */
function calculateGeophysicalOutcomes(geoData, historicalAvg = {}) {
  const outcomes = {};

  // Major earthquake (M6+)
  if (geoData.maxMagnitude !== undefined) {
    outcomes.major_quake = geoData.maxMagnitude >= 6.0;
  }

  // Earthquake count above average
  if (geoData.quakeCount !== undefined) {
    const avg = historicalAvg.quakeCount || 50; // Default average if not provided
    outcomes.quake_above_avg = geoData.quakeCount > avg;
  }

  // Geomagnetic storm (from solar/geophysical data)
  if (geoData.kpIndex !== undefined) {
    outcomes.geomag_storm = geoData.kpIndex >= 5;
  }

  return outcomes;
}

/**
 * Calculate sentiment outcomes
 *
 * @param {Object} currentSentiment - Current sentiment data
 * @param {Object} previousSentiment - Previous day's sentiment
 * @returns {Object} Sentiment outcomes
 */
function calculateSentimentOutcomes(currentSentiment, previousSentiment = {}) {
  const outcomes = {};

  // Sentiment drop
  if (currentSentiment.aggregate !== undefined && previousSentiment.aggregate !== undefined) {
    const change = currentSentiment.aggregate - previousSentiment.aggregate;
    outcomes.sentiment_drop = change < -10;
  }

  // Fear spike (Fear/Greed < 25)
  const fearGreed = currentSentiment.cnnFearGreed ?? currentSentiment.fearGreed ?? currentSentiment.aggregate;
  if (fearGreed !== undefined) {
    outcomes.fear_spike = fearGreed < 25;
  }

  return outcomes;
}

/**
 * Extract all outcomes from module data
 *
 * @param {Object} currentData - Current module data
 * @param {Object} previousData - Previous day's module data
 * @param {Object} historicalAvg - Historical averages for comparison
 * @returns {Object} All binary outcomes
 */
function extractOutcomes(currentData, previousData = {}, historicalAvg = {}) {
  const outcomes = {};

  // Market outcomes
  const marketOutcomes = calculateMarketOutcomes(
    currentData.markets || {},
    previousData.markets || {}
  );
  Object.assign(outcomes, marketOutcomes);

  // Geophysical outcomes
  const geoSource = currentData.geophysical || currentData.solar || {};
  const geoOutcomes = calculateGeophysicalOutcomes(
    {
      maxMagnitude: geoSource.maxMagnitude,
      quakeCount: geoSource.quakeCount || geoSource.count,
      kpIndex: currentData.solar?.kpIndex || geoSource.kpIndex,
    },
    historicalAvg
  );
  Object.assign(outcomes, geoOutcomes);

  // Sentiment outcomes
  const sentimentOutcomes = calculateSentimentOutcomes(
    currentData.sentiment || {},
    previousData.sentiment || {}
  );
  Object.assign(outcomes, sentimentOutcomes);

  return outcomes;
}

/**
 * Get all outcome names
 * @returns {string[]} Array of outcome names
 */
function getAllOutcomeNames() {
  return Object.keys(OUTCOME_DEFINITIONS);
}

/**
 * Get outcome definition
 * @param {string} name
 * @returns {Object|null}
 */
function getOutcomeDefinition(name) {
  return OUTCOME_DEFINITIONS[name] || null;
}

/**
 * Get estimated base rate for an outcome
 * @param {string} name
 * @returns {number}
 */
function getEstimatedBaseRate(name) {
  const def = OUTCOME_DEFINITIONS[name];
  return def?.baseRateEstimate || 0.5;
}

/**
 * Format outcome name for display
 * @param {string} name
 * @returns {string}
 */
function formatOutcomeName(name) {
  const def = OUTCOME_DEFINITIONS[name];
  return def?.description || name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Categorize outcomes by type
 * @returns {Object} Outcomes grouped by category
 */
function getOutcomesByCategory() {
  return {
    market: ['spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile', 'vix_spike', 'gold_direction'],
    geophysical: ['major_quake', 'quake_above_avg', 'geomag_storm'],
    sentiment: ['sentiment_drop', 'fear_spike'],
  };
}

/**
 * Calculate all outcomes from raw data row
 * Used for building historical_features table
 *
 * @param {Object} row - Row with market, geo, and sentiment data
 * @param {Object} prevRow - Previous day's row
 * @param {Object} avgData - Rolling averages
 * @returns {Object} Calculated outcomes
 */
function calculateAllOutcomes(row, prevRow = {}, avgData = {}) {
  const outcomes = {};

  // SPX
  if (row.spx_close !== undefined && prevRow.spx_close !== undefined) {
    const ret = (row.spx_close - prevRow.spx_close) / prevRow.spx_close;
    outcomes.spx_direction = row.spx_close > prevRow.spx_close;
    outcomes.spx_volatile = Math.abs(ret) > 0.01;
    outcomes.spx_return = ret;
  }

  // BTC
  if (row.btc_close !== undefined && prevRow.btc_close !== undefined) {
    const ret = (row.btc_close - prevRow.btc_close) / prevRow.btc_close;
    outcomes.btc_direction = row.btc_close > prevRow.btc_close;
    outcomes.btc_volatile = Math.abs(ret) > 0.03;
  }

  // VIX
  if (row.vix_close !== undefined && prevRow.vix_close !== undefined) {
    const change = (row.vix_close - prevRow.vix_close) / prevRow.vix_close;
    outcomes.vix_spike = change > 0.10;
  }

  // Gold
  if (row.gold_close !== undefined && prevRow.gold_close !== undefined) {
    outcomes.gold_direction = row.gold_close > prevRow.gold_close;
  }

  // Major quake
  if (row.quake_max_magnitude !== undefined) {
    outcomes.major_quake = row.quake_max_magnitude >= 6.0;
  }

  // Quake above average
  if (row.quake_count !== undefined) {
    outcomes.quake_above_avg = row.quake_count > (avgData.quake_count || 50);
  }

  // Geomag storm
  if (row.kp_index !== undefined) {
    outcomes.geomag_storm = row.kp_index >= 5;
  }

  // Sentiment drop
  if (row.sentiment_aggregate !== undefined && prevRow.sentiment_aggregate !== undefined) {
    outcomes.sentiment_drop = (row.sentiment_aggregate - prevRow.sentiment_aggregate) < -10;
  }

  // Fear spike
  const fg = row.fear_greed_cnn ?? row.fear_greed_crypto ?? row.sentiment_aggregate;
  if (fg !== undefined) {
    outcomes.fear_spike = fg < 25;
  }

  return outcomes;
}

module.exports = {
  // Definitions
  OUTCOME_DEFINITIONS,

  // Calculation functions
  calculateMarketOutcomes,
  calculateGeophysicalOutcomes,
  calculateSentimentOutcomes,
  extractOutcomes,
  calculateAllOutcomes,

  // Helpers
  getAllOutcomeNames,
  getOutcomeDefinition,
  getEstimatedBaseRate,
  formatOutcomeName,
  getOutcomesByCategory,
};
