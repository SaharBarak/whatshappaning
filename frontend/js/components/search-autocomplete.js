/**
 * Search Autocomplete
 * Provides keyword suggestions as the user types.
 * EPIC-018 (#152)
 */

import { announceToScreenReader } from '../a11y.js';

const MAX_SUGGESTIONS = 8;
const MIN_QUERY_LENGTH = 2;

/**
 * Initialize autocomplete on an input element.
 * @param {HTMLInputElement} input - The search input
 * @param {Function} getSuggestions - (query) => string[] — returns matching terms
 * @param {Function} onSelect - (term) => void — called when a suggestion is picked
 */
export function initAutocomplete(input, getSuggestions, onSelect) {
  if (!input) return;

  let activeIndex = -1;
  let suggestions = [];
  let listEl = null;

  // Create dropdown container
  listEl = document.createElement('ul');
  listEl.className = 'autocomplete-list';
  listEl.setAttribute('role', 'listbox');
  listEl.id = `${input.id}-autocomplete`;
  listEl.hidden = true;
  input.parentNode.style.position = 'relative';
  input.parentNode.appendChild(listEl);

  // ARIA
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', listEl.id);
  input.setAttribute('aria-expanded', 'false');

  function show(items) {
    suggestions = items.slice(0, MAX_SUGGESTIONS);
    activeIndex = -1;

    if (suggestions.length === 0) {
      hide();
      return;
    }

    listEl.innerHTML = suggestions
      .map(
        (item, i) =>
          `<li class="autocomplete-item" role="option" data-index="${i}">${highlight(item, input.value)}</li>`
      )
      .join('');
    listEl.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    announceToScreenReader(`${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''} available`);
  }

  function hide() {
    listEl.hidden = true;
    listEl.innerHTML = '';
    suggestions = [];
    activeIndex = -1;
    input.setAttribute('aria-expanded', 'false');
  }

  function select(index) {
    const term = suggestions[index];
    if (!term) return;
    input.value = term;
    hide();
    onSelect(term);
  }

  function setActive(index) {
    const items = listEl.querySelectorAll('.autocomplete-item');
    items.forEach((el) => el.classList.remove('active'));
    activeIndex = index;
    if (index >= 0 && items[index]) {
      items[index].classList.add('active');
      input.setAttribute('aria-activedescendant', `${listEl.id}-${index}`);
      items[index].id = `${listEl.id}-${index}`;
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  // Events
  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      hide();
      return;
    }
    const items = getSuggestions(q);
    show(items);
  });

  input.addEventListener('keydown', (e) => {
    if (listEl.hidden) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(activeIndex);
    } else if (e.key === 'Escape') {
      hide();
    }
  });

  listEl.addEventListener('mousedown', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (item) {
      e.preventDefault();
      select(parseInt(item.dataset.index, 10));
    }
  });

  input.addEventListener('blur', () => {
    // Delay to allow click on suggestion
    setTimeout(hide, 150);
  });
}

function highlight(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return escapeHtml(text);
  return (
    escapeHtml(text.slice(0, idx)) +
    `<mark>${escapeHtml(text.slice(idx, idx + query.length))}</mark>` +
    escapeHtml(text.slice(idx + query.length))
  );
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

export default { initAutocomplete };
