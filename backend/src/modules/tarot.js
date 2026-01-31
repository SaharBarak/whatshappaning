/**
 * Tarot Module - Daily Tarot Card
 *
 * Deterministically selects a Tarot card based on the date using date-seeded RNG.
 * Same card globally for everyone on the same day.
 *
 * MVP excludes reversals for simpler interpretation (per IMPLEMENTATION_PLAN.md Option B).
 *
 * Update frequency: Daily at 00:00 UTC
 */

const path = require('path');
const fs = require('fs');
const { getTarotCardIndex } = require('../utils/dateSeeding');

// Tarot deck structure: 78 cards total
// Major Arcana: 0-21 (22 cards)
// Minor Arcana: 22-77 (56 cards = 4 suits × 14 cards)

/**
 * Load Tarot card data from JSON file
 * @returns {Object|null} Tarot data or null if not available
 */
function loadTarotData() {
  const dataPath = path.join(__dirname, '../../data/tarot.json');

  try {
    if (!fs.existsSync(dataPath)) {
      console.warn('Tarot data file not found at:', dataPath);
      return null;
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading tarot data:', error.message);
    return null;
  }
}

/**
 * Convert card name to URL-friendly slug
 * @param {string} name - Card name
 * @returns {string} URL slug
 */
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/^the\s+/i, '') // Remove "The" prefix
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get card from deck by index
 * @param {Array} tarotData - Loaded tarot data (flat array of 78 cards)
 * @param {number} index - Card index (0-77)
 * @returns {Object|null} Card object or null
 */
function getCardByIndex(tarotData, index) {
  if (!tarotData || !Array.isArray(tarotData)) {
    return null;
  }

  // Find card by id in the flat array
  const card = tarotData.find(c => c.id === index);

  if (!card) {
    return null;
  }

  return card;
}

/**
 * Generate image URL for a card
 * @param {Object} card - Card object
 * @returns {string} Image URL
 */
function generateImageUrl(card) {
  const arcana = card.arcana.toLowerCase();
  const slug = nameToSlug(card.name);
  const number = card.number;

  return `/images/tarot/${arcana}/${number}-${slug}.jpg`;
}

/**
 * Calculate Tarot card for a specific date
 * @param {Date} date - JavaScript Date (defaults to now)
 * @returns {Object|null} Tarot card information or null if data unavailable
 */
function calculate(date = new Date()) {
  const tarotData = loadTarotData();

  if (!tarotData) {
    return {
      date: date.toISOString().split('T')[0],
      error: 'Tarot data not available',
      card: null,
      isReversed: false,
      meaning: 'Tarot card data has not been loaded yet.',
      imageUrl: null,
    };
  }

  // Get deterministic card index for this date (0-77)
  const cardIndex = getTarotCardIndex(date);

  // Get card from deck
  const card = getCardByIndex(tarotData, cardIndex);

  if (!card) {
    return {
      date: date.toISOString().split('T')[0],
      error: 'Card data not found',
      card: null,
      isReversed: false,
      meaning: 'Card data unavailable.',
      imageUrl: null,
    };
  }

  // MVP: No reversals (per IMPLEMENTATION_PLAN.md Option B)
  const isReversed = false;
  const meaning = card.uprightMeaning || card.meaning || 'Meaning not available';

  // Generate image URL
  const imageUrl = generateImageUrl(card);

  return {
    date: date.toISOString().split('T')[0],
    card: {
      name: card.name,
      number: card.number,
      arcana: card.arcana,
      suit: card.suit,
      keywords: card.keywords || [],
      element: card.element || null,
      planet: card.planet || null,
      zodiac: card.zodiac || null,
    },
    isReversed,
    meaning,
    imageUrl,
  };
}

/**
 * Get Tarot card for a specific date string
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Object} Tarot data
 */
function getForDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  return calculate(date);
}

/**
 * Get the next occurrence of a specific card
 * @param {string} cardName - Name of the card to find
 * @param {Date} fromDate - Starting date
 * @returns {Object|null} Next occurrence with date, or null if not found
 */
function getNextOccurrence(cardName, fromDate = new Date()) {
  const tarotData = loadTarotData();

  if (!tarotData) {
    return null;
  }

  let checkDate = new Date(fromDate);

  // Check up to 78 days (full deck cycle)
  for (let i = 1; i <= 78; i++) {
    checkDate.setUTCDate(checkDate.getUTCDate() + 1);
    const result = calculate(checkDate);

    if (result.card && result.card.name.toLowerCase() === cardName.toLowerCase()) {
      return {
        date: checkDate.toISOString().split('T')[0],
        daysUntil: i,
        card: result,
      };
    }
  }

  return null;
}

/**
 * Module collect function for scheduler
 * @returns {Promise<Object>} Collected data
 */
async function collect() {
  const now = new Date();
  const tarotData = calculate(now);

  return {
    ...tarotData,
    collectedAt: now.toISOString(),
  };
}

module.exports = {
  name: 'tarot',
  schedule: '0 0 * * *', // Daily at midnight UTC
  collect,
  calculate,
  getForDate,
  getNextOccurrence,
};
