/**
 * Filter Components
 * Provides filtering and search functionality for predictions
 */

import { announceToScreenReader } from '../a11y.js';

// Filter state
const filterState = {
  categories: new Set(),
  confidence: 'all', // all, high, medium, low
  search: '',
  dateFrom: null,
  dateTo: null
};

// Available categories
const CATEGORIES = [
  { id: 'astrology', label: 'Astrology', icon: '⭐' },
  { id: 'numerology', label: 'Numerology', icon: '🔢' },
  { id: 'biorhythm', label: 'Biorhythm', icon: '🌊' },
  { id: 'lunar', label: 'Lunar', icon: '🌙' },
  { id: 'solar', label: 'Solar', icon: '☀️' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'market', label: 'Market', icon: '📈' },
  { id: 'geophysical', label: 'Geophysical', icon: '🌍' }
];

// Debounce utility
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Callback for filter changes
let onFilterChange = null;

/**
 * Initialize filter bar
 * @param {Function} callback - Called with filter state on changes
 */
export function initFilters(callback) {
  onFilterChange = callback;
  
  const container = document.getElementById('filter-bar');
  if (!container) return;
  
  // Load saved presets from localStorage
  loadPresets();
  
  // Set up event listeners
  setupEventListeners(container);
}

/**
 * Set up all event listeners
 */
function setupEventListeners(container) {
  // Search input with debounce
  const searchInput = container.querySelector('#filter-search');
  if (searchInput) {
    const debouncedSearch = debounce((value) => {
      filterState.search = value;
      notifyChange();
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value.trim());
    });
    
    // Clear on escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        filterState.search = '';
        notifyChange();
      }
    });
  }
  
  // Category checkboxes
  const categoryContainer = container.querySelector('#filter-categories');
  if (categoryContainer) {
    categoryContainer.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        const category = e.target.dataset.category;
        if (e.target.checked) {
          filterState.categories.add(category);
        } else {
          filterState.categories.delete(category);
        }
        notifyChange();
      }
    });
  }
  
  // Confidence filter
  const confidenceSelect = container.querySelector('#filter-confidence');
  if (confidenceSelect) {
    confidenceSelect.addEventListener('change', (e) => {
      filterState.confidence = e.target.value;
      notifyChange();
    });
  }
  
  // Date filters
  const dateFrom = container.querySelector('#filter-date-from');
  const dateTo = container.querySelector('#filter-date-to');
  
  if (dateFrom) {
    dateFrom.addEventListener('change', (e) => {
      filterState.dateFrom = e.target.value || null;
      notifyChange();
    });
  }
  
  if (dateTo) {
    dateTo.addEventListener('change', (e) => {
      filterState.dateTo = e.target.value || null;
      notifyChange();
    });
  }
  
  // Toggle advanced filters
  const toggleBtn = container.querySelector('#filter-toggle-advanced');
  const advancedSection = container.querySelector('#filter-advanced');
  
  if (toggleBtn && advancedSection) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = advancedSection.classList.toggle('hidden');
      toggleBtn.setAttribute('aria-expanded', !isHidden);
      toggleBtn.querySelector('.toggle-icon').textContent = isHidden ? '▼' : '▲';
    });
  }
  
  // Clear all filters
  const clearBtn = container.querySelector('#filter-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearFilters);
  }
  
  // Preset management
  const savePresetBtn = container.querySelector('#filter-save-preset');
  if (savePresetBtn) {
    savePresetBtn.addEventListener('click', showSavePresetDialog);
  }
  
  const presetSelect = container.querySelector('#filter-presets');
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        loadPreset(e.target.value);
      }
    });
  }
}

/**
 * Notify listeners of filter changes
 */
function notifyChange() {
  if (onFilterChange) {
    onFilterChange(getFilterState());
  }
  updateActiveFilterCount();
}

/**
 * Get current filter state
 */
