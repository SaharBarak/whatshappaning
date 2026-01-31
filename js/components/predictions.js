/**
 * Predictions Component
 * Renders prediction cards with probability bars and contributing factors
 */

import { config } from '../config.js';

/**
 * Render predictions list
 * @param {Object} predictionsData - Predictions data from API
 * @param {Set} expanded - Set of expanded prediction IDs
 * @param {Function} onToggle - Toggle callback
 */
export function renderPredictions(predictionsData, expanded, onToggle) {
  const container = document.getElementById('predictions-list');
  if (!container) return;

  const predictions = predictionsData?.predictions || [];

  if (predictions.length === 0) {
    container.innerHTML = `
      <div class="no-predictions">
        <p class="text-muted">No predictions available. Data collection in progress.</p>
      </div>
    `;
    return;
  }

  // Sort by probability (highest first)
  const sortedPredictions = [...predictions].sort((a, b) => b.probability - a.probability);

  container.innerHTML = sortedPredictions.map(prediction =>
    renderPrediction(prediction, expanded.has(prediction.outcomeId), onToggle)
  ).join('');
}

/**
 * Render a single prediction card
 */
function renderPrediction(prediction, isExpanded, onToggle) {
  const {
    outcome,
    outcomeId,
    probability,
    confidenceInterval,
    sampleSize,
    baseRate,
    lift,
    confidence,
    factors,
    historicalContext
  } = prediction;

  const probabilityPercent = Math.round(probability * 100);
  const ciLow = confidenceInterval ? Math.round(confidenceInterval[0] * 100) : null;
  const ciHigh = confidenceInterval ? Math.round(confidenceInterval[1] * 100) : null;
  const ciText = ciLow !== null ? `[${ciLow}-${ciHigh}%]` : '';

  const confidenceClass = getConfidenceClass(confidence);
  const barClass = getBarClass(probability);

  const displayName = config.outcomeNames[outcomeId] || outcome || outcomeId;

  return `
    <div class="prediction ${isExpanded ? 'expanded' : ''}"
         data-outcome="${outcomeId}"
         onclick="window.togglePrediction && window.togglePrediction('${outcomeId}')"
         tabindex="0"
         role="button"
         aria-expanded="${isExpanded}">
      <div class="prediction-summary">
        <div class="prediction-header">
          <span class="prediction-name">${displayName}</span>
          <div class="prediction-stats">
            <span class="confidence-interval">${ciText}</span>
            <span class="sample-size">n=${sampleSize || '?'}</span>
            <span class="confidence-badge ${confidenceClass}">${confidence || 'unknown'}</span>
          </div>
        </div>
        <div class="probability-row">
          <div class="probability-bar">
            <div class="probability-fill ${barClass}" style="width: ${probabilityPercent}%"></div>
          </div>
          <span class="probability-value">${probabilityPercent}%</span>
        </div>
      </div>
      ${isExpanded ? renderPredictionDetails(prediction) : ''}
    </div>
  `;
}

/**
 * Render expanded prediction details
 */
function renderPredictionDetails(prediction) {
  const { factors, baseRate, lift, historicalContext } = prediction;

  return `
    <div class="prediction-details">
      ${factors && factors.length > 0 ? renderFactors(factors) : '<p class="text-muted">No factor data available</p>'}
      <div class="prediction-meta">
        ${baseRate ? `<div class="meta-item"><span class="meta-label">Base rate:</span> <span class="meta-value">${Math.round(baseRate * 100)}%</span></div>` : ''}
        ${lift ? `<div class="meta-item"><span class="meta-label">Lift:</span> <span class="meta-value">${lift.toFixed(2)}x</span></div>` : ''}
      </div>
      ${historicalContext ? `<p class="historical-context text-muted" style="margin-top: 8px; font-size: 0.85rem;">${historicalContext}</p>` : ''}
    </div>
  `;
}

/**
 * Render contributing factors
 */
function renderFactors(factors) {
  // Sort by contribution (absolute value, highest first)
  const sortedFactors = [...factors].sort((a, b) =>
    Math.abs(b.contribution) - Math.abs(a.contribution)
  );

  // Limit to max visible
  const visibleFactors = sortedFactors.slice(0, config.maxVisibleFactors);
  const hasMore = sortedFactors.length > config.maxVisibleFactors;

  const maxContribution = Math.max(...sortedFactors.map(f => Math.abs(f.contribution)));

  return `
    <div class="factors-list">
      ${visibleFactors.map((factor, index) => renderFactor(factor, index, visibleFactors.length, maxContribution)).join('')}
      ${hasMore ? `<div class="factor text-muted"><span class="factor-tree">└</span> +${sortedFactors.length - config.maxVisibleFactors} more factors...</div>` : ''}
    </div>
  `;
}

/**
 * Render a single factor
 */
function renderFactor(factor, index, total, maxContribution) {
  const { feature, value, contribution, standalone, sampleSize } = factor;

  const isLast = index === total - 1;
  const treeSymbol = isLast ? '└' : '├';

  const contributionPercent = Math.round(contribution * 100);
  const contributionSign = contribution >= 0 ? '+' : '';
  const contributionClass = contribution >= 0 ? 'positive' : 'negative';

  // Calculate bar width as percentage of max contribution
  const barWidth = maxContribution > 0 ? (Math.abs(contribution) / maxContribution) * 100 : 0;

  const featureDisplay = config.featureNames[feature] || feature;
  const valueDisplay = formatValue(value);

  return `
    <div class="factor">
      <span class="factor-tree">${treeSymbol}─</span>
      <span class="factor-name">${featureDisplay}${valueDisplay ? ': ' + valueDisplay : ''}</span>
      <span class="factor-contribution ${contributionClass}">${contributionSign}${contributionPercent}%</span>
      <span class="factor-sample">(n=${sampleSize || '?'})</span>
      <div class="factor-bar">
        <div class="factor-bar-fill" style="width: ${barWidth}%"></div>
      </div>
    </div>
  `;
}

/**
 * Format factor value for display
 */
function formatValue(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value.toString();
  return String(value);
}

/**
 * Get confidence badge class
 */
function getConfidenceClass(confidence) {
  const level = (confidence || '').toLowerCase().replace(/\s+/g, '-');
  switch (level) {
    case 'very-high': return 'confidence-very-high';
    case 'high': return 'confidence-high';
    case 'medium': return 'confidence-medium';
    case 'low': return 'confidence-low';
    default: return 'confidence-insufficient';
  }
}

/**
 * Get probability bar class based on value
 */
function getBarClass(probability) {
  if (probability >= 0.8) return 'very-high';
  if (probability >= 0.6) return 'high';
  return '';
}

// Expose toggle function globally for onclick handlers
window.togglePrediction = null;

/**
 * Set the toggle callback
 */
export function setToggleCallback(callback) {
  window.togglePrediction = callback;
}

export default { renderPredictions, setToggleCallback };
