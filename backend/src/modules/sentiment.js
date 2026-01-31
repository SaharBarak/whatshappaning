/**
 * Sentiment Module - Multi-Source Sentiment Data Collector
 *
 * Collects sentiment data from multiple sources:
 * - Crypto Fear & Greed Index (Alternative.me)
 * - CNN Fear & Greed Index (unofficial, may require scraping)
 * - Google Trends (fear vs optimism terms analysis)
 * - News Sentiment (from news module's Gemini analysis)
 *
 * Update frequency: Every 3 hours
 */

const axios = require('axios');
const googleTrends = require('google-trends-api');
const newsModule = require('./news');
const logger = require('../utils/logger');

// API endpoints
const CRYPTO_FEAR_GREED_URL = 'https://api.alternative.me/fng/?limit=1';
const CNN_FEAR_GREED_URL = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';

// Google Trends configuration
const FEAR_TERMS = ['recession', 'market crash', 'anxiety', 'end of world', 'war'];
const OPTIMISM_TERMS = ['bull market', 'investment opportunity', 'hope', 'recovery'];
const GOOGLE_TRENDS_REGION = 'US';
const GOOGLE_TRENDS_CACHE_HOURS = 6;

// Aggregation weights matching spec 22 (redistributed without socialMood)
// Original spec: cnn=0.25, crypto=0.15, trends=0.20, news=0.20, social=0.20
// Without social (unavailable): redistribute proportionally
const WEIGHTS = {
  cnnFearGreed: 0.3125, // 0.25 / 0.80
  cryptoFearGreed: 0.1875, // 0.15 / 0.80
  googleTrends: 0.25, // 0.20 / 0.80
  newsSentiment: 0.25, // 0.20 / 0.80
};

// In-memory cache for Google Trends data (rate-limited)
let googleTrendsCache = {
  data: null,
  timestamp: null,
};

// In-memory storage for previous day's values (for 24h change calculation)
let previousValues = {
  cryptoFearGreed: null,
  cnnFearGreed: null,
  googleTrendsScore: null,
  newsSentimentScore: null,
};

/**
 * Get sentiment label from score (0-100)
 * @param {number} score - Sentiment score
 * @returns {string} Sentiment label
 */
function getSentimentLabel(score) {
  if (score <= 20) return 'Extreme Fear';
  if (score <= 40) return 'Fear';
  if (score <= 60) return 'Neutral';
  if (score <= 80) return 'Greed';
  return 'Extreme Greed';
}

/**
 * Determine trend based on 24h change
 * @param {number} change24h - Change value
 * @returns {string} 'rising', 'falling', or 'stable'
 */
function determineTrend(change24h) {
  if (change24h === null || change24h === undefined) return 'stable';
  if (change24h > 1) return 'rising';
  if (change24h < -1) return 'falling';
  return 'stable';
}

/**
 * Fetch Crypto Fear & Greed Index from Alternative.me
 * @returns {Promise<Object|null>} Data object or null on failure
 */
