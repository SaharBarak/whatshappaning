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
import ga4 from './ga4.js';
import { initAutoTracking, interactionEvents, errorEvents } from './ga4-events.js';
import consentBanner from './components/consent-banner.js';
import { init as initPerformance, getMetrics } from './performance.js';
import ErrorTracker from './error-tracking.js';
import { initShare } from './share.js';
import './pwa.js';
import { initComparison } from './components/comparison.js';
import { connect as wsConnect, disconnect as wsDisconnect } from './websocket.js';
import { initConnectionIndicator } from './components/connection-indicator.js';
import { initThemeToggle } from './components/themeToggle.js';

// Lazy-loaded modules (non-critical path)
let ga4, interactionEvents, errorEvents, consentBanner, initShare, initEmailSignup;

/**
 * Lazy load non-critical modules after initial render
 */
async function loadDeferredModules() {
  const [
    ga4Module,
    ga4EventsModule,
    consentModule,
    perfModule,
    shareModule,
    emailModule
  ] = await Promise.all([
    import('./ga4.js'),
    import('./ga4-events.js'),
    import('./components/consent-banner.js'),
    import('./performance.js'),
    import('./share.js'),
    import('./email-signup.js')
  ]);

  ga4 = ga4Module.default;
  interactionEvents = ga4EventsModule.interactionEvents;
  errorEvents = ga4EventsModule.errorEvents;
  consentBanner = consentModule.default;
  initShare = shareModule.initShare;
  initEmailSignup = emailModule.initEmailSignup;

  // Initialize deferred modules
  perfModule.init();
  await ga4.init();
  consentBanner.init();
  ga4EventsModule.initAutoTracking();
  initShare();
  initEmailSignup();

  // Expose performance metrics for debugging
  window.getPerformanceMetrics = perfModule.getMetrics;
}

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
  // Initialize theme toggle (early to prevent flash of wrong theme)
  initThemeToggle();

  // Render and initialize filter bar
  renderFilterBar();
  initFilters(handleFilterChange);

  // Initialize performance monitoring (Core Web Vitals)
  initPerformance();

  // Initialize error tracking
  ErrorTracker.init({ backendUrl: config.apiBase ? `${config.apiBase}/api/errors` : null });
  
  // Initialize GA4 analytics
  await ga4.init();
  
  // Show consent banner if needed
  consentBanner.init();
  
  // Initialize automatic tracking (scroll depth, time on page, errors)
  initAutoTracking();

  // Initialize share functionality
  initShare();

  // Initialize historical comparison view
  initComparison();

  // Initialize email signup form
  initEmailSignup();

  // Set up event listeners
  setupEventListeners();

  // Initial data load
  await refreshData();

  // Load non-critical modules after first render
  loadDeferredModules();

  // Set up auto-refresh (fallback if WS unavailable)
  setInterval(refreshData, config.autoRefreshInterval);

  // Connect WebSocket for real-time updates
  initConnectionIndicator();
  wsConnect(handleRealtimeUpdate);
}

/**
 * Handle filter state changes
 */
function handleFilterChange(filterState) {
  // Re-render predictions with new filters
  render();
}

/**
 * Handle real-time data from WebSocket
 */
function handleRealtimeUpdate(payload) {
  if (payload.current) {
    state.data = payload.current;
  }
  if (payload.predictions) {
    state.predictions = payload.predictions;
  }
  state.lastUpdate = new Date();
  state.error = null;
  hideError();
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
    
    // Track API error (if analytics loaded)
    errorEvents?.apiError('/api/data', error.status || 0, error.message);

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
  await renderModules(mergedModules, state.expandedModules, toggleModule);
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
  const wasExpanded = state.expandedPredictions.has(outcomeId);
  
  if (wasExpanded) {
    state.expandedPredictions.delete(outcomeId);
  } else {
    state.expandedPredictions.add(outcomeId);
    // Track prediction click when expanding
    const prediction = state.predictions?.outcomes?.find(p => p.outcomeId === outcomeId);
    if (prediction) {
      interactionEvents?.predictionClick(outcomeId, prediction.type || 'unknown', prediction.confidence || 0);
    }
  }
  renderPredictions(state.predictions, state.expandedPredictions, togglePrediction);
}

/**
 * Toggle module card expansion
 */
async function toggleModule(moduleName) {
  const wasExpanded = state.expandedModules.has(moduleName);
  
  if (wasExpanded) {
    state.expandedModules.delete(moduleName);
    interactionEvents?.moduleCollapse(moduleName, moduleName);
  } else {
    state.expandedModules.add(moduleName);
    interactionEvents?.moduleExpand(moduleName, moduleName);
  }
  await renderModules(state.data?.modules, state.expandedModules, toggleModule);
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
