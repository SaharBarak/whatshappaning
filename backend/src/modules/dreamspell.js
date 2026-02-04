/**
 * Dreamspell Module - José Argüelles' Modern Interpretation of the Tzolkin
 *
 * Calculates the Dreamspell day using the epoch of July 26, 1987 (Galactic Synchronization).
 * The Dreamspell combines 13 tones × 20 seals to create a 260-day cycle, organized into
 * Wavespells, Castles, and Earth Families with additional power concepts.
 *
 * IMPORTANT: Dreamspell is NOT traditional Mayan. It's a New Age system.
 * February 29 (leap day) is skipped and treated as "Day Out of Time" (same kin as Feb 28).
 *
 * Update frequency: Daily at 00:00 UTC
 */

const path = require('path');

// Load static data
const tones = require(path.join(__dirname, '../../data/tzolkin_tones.json'));
const seals = require(path.join(__dirname, '../../data/dreamspell_seals.json'));

// Dreamspell epoch: June 23, 1987 (Kin 1: Red Magnetic Dragon)
// Note: July 26, 1987 was Kin 34 (White Galactic Wizard), not Kin 1.
// The 260-day Tzolkin cycle began 33 days earlier on June 23, 1987.
const DREAMSPELL_EPOCH = new Date('1987-06-23T00:00:00Z');

// 52 Galactic Activation Portal (GAP) days
const GAP_KINS = [
  1, 20, 22, 39, 43, 50, 51, 58, 64, 69,
  72, 77, 85, 88, 93, 96, 106, 107, 108, 109,
  110, 111, 112, 113, 146, 147, 148, 149, 150,
  151, 152, 153, 165, 168, 173, 176, 184, 189,
  192, 197, 202, 211, 213, 218, 222, 229, 233,
  240, 241, 248, 253, 260
];

// Castle definitions (each castle contains 4 wavespells = 52 days)
const CASTLES = [
  { number: 1, name: 'Red Eastern', color: 'Red', wavespells: [1, 2, 3, 4] },
  { number: 2, name: 'White Northern', color: 'White', wavespells: [5, 6, 7, 8] },
  { number: 3, name: 'Blue Western', color: 'Blue', wavespells: [9, 10, 11, 12] },
  { number: 4, name: 'Yellow Southern', color: 'Yellow', wavespells: [13, 14, 15, 16] },
  { number: 5, name: 'Green Central', color: 'Green', wavespells: [17, 18, 19, 20] }
];

/**
 * Check if a date is February 29 (leap day)
 * @param {Date} date - Date to check
 * @returns {boolean} True if leap day
 */
function isLeapDay(date) {
  return date.getUTCMonth() === 1 && date.getUTCDate() === 29;
}

/**
 * Calculate days since Dreamspell epoch, skipping Feb 29
 * @param {Date} date - Target date
 * @returns {number} Days since epoch (with leap days excluded)
 */
function getDaysSinceEpoch(date) {
  let daysSinceEpoch = Math.floor((date - DREAMSPELL_EPOCH) / 86400000);

  // Count leap days between epoch and target date, excluding them
  const startYear = DREAMSPELL_EPOCH.getUTCFullYear();
  const endYear = date.getUTCFullYear();

  let leapDaysToSubtract = 0;

  for (let year = startYear; year <= endYear; year++) {
    // Check if this is a leap year
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (!isLeap) continue;

    const feb29 = new Date(`${year}-02-29T00:00:00Z`);

    // Only count if Feb 29 is between epoch and target date
    if (feb29 > DREAMSPELL_EPOCH && feb29 < date) {
      leapDaysToSubtract++;
    }

    // Special case: if target date is Feb 29, don't count it
    // (it will use the same kin as Feb 28)
    if (isLeapDay(date) && year === endYear) {
      leapDaysToSubtract++;
    }
  }

  return daysSinceEpoch - leapDaysToSubtract;
}

/**
 * Get seal data by number
 * @param {number} sealNumber - Seal number (1-20)
 * @returns {Object} Seal data
 */
function getSealData(sealNumber) {
  return seals.find(s => s.number === sealNumber);
}

/**
 * Get tone data by number
 * @param {number} toneNumber - Tone number (1-13)
 * @returns {Object} Tone data
 */
function getToneData(toneNumber) {
  return tones.find(t => t.number === toneNumber);
}

/**
 * Calculate guide power based on tone and seal
 * The guide seal depends on the tone position in the wavespell
 * @param {number} tone - Tone number (1-13)
 * @param {number} sealNumber - Seal number (1-20)
 * @returns {number} Guide seal number
 */
function getGuidePower(tone, sealNumber) {
  const sealData = getSealData(sealNumber);

  // Guide changes based on tone position
  // Tones 1,5,9,13 use guide[0], tones 2,6,10 use guide[1], etc.
  // The guide array has 5 elements for tones at positions: 1, 5, 9, 13, and 17 (but 17 wraps to tone 4)
  let guideIndex;
  if ([1, 2, 3, 4].includes(tone)) {
    guideIndex = 0;
  } else if ([5, 6, 7, 8].includes(tone)) {
    guideIndex = 1;
  } else if ([9, 10, 11, 12].includes(tone)) {
    guideIndex = 2;
  } else if (tone === 13) {
    guideIndex = 3;
  }

  return sealData.guide[guideIndex];
}

