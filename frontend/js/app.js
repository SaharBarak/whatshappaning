/**
 * Main Application Module
 * Orchestrates data fetching, rendering, and user interactions
 */

import { config } from './config.js';
import api from './api.js';
import { renderIndices } from './components/indices.js';
import { renderPredictions } from './components/predictions.js';
import { renderPatternAlert } from './components/alerts.js';
import { renderModules } from './components/modules.js';
import { renderSuggestions } from './components/suggestions.js';
import { showError, hideError, showLoading, hideLoading } from './components/states.js';
import { initFilters, renderFilterBar, filterPredictions, getFilterState } from './components/filters.js';

// Application state
const state = {
  data: null,
  predictions: null,
  lastUpdate: null,
  isLoading: false,
  error: null,
  expandedPredictions: new Set(),
  expandedModules: new Set()
};

/**
 * Initialize the application
 */
async function init() {
  // Render and initialize filter bar
  renderFilterBar();
  initFilters(handleFilterChange);

  // Set up event listeners
  setupEventListeners();

  // Initial data load
  await refreshData();

  // Set up auto-refresh
  setInterval(refreshData, config.autoRefreshInterval);
}

/**
 * Handle filter state changes
 */
function handleFilterChange(filterState) {
  // Re-render predictions with new filters
  render();
}

/**
 * Fetch all data from the API
 */
async function refreshData() {
  if (state.isLoading) return;

  state.isLoading = true;
  showLoading();

  try {
    // Fetch current data and predictions in parallel
    const [currentResult, predictionsResult] = await Promise.all([
      api.getCurrentData(),
      api.getPredictions()
    ]);

    state.data = currentResult.data;
    state.predictions = predictionsResult.data;
    state.lastUpdate = new Date();
    state.error = null;

    // Check if data is stale
    if (currentResult.stale || predictionsResult.stale) {
      showError('Showing cached data. Connection issues detected.');
    } else {
      hideError();
    }

    // Render all components
    render();

  } catch (error) {
    console.error('Failed to fetch data:', error);
    state.error = error.message;
    showError(`Failed to load data: ${error.message}`);

    // Still try to render with any cached data
    if (state.data || state.predictions) {
      render();
    }
  } finally {
    state.isLoading = false;
    hideLoading();
  }
}

/**
 * Render all UI components
 */
function render() {
  updateLiveIndicator();
  renderIndices(state.data?.indices);
  
  // Apply filters to predictions
  const filteredPredictions = state.predictions?.predictions 
    ? { ...state.predictions, predictions: filterPredictions(state.predictions.predictions) }
    : state.predictions;
  
  renderPredictions(filteredPredictions, state.expandedPredictions, togglePrediction);
  updatePredictionsCount(state.predictions?.predictions, filteredPredictions?.predictions);
  renderPatternAlert(state.predictions?.patternAlerts);

  // Merge modules from snapshots with dailyData for local calculation modules
  const mergedModules = { ...state.data?.modules };
  if (state.data?.dailyData) {
    const dailyModules = ['tzolkin', 'dreamspell', 'gematria', 'tarot', 'numerology', 'iching', 'parasha'];
    for (const mod of dailyModules) {
      if (state.data.dailyData[mod]) {
        mergedModules[mod] = {
          data: state.data.dailyData[mod],
          collectedAt: state.data.dailyData[mod].collectedAt || state.data.dailyData.created_at
        };
      }
    }
  }
  renderModules(mergedModules, state.expandedModules, toggleModule);
  renderSuggestions(state.predictions?.actionSuggestions);
}

/**
 * Update predictions count display
 */
function updatePredictionsCount(total, filtered) {
  const countEl = document.getElementById('predictions-count');
  if (!countEl) return;
  
  const totalCount = total?.length || 0;
  const filteredCount = filtered?.length || 0;
  
  if (totalCount === 0) {
    countEl.textContent = '';
  } else if (filteredCount === totalCount) {
    countEl.textContent = `(${totalCount})`;
  } else {
    countEl.textContent = `(${filteredCount} of ${totalCount})`;
  }
}

/**
 * Update the live indicator in the header
 */
function updateLiveIndicator() {
  const liveDot = document.querySelector('.live-dot');
  const liveText = document.querySelector('.live-text');

  if (!state.lastUpdate) {
    liveText.textContent = 'Loading...';
    return;
  }

  const freshness = api.calculateFreshness(state.lastUpdate.toISOString());
  const timeAgo = api.formatTimeAgo(state.lastUpdate.toISOString());

  // Update dot color based on freshness
  liveDot.classList.remove('stale', 'error');
  if (freshness === 'stale') {
    liveDot.classList.add('stale');
  }
  if (state.error) {
    liveDot.classList.add('error');
  }

  liveText.textContent = `Live · ${timeAgo}`;
}

/**
 * Toggle prediction expansion
 */
function togglePrediction(outcomeId) {
  if (state.expandedPredictions.has(outcomeId)) {
    state.expandedPredictions.delete(outcomeId);
  } else {
    state.expandedPredictions.add(outcomeId);
  }
  renderPredictions(state.predictions, state.expandedPredictions, togglePrediction);
}

/**
 * Toggle module card expansion
 */
function toggleModule(moduleName) {
  if (state.expandedModules.has(moduleName)) {
    state.expandedModules.delete(moduleName);
  } else {
    state.expandedModules.add(moduleName);
  }
  renderModules(state.data?.modules, state.expandedModules, toggleModule);
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Manual refresh on header double-click
  document.querySelector('.header-title')?.addEventListener('dblclick', () => {
    api.clearCache();
    refreshData();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + R to refresh
    if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      api.clearCache();
      refreshData();
    }

    // Enter or Space to activate focused cards (accessibility)
    if (e.key === 'Enter' || e.key === ' ') {
      const target = document.activeElement;

      // Handle prediction cards
      if (target?.classList.contains('prediction')) {
        e.preventDefault();
        const outcomeId = target.dataset.outcome;
        if (outcomeId) togglePrediction(outcomeId);
      }

      // Handle module cards
      if (target?.classList.contains('module-card')) {
        e.preventDefault();
        const moduleName = target.dataset.module;
        if (moduleName) toggleModule(moduleName);
      }
    }
  });

  // Visibility change - refresh when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.lastUpdate) {
      const age = Date.now() - state.lastUpdate.getTime();
      if (age > config.staleDataThreshold) {
        refreshData();
      }
    }
  });
}

/**
 * Expose error dismissal globally
 */
window.dismissError = () => {
  hideError();
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { state, refreshData };