export function getFilterState() {
  return {
    categories: Array.from(filterState.categories),
    confidence: filterState.confidence,
    search: filterState.search,
    dateFrom: filterState.dateFrom,
    dateTo: filterState.dateTo
  };
}

/**
 * Clear all filters
 */
export function clearFilters() {
  filterState.categories.clear();
  filterState.confidence = 'all';
  filterState.search = '';
  filterState.dateFrom = null;
  filterState.dateTo = null;
  
  // Reset UI
  const container = document.getElementById('filter-bar');
  if (container) {
    // Clear search
    const searchInput = container.querySelector('#filter-search');
    if (searchInput) searchInput.value = '';
    
    // Uncheck all categories
    container.querySelectorAll('[data-category]').forEach(cb => {
      cb.checked = false;
    });
    
    // Reset confidence
    const confidenceSelect = container.querySelector('#filter-confidence');
    if (confidenceSelect) confidenceSelect.value = 'all';
    
    // Clear dates
    const dateFrom = container.querySelector('#filter-date-from');
    const dateTo = container.querySelector('#filter-date-to');
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    // Reset preset select
    const presetSelect = container.querySelector('#filter-presets');
    if (presetSelect) presetSelect.value = '';
  }
  
  notifyChange();
  announceToScreenReader('All filters cleared');
}

/**
 * Update active filter count badge
 */
