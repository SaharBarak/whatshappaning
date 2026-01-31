/**
 * Hebrew Calendar and Gematria Utilities
 *
 * Provides:
 * - Gematria calculations (Standard, Ordinal, Reduced)
 * - Hebrew letter mappings
 * - Hebrew date utilities
 */

// Standard (Mispar Gadol) - Traditional letter values
const STANDARD_VALUES = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5,
  'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10,
  'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60,
  'ע': 70, 'פ': 80, 'צ': 90, 'ק': 100, 'ר': 200,
  'ש': 300, 'ת': 400,
  // Final forms (Sofit)
  'ך': 500, 'ם': 600, 'ן': 700, 'ף': 800, 'ץ': 900,
};

// Alternative: Final forms same as regular (some traditions)
const STANDARD_VALUES_ALT = {
  ...STANDARD_VALUES,
  'ך': 20, 'ם': 40, 'ן': 50, 'ף': 80, 'ץ': 90,
};

// Ordinal (Mispar Siduri) - Position in alphabet 1-22
const ORDINAL_VALUES = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5,
  'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10,
  'כ': 11, 'ל': 12, 'מ': 13, 'נ': 14, 'ס': 15,
  'ע': 16, 'פ': 17, 'צ': 18, 'ק': 19, 'ר': 20,
  'ש': 21, 'ת': 22,
  // Final forms same position
  'ך': 11, 'ם': 13, 'ן': 14, 'ף': 17, 'ץ': 18,
};

// Hebrew month names
const HEBREW_MONTHS = [
  { name: 'Nisan', hebrew: 'נִיסָן', number: 1 },
  { name: 'Iyyar', hebrew: 'אִיָּר', number: 2 },
  { name: 'Sivan', hebrew: 'סִיוָן', number: 3 },
  { name: 'Tammuz', hebrew: 'תַּמּוּז', number: 4 },
  { name: 'Av', hebrew: 'אָב', number: 5 },
  { name: 'Elul', hebrew: 'אֱלוּל', number: 6 },
  { name: 'Tishrei', hebrew: 'תִּשְׁרֵי', number: 7 },
  { name: 'Cheshvan', hebrew: 'חֶשְׁוָן', number: 8 },
  { name: 'Kislev', hebrew: 'כִּסְלֵו', number: 9 },
  { name: 'Tevet', hebrew: 'טֵבֵת', number: 10 },
  { name: 'Shevat', hebrew: 'שְׁבָט', number: 11 },
  { name: 'Adar', hebrew: 'אֲדָר', number: 12 },
  { name: 'Adar II', hebrew: 'אֲדָר ב׳', number: 13 }, // Leap year
];

// Hebrew day names
const HEBREW_DAYS = [
  { name: 'Sunday', hebrew: 'יוֹם רִאשׁוֹן', short: 'א׳' },
  { name: 'Monday', hebrew: 'יוֹם שֵׁנִי', short: 'ב׳' },
  { name: 'Tuesday', hebrew: 'יוֹם שְׁלִישִׁי', short: 'ג׳' },
  { name: 'Wednesday', hebrew: 'יוֹם רְבִיעִי', short: 'ד׳' },
  { name: 'Thursday', hebrew: 'יוֹם חֲמִישִׁי', short: 'ה׳' },
  { name: 'Friday', hebrew: 'יוֹם שִׁשִּׁי', short: 'ו׳' },
  { name: 'Saturday', hebrew: 'שַׁבָּת', short: 'ש׳' },
];

// Notable gematria values
const NOTABLE_NUMBERS = {
  18: { word: 'חי', meaning: 'Life' },
  26: { word: 'יהוה', meaning: 'Tetragrammaton' },
  72: { word: 'חסד', meaning: 'Loving-kindness (also 72 Names)' },
  137: { word: 'קבלה', meaning: 'Kabbalah' },
  358: { word: 'משיח', meaning: 'Messiah' },
  541: { word: 'ישראל', meaning: 'Israel' },
  613: { word: 'תריג', meaning: '613 Commandments' },
};

