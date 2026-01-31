#!/usr/bin/env node

/**
 * Historical Data Backfill Script
 *
 * Bootstraps historical data for correlation analysis.
 * Per spec 25-HISTORICAL-DATA-BOOTSTRAP.md:
 * - Calculates cosmic/esoteric features for any date (local algorithms)
 * - Fetches market data from Yahoo Finance / CoinGecko
 * - Fetches geophysical data from USGS
 * - Handles missing data gracefully (NULL values)
 *
 * Usage:
 *   node scripts/backfill.js --start 2024-01-01 --end 2024-12-31
 *   node scripts/backfill.js --days 30  # Last N days
 *   node scripts/backfill.js --gaps     # Fill only missing dates
 */

const path = require('path');

// Ensure we can require modules from src
const srcPath = path.join(__dirname, '../src');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    startDate: null,
    endDate: null,
    days: null,
    gaps: false,
    dryRun: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--start':
        options.startDate = args[++i];
        break;
      case '--end':
        options.endDate = args[++i];
        break;
      case '--days':
        options.days = parseInt(args[++i], 10);
        break;
      case '--gaps':
        options.gaps = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Historical Data Backfill Script

Usage:
  node scripts/backfill.js [options]

Options:
  --start DATE    Start date (YYYY-MM-DD)
  --end DATE      End date (YYYY-MM-DD)
  --days N        Backfill last N days (alternative to --start/--end)
  --gaps          Only fill missing dates in the range
  --dry-run       Show what would be done without saving
  --verbose, -v   Show detailed progress
  --help, -h      Show this help

Examples:
  node scripts/backfill.js --days 30
  node scripts/backfill.js --start 2024-01-01 --end 2024-12-31
  node scripts/backfill.js --gaps --start 2024-01-01 --end 2024-06-30
