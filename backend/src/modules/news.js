/**
 * News Module - News Headlines Collector with AI Theme Analysis
 *
 * Collects news from multiple RSS sources:
 * - Reuters Agency Feed
 * - AP Top News (via RSSHub)
 * - BBC World News
 *
 * Uses Gemini AI for theme extraction and sentiment analysis.
 *
 * Update frequency: Every 3 hours
 */

const Parser = require('rss-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

// RSS Feed URLs
// Reuters and AP feeds are dead (404/403 as of 2025). Replaced with working alternatives.
const RSS_FEEDS = {
  BBC: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  NYT: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  NPR: 'https://feeds.npr.org/1001/rss.xml',
  AlJazeera: 'https://www.aljazeera.com/xml/rss/all.xml',
};

// Cache keys
const CACHE_KEY_HEADLINES = 'news_headlines_cache';
const CACHE_TTL = config.cache.moduleTtl; // 3 hours

// Initialize RSS parser
const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; NewsCollector/1.0)',
    Accept: 'application/rss+xml, application/xml, text/xml',
  },
});

/**
 * Fetch headlines from a single RSS feed
 * @param {string} sourceName - Name of the source (Reuters, AP, BBC)
 * @param {string} feedUrl - RSS feed URL
 * @param {number} limit - Maximum number of headlines to fetch
 * @returns {Promise<Array>} Array of headline objects
 */
async function fetchFeed(sourceName, feedUrl, limit = 10) {
  try {
    const feed = await parser.parseURL(feedUrl);
    const items = feed.items.slice(0, limit);

    return items.map((item) => ({
      source: sourceName,
      title: item.title || '',
      description: item.contentSnippet || item.content || item.description || '',
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || null,
    }));
  } catch (error) {
    console.error(`Error fetching ${sourceName} feed:`, error.message);
    return [];
  }
}

/**
 * Fetch headlines from all RSS feeds
 * @returns {Promise<Array>} Combined array of headlines from all sources
 */
async function fetchAllFeeds() {
  const feedPromises = Object.entries(RSS_FEEDS).map(([name, url]) =>
    fetchFeed(name, url, 10)
  );

  const results = await Promise.all(feedPromises);
  return results.flat();
}

/**
 * Simple string similarity check using Jaccard index
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter((w) => w.length > 3));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Deduplicate similar stories based on title similarity
 * @param {Array} headlines - Array of headline objects
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Array} Deduplicated headlines
 */
function deduplicateHeadlines(headlines, threshold = 0.5) {
  const unique = [];

  for (const headline of headlines) {
    const isDuplicate = unique.some(
      (existing) => calculateSimilarity(existing.title, headline.title) >= threshold
    );

    if (!isDuplicate) {
      unique.push(headline);
    }
  }

  return unique;
}

/**
 * Analyze headlines using Gemini AI
 * @param {Array} headlines - Array of headline objects
 * @returns {Promise<Object>} Analysis result with themes and sentiment
 */
async function analyzeWithGemini(headlines) {
  const apiKey = config.geminiApiKey;

  if (!apiKey) {
    console.error('GEMINI_API_KEY not configured');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Prepare headlines text for analysis
    const headlinesText = headlines
      .map((h, i) => `${i + 1}. [${h.source}] ${h.title}`)
      .join('\n');

    const prompt = `Analyze these news headlines and extract 3-5 major themes. For each theme provide: name (2-4 words), count of related articles, 3-5 keywords, and sentiment (positive/negative/neutral). Also provide overall sentiment (calm/tense/positive). Return as JSON.

Headlines:
${headlinesText}

Return ONLY valid JSON in this exact format:
{
  "themes": [
    {
      "name": "Theme Name",
      "count": 5,
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "sentiment": "neutral"
    }
  ],
  "overallSentiment": "tense"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const analysis = JSON.parse(jsonStr);
    return analysis;
  } catch (error) {
    console.error('Error analyzing with Gemini:', error.message);
    return null;
  }
}

/**
 * Get cached headlines or return empty array
 * @returns {Array} Cached headlines or empty array
 */
function getCachedHeadlines() {
  const cached = cache.get(CACHE_KEY_HEADLINES);
  return cached || [];
}

/**
 * Cache headlines for fallback use
 * @param {Array} headlines - Headlines to cache
 */
function cacheHeadlines(headlines) {
  cache.set(CACHE_KEY_HEADLINES, headlines, CACHE_TTL);
}

/**
 * Collect news data with theme analysis
 * @returns {Promise<Object>} Complete news analysis object
 */
async function collect() {
  const now = new Date();
  let headlines = [];
  let usedCache = false;

  // Fetch RSS feeds
  try {
    headlines = await fetchAllFeeds();

    if (headlines.length === 0) {
      // If no headlines fetched, try cache
      headlines = getCachedHeadlines();
      usedCache = headlines.length > 0;
      if (usedCache) {
        logger.debug('Using cached headlines due to RSS fetch failure');
      }
    } else {
      // Cache successful fetch
      cacheHeadlines(headlines);
    }
  } catch (error) {
    logger.error('Error fetching RSS feeds:', error.message);
    headlines = getCachedHeadlines();
    usedCache = headlines.length > 0;
  }

  // Deduplicate headlines
  const uniqueHeadlines = deduplicateHeadlines(headlines);

  // Count articles per source
  const sourceCounts = {};
  for (const h of uniqueHeadlines) {
    sourceCounts[h.source] = (sourceCounts[h.source] || 0) + 1;
  }
  const sources = Object.keys(sourceCounts);

  // Attempt Gemini analysis
  let analysis = null;
  if (uniqueHeadlines.length > 0) {
    analysis = await analyzeWithGemini(uniqueHeadlines);
  }

  // Build response
  if (analysis && analysis.themes && analysis.themes.length > 0) {
    // Determine dominant theme (highest count)
    const dominantTheme = analysis.themes.reduce((prev, curr) =>
      curr.count > prev.count ? curr : prev
    ).name;

    return {
      timestamp: now.toISOString(),
      articleCount: uniqueHeadlines.length,
      sources,
      themes: analysis.themes,
      dominantTheme,
      overallSentiment: analysis.overallSentiment || 'neutral',
      collectedAt: now.toISOString(),
    };
  } else {
    // Fallback when Gemini analysis fails
    console.warn('Gemini analysis unavailable, returning raw headline count');

    return {
      timestamp: now.toISOString(),
      articleCount: uniqueHeadlines.length,
      sources,
      themes: [],
      dominantTheme: 'Analysis unavailable',
      overallSentiment: 'Analysis unavailable',
      collectedAt: now.toISOString(),
      note: usedCache
        ? 'Using cached headlines; AI analysis unavailable'
        : 'AI analysis unavailable',
    };
  }
}

module.exports = {
  name: 'news',
  schedule: '0 */3 * * *', // Every 3 hours
  collect,
};
