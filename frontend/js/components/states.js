/**
 * States Component
 * Handles loading states, error states, and freshness badges
 */

/**
 * Show loading state
 */
export function showLoading() {
  // Add skeleton class to containers that need it
  const skeletonContainers = [
    'indices-bar',
    'predictions-list',
    'data-grid'
  ];

  skeletonContainers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.querySelectorAll('.skeleton').forEach(el => {
        el.classList.add('loading');
      });
    }
  });
}

/**
 * Hide loading state
 */
export function hideLoading() {
  document.querySelectorAll('.skeleton').forEach(el => {
    el.classList.remove('loading');
  });
}

/**
 * Show error banner
 * @param {string} message - Error message to display
 */
export function showError(message) {
  const banner = document.getElementById('error-banner');
  if (!banner) return;

  const errorText = banner.querySelector('.error-text');
  if (errorText) {
    errorText.textContent = message;
  }

  banner.classList.remove('hidden');
}

/**
 * Hide error banner
 */
export function hideError() {
  const banner = document.getElementById('error-banner');
  if (banner) {
    banner.classList.add('hidden');
  }
}

/**
 * Create a freshness badge HTML
 * @param {'live' | 'recent' | 'stale'} freshness
 * @returns {string} HTML string
 */
export function createFreshnessBadge(freshness) {
  const labels = {
    live: 'Live',
    recent: 'Recent',
    stale: 'Stale'
  };

  return `<span class="freshness-badge freshness-${freshness}">${labels[freshness] || 'Unknown'}</span>`;
}

/**
 * Create a skeleton element HTML
 * @param {string} type - Type of skeleton (prediction, module, index)
 * @returns {string} HTML string
 */
export function createSkeleton(type) {
  switch (type) {
    case 'prediction':
      return `<div class="prediction-skeleton skeleton"></div>`;
    case 'module':
      return `<div class="module-card skeleton"></div>`;
    case 'index':
      return `<div class="index-item skeleton"><span class="index-label">--</span><span class="index-value">--</span></div>`;
    default:
      return `<div class="skeleton"></div>`;
  }
}

/**
 * Show a "no data" message
 * @param {HTMLElement} container
 * @param {string} message
 */
export function showNoData(container, message = 'No data available') {
  if (!container) return;
  container.innerHTML = `<div class="no-data text-muted"><p>${message}</p></div>`;
}

/**
 * Show a module error state
 * @param {string} moduleName
 * @returns {string} HTML string
 */
export function createModuleError(moduleName) {
  return `
    <div class="module-card error" data-module="${moduleName}">
      <div class="module-header">
        <span class="module-icon">⚠️</span>
        <span class="module-name">${moduleName.toUpperCase()}</span>
      </div>
      <div class="module-primary text-muted">Data unavailable</div>
      <div class="module-secondary text-muted">Check connection</div>
    </div>
  `;
}

export default {
  showLoading,
  hideLoading,
  showError,
  hideError,
  createFreshnessBadge,
  createSkeleton,
  showNoData,
  createModuleError
};
