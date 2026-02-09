/**
 * Filter URL Persistence
 * Syncs filter state to/from URL query params for shareable filtered views.
 * EPIC-018 (#152)
 */

const PARAM_MAP = {
  search: 'q',
  categories: 'cat',
  confidence: 'conf',
  dateFrom: 'from',
  dateTo: 'to',
  lat: 'lat',
  lng: 'lng',
  radius: 'radius',
};

/**
 * Read filter state from current URL.
 * @returns {Object} Partial filter state from URL params
 */
export function readFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  const state = {};

  if (params.has(PARAM_MAP.search)) {
    state.search = params.get(PARAM_MAP.search);
  }

  if (params.has(PARAM_MAP.categories)) {
    state.categories = params.get(PARAM_MAP.categories).split(',').filter(Boolean);
  }

  if (params.has(PARAM_MAP.confidence)) {
    state.confidence = params.get(PARAM_MAP.confidence);
  }

  if (params.has(PARAM_MAP.dateFrom)) {
    state.dateFrom = params.get(PARAM_MAP.dateFrom);
  }

  if (params.has(PARAM_MAP.dateTo)) {
    state.dateTo = params.get(PARAM_MAP.dateTo);
  }

  if (params.has(PARAM_MAP.lat) && params.has(PARAM_MAP.lng)) {
    state.lat = parseFloat(params.get(PARAM_MAP.lat));
    state.lng = parseFloat(params.get(PARAM_MAP.lng));
  }

  if (params.has(PARAM_MAP.radius)) {
    state.radius = parseInt(params.get(PARAM_MAP.radius), 10);
  }

  return state;
}

/**
 * Write filter state to URL without page reload.
 * @param {Object} filterState
 */
export function writeFiltersToURL(filterState) {
  const params = new URLSearchParams();

  if (filterState.search) {
    params.set(PARAM_MAP.search, filterState.search);
  }

  const cats = filterState.categories;
  if (cats && cats.length > 0) {
    params.set(PARAM_MAP.categories, (Array.isArray(cats) ? cats : Array.from(cats)).join(','));
  }

  if (filterState.confidence && filterState.confidence !== 'all') {
    params.set(PARAM_MAP.confidence, filterState.confidence);
  }

  if (filterState.dateFrom) {
    params.set(PARAM_MAP.dateFrom, filterState.dateFrom);
  }

  if (filterState.dateTo) {
    params.set(PARAM_MAP.dateTo, filterState.dateTo);
  }

  if (filterState.lat != null && filterState.lng != null) {
    params.set(PARAM_MAP.lat, filterState.lat);
    params.set(PARAM_MAP.lng, filterState.lng);
  }

  if (filterState.radius) {
    params.set(PARAM_MAP.radius, filterState.radius);
  }

  const qs = params.toString();
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', newUrl);
}

/**
 * Listen for browser back/forward navigation and re-apply filters.
 * @param {Function} applyFilters - (urlState) => void
 */
export function listenForPopState(applyFilters) {
  window.addEventListener('popstate', () => {
    applyFilters(readFiltersFromURL());
  });
}

export default { readFiltersFromURL, writeFiltersToURL, listenForPopState };
