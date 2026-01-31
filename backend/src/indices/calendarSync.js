/**
 * Calendar Sync Index - Calendar System Convergence Detector
 *
 * Identifies interesting convergences between different calendar systems
 * (Tzolkin, Dreamspell, Hebrew Calendar) and lunar phases.
 *
 * Points System:
 * - Galactic Activation Portal (GAP) day: 2 points
 * - Wavespell start (tone 1): 1 point
 * - Rosh Chodesh (Hebrew month start): 1 point
 * - Full/New moon on Shabbat: 1 point
 * - Same number across systems: 1 point (e.g., Hebrew day 7 + Tzolkin tone 7)
 * - Parasha name matches energy: 1 point (subjective, simplified implementation)
 *
 * Update frequency: Daily
 */

const path = require('path');

// Import the modules we need for data
const dreamspellModule = require(path.join(__dirname, '../modules/dreamspell.js'));
const tzolkinModule = require(path.join(__dirname, '../modules/tzolkin.js'));
const parashaModule = require(path.join(__dirname, '../modules/parasha.js'));
const moonModule = require(path.join(__dirname, '../modules/moon.js'));

// Convergence level thresholds
const LEVELS = [
  { max: 0, level: 'None' },
  { max: 1, level: 'Low' },
  { max: 3, level: 'Moderate' },
  { max: 5, level: 'High' },
  { max: Infinity, level: 'Rare Convergence' },
];

// Parasha-to-energy mappings for simple matching
// These are subjective associations based on parasha themes
const PARASHA_ENERGIES = {
  'Bereishit': ['creation', 'beginning', 'new'],
  'Noach': ['renewal', 'transformation', 'water'],
  'Lech-Lecha': ['journey', 'movement', 'departure'],
  'Vayera': ['vision', 'revelation', 'seeing'],
  'Chayei Sara': ['life', 'continuation', 'legacy'],
  'Toldot': ['heritage', 'descendants', 'history'],
  'Vayetzei': ['departure', 'dream', 'vision'],
  'Vayishlach': ['encounter', 'transformation', 'struggle'],
  'Vayeshev': ['dwelling', 'dreams', 'destiny'],
  'Miketz': ['end', 'awakening', 'interpretation'],
  'Vayigash': ['approach', 'reconciliation', 'unity'],
  'Vayechi': ['life', 'blessing', 'completion'],
  'Shemot': ['names', 'identity', 'calling'],
  'Vaera': ['revelation', 'appearance', 'power'],
  'Bo': ['coming', 'movement', 'liberation'],
  'Beshalach': ['sending', 'departure', 'crossing'],
  'Yitro': ['wisdom', 'revelation', 'law'],
  'Mishpatim': ['justice', 'order', 'rules'],
  'Terumah': ['offering', 'giving', 'sacred'],
  'Tetzaveh': ['command', 'light', 'service'],
  'Ki Tisa': ['counting', 'atonement', 'restoration'],
  'Vayakhel': ['assembly', 'community', 'building'],
  'Pekudei': ['accounting', 'completion', 'glory'],
};

// Tzolkin sign energy keywords for matching
const TZOLKIN_SIGN_ENERGIES = {
  'Imix': ['creation', 'beginning', 'primal'],
  'Ik': ['spirit', 'breath', 'communication'],
  'Akbal': ['night', 'dream', 'mystery'],
  'Kan': ['seed', 'growth', 'potential'],
  'Chicchan': ['serpent', 'energy', 'power'],
  'Cimi': ['death', 'transformation', 'ancestors'],
  'Manik': ['deer', 'healing', 'service'],
  'Lamat': ['star', 'beauty', 'harmony'],
  'Muluc': ['moon', 'water', 'emotion'],
  'Oc': ['dog', 'loyalty', 'love'],
  'Chuen': ['monkey', 'play', 'creativity'],
  'Eb': ['road', 'journey', 'path'],
  'Ben': ['reed', 'authority', 'growth'],
  'Ix': ['jaguar', 'wisdom', 'magic'],
  'Men': ['eagle', 'vision', 'seeing'],
  'Cib': ['vulture', 'wisdom', 'karma'],
  'Caban': ['earth', 'movement', 'evolution'],
  'Etznab': ['mirror', 'truth', 'reflection'],
  'Cauac': ['storm', 'transformation', 'energy'],
  'Ahau': ['sun', 'enlightenment', 'completion'],
};

/**
 * Get the convergence level for a given score
 * @param {number} score - Convergence score
 * @returns {string} Convergence level
 */
function getLevel(score) {
  for (const level of LEVELS) {
    if (score <= level.max) {
      return level.level;
    }
  }
  return 'Rare Convergence';
}

/**
 * Check if it's a Galactic Activation Portal (GAP) day
 * @param {Object} dreamspellData - Dreamspell module data
 * @returns {Object} Points and event description
 */
