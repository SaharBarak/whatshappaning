/**
 * Astrology Module - Planetary Positions and Aspects
 *
 * Calculates current planetary positions, aspects, retrogrades, and eclipses
 * using Swiss Ephemeris (swisseph) as the primary data source.
 *
 * Update frequency: Every 3 hours
 */

const path = require('path');
const astro = require(path.join(__dirname, '../utils/astro.js'));

// Planet definitions with glyphs
const PLANETS_TO_TRACK = [
  { name: 'Sun', code: astro.PLANETS.Sun, glyph: '\u2609' },       // ☉
  { name: 'Moon', code: astro.PLANETS.Moon, glyph: '\u263D' },     // ☽
  { name: 'Mercury', code: astro.PLANETS.Mercury, glyph: '\u263F' }, // ☿
  { name: 'Venus', code: astro.PLANETS.Venus, glyph: '\u2640' },   // ♀
  { name: 'Mars', code: astro.PLANETS.Mars, glyph: '\u2642' },     // ♂
  { name: 'Jupiter', code: astro.PLANETS.Jupiter, glyph: '\u2643' }, // ♃
  { name: 'Saturn', code: astro.PLANETS.Saturn, glyph: '\u2644' }, // ♄
  { name: 'Uranus', code: astro.PLANETS.Uranus, glyph: '\u2645' }, // ♅
  { name: 'Neptune', code: astro.PLANETS.Neptune, glyph: '\u2646' }, // ♆
  { name: 'Pluto', code: astro.PLANETS.Pluto, glyph: '\u2647' },   // ♇
  { name: 'North Node', code: astro.PLANETS.NorthNode, glyph: '\u260A' }, // ☊
  { name: 'South Node', code: null, glyph: '\u260B' },             // ☋ (calculated from North Node)
];

// Aspect definitions with orbs from spec
const ASPECT_DEFINITIONS = [
  { name: 'Conjunction', angle: 0, symbol: '\u260C', orb: 8 },     // ☌
  { name: 'Opposition', angle: 180, symbol: '\u260D', orb: 8 },    // ☍
  { name: 'Trine', angle: 120, symbol: '\u25B3', orb: 8 },         // △
  { name: 'Square', angle: 90, symbol: '\u25A1', orb: 7 },         // □
  { name: 'Sextile', angle: 60, symbol: '\u26B9', orb: 6 },        // ⚹
];

// Average daily motion for planets (degrees per day) - used for applying/separating calculation
const PLANET_SPEEDS = {
  'Sun': 0.9856,
  'Moon': 13.1764,
  'Mercury': 1.383,
  'Venus': 1.2,
  'Mars': 0.524,
  'Jupiter': 0.083,
  'Saturn': 0.034,
  'Uranus': 0.012,
  'Neptune': 0.006,
  'Pluto': 0.004,
  'North Node': -0.053,
  'South Node': -0.053,
};

// Known eclipse data (can be extended or fetched from ephemeris)
const UPCOMING_ECLIPSES = [
  { type: 'Lunar', date: '2026-03-03T11:33:00Z' },
  { type: 'Solar', date: '2026-02-17T12:01:00Z' },
  { type: 'Lunar', date: '2026-08-28T04:13:00Z' },
  { type: 'Solar', date: '2026-08-12T17:46:00Z' },
];

/**
 * Try to load Swiss Ephemeris
 */
let swisseph = null;
try {
  swisseph = require('swisseph');
} catch (err) {
  // Will use fallback calculations
}

/**
 * Calculate approximate planetary longitude using simplified astronomy
 * Used when swisseph is not available
 * @param {Date} date - Date to calculate for
 * @param {string} planetName - Name of the planet
 * @returns {Object} Approximate position data
 */