`);
        process.exit(0);
    }
  }

  return options;
}

// Calculate date range from options
function getDateRange(options) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (options.days) {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - options.days);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    };
  }

  if (options.startDate && options.endDate) {
    return {
      startDate: options.startDate,
      endDate: options.endDate,
    };
  }

  // Default: last 30 days
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 30);
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  };
}

// Generate array of dates between start and end
function generateDateRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }

  return dates;
}

// Sleep helper for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main backfill function
async function backfill() {
  const options = parseArgs();
  const { startDate, endDate } = getDateRange(options);

  console.log(`\n📅 Backfill Configuration:`);
  console.log(`   Start Date: ${startDate}`);
  console.log(`   End Date: ${endDate}`);
  console.log(`   Dry Run: ${options.dryRun}`);
  console.log(`   Gap Fill Only: ${options.gaps}\n`);

  // Load required modules
  let db, historical, features, outcomes;
  let tzolkin, dreamspell, numerology, gematria, tarot, iching, parasha;
  let moon, astrology;

  try {
    db = require(path.join(srcPath, 'db'));
    historical = require(path.join(srcPath, 'correlation/historical'));
    features = require(path.join(srcPath, 'correlation/features'));
    outcomes = require(path.join(srcPath, 'correlation/outcomes'));

    // Local calculation modules
    tzolkin = require(path.join(srcPath, 'modules/tzolkin'));
    dreamspell = require(path.join(srcPath, 'modules/dreamspell'));
    numerology = require(path.join(srcPath, 'modules/numerology'));
    gematria = require(path.join(srcPath, 'modules/gematria'));
    tarot = require(path.join(srcPath, 'modules/tarot'));
    iching = require(path.join(srcPath, 'modules/iching'));
    parasha = require(path.join(srcPath, 'modules/parasha'));

    // Astro modules
    moon = require(path.join(srcPath, 'modules/moon'));
    astrology = require(path.join(srcPath, 'modules/astrology'));
  } catch (error) {
    console.error('❌ Failed to load modules:', error.message);
    console.error('   Make sure you run this from the backend directory');
    process.exit(1);
  }

  // Test database connection
  console.log('🔌 Testing database connection...');
  const connected = await db.testConnection();
  if (!connected) {
    console.error('❌ Database connection failed. Check DATABASE_URL environment variable.');
    process.exit(1);
  }
  console.log('✅ Database connected\n');

  // Get dates to process
  let datesToProcess = generateDateRange(startDate, endDate);

  if (options.gaps) {
    console.log('🔍 Checking for gaps in existing data...');
    const coverage = await historical.checkDataCoverage(startDate, endDate);
    console.log(`   Found ${coverage.count} existing records`);
    console.log(`   Found ${coverage.missingDates.length} missing dates\n`);
    datesToProcess = coverage.missingDates;
  }

  if (datesToProcess.length === 0) {
    console.log('✅ No dates to process. Data is complete!');
    process.exit(0);
  }

  console.log(`📊 Processing ${datesToProcess.length} dates...\n`);

  // Track statistics
  const stats = {
    processed: 0,
    saved: 0,
    errors: 0,
    skipped: 0,
  };

  // Process each date
  for (const dateStr of datesToProcess) {
    stats.processed++;
    const date = new Date(dateStr + 'T12:00:00Z');

    if (options.verbose) {
      console.log(`\n📆 Processing ${dateStr} (${stats.processed}/${datesToProcess.length})`);
    } else {
      process.stdout.write(`\r   Progress: ${stats.processed}/${datesToProcess.length} (${Math.round(stats.processed/datesToProcess.length*100)}%)`);
    }

    try {
      // Calculate cosmic/esoteric features (always available)
      const cosmicData = await calculateCosmicFeatures(date, {
        tzolkin, dreamspell, numerology, gematria, tarot, iching, parasha, moon, astrology
      }, options.verbose);

      // Fetch market data (may fail for old dates or weekends)
      const marketData = await fetchHistoricalMarketData(dateStr, options.verbose);

      // Fetch geophysical data (may fail for old dates)
      const geoData = await fetchHistoricalGeoData(dateStr, options.verbose);

      // Combine all data
      const moduleData = {
        ...cosmicData,
        markets: marketData,
        geophysical: geoData,
      };

      // Get previous day data for outcome calculation
      const prevDateStr = getPreviousDate(dateStr);
      let previousData = {};

      try {
        const prevRecords = await historical.loadHistoricalFeatures({
          startDate: prevDateStr,
          endDate: prevDateStr,
          limit: 1,
        });
        if (prevRecords.length > 0) {
          previousData = prevRecords[0];
        }
      } catch (err) {
        // Previous day data not available, outcomes will be null
      }

      // Build and save record
      const record = await historical.buildHistoricalRecord(dateStr, moduleData, previousData);

      if (options.dryRun) {
        if (options.verbose) {
          console.log(`   Would save: ${JSON.stringify(record, null, 2).substring(0, 200)}...`);
        }
        stats.skipped++;
      } else {
        const saved = await historical.saveHistoricalFeature(record);
        if (saved) {
          stats.saved++;
          if (options.verbose) {
            console.log(`   ✅ Saved record for ${dateStr}`);
          }
        } else {
          stats.errors++;
          console.error(`   ⚠️ Failed to save record for ${dateStr}`);
        }
      }

      // Rate limiting: 100ms between requests to be nice to APIs
      await sleep(100);

    } catch (error) {
      stats.errors++;
      console.error(`\n❌ Error processing ${dateStr}: ${error.message}`);
      if (options.verbose) {
        console.error(error.stack);
      }
    }
  }

  // Print summary
  console.log(`\n\n📊 Backfill Complete!`);
  console.log(`   Processed: ${stats.processed}`);
  console.log(`   Saved: ${stats.saved}`);
  console.log(`   Skipped: ${stats.skipped}`);
  console.log(`   Errors: ${stats.errors}`);

  // Verify final state
  const range = await historical.getDataRange();
  console.log(`\n📅 Data Range: ${range.earliest || 'none'} to ${range.latest || 'none'}`);
  console.log(`   Total Records: ${range.count}\n`);

  // Close database connection
  await db.end();
  process.exit(stats.errors > 0 ? 1 : 0);
}

/**
 * Calculate cosmic/esoteric features for a specific date
 * These are all calculated locally and available for any date
 * All modules export getForDate(dateStr) which accepts YYYY-MM-DD strings
 */
async function calculateCosmicFeatures(date, modules, verbose) {
  const { tzolkin, dreamspell, numerology, gematria, tarot, iching, parasha, moon, astrology } = modules;
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;

  const data = {};

  // Tzolkin (always available - local calculation)
  try {
    data.tzolkin = tzolkin.getForDate(dateStr);
    if (verbose) console.log(`   ✅ Tzolkin: ${data.tzolkin.tone} ${data.tzolkin.daySign}`);
  } catch (err) {
    if (verbose) console.log(`   ⚠️ Tzolkin: ${err.message}`);
  }

  // Dreamspell (always available - local calculation)
  try {
    data.dreamspell = dreamspell.getForDate(dateStr);
    if (verbose) console.log(`   ✅ Dreamspell: Kin ${data.dreamspell.kin}`);
  } catch (err) {
    if (verbose) console.log(`   ⚠️ Dreamspell: ${err.message}`);
  }

  // Numerology (always available - local calculation)
  try {
    data.numerology = numerology.getForDate(dateStr);
    if (verbose) console.log(`   ✅ Numerology: ${data.numerology.universalDay}`);
  } catch (err) {
    if (verbose) console.log(`   ⚠️ Numerology: ${err.message}`);
  }

  // Tarot (deterministic based on date seed)
  try {
    data.tarot = tarot.getForDate(dateStr);
    if (verbose) console.log(`   ✅ Tarot: ${data.tarot?.card?.name || 'unknown'}`);
  } catch (err) {
    if (verbose) console.log(`   ⚠️ Tarot: ${err.message}`);
  }

  // I Ching (deterministic based on date seed)
  try {
    data.iching = iching.getForDate(dateStr);
    if (verbose) console.log(`   ✅ I Ching: Hexagram ${data.iching?.number || 'unknown'}`);
  } catch (err) {
    if (verbose) console.log(`   ⚠️ I Ching: ${err.message}`);
  }

  // Moon (local calculation via Swiss Ephemeris or Meeus)
  try {
    data.moon = await moon.getForDate(dateStr);
    if (verbose && data.moon) console.log(`   ✅ Moon: ${data.moon.phase} (${Math.round(data.moon.illumination * 100)}%)`);
  } catch (err) {
    if (verbose) console.log(`   ⚠️ Moon: ${err.message}`);
  }

  // Astrology (local calculation via Swiss Ephemeris)
  // astrology module doesn't have getForDate, so we construct data using helpers
  try {
    const dateObj = new Date(dateStr + 'T12:00:00Z');
    const planets = astrology.PLANETS_TO_TRACK.map(planet => astrology.getPlanetData(dateObj, planet));
    const aspects = astrology.findAspects(planets);
    const retrogrades = astrology.findRetrogrades(planets);
    const nextEclipse = astrology.getNextEclipse(dateObj);
    const moonData = planets.find(p => p.name === 'Moon');
    const voidOfCourseMoon = astrology.calculateVoidOfCourseMoon(moonData, planets, dateObj);

    data.astrology = {
      planets: planets.map(({ longitude, ...rest }) => rest),
      aspects,
      retrogrades,
      retrogradeCount: retrogrades.length,
      nextEclipse,
      voidOfCourseMoon,
    };

    if (verbose) {
      console.log(`   ✅ Astrology: ${retrogrades.length} retrogrades`);
    }
  } catch (err) {
    if (verbose) console.log(`   ⚠️ Astrology: ${err.message}`);
  }

  // Gematria (needs Hebrew date, may need API)
  try {
    data.gematria = await gematria.getForDate(dateStr);
    if (verbose && data.gematria) console.log(`   ✅ Gematria: ${data.gematria.hebrewDate || 'calculated'}`);
  } catch (err) {
    if (verbose) console.log(`   ⚠️ Gematria: ${err.message}`);
  }

  // Parasha (needs Hebrew date, may need API)
  try {
    data.parasha = await parasha.getForDate(dateStr);
    if (verbose && data.parasha) console.log(`   ✅ Parasha: ${data.parasha.name || 'none'}`);
  } catch (err) {
    if (verbose) console.log(`   ⚠️ Parasha: ${err.message}`);
  }

  return data;
}

/**
 * Fetch historical market data from Yahoo Finance and CoinGecko
 * Returns null values for fields that aren't available
 */
async function fetchHistoricalMarketData(dateStr, verbose) {
  const data = {
    spx: null,
    btc: null,
    vix: null,
    gold: null,
    fearGreed: null,
  };

  // Load yahoo-finance2 dynamically (ESM module)
  let yahooFinance;
  try {
    const module = await import('yahoo-finance2');
    yahooFinance = module.default;
  } catch (err) {
    if (verbose) console.log(`   ⚠️ Yahoo Finance not available: ${err.message}`);
    return data;
  }

  const queryDate = new Date(dateStr);
  const nextDay = new Date(queryDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Helper to fetch historical quote
  async function fetchHistorical(symbol, name) {
    try {
      const result = await yahooFinance.historical(symbol, {
        period1: dateStr,
        period2: nextDay.toISOString().split('T')[0],
        interval: '1d',
      });

      if (result && result.length > 0) {
        const quote = result[0];
        return {
          open: quote.open,
          high: quote.high,
          low: quote.low,
          close: quote.close,
          volume: quote.volume,
          change: quote.close && quote.open ? ((quote.close - quote.open) / quote.open) * 100 : null,
        };
      }
    } catch (err) {
      if (verbose) console.log(`   ⚠️ ${name}: ${err.message}`);
    }
    return null;
  }

  // Fetch each symbol (with rate limiting)
  data.spx = await fetchHistorical('^GSPC', 'SPX');
  await sleep(200);

  data.vix = await fetchHistorical('^VIX', 'VIX');
  await sleep(200);

  data.gold = await fetchHistorical('GC=F', 'Gold');
  await sleep(200);

  // Bitcoin from CoinGecko historical
  try {
    const axios = require('axios');
    const timestamp = Math.floor(queryDate.getTime() / 1000);
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${dateStr.split('-').reverse().join('-')}`,
      { timeout: 10000 }
    );

    if (response.data && response.data.market_data) {
      data.btc = {
        price: response.data.market_data.current_price?.usd,
        marketCap: response.data.market_data.market_cap?.usd,
      };
    }
  } catch (err) {
    if (verbose) console.log(`   ⚠️ BTC: ${err.message}`);
  }

  if (verbose && data.spx) {
    console.log(`   ✅ SPX: $${data.spx.close?.toFixed(2)} (${data.spx.change?.toFixed(2)}%)`);
  }

  return data;
}