function checkGAPDay(dreamspellData) {
  if (!dreamspellData) return { points: 0, events: [] };

  if (dreamspellData.isGAP) {
    return {
      points: 2,
      events: ['Galactic Activation Portal day'],
    };
  }

  return { points: 0, events: [] };
}

/**
 * Check if it's a wavespell start (tone 1)
 * @param {Object} dreamspellData - Dreamspell module data
 * @returns {Object} Points and event description
 */
function checkWavespellStart(dreamspellData) {
  if (!dreamspellData) return { points: 0, events: [] };

  if (dreamspellData.tone === 1) {
    return {
      points: 1,
      events: [`${dreamspellData.wavespellSeal} Wavespell begins`],
    };
  }

  return { points: 0, events: [] };
}

/**
 * Check for Rosh Chodesh (Hebrew month start)
 * Based on Hebrew date containing day 1 or day 30
 * @param {Object} parashaData - Parasha module data
 * @returns {Object} Points and event description
 */
function checkRoshChodesh(parashaData) {
  if (!parashaData || !parashaData.hebrewDate) return { points: 0, events: [] };

  const hebrewDate = parashaData.hebrewDate.toLowerCase();

  // Rosh Chodesh occurs on day 1 (and sometimes day 30 of previous month)
  // Look for patterns like "1 Shevat" or "א שבט"
  const dayMatch = hebrewDate.match(/^(\d+)\s/);
  if (dayMatch) {
    const day = parseInt(dayMatch[1], 10);
    if (day === 1 || day === 30) {
      // Extract month name
      const monthMatch = hebrewDate.match(/\d+\s+(.+)/);
      const month = monthMatch ? monthMatch[1] : 'new month';

      return {
        points: 1,
        events: [`Rosh Chodesh ${month}`],
      };
    }
  }

  return { points: 0, events: [] };
}

/**
 * Check if Full/New moon falls on Shabbat
 * @param {Object} moonData - Moon module data
 * @param {Object} parashaData - Parasha module data
 * @returns {Object} Points and event description
 */
function checkLunarShabbat(moonData, parashaData) {
  if (!moonData || !parashaData) return { points: 0, events: [] };

  // Check if it's Shabbat (Saturday)
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const isShabbat = dayOfWeek === 6;

  if (!isShabbat) return { points: 0, events: [] };

  // Check if moon is New or Full
  const phase = moonData.phase?.toLowerCase();
  if (phase === 'new' || phase === 'full') {
    return {
      points: 1,
      events: [`${moonData.phase} Moon on Shabbat`],
    };
  }

  return { points: 0, events: [] };
}

/**
 * Check for matching numbers across calendar systems
 * @param {Object} dreamspellData - Dreamspell module data
 * @param {Object} tzolkinData - Tzolkin module data
 * @param {Object} parashaData - Parasha module data
 * @returns {Object} Points and event description
 */
function checkNumberSync(dreamspellData, tzolkinData, parashaData) {
  if (!dreamspellData || !tzolkinData) return { points: 0, events: [] };

  const numbers = [];
  const events = [];

  // Get Tzolkin tone
  if (tzolkinData.tone) {
    numbers.push({ source: 'Tzolkin tone', value: tzolkinData.tone });
  }

  // Get Dreamspell tone
  if (dreamspellData.tone) {
    numbers.push({ source: 'Dreamspell tone', value: dreamspellData.tone });
  }

  // Get Hebrew day if available
  if (parashaData?.hebrewDate) {
    const dayMatch = parashaData.hebrewDate.match(/^(\d+)/);
    if (dayMatch) {
      const hebrewDay = parseInt(dayMatch[1], 10);
      if (hebrewDay <= 13) { // Only count if it's in the 1-13 range like tones
        numbers.push({ source: 'Hebrew day', value: hebrewDay });
      }
    }
  }

  // Check for matches
  const valueMap = new Map();
  for (const num of numbers) {
    const existing = valueMap.get(num.value) || [];
    existing.push(num.source);
    valueMap.set(num.value, existing);
  }

  let points = 0;
  for (const [value, sources] of valueMap) {
    if (sources.length >= 2) {
      points += 1;
      events.push(`Number ${value} appears in ${sources.join(' and ')}`);
    }
  }

  return { points, events };
}

/**
 * Check if parasha theme matches Tzolkin energy
 * @param {Object} parashaData - Parasha module data
 * @param {Object} tzolkinData - Tzolkin module data
 * @returns {Object} Points and event description
 */
function checkEnergyMatch(parashaData, tzolkinData) {
  if (!parashaData?.name || !tzolkinData?.daySign) {
    return { points: 0, events: [] };
  }

  const parashaEnergies = PARASHA_ENERGIES[parashaData.name] || [];
  const tzolkinEnergies = TZOLKIN_SIGN_ENERGIES[tzolkinData.daySign] || [];

  // Check for overlapping energies
  const overlap = parashaEnergies.filter(e => tzolkinEnergies.includes(e));

  if (overlap.length > 0) {
    return {
      points: 1,
      events: [`Parasha ${parashaData.name} resonates with ${tzolkinData.daySign} (${overlap[0]})`],
    };
  }

  return { points: 0, events: [] };
}

