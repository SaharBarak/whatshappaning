/**
 * I Ching Module - The Book of Changes
 *
 * Daily hexagram from the I Ching (Yi Jing), selected deterministically by date.
 * Provides Eastern divination to complement the Western Tarot system.
 *
 * Per DECISION 2 (IMPLEMENTATION_PLAN.md): Changing lines excluded for MVP.
 *
 * Update frequency: Daily at 00:00 UTC
 */

const path = require('path');
const { getIChingHexagram, getIChingChangingLines } = require('../utils/dateSeeding');

// Load static data
const trigrams = require(path.join(__dirname, '../../data/trigrams.json'));

// Load hexagram data if available
let hexagrams = [];
try {
  hexagrams = require(path.join(__dirname, '../../data/iching.json'));
} catch (err) {
  console.warn('I Ching hexagram data not found. Module will return minimal data until iching.json is created.');
  hexagrams = [];
}

/**
 * Get trigram data by name
 * @param {string} trigramName - Name of the trigram (e.g., "Qian", "Kun")
 * @returns {Object} Trigram object with name, symbol, element, etc.
 */
function getTrigramByName(trigramName) {
  const trigram = trigrams.find(t => t.name === trigramName);
  if (!trigram) {
    return {
      name: trigramName,
      symbol: '?',
      element: 'Unknown',
      attribute: 'Unknown',
    };
  }

  return {
    name: trigram.name,
    chineseName: trigram.chineseName,
    symbol: trigram.symbol,
    element: trigram.element,
    attribute: trigram.attribute,
  };
}

/**
 * Calculate I Ching hexagram for a date
 * @param {Date} date - JavaScript Date (defaults to now)
 * @returns {Object} Hexagram information
 */
function calculate(date = new Date()) {
  // Get hexagram number (1-64) deterministically from date
  const hexagramNumber = getIChingHexagram(date);

  // Per DECISION 2: Exclude changing lines for MVP
  const changingLines = [];

  // Find hexagram data
  const hexagramData = hexagrams.find(h => h.number === hexagramNumber);

  if (!hexagramData) {
    // Graceful fallback if data not loaded
    return {
      date: date.toISOString().split('T')[0],
      hexagram: {
        number: hexagramNumber,
        name: `Hexagram ${hexagramNumber}`,
        chinese: '?',
        pinyin: '?',
        unicode: '?',
        upperTrigram: { name: 'Unknown', symbol: '?', element: 'Unknown' },
        lowerTrigram: { name: 'Unknown', symbol: '?', element: 'Unknown' },
        judgment: 'Hexagram data not available. Please create iching.json.',
        image: '',
        keywords: [],
      },
      changingLines,
      dataAvailable: false,
    };
  }

  // Get trigram details - they may be objects directly or strings
  const upperTrigram = typeof hexagramData.upperTrigram === 'object'
    ? hexagramData.upperTrigram
    : getTrigramByName(hexagramData.upperTrigram);
  const lowerTrigram = typeof hexagramData.lowerTrigram === 'object'
    ? hexagramData.lowerTrigram
    : getTrigramByName(hexagramData.lowerTrigram);

  return {
    date: date.toISOString().split('T')[0],
    hexagram: {
      number: hexagramData.number,
      name: hexagramData.name,
      chinese: hexagramData.chineseName || hexagramData.chinese,
      pinyin: hexagramData.pinyin,
      unicode: hexagramData.unicode,
      upperTrigram,
      lowerTrigram,
      judgment: hexagramData.judgment,
      image: hexagramData.image,
      keywords: hexagramData.keywords || [],
    },
    changingLines,
    dataAvailable: true,
  };
}

/**
 * Get I Ching hexagram for a specific date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Object} I Ching data
 */
function getForDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  return calculate(date);
}

/**
 * Module collect function for scheduler
 * @returns {Promise<Object>} Collected data
 */
async function collect() {
  const now = new Date();
  const iching = calculate(now);

  return {
    ...iching,
    collectedAt: now.toISOString(),
  };
}

/**
 * Get hexagram by number
 * @param {number} number - Hexagram number (1-64)
 * @returns {Object} Hexagram data or null if not found
 */
function getHexagramByNumber(number) {
  if (number < 1 || number > 64) {
    throw new Error('Hexagram number must be between 1 and 64');
  }

  const hexagramData = hexagrams.find(h => h.number === number);
  if (!hexagramData) {
    return null;
  }

  const upperTrigram = typeof hexagramData.upperTrigram === 'object'
    ? hexagramData.upperTrigram
    : getTrigramByName(hexagramData.upperTrigram);
  const lowerTrigram = typeof hexagramData.lowerTrigram === 'object'
    ? hexagramData.lowerTrigram
    : getTrigramByName(hexagramData.lowerTrigram);

  return {
    number: hexagramData.number,
    name: hexagramData.name,
    chinese: hexagramData.chineseName || hexagramData.chinese,
    pinyin: hexagramData.pinyin,
    unicode: hexagramData.unicode,
    upperTrigram,
    lowerTrigram,
    judgment: hexagramData.judgment,
    image: hexagramData.image,
    keywords: hexagramData.keywords || [],
  };
}

/**
 * Calculate changing lines for a date (for future use when DECISION 2 is revisited)
 * @param {Date} date - JavaScript Date
 * @param {number} probability - Probability per line (default 0.25 = 25%)
 * @returns {Array<number>} Array of changing line numbers (1-6, bottom to top)
 */
function calculateChangingLines(date, probability = 0.25) {
  return getIChingChangingLines(date, probability);
}

/**
 * Transform hexagram with changing lines to resulting hexagram
 * (For future use when changing lines are implemented)
 * @param {number} hexagramNumber - Original hexagram number
 * @param {Array<number>} changingLines - Array of changing lines (1-6)
 * @returns {number} Resulting hexagram number
 */
function transformHexagram(hexagramNumber, changingLines) {
  if (changingLines.length === 0) {
    return hexagramNumber;
  }

  // Per DECISION 2: Changing lines excluded for MVP
  // Transformation requires hexagram line data (6 lines per hexagram, yin/yang values)
  // Post-MVP: Add lines[] array to iching.json, then implement line flipping algorithm
  return hexagramNumber;
}

module.exports = {
  name: 'iching',
  schedule: '0 0 * * *', // Daily at midnight UTC
  collect,
  calculate,
  getForDate,
  getHexagramByNumber,
  calculateChangingLines,
  transformHexagram,
  getTrigramByName,
};
