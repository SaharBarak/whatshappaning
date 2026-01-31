/**
 * Date-Seeded Random Number Generation
 *
 * Provides deterministic randomness based on dates for
 * Tarot card selection, I Ching hexagram selection, etc.
 *
 * Same date always produces same result globally.
 */

/**
 * Hash a string to a 32-bit integer using DJB2 algorithm
 * @param {string} str - String to hash
 * @returns {number} 32-bit hash value
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Create a seeded pseudo-random number generator using Mulberry32
 * @param {number} seed - Integer seed
 * @returns {Function} Function that returns random numbers 0-1
 */
function seededRandom(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Get a date-seeded RNG for a specific purpose
 * @param {Date} date - The date
 * @param {string} purpose - Purpose identifier (e.g., 'tarot', 'iching')
 * @returns {Function} Seeded RNG function
 */
function getDateRng(date, purpose = '') {
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const seed = hashString(dateString + purpose);
  return seededRandom(seed);
}

/**
 * Select a random index for a given date
 * @param {Date} date - The date
 * @param {number} max - Maximum value (exclusive)
 * @param {string} purpose - Purpose identifier
 * @returns {number} Random index 0 to max-1
 */
function selectIndex(date, max, purpose = '') {
  const rng = getDateRng(date, purpose);
  return Math.floor(rng() * max);
}

/**
 * Select multiple unique indices for a given date
 * @param {Date} date - The date
 * @param {number} max - Maximum value (exclusive)
 * @param {number} count - Number of indices to select
 * @param {string} purpose - Purpose identifier
 * @returns {Array<number>} Array of unique random indices
 */
function selectMultipleIndices(date, max, count, purpose = '') {
  if (count > max) {
    throw new Error('Count cannot exceed max');
  }

  const rng = getDateRng(date, purpose);
  const selected = new Set();

  while (selected.size < count) {
    const index = Math.floor(rng() * max);
    selected.add(index);
  }

  return Array.from(selected);
}

/**
 * Get a boolean with a given probability for a date
 * @param {Date} date - The date
 * @param {number} probability - Probability of true (0-1)
 * @param {string} purpose - Purpose identifier
 * @returns {boolean} Random boolean
 */
function selectBoolean(date, probability, purpose = '') {
  const rng = getDateRng(date, purpose);
  return rng() < probability;
}

/**
 * Shuffle an array deterministically for a date
 * @param {Array} array - Array to shuffle
 * @param {Date} date - The date
 * @param {string} purpose - Purpose identifier
 * @returns {Array} Shuffled array (new array, original unchanged)
 */
function shuffleForDate(array, date, purpose = '') {
  const rng = getDateRng(date, purpose);
  const result = [...array];

  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Get Tarot card index for a date (0-77)
 * @param {Date} date - The date
 * @returns {number} Card index
 */
function getTarotCardIndex(date) {
  return selectIndex(date, 78, 'tarot');
}

/**
 * Get I Ching hexagram number for a date (1-64)
 * @param {Date} date - The date
 * @returns {number} Hexagram number
 */
function getIChingHexagram(date) {
  return selectIndex(date, 64, 'iching') + 1;
}

/**
 * Get I Ching changing lines for a date
 * @param {Date} date - The date
 * @param {number} probability - Probability per line (default 0.25)
 * @returns {Array<number>} Array of changing line numbers (1-6)
 */
function getIChingChangingLines(date, probability = 0.25) {
  const rng = getDateRng(date, 'iching_lines');
  const changingLines = [];

  for (let line = 1; line <= 6; line++) {
    if (rng() < probability) {
      changingLines.push(line);
    }
  }

  return changingLines;
}

/**
 * Check if Tarot card should be reversed for a date
 * @param {Date} date - The date
 * @param {number} probability - Probability of reversal (default 0.5)
 * @returns {boolean} True if reversed
 */
function isTarotReversed(date, probability = 0.5) {
  return selectBoolean(date, probability, 'tarot_reversed');
}

module.exports = {
  hashString,
  seededRandom,
  getDateRng,
  selectIndex,
  selectMultipleIndices,
  selectBoolean,
  shuffleForDate,
  getTarotCardIndex,
  getIChingHexagram,
  getIChingChangingLines,
  isTarotReversed,
};
