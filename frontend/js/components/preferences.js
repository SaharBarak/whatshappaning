/**
 * User Preferences Component
 * Allows users to personalize their feed by selecting interest categories,
 * preferred times, and notification settings.
 */

import { config } from '../config.js';
import api from '../api.js';

const VALID_CATEGORIES = [
  'astrology', 'moon', 'numerology', 'tarot', 'iching',
  'markets', 'geophysical', 'solar', 'schumann', 'sentiment',
  'cosmic', 'gematria', 'parasha', 'tzolkin', 'dreamspell', 'news'
];

const VALID_TIME_PREFS = [
  { value: 'morning', label: '🌅 Morning', desc: '6am–12pm' },
  { value: 'afternoon', label: '☀️ Afternoon', desc: '12pm–5pm' },
  { value: 'evening', label: '🌆 Evening', desc: '5pm–9pm' },
  { value: 'night', label: '🌙 Night', desc: '9pm–6am' },
  { value: 'all', label: '🕐 All Times', desc: 'No preference' }
];

// Client ID for preferences (stored in localStorage)
function getClientId() {
  let id = localStorage.getItem('wh_client_id');
  if (!id) {
    id = 'wh-' + crypto.randomUUID();
    localStorage.setItem('wh_client_id', id);
  }
  return id;
}

// Current preferences state
let currentPrefs = null;
let onPrefsChanged = null;

/**
 * Load preferences from API
 */
async function loadPreferences() {
  // Always load local first so we never block on a dead API
  const saved = localStorage.getItem('wh_preferences');
  if (saved) {
    try { currentPrefs = JSON.parse(saved); } catch (e) { /* ignore */ }
  }

  try {
    const clientId = getClientId();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(`${config.apiUrl}/api/preferences/${clientId}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (resp.ok) {
      const data = await resp.json();
      currentPrefs = data.preferences;
    } else if (resp.status === 404) {
      // No server-side prefs — keep local
    }
  } catch (err) {
    console.warn('Could not load preferences from API:', err.message);
  }
  return currentPrefs;
}

/**
 * Save preferences to API
 */
async function savePreferences(prefs) {
  const clientId = getClientId();
  
  // Always save locally as backup
  localStorage.setItem('wh_preferences', JSON.stringify(prefs));
  currentPrefs = prefs;

  try {
    const resp = await fetch(`${config.apiUrl}/api/preferences/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    });
    if (!resp.ok) {
      console.warn('Failed to save preferences to server');
    }
  } catch (err) {
    console.warn('Could not save preferences remotely:', err);
  }

  if (onPrefsChanged) onPrefsChanged(currentPrefs);
}

/**
 * Get current preferences
 */
export function getPreferences() {
  return currentPrefs;
}

/**
 * Render the preferences panel HTML
 */
function renderPreferencesPanel() {
  const panel = document.getElementById('preferences-panel');
  if (!panel) return;

  const selectedCats = currentPrefs?.categories || [];
  const selectedTimes = currentPrefs?.preferredTimes || [];
  const notifications = currentPrefs?.notifications || {};

  panel.innerHTML = `
    <div class="prefs-overlay" id="prefs-overlay"></div>
    <div class="prefs-drawer" role="dialog" aria-label="Preferences" aria-modal="true">
      <div class="prefs-header">
        <h2 class="prefs-title">⚙️ Preferences</h2>
        <button class="prefs-close" id="prefs-close" aria-label="Close preferences">&times;</button>
      </div>

      <div class="prefs-body">
        <section class="prefs-section">
          <h3 class="prefs-section-title">Interest Categories</h3>
          <p class="prefs-section-desc">Select modules to prioritize in your feed</p>
          <div class="prefs-categories" id="prefs-categories">
            ${VALID_CATEGORIES.map(cat => {
              const mod = config.modules[cat] || { icon: '📌', name: cat.toUpperCase() };
              const checked = selectedCats.includes(cat);
              return `
                <label class="prefs-chip ${checked ? 'selected' : ''}" data-category="${cat}">
                  <input type="checkbox" value="${cat}" ${checked ? 'checked' : ''} class="prefs-chip-input">
                  <span class="prefs-chip-icon">${mod.icon}</span>
                  <span class="prefs-chip-label">${mod.name}</span>
                </label>`;
            }).join('')}
          </div>
          <div class="prefs-cat-actions">
            <button class="prefs-btn-sm" id="prefs-select-all">Select All</button>
            <button class="prefs-btn-sm" id="prefs-select-none">Clear</button>
          </div>
        </section>

        <section class="prefs-section">
          <h3 class="prefs-section-title">Preferred Times</h3>
          <p class="prefs-section-desc">When do you usually check in?</p>
          <div class="prefs-times" id="prefs-times">
            ${VALID_TIME_PREFS.map(t => {
              const checked = selectedTimes.includes(t.value);
              return `
                <label class="prefs-time-chip ${checked ? 'selected' : ''}" data-time="${t.value}">
                  <input type="checkbox" value="${t.value}" ${checked ? 'checked' : ''} class="prefs-time-input">
                  <span class="prefs-time-label">${t.label}</span>
                  <span class="prefs-time-desc">${t.desc}</span>
                </label>`;
            }).join('')}
          </div>
        </section>

        <section class="prefs-section">
          <h3 class="prefs-section-title">Notifications</h3>
          <p class="prefs-section-desc">Choose what alerts you want</p>
          <div class="prefs-notifications">
            <label class="prefs-toggle-row">
              <span>🔔 Pattern Alerts</span>
              <input type="checkbox" id="pref-notify-patterns" ${notifications.patternAlerts ? 'checked' : ''}>
            </label>
            <label class="prefs-toggle-row">
              <span>📊 Prediction Shifts</span>
              <input type="checkbox" id="pref-notify-shifts" ${notifications.predictionShifts ? 'checked' : ''}>
            </label>
            <label class="prefs-toggle-row">
              <span>📋 Daily Summary</span>
              <input type="checkbox" id="pref-notify-daily" ${notifications.dailySummary ? 'checked' : ''}>
            </label>
            <label class="prefs-toggle-row">
              <span>⚡ Rare Events</span>
              <input type="checkbox" id="pref-notify-rare" ${notifications.rareEvents ? 'checked' : ''}>
            </label>
          </div>
        </section>
      </div>

      <div class="prefs-footer">
        <button class="prefs-btn-save" id="prefs-save">Save Preferences</button>
        <button class="prefs-btn-reset" id="prefs-reset">Reset to Default</button>
      </div>
    </div>
  `;

  // Wire up event listeners
  setupPanelListeners(panel);
}

