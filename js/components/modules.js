/**
 * Modules Component
 * Renders all 16 data module cards with expandable details
 * 
 * Uses lazy-loaded renderer chunks for code splitting:
 * - esoteric.js: Moon, Tzolkin, Dreamspell, Parasha, Gematria, Numerology, I Ching, Tarot
 * - scientific.js: Solar, Schumann, Cosmic, Astrology, Geophysical
 * - realworld.js: Markets, Sentiment, News
 */

import { config } from '../config.js';
import { calculateFreshness } from '../api.js';
import { createModuleCard } from './module-renderers/helpers.js';

// Lazy-loaded renderer registry — loaded on demand per category
const rendererCache = {};

const rendererMap = {
  moon: 'esoteric', tzolkin: 'esoteric', dreamspell: 'esoteric',
  parasha: 'esoteric', gematria: 'esoteric', numerology: 'esoteric',
  iching: 'esoteric', tarot: 'esoteric',
  solar: 'scientific', schumann: 'scientific', cosmic: 'scientific',
  astrology: 'scientific', geophysical: 'scientific',
  markets: 'realworld', sentiment: 'realworld', news: 'realworld'
};

const rendererFnNames = {
  moon: 'renderMoon', tzolkin: 'renderTzolkin', dreamspell: 'renderDreamspell',
  parasha: 'renderParasha', gematria: 'renderGematria', numerology: 'renderNumerology',
  iching: 'renderIching', tarot: 'renderTarot',
  solar: 'renderSolar', schumann: 'renderSchumann', cosmic: 'renderCosmic',
  astrology: 'renderAstrology', geophysical: 'renderGeophysical',
  markets: 'renderMarkets', sentiment: 'renderSentiment', news: 'renderNews'
};

/**
 * Load renderer chunk on demand
 */
async function loadRendererChunk(chunk) {
  if (rendererCache[chunk]) return rendererCache[chunk];
  
  const loaders = {
    esoteric: () => import('./module-renderers/esoteric.js'),
    scientific: () => import('./module-renderers/scientific.js'),
    realworld: () => import('./module-renderers/realworld.js')
  };
  
  rendererCache[chunk] = await loaders[chunk]();
  return rendererCache[chunk];
}

/**
 * Get renderer function, loading chunk if needed
 */
async function getRenderer(moduleName) {
  const chunk = rendererMap[moduleName];
  if (!chunk) return null;
  
  const mod = await loadRendererChunk(chunk);
  return mod[rendererFnNames[moduleName]] || null;
}

/**
 * Render a single module card (sync fallback for generic)
 */
function renderGenericCard(name, data, moduleConfig, isExpanded, freshness) {
  const primary = JSON.stringify(data).substring(0, 20) + '...';
  return createModuleCard(name, moduleConfig, isExpanded, primary, '--', '', freshness);
}

/**
 * Render all module cards
 * @param {Object} modules - Module data from API
 * @param {Set} expanded - Set of expanded module names
 * @param {Function} onToggle - Toggle callback
 */
export async function renderModules(modules, expanded, onToggle) {
  const container = document.getElementById('data-grid');
  if (!container) return;

  // Store toggle callback globally
  window.toggleModule = onToggle;

  if (!modules) {
    // Render skeleton cards
    container.innerHTML = config.moduleOrder.map(name => `
      <div class="module-card skeleton" data-module="${name}">
        <div class="module-header">
          <span class="module-icon">${config.modules[name]?.icon || '📊'}</span>
          <span class="module-name">${config.modules[name]?.name || name.toUpperCase()}</span>
        </div>
        <div class="module-primary">--</div>
        <div class="module-secondary">--</div>
      </div>
    `).join('');
    return;
  }

  // Determine which chunks we need
  const neededChunks = new Set();
  for (const name of config.moduleOrder) {
    const chunk = rendererMap[name];
    if (chunk && modules[name]) neededChunks.add(chunk);
  }

  // Preload all needed chunks in parallel
  await Promise.all([...neededChunks].map(loadRendererChunk));

  // Now render synchronously from cache
  const cards = config.moduleOrder.map(name => {
    const moduleWrapper = modules[name];
    const moduleConfig = config.modules[name] || { icon: '📊', name: name.toUpperCase() };
    const isExpanded = expanded.has(name);

    if (!moduleWrapper) {
      return `
        <div class="module-card" data-module="${name}"
             onclick="window.toggleModule && window.toggleModule('${name}')"
             tabindex="0" role="button">
          <div class="module-header">
            <span class="module-icon">${moduleConfig.icon}</span>
            <span class="module-name">${moduleConfig.name}</span>
          </div>
          <div class="module-primary text-muted">No data</div>
          <div class="module-secondary text-muted">--</div>
        </div>
      `;
    }

    const moduleData = moduleWrapper.data || moduleWrapper;
    const collectedAt = moduleWrapper.collectedAt;
    const freshness = collectedAt ? calculateFreshness(collectedAt) : 'stale';

    const chunk = rendererMap[name];
    const fnName = rendererFnNames[name];
    const renderer = chunk && rendererCache[chunk] ? rendererCache[chunk][fnName] : null;

    if (renderer) {
      return renderer(name, moduleData, moduleConfig, isExpanded, freshness);
    }
    return renderGenericCard(name, moduleData, moduleConfig, isExpanded, freshness);
  });

  container.innerHTML = cards.join('');
}

export default { renderModules };
