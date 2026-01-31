/**
 * Gematria Module - Hebrew Date and Parasha Gematria Calculations
 *
 * Calculates numerical values for the current Hebrew date and weekly Parasha
 * using traditional Hebrew gematria systems (Standard, Ordinal, Reduced).
 *
 * Update frequency: Daily at 00:00 UTC (or at sunset when Hebrew date changes)
 */

const path = require('path');
const {
  calculateStandard,
  calculateOrdinal,
  calculateReduced,
  HEBREW_MONTHS,
  HEBREW_DAYS,
  NOTABLE_NUMBERS,
  getNotableMeaning,
  getHebrewDay,
} = require('../utils/hebrew');

/**
 * Convert Gregorian date to Hebrew date using Hebcal API
 * @param {Date} date - JavaScript Date
 * @returns {Promise<Object>} Hebrew date components
 */
async function convertToHebrewDate(date) {
  const dateStr = date.toISOString().split('T')[0];
  const url = `https://www.hebcal.com/converter?cfg=json&date=${dateStr}&g2h=1`;

  try {
    // Note: In production, use a proper HTTP client like axios or node-fetch
    // For now, we'll use a placeholder that simulates the API response
    const response = await fetchHebcalAPI(url);

    return {
      day: response.hd,
      month: response.hm,
      year: response.hy,
      hebrew: response.hebrew,
    };
  } catch (error) {
    console.warn('Hebcal API unavailable, using fallback calculation:', error.message);
    return calculateHebrewDateFallback(date);
  }
}

/**
 * Fetch from Hebcal API
 * @param {string} url - API URL
 * @returns {Promise<Object>} API response
 */
async function fetchHebcalAPI(url) {
  // This is a placeholder - in production, replace with actual HTTP client
  // For MVP, we return sample data
  throw new Error('HTTP client not configured - using fallback');
}

/**
 * Fallback Hebrew date calculation (simplified approximation)
 * Note: This is a simplified calculation for MVP. For accurate conversion,
 * use the Hebcal API or a proper Hebrew calendar library.
 *
 * @param {Date} date - JavaScript Date
 * @returns {Object} Hebrew date components
 */
function calculateHebrewDateFallback(date) {
  // Hebrew calendar epoch: September 7, -3760 (Gregorian proleptic)
  // This is a VERY simplified approximation for demonstration
  // Real Hebrew calendar is lunisolar and requires complex calculations

  const HEBREW_EPOCH = new Date('1970-09-27'); // Approximation for epoch adjustment
  const now = new Date(date);

  // Simplified: Just use current date to return a sample Hebrew date
  // In production, this should use proper Hebrew calendar conversion
  const monthIndex = date.getMonth();
  const monthMapping = [
    'Tevet', 'Shevat', 'Adar', 'Nisan', 'Iyyar', 'Sivan',
    'Tammuz', 'Av', 'Elul', 'Tishrei', 'Cheshvan', 'Kislev'
  ];

  const hebrewMonth = HEBREW_MONTHS.find(m => m.name === monthMapping[monthIndex]);
  const hebrewYear = 5786; // Sample year - should be calculated
  const hebrewDay = date.getDate();

  // Format Hebrew date string (simplified)
  const dayStr = String(hebrewDay);
  const hebrew = `${dayStr} ${hebrewMonth.name} ${hebrewYear}`;

  return {
    day: hebrewDay,
    month: hebrewMonth.name,
    monthHebrew: hebrewMonth.hebrew,
    year: hebrewYear,
    hebrew,
  };
}

/**
 * Get current parasha from the parasha module
 * @param {Date} date - JavaScript Date
 * @returns {Promise<Object|null>} Parasha data or null
 */
async function getCurrentParasha(date) {
  try {
    // Try to load the parasha module
    const parashaModule = require('./parasha');

    if (parashaModule && typeof parashaModule.calculate === 'function') {
      const parashaData = await parashaModule.calculate(date);
      return parashaData;
    }

    return null;
  } catch (error) {
    // Parasha module not available yet
    console.log('Parasha module not available:', error.message);
    return null;
  }
}

/**
 * Calculate gematria for the Hebrew date
 * @param {Object} hebrewDate - Hebrew date components
 * @returns {Object} Gematria values for date
 */
