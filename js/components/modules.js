/**
 * Modules Component
 * Renders all 16 data module cards with expandable details
 */

import { config } from '../config.js';
import { calculateFreshness } from '../api.js';

// Module-specific renderers
const moduleRenderers = {
  moon: renderMoon,
  tzolkin: renderTzolkin,
  dreamspell: renderDreamspell,
  parasha: renderParasha,
  gematria: renderGematria,
  numerology: renderNumerology,
  iching: renderIching,
  tarot: renderTarot,
  solar: renderSolar,
  schumann: renderSchumann,
  cosmic: renderCosmic,
  astrology: renderAstrology,
  markets: renderMarkets,
  geophysical: renderGeophysical,
  sentiment: renderSentiment,
  news: renderNews
};

/**
 * Render all module cards
 * @param {Object} modules - Module data from API
 * @param {Set} expanded - Set of expanded module names
 * @param {Function} onToggle - Toggle callback
 */
export function renderModules(modules, expanded, onToggle) {
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

  container.innerHTML = config.moduleOrder.map(name => {
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

    // Extract data and collectedAt from wrapper (API returns { data, collectedAt })
    const moduleData = moduleWrapper.data || moduleWrapper;
    const collectedAt = moduleWrapper.collectedAt;
    const freshness = collectedAt ? calculateFreshness(collectedAt) : 'stale';

    const renderer = moduleRenderers[name] || renderGeneric;
    return renderer(name, moduleData, moduleConfig, isExpanded, freshness);
  }).join('');
}

// Helper to create module card wrapper
function createModuleCard(name, config, isExpanded, primary, secondary, details = '', freshness = 'live') {
  const freshnessClass = `freshness-${freshness}`;
  return `
    <div class="module-card ${isExpanded ? 'expanded' : ''}" data-module="${name}"
         onclick="window.toggleModule && window.toggleModule('${name}')"
         tabindex="0" role="button" aria-expanded="${isExpanded}">
      <div class="module-header">
        <span class="module-icon">${config.icon}</span>
        <span class="module-name">${config.name}</span>
        <span class="freshness-badge ${freshnessClass}">${freshness}</span>
      </div>
      <div class="module-primary">${primary}</div>
      <div class="module-secondary">${secondary}</div>
      ${details ? `<div class="module-details">${details}</div>` : ''}
    </div>
  `;
}

// Helper to create detail row
function detailRow(label, value) {
  if (value === undefined || value === null) return '';
  return `<div class="module-detail-row"><span class="detail-label">${label}</span><span class="detail-value">${value}</span></div>`;
}

// === Module-specific renderers ===

