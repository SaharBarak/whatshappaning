/**
 * Insight Component - AI-powered cosmic narrative
 * Fetches from /api/insight and renders the conclusion-first hero section
 */

import { config } from '../config.js';
import { getSnapshot } from '../api.js';

const MOOD_GRADIENTS = {
  calm: 'linear-gradient(135deg, #0c1220 0%, #1a2744 50%, #0f1b2d 100%)',
  intense: 'linear-gradient(135deg, #1a0a0a 0%, #3d1515 50%, #2a0e0e 100%)',
  transformative: 'linear-gradient(135deg, #0d0a1a 0%, #2d1b4e 50%, #1a0f30 100%)',
  reflective: 'linear-gradient(135deg, #0a0d1a 0%, #1b2d4e 50%, #0f1a30 100%)',
  energetic: 'linear-gradient(135deg, #1a1000 0%, #4e3a0a 50%, #302200 100%)',
  chaotic: 'linear-gradient(135deg, #1a0515 0%, #4e0a2d 50%, #300f1a 100%)',
  creative: 'linear-gradient(135deg, #0a1a15 0%, #0a4e3a 50%, #0f3022 100%)',
  tender: 'linear-gradient(135deg, #1a0a15 0%, #3d1540 50%, #2a0e28 100%)',
  expansive: 'linear-gradient(135deg, #0a1a1a 0%, #0a4e4e 50%, #0f3030 100%)',
  grounding: 'linear-gradient(135deg, #15120a 0%, #3d3515 50%, #2a250e 100%)',
};

const MOOD_EMOJIS = {
  calm: '🌊', intense: '🔥', transformative: '🦋', reflective: '🪞',
  energetic: '⚡', chaotic: '🌪️', creative: '🎨', tender: '💗',
  expansive: '🌌', grounding: '🌿',
};

let insightData = null;
let isLoading = false;
let hasError = false;

/**
 * Fetch insight — tries static snapshot first, falls back to API
 */
async function fetchInsight(forceRefresh = false) {
  // Try snapshot first (unless force refresh)
  if (!forceRefresh) {
    try {
      const snapshot = await getSnapshot();
      if (snapshot && snapshot.data && snapshot.data.insight) {
        return snapshot.data.insight;
      }
    } catch (e) {
      // Fall through to API
    }
  }

  const url = forceRefresh
    ? `${config.apiUrl}/api/insight/refresh`
    : `${config.apiUrl}/api/insight`;
  
  const options = forceRefresh ? { method: 'POST' } : {};
  
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/**
 * Render skeleton loading state
 */
function renderSkeleton() {
  const container = document.getElementById('insight-hero');
  if (!container) return;

  container.innerHTML = `
    <div class="insight-loading">
      <div class="insight-skeleton-mood skeleton"></div>
      <div class="insight-skeleton-line skeleton" style="width:90%"></div>
      <div class="insight-skeleton-line skeleton" style="width:75%"></div>
      <div class="insight-skeleton-line skeleton" style="width:85%"></div>
      <div class="insight-skeleton-line skeleton" style="width:60%"></div>
      <div class="insight-skeleton-pills">
        <span class="insight-skeleton-pill skeleton"></span>
        <span class="insight-skeleton-pill skeleton"></span>
        <span class="insight-skeleton-pill skeleton"></span>
      </div>
    </div>
  `;
  container.style.background = MOOD_GRADIENTS.reflective;
}

/**
 * Render the insight data
 */
function renderInsight(data) {
  const container = document.getElementById('insight-hero');
  if (!container) return;

  const mood = data.mood || 'reflective';
  const emoji = MOOD_EMOJIS[mood] || '✨';
  container.style.background = MOOD_GRADIENTS[mood] || MOOD_GRADIENTS.reflective;

  // Format insight paragraphs
  const paragraphs = data.insight.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');

  // Highlights
  const highlights = (data.highlights || []).map(h => 
    `<span class="insight-highlight-pill" data-source="${findSourceForHighlight(h, data.sources)}">${h}</span>`
  ).join('');

  // Time ago
  const genTime = data.generated_at ? new Date(data.generated_at) : null;
  const timeAgo = genTime ? formatTimeAgo(genTime) : '';

  container.innerHTML = `
    <div class="insight-mood-badge">${emoji} ${mood}</div>
    <div class="insight-narrative">${paragraphs}</div>
    ${highlights ? `<div class="insight-highlights">${highlights}</div>` : ''}
    <div class="insight-guidance">
      <div class="insight-guidance-header">
        <span class="insight-guidance-icon">🧭</span>
        <span class="insight-guidance-label">Guidance for today</span>
      </div>
      <p class="insight-guidance-text">${data.guidance || ''}</p>
    </div>
    <div class="insight-meta">
      <span class="insight-sources">Based on ${(data.sources || []).length} data sources</span>
      ${timeAgo ? `<span class="insight-time">Updated ${timeAgo}</span>` : ''}
      <button class="insight-refresh-btn" id="insight-refresh-btn" aria-label="Refresh insight">↻ Refresh</button>
    </div>
  `;

  // Refresh button
  document.getElementById('insight-refresh-btn')?.addEventListener('click', () => {
    loadInsight(true);
  });

  // Highlight pills click → scroll to module
  container.querySelectorAll('.insight-highlight-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const source = pill.dataset.source;
      if (source) {
        // Expand raw data section and scroll to module
        const rawSection = document.getElementById('raw-data-section');
        if (rawSection && rawSection.classList.contains('collapsed')) {
          rawSection.classList.remove('collapsed');
          document.getElementById('raw-data-toggle')?.setAttribute('aria-expanded', 'true');
        }
        const moduleCard = document.querySelector(`.module-card[data-module="${source}"]`);
        if (moduleCard) {
          moduleCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          moduleCard.classList.add('highlight-flash');
          setTimeout(() => moduleCard.classList.remove('highlight-flash'), 2000);
        }
      }
    });
  });
}