function calculateApproximatePosition(date, planetName) {
  // J2000.0 epoch reference
  const J2000 = new Date('2000-01-01T12:00:00Z');
  const daysSinceJ2000 = (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24);

  // Simplified orbital elements at J2000
  const orbitalElements = {
    'Sun': { L0: 280.460, n: 0.9856474 },      // Earth's position from Sun's perspective
    'Moon': { L0: 218.32, n: 13.1763965 },
    'Mercury': { L0: 252.251, n: 4.0923344 },
    'Venus': { L0: 181.979, n: 1.6021302 },
    'Mars': { L0: 355.433, n: 0.5240208 },
    'Jupiter': { L0: 34.351, n: 0.0830853 },
    'Saturn': { L0: 50.077, n: 0.0334442 },
    'Uranus': { L0: 314.055, n: 0.0117259 },
    'Neptune': { L0: 304.349, n: 0.0059818 },
    'Pluto': { L0: 238.929, n: 0.0039768 },
    'North Node': { L0: 125.044, n: -0.0529539 },
  };

  const elements = orbitalElements[planetName];
  if (!elements) {
    return { longitude: 0, error: 'Unknown planet' };
  }

  // Calculate mean longitude
  let longitude = (elements.L0 + elements.n * daysSinceJ2000) % 360;
  if (longitude < 0) longitude += 360;

  // Simplified retrograde check (outer planets when Earth passes them)
  // This is very approximate
  let retrograde = false;
  if (['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(planetName)) {
    const sunLong = (orbitalElements['Sun'].L0 + orbitalElements['Sun'].n * daysSinceJ2000) % 360;
    const elongation = Math.abs(longitude - sunLong);
    // Very simplified: inner planets retrograde near inferior conjunction
    // Outer planets retrograde near opposition
    if (planetName === 'Mercury' || planetName === 'Venus') {
      retrograde = elongation < 20 || elongation > 340;
    } else {
      retrograde = elongation > 150 && elongation < 210;
    }
  }

  const sign = astro.getZodiacSign(longitude);

  return {
    longitude,
    latitude: 0,
    distance: 1,
    speed: PLANET_SPEEDS[planetName] || 0,
    retrograde,
    sign: sign.name,
    signSymbol: sign.symbol,
    degree: sign.degree,
    estimated: true,
  };
}

/**
 * Get planet position using swisseph or fallback
 * @param {Date} date - Date to calculate for
 * @param {Object} planet - Planet definition object
 * @returns {Object} Planet position data
 */
function getPlanetData(date, planet) {
  // Special case: South Node is opposite North Node
  if (planet.name === 'South Node') {
    const northNodePlanet = PLANETS_TO_TRACK.find(p => p.name === 'North Node');
    const northNode = getPlanetData(date, northNodePlanet);
    const southLong = (northNode.longitude + 180) % 360;
    const sign = astro.getZodiacSign(southLong);

    return {
      name: 'South Node',
      sign: sign.name,
      degree: sign.degree,
      retrograde: northNode.retrograde,
      glyph: planet.glyph,
      longitude: southLong,
      estimated: northNode.estimated || false,
    };
  }

  let position;

  if (swisseph && planet.code !== null) {
    position = astro.getPlanetPosition(date, planet.code);
  } else {
    position = calculateApproximatePosition(date, planet.name);
  }

  return {
    name: planet.name,
    sign: position.sign || astro.getZodiacSign(position.longitude).name,
    degree: Math.round((position.degree || (position.longitude % 30)) * 10) / 10,
    retrograde: position.retrograde || false,
    glyph: planet.glyph,
    longitude: position.longitude,
    estimated: position.estimated || position.error ? true : false,
  };
}

/**
 * Calculate aspect between two planets
 * @param {Object} planet1 - First planet data
 * @param {Object} planet2 - Second planet data
 * @returns {Object|null} Aspect data or null
 */
function calculateAspect(planet1, planet2) {
  let angle = Math.abs(planet1.longitude - planet2.longitude);
  if (angle > 180) angle = 360 - angle;

  for (const aspectDef of ASPECT_DEFINITIONS) {
    const orb = Math.abs(angle - aspectDef.angle);
    if (orb <= aspectDef.orb) {
      // Determine if aspect is applying or separating
      // Faster planet catches up to slower planet = applying
      const speed1 = PLANET_SPEEDS[planet1.name] || 0;
      const speed2 = PLANET_SPEEDS[planet2.name] || 0;

      // Simplified applying calculation
      let applying = true;
      const fasterPlanet = speed1 > speed2 ? planet1 : planet2;
      const slowerPlanet = speed1 > speed2 ? planet2 : planet1;

      // If faster planet is behind slower and approaching the aspect angle
      const diff = fasterPlanet.longitude - slowerPlanet.longitude;
      const normalizedDiff = ((diff % 360) + 360) % 360;

      // Very simplified: if the actual angle is less than exact, it's applying
      if (aspectDef.angle === 0) {
        applying = normalizedDiff > 180 || normalizedDiff < aspectDef.orb;
      } else {
        applying = angle < aspectDef.angle;
      }

      return {
        planet1: planet1.name,
        planet2: planet2.name,
        aspect: aspectDef.name,
        symbol: aspectDef.symbol,
        orb: Math.round(orb * 10) / 10,
        applying,
      };
    }
  }

  return null;
}

/**
 * Find all aspects between planets
 * @param {Array} planets - Array of planet data objects
 * @returns {Array} Array of aspect objects
 */
function findAspects(planets) {
  const aspects = [];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const aspect = calculateAspect(planets[i], planets[j]);
      if (aspect) {
        aspects.push(aspect);
      }
    }
  }

  return aspects;
}

/**
 * Find retrogrades from planet list
 * @param {Array} planets - Array of planet data objects
 * @returns {Array} Names of retrograde planets
 */
function findRetrogrades(planets) {
  return planets
    .filter(p => p.retrograde && !['Sun', 'Moon'].includes(p.name))
    .map(p => p.name);
}

