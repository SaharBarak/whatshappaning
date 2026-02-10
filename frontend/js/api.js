/**
 * API Client Module
 * Handles all communication with the backend API
 * Fetches from static Supabase snapshot first, falls back to live API
 */

import { config } from './config.js';

// In-memory cache
const cache = new Map();

// Static snapshot URL (Supabase Storage)
const SNAPSHOT_URL = 'https://cvliqlgwcfbybayowvhw.supabase.co/storage/v1/object/public/snapshots/latest.json';
const SNAPSHOT_CACHE_KEY = 'wh:snapshot';
const SNAPSHOT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
 * Fetch the static snapshot from Supabase Storage
 * Returns { data, fromCache } or null on failure
 */
async function fetchSnapshot() {
  // Check localStorage cache
  try {
    const cached = localStorage.getItem(SNAPSHOT_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed._cachedAt < SNAPSHOT_CACHE_TTL) {
        return { data: parsed.snapshot, fromCache: true };
      }
    }
  } catch (e) { /* ignore */ }

  try {
    const response = await fetch(SNAPSHOT_URL, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Snapshot fetch: ${response.status}`);
    const snapshot = await response.json();

    // Cache in localStorage
    try {
      localStorage.setItem(SNAPSHOT_CACHE_KEY, JSON.stringify({
        snapshot,
        _cachedAt: Date.now(),
      }));
    } catch (e) { /* quota exceeded, ignore */ }

    return { data: snapshot, fromCache: false };
  } catch (err) {
    console.warn('Snapshot fetch failed, falling back to API:', err.message);
    return null;
  }
}

/**
 * Get the current snapshot (with next_update, insight, etc.)
 * Used by the countdown timer component
 */
export async function getSnapshot() {
  const result = await fetchSnapshot();
  if (result) return result;
  // No snapshot available — return null, caller should handle
  return null;
}

/**
 * Get all current module data and indices
 * Tries static snapshot first, falls back to live API
 */
export async function getCurrentData() {
  const snapshot = await fetchSnapshot();
  if (snapshot) {
    // Reshape snapshot to match what the app expects from /api/current
    const snapshotData = snapshot.data;
    const allModules = snapshotData.modules || {};

    // Separate daily modules from snapshot modules (matching backend /api/current shape)
    const dailyModuleNames = ['tzolkin', 'dreamspell', 'tarot', 'iching', 'gematria', 'numerology', 'parasha'];
    const snapshotModuleNames = ['moon', 'astrology', 'solar', 'schumann', 'news', 'cosmic', 'markets', 'geophysical', 'sentiment'];

    const dailyData = {};
    const modules = {};

    for (const [key, value] of Object.entries(allModules)) {
      if (dailyModuleNames.includes(key)) {
        dailyData[key] = value;
      } else {
        modules[key] = { data: value, collectedAt: value?.collectedAt || snapshotData.generated_at };
      }
    }

    return {
      data: {
        timestamp: snapshotData.generated_at,
        dataAge: '0m',
        modules,
        dailyData,
        indices: {
          solarGeo: { value: null, level: 'unknown' },
          astroEvents: { count: 0, level: 'unknown' },
          calendarSync: { score: 0, level: 'unknown' },
        },
        generated_at: snapshotData.generated_at,
        next_update: snapshotData.next_update,
        insight: snapshotData.insight,
        fromSnapshot: true,
      },
      fromCache: snapshot.fromCache,
    };
  }
  // Fallback to live API
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
 * Tries static snapshot first, falls back to live API
 */
export async function getPredictions() {
  const snapshot = await fetchSnapshot();
  if (snapshot && snapshot.data && snapshot.data.predictions) {
    return { data: snapshot.data.predictions, fromCache: snapshot.fromCache, fromSnapshot: true };
  }
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
  getSnapshot,
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