/**
 * Calculate standard gematria value of Hebrew text
 * @param {string} text - Hebrew text
 * @param {boolean} useFinalValues - Whether to use higher values for final forms
 * @returns {number} Gematria value
 */
function calculateStandard(text, useFinalValues = true) {
  const values = useFinalValues ? STANDARD_VALUES : STANDARD_VALUES_ALT;
  return text
    .split('')
    .filter(c => values[c])
    .reduce((sum, c) => sum + values[c], 0);
}

/**
 * Calculate ordinal gematria value
 * @param {string} text - Hebrew text
 * @returns {number} Ordinal value
 */
function calculateOrdinal(text) {
  return text
    .split('')
    .filter(c => ORDINAL_VALUES[c])
    .reduce((sum, c) => sum + ORDINAL_VALUES[c], 0);
}

/**
 * Calculate reduced gematria value (Mispar Katan)
 * Reduces each letter's value to single digit, then sums
 * @param {string} text - Hebrew text
 * @returns {number} Reduced value
 */
function calculateReduced(text) {
  const standard = calculateStandard(text);
  return reduceToSingleDigit(standard);
}

/**
 * Reduce a number to a single digit (preserving master numbers 11, 22, 33)
 * @param {number} num - Number to reduce
 * @param {boolean} preserveMaster - Whether to preserve 11, 22, 33
 * @returns {number} Reduced number
 */
function reduceToSingleDigit(num, preserveMaster = false) {
  const masterNumbers = [11, 22, 33];

  while (num > 9) {
    if (preserveMaster && masterNumbers.includes(num)) {
      return num;
    }
    num = String(num)
      .split('')
      .reduce((a, b) => a + parseInt(b, 10), 0);
  }

  return num;
}

/**
 * Get all gematria values for text
 * @param {string} text - Hebrew text
 * @returns {Object} Object with standard, ordinal, and reduced values
 */
function calculateAll(text) {
  return {
    standard: calculateStandard(text),
    ordinal: calculateOrdinal(text),
    reduced: calculateReduced(text),
  };
}

/**
 * Check if a number has notable meaning
 * @param {number} value - Gematria value
 * @returns {Object|null} Notable meaning or null
 */
function getNotableMeaning(value) {
  return NOTABLE_NUMBERS[value] || null;
}

/**
 * Find Hebrew month by name
 * @param {string} name - Month name (English or Hebrew)
 * @returns {Object|null} Month object or null
 */
function findMonth(name) {
  const lower = name.toLowerCase();
  return HEBREW_MONTHS.find(m =>
    m.name.toLowerCase() === lower ||
    m.hebrew === name
  ) || null;
}

/**
 * Get Hebrew day of week
 * @param {Date} date - JavaScript Date
 * @returns {Object} Day object with name and Hebrew
 */
function getHebrewDay(date) {
  return HEBREW_DAYS[date.getDay()];
}

/**
 * Convert number to Hebrew numerals
 * @param {number} num - Number (1-999 supported)
 * @returns {string} Hebrew numeral representation
 */
function toHebrewNumerals(num) {
  if (num < 1 || num > 999) {
    return String(num);
  }

  const hundreds = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];

  const h = Math.floor(num / 100);
  const t = Math.floor((num % 100) / 10);
  const o = num % 10;

  // Special cases for 15 and 16 (to avoid yod-he which spells God's name)
  if (t === 1 && o === 5) {
    return hundreds[h] + 'טו';
  }
  if (t === 1 && o === 6) {
    return hundreds[h] + 'טז';
  }

  return hundreds[h] + tens[t] + ones[o];
}

module.exports = {
  STANDARD_VALUES,
  ORDINAL_VALUES,
  HEBREW_MONTHS,
  HEBREW_DAYS,
  NOTABLE_NUMBERS,
  calculateStandard,
  calculateOrdinal,
  calculateReduced,
  calculateAll,
  reduceToSingleDigit,
  getNotableMeaning,
  findMonth,
  getHebrewDay,
  toHebrewNumerals,
};
