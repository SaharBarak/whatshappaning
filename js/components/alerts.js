/**
 * Pattern Alert Component
 * Renders pattern match alerts when similarity exceeds threshold
 */

import { config } from '../config.js';

/**
 * Render pattern alert section
 * @param {Array} alerts - Pattern alerts from API
 */
export function renderPatternAlert(alerts) {
  const container = document.getElementById('pattern-alert');
  if (!container) return;

  // Filter alerts that exceed threshold
  const significantAlerts = (alerts || []).filter(
    alert => alert.matchScore >= config.patternMatchThreshold
  );

  if (significantAlerts.length === 0) {
    container.classList.add('hidden');
    return;
  }

  // Show the most significant alert
  const topAlert = significantAlerts.sort((a, b) => b.matchScore - a.matchScore)[0];

  container.classList.remove('hidden');
  container.innerHTML = renderAlert(topAlert);
}

/**
 * Render a single alert
 */
function renderAlert(alert) {
  const {
    alertType,
    matchScore,
    matchingDates,
    description,
    commonOutcome,
    outcomeRate,
    sampleSize,
    matchingFeatures
  } = alert;

  const matchPercent = Math.round(matchScore * 100);
  const outcomePercent = outcomeRate ? Math.round(outcomeRate * 100) : null;

  return `
    <div class="alert-header">
      <span class="alert-icon">⚠️</span>
      <span class="alert-title">PATTERN ALERT</span>
      <span class="match-score">Match: ${matchPercent}%</span>
    </div>
    <div class="alert-content">
      ${description ? `<p class="alert-description">${escapeHtml(description)}</p>` : ''}

      ${matchingDates && matchingDates.length > 0 ? `
        <p class="text-secondary" style="margin-bottom: 8px;">Conditions match:</p>
        <div class="matching-dates">
          ${matchingDates.slice(0, 5).map(date => `
            <span class="matching-date">${formatDate(date)}</span>
          `).join('')}
          ${matchingDates.length > 5 ? `<span class="matching-date">+${matchingDates.length - 5} more</span>` : ''}
        </div>
      ` : ''}

      ${commonOutcome ? `
        <p class="outcome-rate">
          Historical outcome:
          ${outcomePercent !== null ? `<strong>${outcomePercent}%</strong> ` : ''}
          ${escapeHtml(commonOutcome)}
          ${sampleSize ? ` (n=${sampleSize})` : ''}
        </p>
      ` : ''}

      ${matchingFeatures && matchingFeatures.length > 0 ? `
        <div class="matching-features" style="margin-top: 12px;">
          <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 4px;">Matching features:</p>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${matchingFeatures.slice(0, 8).map(feature => `
              <span style="background: var(--bg-card); padding: 2px 8px; border-radius: 3px; font-size: 0.8rem;">
                ${getFeatureDisplay(feature)} ✓
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get feature display name
 */
function getFeatureDisplay(feature) {
  const names = {
    mercury_retrograde: 'Mercury Rx',
    venus_retrograde: 'Venus Rx',
    mars_retrograde: 'Mars Rx',
    moon_phase: 'Moon Phase',
    moon_void_of_course: 'VOC Moon',
    vix: 'VIX',
    kp_index: 'Kp Index',
    fear_greed_crypto: 'Crypto F&G',
    eclipse_proximity: 'Eclipse'
  };
  return names[feature] || feature.replace(/_/g, ' ');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default { renderPatternAlert };
