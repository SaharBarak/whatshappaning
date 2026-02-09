/**
 * Historical Comparison View Component
 * Side-by-side comparison of today's data with a historical date
 */

import { getHistoricalData, getHistoricalRange } from '../api.js';

let comparisonState = {
  isOpen: false,
  selectedDate: null,
  historicalData: null,
  dateRange: null,
  isLoading: false,
  error: null
};

/**
 * Initialize comparison view — attach event listeners
 */
export function initComparison() {
  const toggle = document.getElementById('comparison-toggle');
  if (toggle) {
    toggle.addEventListener('click', toggleComparisonPanel);
  }

  // Handle deep link: ?compare=2024-02-14
  const params = new URLSearchParams(window.location.search);
  const compareDate = params.get('compare');
  if (compareDate) {
    openComparison(compareDate);
  }
}

/**
 * Toggle comparison panel visibility
 */
function toggleComparisonPanel() {
  if (comparisonState.isOpen) {
    closeComparison();
  } else {
    openComparison();
  }
}

/**
 * Open the comparison panel, optionally with a pre-selected date
 */
async function openComparison(date = null) {
  comparisonState.isOpen = true;

  const panel = document.getElementById('comparison-panel');
  if (!panel) return;

  panel.hidden = false;
  panel.classList.add('visible');

  // Load date range if not yet loaded
  if (!comparisonState.dateRange) {
    try {
      const result = await getHistoricalRange();
      comparisonState.dateRange = result.data;
    } catch (e) {
      console.error('[Comparison] Failed to load date range:', e);
    }
  }

  renderComparisonPanel(panel);

  if (date) {
    await loadHistoricalDate(date);
  }
}

/**
 * Close the comparison panel
 */
function closeComparison() {
  comparisonState.isOpen = false;
  comparisonState.selectedDate = null;
  comparisonState.historicalData = null;

  const panel = document.getElementById('comparison-panel');
  if (panel) {
    panel.classList.remove('visible');
    panel.hidden = true;
  }

  // Remove deep link param
  const url = new URL(window.location);
  url.searchParams.delete('compare');
  window.history.replaceState({}, '', url);
}

/**
 * Load historical data for a specific date
 */
async function loadHistoricalDate(dateStr) {
  comparisonState.isLoading = true;
  comparisonState.selectedDate = dateStr;
  comparisonState.error = null;

  const panel = document.getElementById('comparison-panel');
  renderComparisonPanel(panel);

  try {
    const result = await getHistoricalData(dateStr);
    comparisonState.historicalData = result.data;

    // Update URL for shareability
    const url = new URL(window.location);
    url.searchParams.set('compare', dateStr);
    window.history.replaceState({}, '', url);
  } catch (error) {
    console.error('[Comparison] Failed to load historical data:', error);
    comparisonState.error = error.message;
    comparisonState.historicalData = null;
  } finally {
    comparisonState.isLoading = false;
    renderComparisonPanel(panel);
  }
}

/**
 * Render the comparison panel contents
 */
function renderComparisonPanel(panel) {
  if (!panel) return;

  const dateRange = comparisonState.dateRange || {};
  const minDate = dateRange.startDate || '2000-01-01';
  const maxDate = dateRange.endDate || new Date().toISOString().split('T')[0];

  let content = `
    <div class="comparison-header">
      <h2 class="comparison-title">📊 Historical Comparison</h2>
      <button class="comparison-close" id="comparison-close-btn" aria-label="Close comparison">&times;</button>
    </div>
    <div class="comparison-controls">
      <label for="comparison-date" class="comparison-label">Compare with:</label>
      <input type="date" id="comparison-date" class="comparison-date-input"
        min="${minDate}" max="${maxDate}"
        value="${comparisonState.selectedDate || ''}" />
      <button id="comparison-load-btn" class="comparison-load-btn">Compare</button>
    </div>
  `;

  if (comparisonState.isLoading) {
    content += `<div class="comparison-loading">Loading historical data…</div>`;
  } else if (comparisonState.error) {
    content += `<div class="comparison-error">Failed to load data: ${comparisonState.error}</div>`;
  } else if (comparisonState.historicalData) {
    content += renderComparisonData(comparisonState.historicalData);
  }

  panel.innerHTML = content;

  // Attach event listeners
  document.getElementById('comparison-close-btn')?.addEventListener('click', closeComparison);
  document.getElementById('comparison-load-btn')?.addEventListener('click', () => {
    const dateInput = document.getElementById('comparison-date');
    if (dateInput?.value) {
      loadHistoricalDate(dateInput.value);
    }
  });
  document.getElementById('comparison-date')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const dateInput = document.getElementById('comparison-date');
      if (dateInput?.value) loadHistoricalDate(dateInput.value);
    }
  });
}

/**
 * Render the actual comparison data
 */
function renderComparisonData(historical) {
  const date = comparisonState.selectedDate;
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  let html = `<div class="comparison-date-label">${formattedDate}</div>`;

  // Similarity score
  if (historical.similarity_to_today != null) {
    const pct = Math.round(historical.similarity_to_today * 100);
    html += `
      <div class="comparison-similarity">
        <span class="similarity-label">Similarity to today:</span>
        <span class="similarity-value">${pct}%</span>
        <div class="similarity-bar">
          <div class="similarity-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }

  // Modules side-by-side
  if (historical.modules) {
    html += `<div class="comparison-modules">`;
    for (const [name, modData] of Object.entries(historical.modules)) {
      html += renderModuleComparison(name, modData);
    }
    html += `</div>`;
  }

  // Outcomes (what happened after)
  if (historical.outcomes) {
    html += renderOutcomes(historical.outcomes);
  }

  return html;
}

/**
 * Render a single module's historical data
 */
function renderModuleComparison(name, data) {
  const label = name.charAt(0).toUpperCase() + name.slice(1);
  const entries = typeof data === 'object' && data !== null
    ? Object.entries(data).filter(([k]) => k !== 'collectedAt')
    : [];

  if (entries.length === 0) return '';

  let rows = entries.map(([key, value]) => {
    const displayVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return `<div class="comparison-row">
      <span class="comparison-key">${key.replace(/_/g, ' ')}</span>
      <span class="comparison-val">${displayVal}</span>
    </div>`;
  }).join('');

  return `
    <div class="comparison-module-card">
      <h3 class="comparison-module-title">${label}</h3>
      ${rows}
    </div>
  `;
}

/**
 * Render outcome context (what happened after the historical date)
 */
function renderOutcomes(outcomes) {
  const entries = Object.entries(outcomes);
  if (entries.length === 0) return '';

  let rows = entries.map(([key, value]) => {
    const label = key.replace(/_/g, ' ').replace(/(\d)d$/, '$1-day');
    const formatted = typeof value === 'object'
      ? Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ')
      : (typeof value === 'number' ? `${value > 0 ? '+' : ''}${value.toFixed(1)}%` : String(value));
    return `<div class="comparison-row">
      <span class="comparison-key">${label}</span>
      <span class="comparison-val">${formatted}</span>
    </div>`;
  }).join('');

  return `
    <div class="comparison-outcomes">
      <h3 class="comparison-module-title">📈 What Happened After</h3>
      ${rows}
    </div>
  `;
}

/**
 * Open comparison from a pattern alert (external trigger)
 */
export function compareToDate(dateStr) {
  openComparison(dateStr);
}

export default { initComparison, compareToDate };