async function fetchCryptoFearGreed() {
  try {
    const response = await axios.get(CRYPTO_FEAR_GREED_URL, {
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
    const score = parseInt(fngData.value, 10);

    // Calculate 24h change
    const change24h =
      previousValues.cryptoFearGreed !== null ? score - previousValues.cryptoFearGreed : null;

    // Store current value for next comparison
    previousValues.cryptoFearGreed = score;

    return {
      score,
      label: getSentimentLabel(score),
      change24h,
    };
  } catch (error) {
    console.error('Error fetching Crypto Fear & Greed:', error.message);
    return null;
  }
}

/**
 * Fetch CNN Fear & Greed Index (unofficial API, may fail)
 * @returns {Promise<Object|null>} Data object or null on failure
 */
async function fetchCNNFearGreed() {
  try {
    const response = await axios.get(CNN_FEAR_GREED_URL, {
      timeout: 10000,
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const data = response.data;

    if (!data || typeof data.fear_and_greed === 'undefined') {
      throw new Error('Invalid response from CNN Fear & Greed API');
    }

    // CNN API returns fear_and_greed object with score
    const fngData = data.fear_and_greed;
    const score = Math.round(fngData.score);

    // Calculate 24h change
    const change24h =
      previousValues.cnnFearGreed !== null ? score - previousValues.cnnFearGreed : null;

    // Store current value for next comparison
    previousValues.cnnFearGreed = score;

    return {
      score,
      label: getSentimentLabel(score),
      change24h,
    };
  } catch (error) {
    console.error('Error fetching CNN Fear & Greed (unofficial API may be unavailable):', error.message);
    return null;
  }
}

/**
 * Fetch interest data for a set of terms from Google Trends
 * @param {string[]} terms - Array of search terms
 * @returns {Promise<number>} Average interest score
 */
async function fetchTermsInterest(terms) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Past 7 days

    const results = await googleTrends.interestOverTime({
      keyword: terms,
      startTime: startDate,
      endTime: endDate,
      geo: GOOGLE_TRENDS_REGION,
    });

    const parsedResults = JSON.parse(results);

    if (!parsedResults.default || !parsedResults.default.timelineData) {
      throw new Error('Invalid Google Trends response');
    }

    const timelineData = parsedResults.default.timelineData;

    if (timelineData.length === 0) {
      return 0;
    }

    // Get the most recent data point and average all term values
    const latestData = timelineData[timelineData.length - 1];
    const values = latestData.value || [];
    const avgInterest = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    return avgInterest;
  } catch (error) {
    console.error('Error fetching Google Trends interest:', error.message);
    return 0;
  }
}

/**
 * Fetch Google Trends sentiment data
 * Uses fear vs optimism terms to calculate sentiment
 * @returns {Promise<Object|null>} Data object or null on failure
 */
async function fetchGoogleTrends() {
  // Check cache first (6 hour TTL due to rate limiting)
  const now = Date.now();
  const cacheAgeMs = GOOGLE_TRENDS_CACHE_HOURS * 60 * 60 * 1000;

  if (googleTrendsCache.data && googleTrendsCache.timestamp && now - googleTrendsCache.timestamp < cacheAgeMs) {
    logger.debug('Using cached Google Trends data');
    return googleTrendsCache.data;
  }

  try {
    // Fetch interest for both fear and optimism terms
    const [fearInterest, optimismInterest] = await Promise.all([
      fetchTermsInterest(FEAR_TERMS),
      fetchTermsInterest(OPTIMISM_TERMS),
    ]);

    // Calculate fear index (0-100): higher fear interest = higher fear index
    // Calculate optimism index (0-100): higher optimism interest = higher optimism index
    const fearIndex = Math.min(100, Math.round(fearInterest));
    const optimismIndex = Math.min(100, Math.round(optimismInterest));

    // Get dominant terms (simplified - just report the term categories)
    const dominantTerms = [];
    if (fearInterest > optimismInterest) {
      dominantTerms.push(...FEAR_TERMS.slice(0, 2));
    } else {
      dominantTerms.push(...OPTIMISM_TERMS.slice(0, 2));
    }

    const result = {
      fearIndex,
      optimismIndex,
      dominantTerms,
    };

    // Cache the result
    googleTrendsCache = {
      data: result,
      timestamp: now,
    };

    return result;
  } catch (error) {
    console.error('Error fetching Google Trends data:', error.message);
    return null;
  }
}

/**
 * Convert Google Trends data to a 0-100 sentiment score
 * Higher optimism / lower fear = higher score (more bullish)
 * @param {Object} trendsData - Google Trends data
 * @returns {number} Score 0-100
 */
function googleTrendsToScore(trendsData) {
  if (!trendsData) return 50; // Neutral if no data

  const { fearIndex, optimismIndex } = trendsData;

  // If both are 0, return neutral
  if (fearIndex === 0 && optimismIndex === 0) return 50;

  // Calculate ratio-based score
  // Higher optimism relative to fear = higher score
  const total = fearIndex + optimismIndex;
  if (total === 0) return 50;

  const optimismRatio = optimismIndex / total;
  const score = Math.round(optimismRatio * 100);

  return Math.max(0, Math.min(100, score));
}

/**
 * Fetch news sentiment from the news module
 * Converts qualitative sentiment to a 0-100 score
 * @returns {Promise<Object|null>} News sentiment data or null on failure
 */
async function fetchNewsSentiment() {
  try {
    const newsData = await newsModule.collect();

    if (!newsData || newsData.overallSentiment === 'Analysis unavailable') {
      return null;
    }

    // Convert qualitative sentiment to 0-100 score
    // calm = 50 (neutral), tense = 25 (fear), positive = 75 (greed), neutral = 50
    const sentimentScores = {
      calm: 50,
      neutral: 50,
      tense: 25,
      positive: 75,
    };

    const sentiment = newsData.overallSentiment.toLowerCase();
    const score = sentimentScores[sentiment] || 50;

    // Calculate 24h change
    const change24h =
      previousValues.newsSentimentScore !== null ? score - previousValues.newsSentimentScore : null;

    // Store current value for next comparison
    previousValues.newsSentimentScore = score;

    return {
      score,
      dominantTone: newsData.overallSentiment,
      dominantTheme: newsData.dominantTheme,
      articleCount: newsData.articleCount,
      change24h,
    };
  } catch (error) {
    console.error('Error fetching news sentiment:', error.message);
    return null;
  }
}

/**
 * Calculate aggregate sentiment from available sources
 * Redistributes weights if some sources are unavailable
 * @param {Object|null} cryptoData - Crypto Fear & Greed data
 * @param {Object|null} cnnData - CNN Fear & Greed data
 * @param {Object|null} trendsData - Google Trends data
 * @param {Object|null} newsData - News sentiment data
 * @returns {Object} Aggregate sentiment object
 */
function calculateAggregate(cryptoData, cnnData, trendsData, newsData) {
  const sources = [];
  let totalWeight = 0;

  // Collect available sources with their weights
  if (cryptoData && cryptoData.score !== null) {
    sources.push({ score: cryptoData.score, weight: WEIGHTS.cryptoFearGreed, name: 'crypto' });
    totalWeight += WEIGHTS.cryptoFearGreed;
  }

  if (cnnData && cnnData.score !== null) {
    sources.push({ score: cnnData.score, weight: WEIGHTS.cnnFearGreed, name: 'cnn' });
    totalWeight += WEIGHTS.cnnFearGreed;
  }

  if (trendsData) {
    const trendsScore = googleTrendsToScore(trendsData);
    sources.push({ score: trendsScore, weight: WEIGHTS.googleTrends, name: 'trends' });
    totalWeight += WEIGHTS.googleTrends;

    // Store for 24h change calculation
    previousValues.googleTrendsScore = trendsScore;
  }

  if (newsData && newsData.score !== null) {
    sources.push({ score: newsData.score, weight: WEIGHTS.newsSentiment, name: 'news' });
    totalWeight += WEIGHTS.newsSentiment;
  }

  // If no sources available, return neutral
  if (sources.length === 0) {
    return {
      score: 50,
      label: 'Neutral',
      trend: 'stable',
      change24h: null,
    };
  }

  // Redistribute weights proportionally among available sources
  let weightedSum = 0;
  let weightedChangeSum = 0;
  let hasChange = false;

  for (const source of sources) {
    const adjustedWeight = source.weight / totalWeight;
    weightedSum += source.score * adjustedWeight;

    // Get 24h change for this source
    let change = null;
    if (source.name === 'crypto' && cryptoData) {
      change = cryptoData.change24h;
    } else if (source.name === 'cnn' && cnnData) {
      change = cnnData.change24h;
    } else if (source.name === 'news' && newsData) {
      change = newsData.change24h;
    }

    if (change !== null) {
      weightedChangeSum += change * adjustedWeight;
      hasChange = true;
    }
  }

  const aggregateScore = Math.round(weightedSum);
  const aggregateChange = hasChange ? Math.round(weightedChangeSum * 10) / 10 : null;

  return {
    score: aggregateScore,
    label: getSentimentLabel(aggregateScore),
    trend: determineTrend(aggregateChange),
    change24h: aggregateChange,
  };
}

/**
 * Collect all sentiment data
 * @returns {Promise<Object>} Complete sentiment data object
 */
async function collect() {
  const now = new Date();

  // Fetch all data in parallel (news sentiment last as it involves Gemini call)
  const [cryptoData, cnnData, trendsData, newsData] = await Promise.all([
    fetchCryptoFearGreed(),
    fetchCNNFearGreed(),
    fetchGoogleTrends(),
    fetchNewsSentiment(),
  ]);

  // Calculate aggregate sentiment
  const aggregate = calculateAggregate(cryptoData, cnnData, trendsData, newsData);

  // Build components object
  const components = {};

  if (cryptoData) {
    components.cryptoFearGreed = {
      score: cryptoData.score,
      label: cryptoData.label,
      change24h: cryptoData.change24h,
    };
  } else {
    components.cryptoFearGreed = {
      score: null,
      label: null,
      change24h: null,
      error: 'Failed to fetch Crypto Fear & Greed data',
    };
  }

  if (cnnData) {
    components.cnnFearGreed = {
      score: cnnData.score,
      label: cnnData.label,
      change24h: cnnData.change24h,
    };
  } else {
    components.cnnFearGreed = {
      score: null,
      label: null,
      change24h: null,
      error: 'CNN Fear & Greed API unavailable (unofficial endpoint)',
    };
  }

  if (trendsData) {
    components.googleTrends = {
      fearIndex: trendsData.fearIndex,
      optimismIndex: trendsData.optimismIndex,
      dominantTerms: trendsData.dominantTerms,
    };
  } else {
    components.googleTrends = {
      fearIndex: null,
      optimismIndex: null,
      dominantTerms: [],
      error: 'Failed to fetch Google Trends data',
    };
  }

  if (newsData) {
    components.newsSentiment = {
      score: newsData.score,
      dominantTone: newsData.dominantTone,
      dominantTheme: newsData.dominantTheme,
      articleCount: newsData.articleCount,
      change24h: newsData.change24h,
    };
  } else {
    components.newsSentiment = {
      score: null,
      dominantTone: null,
      dominantTheme: null,
      articleCount: null,
      change24h: null,
      error: 'News sentiment unavailable (requires Gemini API)',
    };
  }

  return {
    timestamp: now.toISOString(),
    aggregate,
    components,
    collectedAt: now.toISOString(),
  };
}

module.exports = {
  name: 'sentiment',
  schedule: '0 */3 * * *', // Every 3 hours
  collect,
};