/**
 * Generate a note summarizing the convergences
 * @param {number} score - Total score
 * @param {Array} events - List of convergence events
 * @returns {string|null} Summary note
 */
function generateNote(score, events) {
  if (score === 0) return null;
  if (score === 1) return 'Minor calendar alignment today';
  if (score <= 3) return 'Multiple calendar systems mark transitions today';
  if (score <= 5) return 'Significant convergence of calendar energies';
  return 'Rare alignment across multiple calendar traditions';
}

/**
 * Calculate the Calendar Sync index from module data
 * @param {Object} dreamspellData - Data from dreamspell module
 * @param {Object} tzolkinData - Data from tzolkin module
 * @param {Object} parashaData - Data from parasha module
 * @param {Object} moonData - Data from moon module
 * @returns {Object} Calendar Sync index result
 */
function calculateIndex(dreamspellData, tzolkinData, parashaData, moonData) {
  // Calculate all component points
  const gap = checkGAPDay(dreamspellData);
  const wavespell = checkWavespellStart(dreamspellData);
  const roshChodesh = checkRoshChodesh(parashaData);
  const lunarShabbat = checkLunarShabbat(moonData, parashaData);
  const numberSync = checkNumberSync(dreamspellData, tzolkinData, parashaData);
  const energyMatch = checkEnergyMatch(parashaData, tzolkinData);

  // Sum total points
  const totalScore = gap.points + wavespell.points + roshChodesh.points +
                     lunarShabbat.points + numberSync.points + energyMatch.points;

  // Combine all events
  const convergences = [
    ...gap.events,
    ...wavespell.events,
    ...roshChodesh.events,
    ...lunarShabbat.events,
    ...numberSync.events,
    ...energyMatch.events,
  ];

  // Get level
  const level = getLevel(totalScore);

  // Generate note
  const note = generateNote(totalScore, convergences);

  return {
    score: totalScore,
    level,
    convergences,
    note,
    breakdown: {
      gapDay: { points: gap.points, active: gap.events.length > 0 },
      wavespellStart: { points: wavespell.points, active: wavespell.events.length > 0 },
      roshChodesh: { points: roshChodesh.points, active: roshChodesh.events.length > 0 },
      lunarShabbat: { points: lunarShabbat.points, active: lunarShabbat.events.length > 0 },
      numberSync: { points: numberSync.points, matches: numberSync.events.length },
      energyMatch: { points: energyMatch.points, active: energyMatch.events.length > 0 },
    },
  };
}

/**
 * Collect data and calculate the Calendar Sync index
 * @returns {Promise<Object>} Calendar Sync index data
 */
async function collect() {
  const now = new Date();
  const timestamp = now.toISOString();

  try {
    // Collect data from all modules in parallel
    const [dreamspellData, tzolkinData, parashaData, moonData] = await Promise.all([
      dreamspellModule.collect(),
      tzolkinModule.collect(),
      parashaModule.collect(),
      moonModule.collect(),
    ]);

    // Calculate the index
    const indexResult = calculateIndex(dreamspellData, tzolkinData, parashaData, moonData);

    return {
      timestamp,
      ...indexResult,
      collectedAt: now.toISOString(),
    };
  } catch (error) {
    console.error('Error calculating Calendar Sync index:', error.message);

    // Return a default/error state
    return {
      timestamp,
      score: 0,
      level: 'Unknown',
      convergences: [],
      note: null,
      error: error.message,
      collectedAt: now.toISOString(),
    };
  }
}

/**
 * Calculate index from pre-fetched data (for API efficiency)
 * @param {Object} dreamspellData - Pre-fetched dreamspell data
 * @param {Object} tzolkinData - Pre-fetched tzolkin data
 * @param {Object} parashaData - Pre-fetched parasha data
 * @param {Object} moonData - Pre-fetched moon data
 * @returns {Object} Calendar Sync index data
 */
function calculateFromData(dreamspellData, tzolkinData, parashaData, moonData) {
  const now = new Date();
  const indexResult = calculateIndex(dreamspellData, tzolkinData, parashaData, moonData);

  return {
    timestamp: now.toISOString(),
    ...indexResult,
    collectedAt: now.toISOString(),
  };
}

module.exports = {
  name: 'calendarSync',
  schedule: '0 0 * * *', // Daily at midnight UTC
  collect,
  calculateFromData,
  calculateIndex,
  // Export helper functions for testing
  getLevel,
  checkGAPDay,
  checkWavespellStart,
  checkRoshChodesh,
  checkLunarShabbat,
  checkNumberSync,
  checkEnergyMatch,
  generateNote,
  LEVELS,
  PARASHA_ENERGIES,
  TZOLKIN_SIGN_ENERGIES,
};
