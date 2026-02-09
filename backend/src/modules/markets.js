/**
 * Markets Module - Financial Market Data Collector
 *
 * Collects market data from multiple sources:
 * - Yahoo Finance: SPX, VIX, Gold, DXY
 * - CoinGecko: Bitcoin price and 24h change
 * - Alternative.me: Crypto Fear & Greed Index
 *
 * Update frequency: Every 3 hours
 */

const axios = require('axios');

// yahoo-finance2 is ESM-only, so we need to use dynamic import
let yahooFinance = null;
async function getYahooFinance() {
  if (!yahooFinance) {
    try {
      const module = await import('yahoo-finance2');
      const YahooFinance = module.default;
      // v2.x default export is a class constructor, not a plain object
      yahooFinance = typeof YahooFinance === 'function' ? new YahooFinance() : YahooFinance;
    } catch (error) {
      console.error('Failed to load yahoo-finance2:', error.message);
      return null;
    }
  }
  return yahooFinance;
}

// Yahoo Finance ticker symbols
const YAHOO_SYMBOLS = {
  SPX: '^GSPC',
  VIX: '^VIX',
  GOLD: 'GC=F',
  DXY: 'DX-Y.NYB',
};

// API endpoints
const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true';
const FEAR_GREED_URL = 'https://api.alternative.me/fng/?limit=1';

/**
 * Determine trend based on daily change percentage
 * @param {number} dailyChange - Percentage change
 * @returns {string} 'up', 'down', or 'stable'
 */
function determineTrend(dailyChange) {
  if (dailyChange > 0.5) return 'up';
  if (dailyChange < -0.5) return 'down';
  return 'stable';
}

/**
 * Get VIX level classification
 * @param {number} vixValue - VIX price
 * @returns {string} VIX level label
 */
function getVixLevel(vixValue) {
  if (vixValue < 15) return 'Low';
  if (vixValue <= 20) return 'Moderate';
  if (vixValue <= 30) return 'Elevated';
  return 'High';
}

/**
 * Get Fear & Greed label from value
 * @param {number} value - Fear & Greed index (0-100)
 * @returns {string} Label
 */
function getFearGreedLabel(value) {
  if (value <= 20) return 'Extreme Fear';
  if (value <= 40) return 'Fear';
  if (value <= 60) return 'Neutral';
  if (value <= 80) return 'Greed';
  return 'Extreme Greed';
}

/**
 * Determine overall sentiment based on multiple factors
 * @param {number} cryptoFearGreed - Crypto Fear & Greed value
 * @param {string} vixLevel - VIX level
 * @returns {string} Overall sentiment
 */
function determineOverallSentiment(cryptoFearGreed, vixLevel) {
  // Simple sentiment calculation based on fear/greed and VIX
  const fearGreedScore = cryptoFearGreed || 50;
  const vixScore =
    vixLevel === 'Low' ? 75 : vixLevel === 'Moderate' ? 50 : vixLevel === 'Elevated' ? 30 : 15;

  const avgScore = (fearGreedScore + vixScore) / 2;

  if (avgScore >= 60) return 'Bullish';
  if (avgScore <= 40) return 'Bearish';
  return 'Neutral';
}

/**
 * Fetch stock/index data from Yahoo Finance
 * @param {string} name - Display name (e.g., 'SPX')
 * @param {string} symbol - Yahoo Finance symbol
 * @returns {Promise<Object>} Index data or error object
 */
async function fetchYahooData(name, symbol) {
  try {
    const yf = await getYahooFinance();
    if (!yf) {
      throw new Error('yahoo-finance2 module not available');
    }

    const quote = await yf.quote(symbol);

    if (!quote || quote.regularMarketPrice === undefined) {
      throw new Error(`No data returned for ${symbol}`);
    }

    const price = quote.regularMarketPrice;
    const dailyChange = quote.regularMarketChangePercent || 0;

    return {
      price: Math.round(price * 100) / 100,
      dailyChange: Math.round(dailyChange * 100) / 100,
      trend: determineTrend(dailyChange),
    };
  } catch (error) {
    console.error(`Error fetching ${name} (${symbol}) from Yahoo Finance:`, error.message);
    return {
      price: null,
      dailyChange: null,
      trend: null,
      error: `Failed to fetch ${name}: ${error.message}`,
    };
  }
}

