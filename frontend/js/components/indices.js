/**
 * Indices Bar Component
 * Renders the three composite indices (Solar-Geo, Astro Events, Calendar Sync)
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
      <div class="index-item">
        <span class="index-label">Solar-Geo:</span>
        <span class="index-value">--</span>
      </div>
      <div class="index-item">
        <span class="index-label">Astro Events:</span>
        <span class="index-value">--</span>
      </div>
      <div class="index-item">
        <span class="index-label">Calendar Sync:</span>
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
 * Render a single index
 */
function renderIndex(label, data) {
  if (!data) {
    return `
      <div class="index-item">
        <span class="index-label">${label}:</span>
        <span class="index-value">--</span>
      </div>
    `;
  }

  const value = typeof data.value === 'number' ? data.value.toFixed(1) : data.value;
  const trend = data.trend || 'stable';
  const trendIcon = getTrendIcon(trend);
  const level = data.level || '';

  return `
    <div class="index-item" title="${level}">
      <span class="index-label">${label}:</span>
      <span class="index-value">${value}</span>
      <span class="index-trend ${trend}">${trendIcon}</span>
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
