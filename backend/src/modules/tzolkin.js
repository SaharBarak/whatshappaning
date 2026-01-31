/**
 * Tzolkin Module - Traditional Mayan 260-day Sacred Calendar
 *
 * Calculates the current Tzolkin day using the GMT correlation (584283).
 * The Tzolkin combines 20 day signs with 13 tones to create a 260-day cycle.
 *
 * Update frequency: Daily at 00:00 UTC
 */

const path = require('path');

// Load static data
const tones = require(path.join(__dirname, '../../data/tzolkin_tones.json'));
const signs = require(path.join(__dirname, '../../data/tzolkin_signs.json'));

// GMT Correlation constant (Goodman-Martinez-Thompson)
const GMT_CORRELATION = 584283;

/**
 * Convert a Date to Julian Day Number
 * @param {Date} date - JavaScript Date
 * @returns {number} Julian Day Number
 */
function dateToJulianDay(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

/**
 * Calculate Tzolkin day from a date
 * @param {Date} date - JavaScript Date (defaults to now)
 * @returns {Object} Tzolkin day information
 */
function calculate(date = new Date()) {
  const julianDay = dateToJulianDay(date);
  const daysSinceEpoch = julianDay - GMT_CORRELATION;

  // Calculate tone (1-13)
  // Use modulo that handles negative numbers correctly
  const toneIndex = ((daysSinceEpoch % 13) + 13) % 13;
  const tone = toneIndex + 1;

  // Calculate day sign (0-19)
  const signIndex = ((daysSinceEpoch % 20) + 20) % 20;

  // Get tone and sign data
  const toneData = tones.find(t => t.number === tone);
  const signData = signs.find(s => s.number === signIndex);

  // Calculate day in the 260-day cycle (1-260)
  // Formula: ((tone - 1) * 20 + signIndex) % 260 doesn't work directly
  // Instead, find position where tone and sign align
  let dayInCycle = 0;
  for (let d = 1; d <= 260; d++) {
    const t = ((d - 1) % 13) + 1;
    const s = (d - 1) % 20;
    if (t === tone && s === signIndex) {
      dayInCycle = d;
      break;
    }
  }

  // Generate meaning by combining tone and sign energies
  const meaning = generateMeaning(toneData, signData);

  return {
    date: date.toISOString().split('T')[0],
    tone,
    toneName: toneData.name,
    toneKeyword: toneData.keyword,
    toneEnergy: toneData.energy,
    daySign: signData.name,
    daySignEnglish: signData.englishName,
    daySignNumber: signIndex,
    glyph: signData.glyph,
    direction: signData.direction,
    color: signData.color,
    element: signData.element,
    meaning,
    keywords: signData.keywords,
    dayInCycle,
    question: toneData.question,
  };
}

/**
 * Generate a combined meaning from tone and sign
 * @param {Object} tone - Tone data
 * @param {Object} sign - Sign data
 * @returns {string} Combined meaning
 */
function generateMeaning(tone, sign) {
  return `${tone.keyword} energy applied to ${sign.meaning.toLowerCase()}`;
}

/**
 * Get Tzolkin for a specific date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Object} Tzolkin data
 */
function getForDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  return calculate(date);
}

/**
 * Get the next occurrence of a specific Tzolkin day
 * @param {number} targetTone - Target tone (1-13)
 * @param {number} targetSignIndex - Target sign index (0-19)
 * @param {Date} fromDate - Starting date
 * @returns {Object} Next occurrence with date and Tzolkin data
 */
function getNextOccurrence(targetTone, targetSignIndex, fromDate = new Date()) {
  let checkDate = new Date(fromDate);

  for (let i = 1; i <= 260; i++) {
    checkDate.setUTCDate(checkDate.getUTCDate() + 1);
    const tzolkin = calculate(checkDate);

    if (tzolkin.tone === targetTone && tzolkin.daySignNumber === targetSignIndex) {
      return {
        date: checkDate.toISOString().split('T')[0],
        daysUntil: i,
        tzolkin,
      };
    }
  }

  return null;
}

/**
 * Check if a date is a portal day (GAP day in Dreamspell)
 * Note: This uses Dreamspell GAP days, not traditional Tzolkin
 * @param {Date} date - Date to check
 * @returns {boolean} True if portal day
 */
function isPortalDay(date) {
  const tzolkin = calculate(date);
  // GAP days are specific kins in the 260-day cycle
  const GAP_DAYS = [
    1, 20, 22, 39, 43, 50, 51, 58, 64, 69,
    72, 77, 85, 88, 93, 96, 106, 107, 108, 109,
    110, 111, 112, 113, 146, 147, 148, 149, 150,
    151, 152, 153, 165, 168, 173, 176, 184, 189,
    192, 197, 202, 211, 213, 218, 222, 229, 233,
    240, 241, 248, 253, 260
  ];
  return GAP_DAYS.includes(tzolkin.dayInCycle);
}

/**
 * Module collect function for scheduler
 * @returns {Promise<Object>} Collected data
 */
async function collect() {
  const now = new Date();
  const tzolkin = calculate(now);

  return {
    ...tzolkin,
    isPortalDay: isPortalDay(now),
    collectedAt: now.toISOString(),
  };
}

module.exports = {
  name: 'tzolkin',
  schedule: '0 0 * * *', // Daily at midnight UTC
  collect,
  calculate,
  getForDate,
  getNextOccurrence,
  isPortalDay,
  dateToJulianDay,
  GMT_CORRELATION,
};
