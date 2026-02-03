/**
 * Indices Bar Component
 * Renders the three composite indices (Solar-Geo, Astro Events, Calendar Sync)
 * Per spec 02-FRONTEND-UI.md line 83: "No labels, just values"
 */

/**
 * Render indices bar
 * @param {Object} indices - Indices data from API
 */
export function renderIndices(indices) {
  const container = document.getElementById('indices-bar');
  if (!container) return;

  if (!indices) {
    container.innerHTML = `
      <div class="index-item" title="Solar-Geo Index">
        <span class="index-value">--</span>
      </div>
      <div class="index-item" title="Astro Events Index">
        <span class="index-value">--</span>
      </div>
      <div class="index-item" title="Calendar Sync Index">
        <span class="index-value">--</span>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    ${renderIndex('Solar-Geo', indices.solarGeo)}
    ${renderIndex('Astro Events', indices.astroEvents)}
    ${renderIndex('Calendar Sync', indices.calendarSync)}
  `;

  // Remove skeleton class
  container.querySelectorAll('.index-item').forEach(item => {
    item.classList.remove('skeleton');
  });
}

/**
 * Render a single index (no labels per spec, use title for accessibility)
 */
function renderIndex(label, data) {
  if (!data) {
    return `
      <div class="index-item" title="${label} Index">
        <span class="index-value">--</span>
      </div>
    `;
  }

  // Get value from different possible fields (value, count, or score)
  let rawValue = data.value ?? data.count ?? data.score ?? null;
  const value = rawValue !== null && rawValue !== undefined
    ? (typeof rawValue === 'number' ? rawValue.toFixed(1) : rawValue)
    : '--';
  const trend = data.trend || 'stable';
  const trendIcon = getTrendIcon(trend);
  const level = data.level || '';
  const tooltip = level && level !== 'Unknown' ? `${label}: ${level}` : `${label} Index`;

  return `
    <div class="index-item" title="${tooltip}" aria-label="${label}: ${value}">
      <span class="index-value">${value}</span>
      <span class="index-trend ${trend}" aria-hidden="true">${trendIcon}</span>
    </div>
  `;
}

/**
 * Get trend icon
 */
function getTrendIcon(trend) {
  switch (trend) {
    case 'rising': return '↑';
    case 'falling': return '↓';
    case 'stable': return '→';
    default: return '';
  }
}

export default { renderIndices };