function calculateDateGematria(hebrewDate) {
  // Combine day, month, and year in Hebrew
  const monthObj = HEBREW_MONTHS.find(m => m.name === hebrewDate.month);
  const hebrewMonthText = monthObj ? monthObj.hebrew : '';

  // For gematria calculation, we use the Hebrew text representation
  const hebrewText = hebrewDate.hebrew || `${hebrewDate.day} ${hebrewMonthText} ${hebrewDate.year}`;

  return {
    standard: calculateStandard(hebrewText),
    ordinal: calculateOrdinal(hebrewText),
    reduced: calculateReduced(hebrewText),
  };
}

/**
 * Calculate gematria for a parasha name
 * @param {string} parashaName - Hebrew parasha name
 * @returns {Object} Gematria values for parasha
 */
function calculateParashaGematria(parashaName) {
  if (!parashaName) {
    return {
      standard: null,
      ordinal: null,
      reduced: null,
    };
  }

  return {
    standard: calculateStandard(parashaName),
    ordinal: calculateOrdinal(parashaName),
    reduced: calculateReduced(parashaName),
  };
}

/**
 * Find notable number matches in calculated values
 * @param {Object} values - All calculated gematria values
 * @returns {Array} Array of notable matches
 */
function findNotableMatches(values) {
  const matches = [];
  const valuesToCheck = new Set([
    values.dateStandard,
    values.dateOrdinal,
    values.dateReduced,
    values.parashaStandard,
    values.parashaOrdinal,
    values.parashaReduced,
    values.dayOfWeek?.gematria,
    values.month?.gematria,
  ]);

  valuesToCheck.forEach(value => {
    if (value !== null && value !== undefined) {
      const meaning = getNotableMeaning(value);
      if (meaning) {
        matches.push({
          value,
          word: meaning.word,
          meaning: meaning.meaning,
        });
      }
    }
  });

  return matches;
}

/**
 * Calculate gematria values for a given date
 * @param {Date} date - JavaScript Date (defaults to now)
 * @returns {Promise<Object>} Gematria data
 */
async function calculate(date = new Date()) {
  // Get Hebrew date
  const hebrewDate = await convertToHebrewDate(date);

  // Get day of week
  const dayOfWeek = getHebrewDay(date);
  const dayGematria = calculateStandard(dayOfWeek.hebrew);

  // Get month gematria
  const monthObj = HEBREW_MONTHS.find(m => m.name === hebrewDate.month);
  const monthGematria = monthObj ? calculateStandard(monthObj.hebrew) : null;

  // Calculate date gematria
  const dateGematria = calculateDateGematria(hebrewDate);

  // Get parasha if available
  const parashaData = await getCurrentParasha(date);
  const parashaName = parashaData?.hebrewName || parashaData?.name || null;
  const parashaGematria = calculateParashaGematria(parashaName);

  // Build result object
  const result = {
    date: date.toISOString().split('T')[0],
    hebrewDate: hebrewDate.hebrew,
    dateComponents: {
      day: hebrewDate.day,
      month: hebrewDate.month,
      monthHebrew: hebrewDate.monthHebrew || (monthObj ? monthObj.hebrew : ''),
      year: hebrewDate.year,
    },
    dateStandard: dateGematria.standard,
    dateOrdinal: dateGematria.ordinal,
    dateReduced: dateGematria.reduced,
    parashaName: parashaName,
    parashaEnglish: parashaData?.englishName || parashaData?.name || null,
    parashaStandard: parashaGematria.standard,
    parashaOrdinal: parashaGematria.ordinal,
    parashaReduced: parashaGematria.reduced,
    dayOfWeek: {
      name: dayOfWeek.name,
      hebrew: dayOfWeek.hebrew,
      gematria: dayGematria,
    },
    month: {
      name: hebrewDate.month,
      hebrew: monthObj ? monthObj.hebrew : '',
      gematria: monthGematria,
    },
  };

  // Find notable matches
  result.notableMatches = findNotableMatches(result);

  return result;
}

/**
 * Get gematria for a specific date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Promise<Object>} Gematria data
 */
async function getForDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  return calculate(date);
}

/**
 * Module collect function for scheduler
 * @returns {Promise<Object>} Collected data
 */
async function collect() {
  const now = new Date();
  const gematriaData = await calculate(now);

  return {
    ...gematriaData,
    collectedAt: now.toISOString(),
  };
}

module.exports = {
  name: 'gematria',
  schedule: '0 0 * * *', // Daily at midnight UTC
  collect,
  calculate,
  getForDate,
  calculateDateGematria,
  calculateParashaGematria,
  findNotableMatches,
};