/**
 * Fetch Bitcoin data from CoinGecko
 * @returns {Promise<Object>} BTC data or error object
 */
async function fetchBitcoinData() {
  try {
    const response = await axios.get(COINGECKO_URL, {
      timeout: 10000,
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.data;

    if (!data || !data.bitcoin) {
      throw new Error('Invalid response from CoinGecko');
    }

    const price = data.bitcoin.usd;
    const dailyChange = data.bitcoin.usd_24h_change || 0;

    return {
      price: Math.round(price * 100) / 100,
      dailyChange: Math.round(dailyChange * 100) / 100,
      trend: determineTrend(dailyChange),
    };
  } catch (error) {
    console.error('Error fetching BTC from CoinGecko:', error.message);
    return {
      price: null,
      dailyChange: null,
      trend: null,
      error: `Failed to fetch BTC: ${error.message}`,
    };
  }
}

/**
 * Fetch Crypto Fear & Greed Index from Alternative.me
 * @returns {Promise<Object>} Fear & Greed data or error object
 */
async function fetchFearGreedIndex() {
  try {
    const response = await axios.get(FEAR_GREED_URL, {
      timeout: 10000,
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.data;

    if (!data || !data.data || !data.data[0]) {
      throw new Error('Invalid response from Alternative.me');
    }

    const fngData = data.data[0];
    const value = parseInt(fngData.value, 10);

    return {
      value,
      label: getFearGreedLabel(value),
    };
  } catch (error) {
    console.error('Error fetching Fear & Greed Index:', error.message);
    return {
      value: null,
      label: null,
      error: `Failed to fetch Fear & Greed: ${error.message}`,
    };
  }
}

/**
 * Collect all market data
 * @returns {Promise<Object>} Complete market data object
 */
async function collect() {
  const now = new Date();
  const anomalies = [];

  // Fetch all data in parallel
  const [spxData, vixData, goldData, dxyData, btcData, fearGreedData] = await Promise.all([
    fetchYahooData('SPX', YAHOO_SYMBOLS.SPX),
    fetchYahooData('VIX', YAHOO_SYMBOLS.VIX),
    fetchYahooData('GOLD', YAHOO_SYMBOLS.GOLD),
    fetchYahooData('DXY', YAHOO_SYMBOLS.DXY),
    fetchBitcoinData(),
    fetchFearGreedIndex(),
  ]);

  // Build indices object
  const indices = {
    SPX: spxData,
    VIX: vixData,
    BTC: btcData,
    GOLD: goldData,
    DXY: dxyData,
  };

  // Track any errors as anomalies
  Object.entries(indices).forEach(([name, data]) => {
    if (data.error) {
      anomalies.push({
        type: 'data_fetch_error',
        source: name,
        message: data.error,
      });
    }
  });

  if (fearGreedData.error) {
    anomalies.push({
      type: 'data_fetch_error',
      source: 'cryptoFearGreed',
      message: fearGreedData.error,
    });
  }

  // Calculate VIX level
  const vixLevel = vixData.price !== null ? getVixLevel(vixData.price) : null;

  // Build sentiment object
  const sentiment = {
    cryptoFearGreed: {
      value: fearGreedData.value,
      label: fearGreedData.label,
    },
    vixLevel,
    overallSentiment: determineOverallSentiment(fearGreedData.value, vixLevel),
  };

  return {
    timestamp: now.toISOString(),
    indices,
    sentiment,
    anomalies,
    collectedAt: now.toISOString(),
  };
}

module.exports = {
  name: 'markets',
  schedule: '0 */3 * * *', // Every 3 hours
  collect,
};