/**
 * Render error fallback
 */
function renderError() {
  const container = document.getElementById('insight-hero');
  if (!container) return;

  container.style.background = MOOD_GRADIENTS.reflective;
  container.innerHTML = `
    <div class="insight-error">
      <span class="insight-error-icon">🔭</span>
      <p class="insight-error-text">Cosmic insight is taking a moment to align. Explore the raw data below while we recalibrate.</p>
      <button class="insight-refresh-btn" id="insight-refresh-btn">Try again</button>
    </div>
  `;

  document.getElementById('insight-refresh-btn')?.addEventListener('click', () => {
    loadInsight(true);
  });

  // Auto-expand raw data on error
  const rawSection = document.getElementById('raw-data-section');
  if (rawSection) rawSection.classList.remove('collapsed');
}

/**
 * Main load function
 */
export async function loadInsight(forceRefresh = false) {
  isLoading = true;
  hasError = false;
  renderSkeleton();

  try {
    insightData = await fetchInsight(forceRefresh);
    renderInsight(insightData);
    hasError = false;
  } catch (err) {
    console.error('Failed to load insight:', err);
    hasError = true;
    renderError();
  } finally {
    isLoading = false;
  }
}

/**
 * Try to match a highlight string to a source module
 */
function findSourceForHighlight(highlight, sources) {
  const h = highlight.toLowerCase();
  const moduleKeywords = {
    moon: ['moon', 'lunar', 'waning', 'waxing', 'full moon', 'new moon'],
    astrology: ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'neptune', 'uranus', 'pluto', 'retrograde', 'transit', 'conjunction', 'opposition', 'trine', 'square', 'sextile', 'pisces', 'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius'],
    solar: ['solar', 'sunspot', 'flare', 'cme', 'solar wind'],
    schumann: ['schumann', 'resonance', 'hz'],
    tarot: ['tarot', 'card', 'arcana'],
    numerology: ['numerology', 'life path', 'master number'],
    iching: ['i ching', 'hexagram'],
    tzolkin: ['tzolkin', 'kin', 'tone'],
    dreamspell: ['dreamspell', 'wavespell'],
    cosmic: ['cosmic', 'galactic'],
    markets: ['market', 'bitcoin', 'btc', 'vix', 's&p', 'gold'],
    geophysical: ['earthquake', 'quake', 'seismic', 'geomagnetic'],
    sentiment: ['sentiment', 'fear', 'greed'],
    news: ['news', 'headline'],
    gematria: ['gematria'],
    parasha: ['parasha', 'torah'],
  };

  for (const [mod, keywords] of Object.entries(moduleKeywords)) {
    if (keywords.some(kw => h.includes(kw)) && (sources || []).includes(mod)) {
      return mod;
    }
  }
  return '';
}

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export { insightData, isLoading, hasError };