function updateActiveFilterCount() {
  const badge = document.getElementById('filter-active-count');
  if (!badge) return;
  
  let count = 0;
  if (filterState.categories.size > 0) count++;
  if (filterState.confidence !== 'all') count++;
  if (filterState.search) count++;
  if (filterState.dateFrom || filterState.dateTo) count++;
  
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

/**
 * Filter predictions based on current state
 * @param {Array} predictions - Array of predictions
 * @returns {Array} Filtered predictions
 */
export function filterPredictions(predictions) {
  if (!predictions) return [];
  
  return predictions.filter(prediction => {
    // Category filter
    if (filterState.categories.size > 0) {
      const predCategory = prediction.category?.toLowerCase();
      if (!predCategory || !filterState.categories.has(predCategory)) {
        return false;
      }
    }
    
    // Confidence filter
    if (filterState.confidence !== 'all') {
      const conf = prediction.confidence?.toLowerCase();
      if (conf !== filterState.confidence) {
        return false;
      }
    }
    
    // Search filter
    if (filterState.search) {
      const searchLower = filterState.search.toLowerCase();
      const name = (prediction.name || '').toLowerCase();
      const desc = (prediction.description || '').toLowerCase();
      if (!name.includes(searchLower) && !desc.includes(searchLower)) {
        return false;
      }
    }
    
    // Date filters (if prediction has a date)
    if (prediction.date) {
      const predDate = new Date(prediction.date);
      if (filterState.dateFrom) {
        const from = new Date(filterState.dateFrom);
        if (predDate < from) return false;
      }
      if (filterState.dateTo) {
        const to = new Date(filterState.dateTo);
        if (predDate > to) return false;
      }
    }
    
    return true;
  });
}

// Preset management
let presets = {};

function loadPresets() {
  try {
    const saved = localStorage.getItem('whatshappening-filter-presets');
    if (saved) {
      presets = JSON.parse(saved);
      renderPresetOptions();
    }
  } catch (e) {
    console.warn('Failed to load filter presets:', e);
  }
}

function savePresets() {
  try {
    localStorage.setItem('whatshappening-filter-presets', JSON.stringify(presets));
    renderPresetOptions();
  } catch (e) {
    console.warn('Failed to save filter presets:', e);
  }
}

function renderPresetOptions() {
  const select = document.querySelector('#filter-presets');
  if (!select) return;
  
  // Keep the default option
  select.innerHTML = '<option value="">Load preset...</option>';
  
  Object.keys(presets).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

function loadPreset(name) {
  const preset = presets[name];
  if (!preset) return;
  
  // Apply preset state
  filterState.categories = new Set(preset.categories || []);
  filterState.confidence = preset.confidence || 'all';
  filterState.search = preset.search || '';
  filterState.dateFrom = preset.dateFrom || null;
  filterState.dateTo = preset.dateTo || null;
  
  // Update UI
  const container = document.getElementById('filter-bar');
  if (container) {
    // Update search
    const searchInput = container.querySelector('#filter-search');
    if (searchInput) searchInput.value = filterState.search;
    
    // Update categories
    container.querySelectorAll('[data-category]').forEach(cb => {
      cb.checked = filterState.categories.has(cb.dataset.category);
    });
    
    // Update confidence
    const confidenceSelect = container.querySelector('#filter-confidence');
    if (confidenceSelect) confidenceSelect.value = filterState.confidence;
    
    // Update dates
    const dateFrom = container.querySelector('#filter-date-from');
    const dateTo = container.querySelector('#filter-date-to');
    if (dateFrom) dateFrom.value = filterState.dateFrom || '';
    if (dateTo) dateTo.value = filterState.dateTo || '';
  }
  
  notifyChange();
}

function showSavePresetDialog() {
  const name = prompt('Enter preset name:');
  if (!name) return;
  
  presets[name] = getFilterState();
  savePresets();
  
  // Show confirmation
  showToast(`Preset "${name}" saved`);
}

function showToast(message) {
  const existing = document.querySelector('.filter-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'filter-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => toast.classList.add('show'));
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/**
 * Render the filter bar HTML
 * Call this to inject filter bar into the page
 */
export function renderFilterBar() {
  const container = document.getElementById('filter-bar');
  if (!container) return;
  
  container.innerHTML = `
    <div class="filter-bar-main">
      <div class="filter-search-wrapper">
        <span class="filter-search-icon" aria-hidden="true">🔍</span>
        <input
          type="search"
          id="filter-search"
          class="filter-search"
          placeholder="Search predictions..."
          aria-label="Search predictions"
        />
      </div>
      
      <button
        id="filter-toggle-advanced"
        class="filter-toggle-btn"
        aria-expanded="false"
        aria-controls="filter-advanced"
      >
        <span>Filters</span>
        <span id="filter-active-count" class="filter-badge hidden">0</span>
        <span class="toggle-icon" aria-hidden="true">▼</span>
      </button>
      
      <select id="filter-presets" class="filter-presets" aria-label="Filter presets">
        <option value="">Load preset...</option>
      </select>
    </div>
    
    <div id="filter-advanced" class="filter-advanced hidden">
      <div class="filter-section">
        <label class="filter-section-label">Categories</label>
        <div id="filter-categories" class="filter-categories">
          ${CATEGORIES.map(cat => `
            <label class="filter-category-label">
              <input type="checkbox" data-category="${cat.id}" />
              <span class="category-icon">${cat.icon}</span>
              <span>${cat.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
      
      <div class="filter-section">
        <label class="filter-section-label" for="filter-confidence">Confidence</label>
        <select id="filter-confidence" class="filter-select">
          <option value="all">All levels</option>
          <option value="high">High only</option>
          <option value="medium">Medium only</option>
          <option value="low">Low only</option>
        </select>
      </div>
      
      <div class="filter-section">
        <label class="filter-section-label">Date Range</label>
        <div class="filter-date-range">
          <input type="date" id="filter-date-from" class="filter-date" aria-label="From date" />
          <span class="filter-date-separator">to</span>
          <input type="date" id="filter-date-to" class="filter-date" aria-label="To date" />
        </div>
      </div>
      
      <div class="filter-actions">
        <button id="filter-clear" class="filter-action-btn">Clear All</button>
        <button id="filter-save-preset" class="filter-action-btn filter-action-btn-primary">Save Preset</button>
      </div>
    </div>
  `;
}

export default {
  initFilters,
  renderFilterBar,
  getFilterState,
  clearFilters,
  filterPredictions
};