/**
 * Get the next eclipse from the current date
 * @param {Date} date - Current date
 * @returns {Object} Next eclipse data
 */
function getNextEclipse(date) {
  const now = date.getTime();

  // Sort eclipses by date and find the next one
  const sortedEclipses = UPCOMING_ECLIPSES
    .map(e => ({ ...e, dateObj: new Date(e.date) }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  for (const eclipse of sortedEclipses) {
    if (eclipse.dateObj.getTime() > now) {
      const daysUntil = Math.ceil((eclipse.dateObj.getTime() - now) / (1000 * 60 * 60 * 24));
      return {
        type: eclipse.type,
        date: eclipse.dateObj.toISOString(),
        daysUntil,
      };
    }
  }

  // If no future eclipse found, provide placeholder
  return {
    type: 'Unknown',
    date: null,
    daysUntil: null,
  };
}

/**
 * Calculate Void of Course Moon
 * Moon is void of course when it makes no more major aspects before leaving its current sign
 * @param {Object} moonData - Moon position data
 * @param {Array} planets - All planet data
 * @param {Date} date - Current date
 * @returns {Object} VOC Moon status
 */
function calculateVoidOfCourseMoon(moonData, planets, date) {
  // Calculate degrees remaining in current sign
  const degreesInSign = moonData.degree;
  const degreesRemaining = 30 - degreesInSign;
  const hoursRemaining = degreesRemaining / (13.1764 / 24); // Moon's hourly motion

  // Check if Moon will make any aspects before leaving sign
  const moonLong = moonData.longitude;
  const signEndLong = Math.ceil(moonLong / 30) * 30;

  let willMakeAspect = false;

  for (const planet of planets) {
    if (planet.name === 'Moon') continue;

    // Check each aspect type
    for (const aspectDef of ASPECT_DEFINITIONS) {
      // Would the aspect occur before Moon leaves sign?
      const targetLong1 = (planet.longitude + aspectDef.angle) % 360;
      const targetLong2 = (planet.longitude - aspectDef.angle + 360) % 360;

      if ((moonLong < targetLong1 && targetLong1 < signEndLong) ||
          (moonLong < targetLong2 && targetLong2 < signEndLong)) {
        willMakeAspect = true;
        break;
      }
    }
    if (willMakeAspect) break;
  }

  const vocActive = !willMakeAspect && degreesRemaining < 5;

  return {
    active: vocActive,
    nextStart: vocActive ? null : null, // Would require forward calculation
    nextEnd: vocActive ? new Date(date.getTime() + hoursRemaining * 60 * 60 * 1000).toISOString() : null,
  };
}

/**
 * Module collect function for scheduler
 * @returns {Promise<Object>} Collected astrology data
 */
async function collect() {
  const now = new Date();
  const timestamp = now.toISOString();

  try {
    // Calculate all planet positions
    const planets = PLANETS_TO_TRACK.map(planet => getPlanetData(now, planet));

    // Remove internal longitude from output
    const planetsOutput = planets.map(({ longitude, estimated, ...rest }) => ({
      ...rest,
      ...(estimated ? { estimated } : {}),
    }));

    // Find all aspects
    const aspects = findAspects(planets);

    // Find retrogrades
    const retrogrades = findRetrogrades(planets);

    // Get next eclipse
    const nextEclipse = getNextEclipse(now);

    // Calculate void of course moon
    const moonData = planets.find(p => p.name === 'Moon');
    const voidOfCourseMoon = calculateVoidOfCourseMoon(moonData, planets, now);

    // Check if we're using estimated data
    const isEstimated = planets.some(p => p.estimated);

    return {
      timestamp,
      planets: planetsOutput,
      aspects,
      retrogrades,
      retrogradeCount: retrogrades.length,
      nextEclipse,
      voidOfCourseMoon,
      ...(isEstimated ? { estimated: true, note: 'Swiss Ephemeris not available - using simplified calculations' } : {}),
      collectedAt: now.toISOString(),
    };
  } catch (error) {
    console.error('Astrology module error:', error);

    // Return a valid response even on error
    return {
      timestamp,
      planets: [],
      aspects: [],
      retrogrades: [],
      retrogradeCount: 0,
      nextEclipse: getNextEclipse(now),
      voidOfCourseMoon: { active: false, nextStart: null, nextEnd: null },
      error: error.message,
      collectedAt: now.toISOString(),
    };
  }
}

module.exports = {
  name: 'astrology',
  schedule: '0 */3 * * *', // Every 3 hours
  collect,
  // Export helper functions for testing/external use
  getPlanetData,
  calculateAspect,
  findAspects,
  findRetrogrades,
  getNextEclipse,
  calculateVoidOfCourseMoon,
  calculateApproximatePosition,
  PLANETS_TO_TRACK,
  ASPECT_DEFINITIONS,
};
