/**
 * Shared helpers for module renderers
 */

export function createModuleCard(name, config, isExpanded, primary, secondary, details = '', freshness = 'live') {
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

export function detailRow(label, value) {
  if (value === undefined || value === null) return '';
  return `<div class="module-detail-row"><span class="detail-label">${label}</span><span class="detail-value">${value}</span></div>`;
}

export function romanize(num) {
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
