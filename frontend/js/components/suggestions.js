/**
 * Suggestions Component
 * Renders action suggestions with favorable/caution categorization
 */

/**
 * Render suggestions section
 * @param {Array} suggestions - Action suggestions from API
 */
export function renderSuggestions(suggestions) {
  const container = document.getElementById('suggestions-content');
  if (!container) return;

  if (!suggestions || suggestions.length === 0) {
    container.innerHTML = `
      <p class="text-muted">No specific suggestions at this time. Check back when more data is available.</p>
    `;
    return;
  }

  // Group suggestions by category type
  const grouped = groupSuggestions(suggestions);

  container.innerHTML = `
    ${grouped.favorable.length > 0 ? renderSuggestionGroup('Favorable For', 'favorable', grouped.favorable) : ''}
    ${grouped.caution.length > 0 ? renderSuggestionGroup('Caution Advised', 'caution', grouped.caution) : ''}
    ${grouped.info.length > 0 ? renderSuggestionGroup('Information', 'info', grouped.info) : ''}
  `;
}

/**
 * Group suggestions by type
 */
function groupSuggestions(suggestions) {
  const grouped = {
    favorable: [],
    caution: [],
    info: []
  };

  suggestions.forEach(suggestion => {
    const category = (suggestion.category || '').toLowerCase();
    const suggestionText = suggestion.suggestion || '';
    const reasoning = suggestion.reasoning || '';

    // Determine if favorable or caution based on content
    const isCaution =
      suggestionText.toLowerCase().includes('caution') ||
      suggestionText.toLowerCase().includes('avoid') ||
      suggestionText.toLowerCase().includes('elevated') ||
      category === 'caution' ||
      category === 'warning';

    const isFavorable =
      suggestionText.toLowerCase().includes('favorable') ||
      suggestionText.toLowerCase().includes('good') ||
      category === 'favorable' ||
      category === 'positive';

    const item = {
      text: suggestionText,
      reasoning: reasoning,
      confidence: suggestion.confidence,
      disclaimer: suggestion.disclaimer
    };

    if (isCaution) {
      grouped.caution.push(item);
    } else if (isFavorable) {
      grouped.favorable.push(item);
    } else {
      grouped.info.push(item);
    }
  });

  return grouped;
}

/**
 * Render a suggestion group
 */
function renderSuggestionGroup(label, type, items) {
  return `
    <div class="suggestion-group">
      <span class="suggestion-label ${type}">${label}:</span>
      <div class="suggestion-list">
        ${items.map(item => renderSuggestionItem(item)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render a single suggestion item
 */
function renderSuggestionItem(item) {
  const { text, reasoning, confidence, disclaimer } = item;

  let tooltip = '';
  if (reasoning) {
    tooltip = `title="${escapeHtml(reasoning)}${disclaimer ? ' | ' + disclaimer : ''}"`;
  }

  const confidenceIndicator = confidence ?
    `<span class="suggestion-confidence" style="font-size: 0.7rem; color: var(--text-muted);">(${confidence})</span>` : '';

  return `
    <span class="suggestion-item" ${tooltip}>
      ${escapeHtml(text)} ${confidenceIndicator}
    </span>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default { renderSuggestions };
