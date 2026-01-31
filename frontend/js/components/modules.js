/**
 * Modules Component
 * Renders all 16 data module cards with expandable details
 */

import { config } from '../config.js';

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
    const moduleData = modules[name];
    const moduleConfig = config.modules[name] || { icon: '📊', name: name.toUpperCase() };
    const isExpanded = expanded.has(name);

    if (!moduleData) {
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

    const renderer = moduleRenderers[name] || renderGeneric;
    return renderer(name, moduleData, moduleConfig, isExpanded);
  }).join('');
}

// Helper to create module card wrapper
function createModuleCard(name, config, isExpanded, primary, secondary, details = '') {
  return `
    <div class="module-card ${isExpanded ? 'expanded' : ''}" data-module="${name}"
         onclick="window.toggleModule && window.toggleModule('${name}')"
         tabindex="0" role="button" aria-expanded="${isExpanded}">
      <div class="module-header">
        <span class="module-icon">${config.icon}</span>
        <span class="module-name">${config.name}</span>
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

function renderMoon(name, data, config, isExpanded) {
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

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderTzolkin(name, data, config, isExpanded) {
  const primary = `${data.tone || '--'} ${data.daySignName || data.daySign || ''}`;
  const secondary = data.meaning || '--';

  const details = `
    ${detailRow('Tone', data.tone)}
    ${detailRow('Tone Name', data.toneName)}
    ${detailRow('Day Sign', data.daySignName || data.daySign)}
    ${detailRow('Meaning', data.meaning)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderDreamspell(name, data, config, isExpanded) {
  const primary = `Kin ${data.kin || '--'}`;
  const secondary = `${data.sealName || data.seal || '--'}`;

  const details = `
    ${detailRow('Kin', data.kin)}
    ${detailRow('Seal', data.sealName || data.seal)}
    ${detailRow('Tone', data.toneName || data.tone)}
    ${detailRow('Wavespell', data.wavespell)}
    ${detailRow('GAP Day', data.isGAP ? 'Yes' : 'No')}
    ${detailRow('Guide', data.guidePower)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderParasha(name, data, config, isExpanded) {
  const primary = data.name || '--';
  const secondary = data.hebrewName || '--';

  const details = `
    ${detailRow('Name', data.name)}
    ${detailRow('Hebrew', data.hebrewName)}
    ${detailRow('Book', data.book)}
    ${detailRow('Chapters', data.chapters)}
    ${detailRow('Hebrew Date', data.hebrewDate)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderGematria(name, data, config, isExpanded) {
  const primary = `${data.dateGematria || '--'} → ${data.reducedValue || '--'}`;
  const secondary = data.hebrewDate || '--';

  const details = `
    ${detailRow('Hebrew Date', data.hebrewDate)}
    ${detailRow('Date Gematria', data.dateGematria)}
    ${detailRow('Reduced', data.reducedValue)}
    ${detailRow('Parasha Gematria', data.parashaGematria)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderNumerology(name, data, config, isExpanded) {
  const primary = `Day: ${data.universalDay || '--'}`;
  const secondary = data.currentHourRuler ? `♃ ${data.currentHourRuler}` : (data.dayRuler || '--');

  const details = `
    ${detailRow('Universal Day', data.universalDay)}
    ${detailRow('Day Meaning', data.dayMeaning)}
    ${detailRow('Day Ruler', data.dayRuler)}
    ${detailRow('Current Hour', data.currentHourRuler)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderIching(name, data, config, isExpanded) {
  const primary = `${data.number || '--'} ${data.chinese || ''}`;
  const secondary = data.name || '--';

  const details = `
    ${detailRow('Hexagram', data.number)}
    ${detailRow('Name', data.name)}
    ${detailRow('Chinese', data.chinese)}
    ${detailRow('Upper Trigram', typeof data.upperTrigram === 'object' ? data.upperTrigram?.name : data.upperTrigram)}
    ${detailRow('Lower Trigram', typeof data.lowerTrigram === 'object' ? data.lowerTrigram?.name : data.lowerTrigram)}
    ${detailRow('Keywords', Array.isArray(data.keywords) ? data.keywords.join(', ') : data.keywords)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderTarot(name, data, config, isExpanded) {
  const cardDisplay = data.number !== undefined ? (data.number === 0 ? '0' : romanize(data.number) || data.number) : '--';
  const primary = cardDisplay;
  const secondary = data.name || data.card || '--';

  const details = `
    ${detailRow('Card', data.name || data.card)}
    ${detailRow('Arcana', data.arcana)}
    ${detailRow('Suit', data.suit)}
    ${detailRow('Keywords', Array.isArray(data.keywords) ? data.keywords.join(', ') : data.keywords)}
    ${detailRow('Interpretation', data.interpretation)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderSolar(name, data, config, isExpanded) {
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

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderSchumann(name, data, config, isExpanded) {
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

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderCosmic(name, data, config, isExpanded) {
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

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderAstrology(name, data, config, isExpanded) {
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

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderMarkets(name, data, config, isExpanded) {
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

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderGeophysical(name, data, config, isExpanded) {
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

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderSentiment(name, data, config, isExpanded) {
  const aggregate = data.aggregate !== undefined ? data.aggregate : '--';
  const trend = data.trend || '';
  const trendArrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '';

  const primary = `${aggregate} ${data.label || 'Fear'}`;
  const secondary = `${trendArrow} ${data.change !== undefined ? (data.change >= 0 ? '+' : '') + data.change : '--'}`;

  const details = `
    ${detailRow('Aggregate', data.aggregate)}
    ${detailRow('Crypto F&G', data.cryptoFearGreed)}
    ${detailRow('CNN F&G', data.cnnFearGreed)}
    ${detailRow('Label', data.label)}
  `;

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderNews(name, data, config, isExpanded) {
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

  return createModuleCard(name, config, isExpanded, primary, secondary, details);
}

function renderGeneric(name, data, config, isExpanded) {
  const primary = JSON.stringify(data).substring(0, 20) + '...';
  const secondary = '--';

  return createModuleCard(name, config, isExpanded, primary, secondary, '');
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