/**
 * Set up panel interactivity
 */
function setupPanelListeners(panel) {
  // Close
  panel.querySelector('#prefs-close')?.addEventListener('click', closePreferences);
  panel.querySelector('#prefs-overlay')?.addEventListener('click', closePreferences);

  // Category chips toggle visual state
  panel.querySelectorAll('.prefs-chip-input').forEach(input => {
    input.addEventListener('change', () => {
      input.closest('.prefs-chip').classList.toggle('selected', input.checked);
    });
  });

  // Time chips
  panel.querySelectorAll('.prefs-time-input').forEach(input => {
    input.addEventListener('change', () => {
      const chip = input.closest('.prefs-time-chip');
      chip.classList.toggle('selected', input.checked);
      // "All" is exclusive
      if (input.value === 'all' && input.checked) {
        panel.querySelectorAll('.prefs-time-input').forEach(other => {
          if (other !== input) {
            other.checked = false;
            other.closest('.prefs-time-chip').classList.remove('selected');
          }
        });
      } else if (input.value !== 'all' && input.checked) {
        const allInput = panel.querySelector('.prefs-time-input[value="all"]');
        if (allInput) {
          allInput.checked = false;
          allInput.closest('.prefs-time-chip').classList.remove('selected');
        }
      }
    });
  });

  // Select all / none
  panel.querySelector('#prefs-select-all')?.addEventListener('click', () => {
    panel.querySelectorAll('.prefs-chip-input').forEach(i => { i.checked = true; i.closest('.prefs-chip').classList.add('selected'); });
  });
  panel.querySelector('#prefs-select-none')?.addEventListener('click', () => {
    panel.querySelectorAll('.prefs-chip-input').forEach(i => { i.checked = false; i.closest('.prefs-chip').classList.remove('selected'); });
  });

  // Save
  panel.querySelector('#prefs-save')?.addEventListener('click', () => {
    const categories = [...panel.querySelectorAll('.prefs-chip-input:checked')].map(i => i.value);
    const preferredTimes = [...panel.querySelectorAll('.prefs-time-input:checked')].map(i => i.value);
    const notifications = {
      patternAlerts: panel.querySelector('#pref-notify-patterns')?.checked || false,
      predictionShifts: panel.querySelector('#pref-notify-shifts')?.checked || false,
      dailySummary: panel.querySelector('#pref-notify-daily')?.checked || false,
      rareEvents: panel.querySelector('#pref-notify-rare')?.checked || false,
    };

    savePreferences({ categories, preferredTimes, notifications });
    showSaveConfirmation();
    setTimeout(closePreferences, 800);
  });

  // Reset
  panel.querySelector('#prefs-reset')?.addEventListener('click', () => {
    currentPrefs = null;
    localStorage.removeItem('wh_preferences');
    renderPreferencesPanel();
    if (onPrefsChanged) onPrefsChanged(null);
  });

  // Escape key
  const escHandler = (e) => {
    if (e.key === 'Escape') closePreferences();
  };
  document.addEventListener('keydown', escHandler);
  panel._escHandler = escHandler;
}

function showSaveConfirmation() {
  const btn = document.getElementById('prefs-save');
  if (btn) {
    btn.textContent = '✓ Saved!';
    btn.classList.add('saved');
  }
}

/**
 * Open preferences panel
 */
export function openPreferences() {
  const panel = document.getElementById('preferences-panel');
  if (!panel) return;
  renderPreferencesPanel();
  panel.classList.add('open');
  panel.querySelector('.prefs-close')?.focus();
}

/**
 * Close preferences panel
 */
export function closePreferences() {
  const panel = document.getElementById('preferences-panel');
  if (!panel) return;
  panel.classList.remove('open');
  if (panel._escHandler) {
    document.removeEventListener('keydown', panel._escHandler);
  }
}

/**
 * Apply preferences to module ordering
 * Returns reordered module keys with preferred ones first
 */
export function applyPreferencesToModuleOrder(moduleKeys) {
  if (!currentPrefs?.categories?.length) return moduleKeys;

  const preferred = currentPrefs.categories;
  const inPrefs = moduleKeys.filter(k => preferred.includes(k));
  const notInPrefs = moduleKeys.filter(k => !preferred.includes(k));

  // Maintain relative order within each group
  return [...inPrefs, ...notInPrefs];
}

/**
 * Initialize preferences system
 */
export async function initPreferences(changeCallback) {
  onPrefsChanged = changeCallback;
  await loadPreferences();

  // Wire up the preferences button
  document.getElementById('prefs-btn')?.addEventListener('click', openPreferences);
}
