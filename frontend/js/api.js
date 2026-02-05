/**
 * API Client Module
 * Handles all communication with the backend API
 */

import { config } from './config.js';

// In-memory cache
const cache = new Map();

/**
 * Make an API request with caching and error handling
 */
async function request(endpoint, options = {}) {
  const url = `${config.apiUrl}${endpoint}`;
  const cacheKey = url;

  // Check cache
  if (config.cacheEnabled && !options.skipCache) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < config.cacheTTL) {
      return { data: cached.data, fromCache: true };
    }
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Update cache
    if (config.cacheEnabled) {
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }

    return { data, fromCache: false };
  } catch (error) {
    // Return cached data if available, even if stale
    const cached = cache.get(cacheKey);
    if (cached) {
      console.warn(`API request failed, using stale cache: ${error.message}`);
      return { data: cached.data, fromCache: true, stale: true, error: error.message };
    }
    throw error;
  }
}

/**
 * Clear the cache (or specific key)
 */
export function clearCache(key = null) {
  if (key) {
    cache.delete(`${config.apiUrl}${key}`);
  } else {
    cache.clear();
  }
}

/**
 * Get all current module data and indices
 */
export async function getCurrentData() {
  return request('/api/current');
}

/**
 * Get historical data for a specific module
 */
export async function getHistory(moduleName, days = 7) {
  return request(`/api/history/${moduleName}?days=${days}`);
}

/**
 * Get today's predictions
 */
export async function getPredictions() {
  return request('/api/predictions');
}

/**
 * Get prediction for a specific outcome
 */
export async function getPrediction(outcomeId) {
  return request(`/api/predictions/${outcomeId}`);
}

/**
 * Get all significant correlations
 */
export async function getCorrelations(filters = {}) {
  const params = new URLSearchParams();
  if (filters.feature) params.set('feature', filters.feature);
  if (filters.outcome) params.set('outcome', filters.outcome);
  if (filters.minSampleSize) params.set('minSampleSize', filters.minSampleSize);
  if (filters.minLift) params.set('minLift', filters.minLift);

  const query = params.toString();
  return request(`/api/correlations${query ? '?' + query : ''}`);
}

/**
 * Get current pattern matches
 */
export async function getPatterns() {
  return request('/api/patterns');
}

/**
 * Run a custom backtest query
 */
export async function runBacktest(query) {
  return request('/api/backtest', {
    method: 'POST',
    body: query,
    skipCache: true
  });
}

/**
 * Get available historical date range
 */
export async function getHistoricalRange() {
  return request('/api/historical/range');
}

/**
 * Get all module data for a specific historical date
 */
export async function getHistoricalData(date) {
  return request(`/api/historical/${date}`);
}

/**
 * Check API health
 */
export async function checkHealth() {
  return request('/health');
}

/**
 * Get detailed health status
 */
export async function getDetailedHealth() {
  return request('/health/detailed');
}

/**
 * Calculate data freshness
 * @param {string} timestamp - ISO timestamp
 * @returns {'live' | 'recent' | 'stale'}
 */
export function calculateFreshness(timestamp) {
  if (!timestamp) return 'stale';

  const age = Date.now() - new Date(timestamp).getTime();

  if (age < config.recentDataThreshold) {
    return 'live';
  } else if (age < config.staleDataThreshold) {
    return 'recent';
  } else {
    return 'stale';
  }
}

/**
 * Format time ago string
 * @param {string} timestamp - ISO timestamp
 * @returns {string}
 */
export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'unknown';

  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 120) return '1m ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 7200) return '1h ago';
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default {
  getCurrentData,
  getHistory,
  getHistoricalRange,
  getHistoricalData,
  getPredictions,
  getPrediction,
  getCorrelations,
  getPatterns,
  runBacktest,
  checkHealth,
  getDetailedHealth,
  clearCache,
  calculateFreshness,
  formatTimeAgo
};