/**
 * Fetch historical geophysical data
 * USGS earthquake API supports historical queries
 * NOAA Kp data has limited historical availability
 */
async function fetchHistoricalGeoData(dateStr, verbose) {
  const data = {
    earthquakes: null,
    kpIndex: null,
  };

  const axios = require('axios');
  const queryDate = new Date(dateStr);
  const nextDay = new Date(queryDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // USGS Earthquake data (historical available)
  try {
    const startTime = dateStr;
    const endTime = nextDay.toISOString().split('T')[0];

    const response = await axios.get(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&endtime=${endTime}&minmagnitude=2.5`,
      { timeout: 15000 }
    );

    if (response.data && response.data.features) {
      const quakes = response.data.features;
      const magnitudes = quakes.map(q => q.properties.mag).filter(m => m !== null);

      data.earthquakes = {
        count: quakes.length,
        maxMagnitude: magnitudes.length > 0 ? Math.max(...magnitudes) : null,
        avgMagnitude: magnitudes.length > 0 ? magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length : null,
        significant: quakes.filter(q => q.properties.mag >= 5.0).length,
      };

      if (verbose) {
        console.log(`   ✅ Earthquakes: ${data.earthquakes.count} (max M${data.earthquakes.maxMagnitude?.toFixed(1) || '?'})`);
      }
    }
  } catch (err) {
    if (verbose) console.log(`   ⚠️ USGS: ${err.message}`);
  }

  // Kp Index - limited historical availability from NOAA
  // For recent dates, try fetching from archive
  try {
    // NOAA's historical Kp data is available via FTP archives
    // For simplicity, we skip this for now and leave it null
    // Future enhancement: implement FTP fetch from ftp://ftp.swpc.noaa.gov/pub/indices/old_indices/
    data.kpIndex = null;
  } catch (err) {
    // Expected - historical Kp not easily available
  }

  return data;
}

/**
 * Get previous date string
 */
function getPreviousDate(dateStr) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

// Run backfill
backfill().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