/**
 * Get castle for a given wavespell
 * @param {number} wavespell - Wavespell number (1-20)
 * @returns {Object} Castle data
 */
function getCastle(wavespell) {
  return CASTLES.find(castle => castle.wavespells.includes(wavespell));
}

/**
 * Calculate Dreamspell day from a date
 * @param {Date} date - JavaScript Date (defaults to now)
 * @returns {Object} Dreamspell day information
 */
function calculate(date = new Date()) {
  const daysSinceEpoch = getDaysSinceEpoch(date);

  // Calculate kin (1-260)
  // Day 0 (epoch) = Kin 1, Day 1 = Kin 2, ..., Day 259 = Kin 260, Day 260 = Kin 1
  const kin = (daysSinceEpoch % 260) + 1;

  // Calculate tone (1-13)
  const tone = ((kin - 1) % 13) + 1;

  // Calculate seal number (1-20, but stored as 1-20 in our data)
  const sealIndex = ((kin - 1) % 20);
  const sealNumber = sealIndex + 1;

  // Calculate wavespell (1-20) - which 13-day period
  const wavespell = Math.floor((kin - 1) / 13) + 1;

  // Get data objects
  const toneData = getToneData(tone);
  const sealData = getSealData(sealNumber);

  // Get wavespell seal (the seal that starts the wavespell)
  const wavespellKinStart = (wavespell - 1) * 13 + 1;
  const wavespellSealNumber = ((wavespellKinStart - 1) % 20) + 1;
  const wavespellSealData = getSealData(wavespellSealNumber);

  // Get castle
  const castle = getCastle(wavespell);

  // Get power seals
  const guidePowerNumber = getGuidePower(tone, sealNumber);
  const analogPowerNumber = sealData.analog;
  const antipodePowerNumber = sealData.antipode;
  const occultPowerNumber = sealData.occult;

  const guidePower = getSealData(guidePowerNumber).name;
  const analogPower = getSealData(analogPowerNumber).name;
  const antipodePower = getSealData(antipodePowerNumber).name;
  const occultPower = getSealData(occultPowerNumber).name;

  // Check if this is a GAP day
  const isGAP = GAP_KINS.includes(kin);

  return {
    date: date.toISOString().split('T')[0],
    kin,
    tone,
    toneName: toneData.name,
    toneKeyword: toneData.keyword,
    seal: sealData.name,
    sealNumber,
    sealKeyword: sealData.keyword,
    color: sealData.color,
    wavespell,
    wavespellSeal: wavespellSealData.name,
    castle: castle.name,
    castleColor: castle.color,
    earthFamily: sealData.earthFamily,
    guidePower,
    analogPower,
    antipodePower,
    occultPower,
    isGAP,
    isLeapDay: isLeapDay(date),
  };
}

/**
 * Get Dreamspell for a specific date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Object} Dreamspell data
 */
function getForDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  return calculate(date);
}

/**
 * Get the next occurrence of a specific kin
 * @param {number} targetKin - Target kin (1-260)
 * @param {Date} fromDate - Starting date
 * @returns {Object} Next occurrence with date and Dreamspell data
 */
function getNextKin(targetKin, fromDate = new Date()) {
  let checkDate = new Date(fromDate);

  for (let i = 1; i <= 260; i++) {
    checkDate.setUTCDate(checkDate.getUTCDate() + 1);
    const dreamspell = calculate(checkDate);

    if (dreamspell.kin === targetKin) {
      return {
        date: checkDate.toISOString().split('T')[0],
        daysUntil: i,
        dreamspell,
      };
    }
  }

  return null;
}

/**
 * Get all GAP days in a given year
 * @param {number} year - Year to check
 * @returns {Array} Array of dates that are GAP days
 */
function getGAPDaysInYear(year) {
  const gapDays = [];
  const startDate = new Date(`${year}-01-01T00:00:00Z`);
  const endDate = new Date(`${year}-12-31T00:00:00Z`);

  let checkDate = new Date(startDate);

  while (checkDate <= endDate) {
    const dreamspell = calculate(checkDate);
    if (dreamspell.isGAP) {
      gapDays.push({
        date: checkDate.toISOString().split('T')[0],
        kin: dreamspell.kin,
        seal: dreamspell.seal,
        tone: dreamspell.tone,
      });
    }
    checkDate.setUTCDate(checkDate.getUTCDate() + 1);
  }

  return gapDays;
}

/**
 * Module collect function for scheduler
 * @returns {Promise<Object>} Collected data
 */
async function collect() {
  const now = new Date();
  const dreamspell = calculate(now);

  return {
    ...dreamspell,
    collectedAt: now.toISOString(),
  };
}

module.exports = {
  name: 'dreamspell',
  schedule: '0 0 * * *', // Daily at midnight UTC
  collect,
  calculate,
  getForDate,
  getNextKin,
  getGAPDaysInYear,
  getDaysSinceEpoch,
  DREAMSPELL_EPOCH,
  GAP_KINS,
  CASTLES,
};