function renderMoon(name, data, config, isExpanded, freshness) {
  const primary = `${data.phaseName || data.phase || '--'}`;
  const secondary = `${data.illumination ? Math.round(data.illumination) + '%' : '--'} ${data.sign || ''}`;

  const details = `
    ${detailRow('Phase', data.phaseName || data.phase)}
    ${detailRow('Illumination', data.illumination ? Math.round(data.illumination) + '%' : null)}
    ${detailRow('Sign', data.sign)}
    ${detailRow('Age', data.age ? data.age.toFixed(1) + ' days' : null)}
    ${detailRow('VOC', data.voidOfCourse ? 'Yes' : 'No')}
    ${detailRow('Next Phase', data.nextPhase?.phase)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderTzolkin(name, data, config, isExpanded, freshness) {
  const primary = `${data.tone || '--'} ${data.daySignName || data.daySign || ''}`;
  const secondary = data.meaning || '--';

  const details = `
    ${detailRow('Tone', data.tone)}
    ${detailRow('Tone Name', data.toneName)}
    ${detailRow('Day Sign', data.daySignName || data.daySign)}
    ${detailRow('Meaning', data.meaning)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderDreamspell(name, data, config, isExpanded, freshness) {
  const primary = `Kin ${data.kin || '--'}`;
  const toneName = data.toneName || data.tone || '';
  const sealName = data.sealName || data.seal || '--';
  const secondary = toneName ? `${toneName} ${sealName}` : sealName;

  const details = `
    ${detailRow('Kin', data.kin)}
    ${detailRow('Seal', data.sealName || data.seal)}
    ${detailRow('Tone', data.toneName || data.tone)}
    ${detailRow('Wavespell', data.wavespell)}
    ${detailRow('GAP Day', data.isGAP ? 'Yes' : 'No')}
    ${detailRow('Guide', data.guidePower)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderParasha(name, data, config, isExpanded, freshness) {
  const primary = data.name || '--';
  const secondary = data.hebrewName || '--';

  const details = `
    ${detailRow('Name', data.name)}
    ${detailRow('Hebrew', data.hebrewName)}
    ${detailRow('Book', data.book)}
    ${detailRow('Chapters', data.chapters)}
    ${detailRow('Hebrew Date', data.hebrewDate)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderGematria(name, data, config, isExpanded, freshness) {
  const primary = `${data.dateStandard || data.dateGematria || '--'} → ${data.dateReduced || data.reducedValue || '--'}`;
  const secondary = data.hebrewDate || '--';

  const details = `
    ${detailRow('Hebrew Date', data.hebrewDate)}
    ${detailRow('Date Gematria', data.dateStandard || data.dateGematria)}
    ${detailRow('Reduced', data.dateReduced || data.reducedValue)}
    ${detailRow('Parasha', data.parashaEnglish)}
    ${detailRow('Parasha Gematria', data.parashaStandard || data.parashaGematria)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderNumerology(name, data, config, isExpanded, freshness) {
  // Handle nested numerology structure
  const num = data.numerology || data;
  const hour = data.planetaryHour || {};
  const primary = `Day: ${num.universalDay || '--'}`;
  const secondary = hour.current ? `${hour.symbol || '♃'} ${hour.current}` : (hour.dayRuler || '--');

  const details = `
    ${detailRow('Universal Day', num.universalDay)}
    ${detailRow('Meaning', num.meaning)}
    ${detailRow('Vibration', num.vibration)}
    ${detailRow('Day Ruler', hour.dayRuler)}
    ${detailRow('Current Hour', hour.current)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderIching(name, data, config, isExpanded, freshness) {
  // Handle nested hexagram structure
  const hex = data.hexagram || data;
  const primary = `${hex.number || '--'} ${hex.chinese || ''}`;
  const secondary = hex.name || '--';

  const details = `
    ${detailRow('Hexagram', hex.number)}
    ${detailRow('Name', hex.name)}
    ${detailRow('Chinese', hex.chinese)}
    ${detailRow('Upper Trigram', typeof hex.upperTrigram === 'object' ? hex.upperTrigram?.name : hex.upperTrigram)}
    ${detailRow('Lower Trigram', typeof hex.lowerTrigram === 'object' ? hex.lowerTrigram?.name : hex.lowerTrigram)}
    ${detailRow('Keywords', Array.isArray(hex.keywords) ? hex.keywords.join(', ') : hex.keywords)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderTarot(name, data, config, isExpanded, freshness) {
  // Handle nested card structure
  const card = data.card || data;
  const cardNum = card.number !== undefined ? card.number : null;
  const cardDisplay = cardNum !== null ? (cardNum === 0 ? '0' : romanize(cardNum) || cardNum) : (card.arcana === 'Minor' ? card.number : '--');
  const primary = card.name || '--';
  const secondary = data.meaning || (Array.isArray(card.keywords) ? card.keywords.slice(0, 2).join(', ') : '--');

  const details = `
    ${detailRow('Card', card.name)}
    ${detailRow('Arcana', card.arcana)}
    ${detailRow('Suit', card.suit)}
    ${detailRow('Element', card.element)}
    ${detailRow('Keywords', Array.isArray(card.keywords) ? card.keywords.join(', ') : card.keywords)}
    ${detailRow('Meaning', data.meaning)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderSolar(name, data, config, isExpanded, freshness) {
  const kp = data.kpIndex !== undefined ? `Kp:${data.kpIndex}` : 'Kp:--';
  const flare = data.flareClass || '--';
  const primary = `${kp} ${flare}`;
  const secondary = data.solarWind?.speed ? `Wind:${Math.round(data.solarWind.speed)}` : '--';

  const details = `
    ${detailRow('Kp Index', data.kpIndex)}
    ${detailRow('Ap Index', data.apIndex)}
    ${detailRow('Flare Class', data.flareClass)}
    ${detailRow('Sunspot Number', data.sunspotNumber)}
    ${detailRow('Solar Wind', data.solarWind?.speed ? Math.round(data.solarWind.speed) + ' km/s' : null)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderSchumann(name, data, config, isExpanded, freshness) {
  const freq = data.baseFrequency ? `${data.baseFrequency}Hz` : '--';
  const primary = freq;
  const secondary = data.activity || 'Normal';

  const details = `
    ${detailRow('Base Frequency', data.baseFrequency ? data.baseFrequency + ' Hz' : null)}
    ${detailRow('Amplitude', data.amplitude)}
    ${detailRow('Activity', data.activity)}
    ${detailRow('Source', data.source)}
    ${detailRow('Estimated', data.isEstimated ? 'Yes' : 'No')}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderCosmic(name, data, config, isExpanded, freshness) {
  const level = data.cosmicRayLevel ? `${Math.round(data.cosmicRayLevel)}%` : '--';
  const primary = `Rays:${level}`;
  const showers = data.activeShowers?.length > 0 ? data.activeShowers[0].name : 'No shower';
  const secondary = showers;

  const details = `
    ${detailRow('Cosmic Ray Level', data.cosmicRayLevel ? data.cosmicRayLevel + '%' : null)}
    ${detailRow('Neutron Count', data.neutronCount)}
    ${detailRow('Active Showers', data.activeShowers?.map(s => s.name).join(', ') || 'None')}
    ${detailRow('Next Peak', data.nextPeak?.name)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderAstrology(name, data, config, isExpanded, freshness) {
  // Find Sun and Moon from planets
  const sun = data.planets?.find(p => p.name === 'Sun');
  const moon = data.planets?.find(p => p.name === 'Moon');

  const sunSign = sun?.sign || '--';
  const moonSign = moon?.sign || '--';
  const retrogrades = data.retrogrades?.length || 0;

  const primary = `☉${sunSign.substring(0, 3)}`;
  const secondary = `☽${moonSign.substring(0, 3)}${retrogrades > 0 ? ` [${retrogrades}R]` : ''}`;

  const details = `
    ${detailRow('Sun Sign', sun?.sign)}
    ${detailRow('Moon Sign', moon?.sign)}
    ${detailRow('Retrogrades', data.retrogrades?.map(r => r.planet || r).join(', ') || 'None')}
    ${detailRow('VOC Moon', data.voidOfCourseMoon ? 'Yes' : 'No')}
    ${detailRow('Aspects', data.aspects?.length || 0)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderMarkets(name, data, config, isExpanded, freshness) {
  const spxChange = data.spx?.changePercent;
  const spxDisplay = spxChange !== undefined ? `SPX ${spxChange >= 0 ? '+' : ''}${spxChange.toFixed(1)}%` : 'SPX --';
  const vix = data.vix?.value !== undefined ? `VIX:${data.vix.value.toFixed(1)}` : 'VIX:--';

  const primary = spxDisplay;
  const secondary = vix;

  const details = `
    ${detailRow('S&P 500', data.spx?.price?.toFixed(2))}
    ${detailRow('SPX Change', spxChange !== undefined ? (spxChange >= 0 ? '+' : '') + spxChange.toFixed(2) + '%' : null)}
    ${detailRow('VIX', data.vix?.value?.toFixed(2))}
    ${detailRow('Bitcoin', data.btc?.price ? '$' + data.btc.price.toLocaleString() : null)}
    ${detailRow('BTC Change', data.btc?.changePercent !== undefined ? (data.btc.changePercent >= 0 ? '+' : '') + data.btc.changePercent.toFixed(2) + '%' : null)}
    ${detailRow('Gold', data.gold?.price ? '$' + data.gold.price.toFixed(2) : null)}
    ${detailRow('Crypto F&G', data.cryptoFearGreed?.value)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderGeophysical(name, data, config, isExpanded, freshness) {
  const quakeCount = data.quakeCount !== undefined ? `Quakes:${data.quakeCount}` : 'Quakes:--';
  const maxMag = data.maxMagnitude !== undefined ? `M${data.maxMagnitude.toFixed(1)}+: ${data.significantQuakes?.length || 0}` : '--';

  const primary = quakeCount;
  const secondary = maxMag;

  const details = `
    ${detailRow('Quake Count (24h)', data.quakeCount)}
    ${detailRow('Max Magnitude', data.maxMagnitude?.toFixed(1))}
    ${detailRow('Significant', data.significantQuakes?.length)}
    ${detailRow('Activity Level', data.activityLevel)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderSentiment(name, data, config, isExpanded, freshness) {
  // Handle nested aggregate structure
  const agg = data.aggregate || {};
  const comp = data.components || {};
  const score = agg.score !== undefined ? agg.score : '--';
  const label = agg.label || 'Unknown';
  const trend = agg.trend || '';
  const trendArrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '';
  const change = agg.change24h;

  const primary = `${score} ${label}`;
  const secondary = `${trendArrow} ${change !== undefined && change !== null ? (change >= 0 ? '+' : '') + change : '--'}`;

  const details = `
    ${detailRow('Aggregate', score)}
    ${detailRow('Label', label)}
    ${detailRow('Crypto F&G', comp.cryptoFearGreed?.score)}
    ${detailRow('CNN F&G', comp.cnnFearGreed?.score)}
    ${detailRow('Trend', trend)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderNews(name, data, config, isExpanded, freshness) {
  const themeCount = data.themes?.length || 0;
  const dominant = data.dominantTheme || '--';

  const primary = `Themes: ${themeCount}`;
  const secondary = dominant;

  const themesList = data.themes?.slice(0, 5).map(t =>
    detailRow(t.theme || t.name || 'Theme', t.count || t.sentiment || '')
  ).join('') || '';

  const details = `
    ${detailRow('Dominant Theme', data.dominantTheme)}
    ${detailRow('Sentiment', data.sentiment)}
    ${detailRow('Article Count', data.articleCount)}
    ${themesList}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

function renderGeneric(name, data, config, isExpanded, freshness) {
  const primary = JSON.stringify(data).substring(0, 20) + '...';
  const secondary = '--';

  return createModuleCard(name, config, isExpanded, primary, secondary, '', freshness);
}

// Roman numeral helper for Tarot
function romanize(num) {
  if (!num || num < 1) return num;
  const lookup = {
    M: 1000, CM: 900, D: 500, CD: 400,
    C: 100, XC: 90, L: 50, XL: 40,
    X: 10, IX: 9, V: 5, IV: 4, I: 1
  };
  let roman = '';
  for (const [key, value] of Object.entries(lookup)) {
    while (num >= value) {
      roman += key;
      num -= value;
    }
  }
  return roman;
}

export default { renderModules };
