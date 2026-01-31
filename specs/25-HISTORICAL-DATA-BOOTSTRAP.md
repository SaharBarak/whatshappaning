# Historical Data Bootstrap Specification

Defines the process for initializing historical data, identifying gaps, and bulk-importing data for correlation analysis.

---

## Overview

The correlation engine requires historical data to calculate statistical relationships between cosmic/esoteric features and measurable outcomes. This document specifies:
- Bootstrap process for new installations
- Data sources for historical records
- Bulk import procedures
- Gap detection and backfill strategies

---

## Data Coverage Requirements

Per spec 23, minimum historical data ranges:

| Data Type | Start Date | Years | Purpose |
|-----------|-----------|-------|---------|
| S&P 500 | 1950+ | 76+ | Market direction correlations |
| Bitcoin | 2014+ | 12+ | Crypto outcome correlations |
| Earthquakes | 2000+ | 26+ | Geophysical patterns |
| Solar/Kp Index | 1930+ | 96+ | Space weather correlations |

**Minimum viable bootstrap**: 30 days (Wilson interval requirement for n >= 30)

**Recommended bootstrap**: 365+ days for seasonal pattern detection

---

## Bootstrap Process

### Step 1: Database Initialization

Ensure schema exists (per spec 14):

```sql
-- Core table for historical feature/outcome pairs
CREATE TABLE IF NOT EXISTS historical_features (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,

  -- Cosmic/Esoteric Features (23)
  moon_phase INTEGER,
  moon_sign INTEGER,
  moon_illumination REAL,
  moon_void_of_course BOOLEAN,
  tzolkin_tone INTEGER,
  tzolkin_sign INTEGER,
  dreamspell_kin INTEGER,
  dreamspell_wavespell INTEGER,
  mercury_retrograde BOOLEAN,
  venus_retrograde BOOLEAN,
  mars_retrograde BOOLEAN,
  planets_retrograde_count INTEGER,
  sun_sign INTEGER,
  major_aspects_count INTEGER,
  eclipse_proximity INTEGER,
  hebrew_day INTEGER,
  hebrew_month INTEGER,
  parasha_index INTEGER,
  numerology_day INTEGER,
  tarot_card INTEGER,
  iching_hexagram INTEGER,
  planetary_hour INTEGER,
  day_of_week INTEGER,

  -- Geophysical Features (9)
  kp_index REAL,
  ap_index REAL,
  solar_flare_class INTEGER,
  sunspot_number REAL,
  solar_wind_speed REAL,
  schumann_amplitude REAL,
  quake_count_24h INTEGER,
  quake_max_magnitude REAL,
  quake_energy_log REAL,

  -- Sentiment Features (4)
  fear_greed_cnn INTEGER,
  fear_greed_crypto INTEGER,
  vix REAL,
  sentiment_aggregate REAL,

  -- Outcomes (12 binary)
  spx_direction BOOLEAN,
  spx_volatile BOOLEAN,
  spx_return REAL,
  btc_direction BOOLEAN,
  btc_volatile BOOLEAN,
  vix_spike BOOLEAN,
  gold_direction BOOLEAN,
  major_quake BOOLEAN,
  quake_above_avg BOOLEAN,
  geomag_storm BOOLEAN,
  sentiment_drop BOOLEAN,
  fear_spike BOOLEAN,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historical_date ON historical_features(date);
```

### Step 2: Gap Detection

Use `checkDataCoverage()` to identify missing dates:

```javascript
const { checkDataCoverage } = require('./correlation/historical');

// Check last 365 days
const endDate = new Date().toISOString().split('T')[0];
const startDate = new Date(Date.now() - 365*24*60*60*1000).toISOString().split('T')[0];

const coverage = await checkDataCoverage(startDate, endDate);
// Returns: { exists: false, count: 200, missingDates: ['2025-01-15', ...] }
```

### Step 3: Data Import

For each missing date, collect data from sources and build records:

```javascript
const { buildHistoricalRecord, saveHistoricalFeature } = require('./correlation/historical');

for (const dateStr of coverage.missingDates) {
  // Collect module data for the date (either from APIs or cached sources)
  const moduleData = await collectModuleDataForDate(dateStr);

  // Get previous day's data for outcome calculation
  const prevDate = getPreviousDate(dateStr);
  const previousData = await loadHistoricalFeatures({ startDate: prevDate, endDate: prevDate });

  // Build and save record
  const record = await buildHistoricalRecord(dateStr, moduleData, previousData[0] || {});
  await saveHistoricalFeature(record);
}
```

---

## External Data Sources for Backfill

### Market Data

| Source | Data | API/Access |
|--------|------|------------|
| Yahoo Finance | S&P 500, Gold historical | `yahoo-finance2` npm package |
| CoinGecko | Bitcoin historical | Public API, 50 req/min free |
| CBOE | VIX historical | CSV download |

### Geophysical Data

| Source | Data | API/Access |
|--------|------|------------|
| NOAA SWPC | Kp/Ap indices, solar flares | FTP archives, 30+ years |
| USGS | Earthquake catalog | CSV download, 2000+ |
| Tomsk Observatory | Schumann resonance | Limited historical |

### Astronomical Data

| Source | Data | Method |
|--------|------|--------|
| Swiss Ephemeris | Planetary positions | Local calculation for any date |
| Hebcal | Hebrew calendar | API supports historical dates |
| Local algorithms | Tzolkin, Dreamspell, Numerology | Deterministic calculation |

---

## Bulk Import Scripts

### Daily Collection (Automated)

The scheduler runs `updateTodayRecord()` daily:

```javascript
// In scheduler.js
cron.schedule('0 0 * * *', async () => {
  const moduleData = await collectAllModules();
  await historical.updateTodayRecord(moduleData);
});
```

### Historical Backfill (Manual)

Bootstrap script for initial setup:

```bash
# Run from backend directory
node scripts/backfill.js --start 2024-01-01 --end 2024-12-31
```

Script structure:

```javascript
// scripts/backfill.js
const { buildHistoricalRecord, saveHistoricalFeature, checkDataCoverage } = require('../src/correlation/historical');

async function backfill(startDate, endDate) {
  const coverage = await checkDataCoverage(startDate, endDate);
  console.log(`Found ${coverage.missingDates.length} missing dates`);

  for (const date of coverage.missingDates) {
    try {
      // Calculate cosmic features (always available)
      const cosmicData = await calculateCosmicFeatures(date);

      // Fetch historical market/geo data (may fail for old dates)
      const marketData = await fetchHistoricalMarketData(date);
      const geoData = await fetchHistoricalGeoData(date);

      const moduleData = { ...cosmicData, ...marketData, ...geoData };
      const record = await buildHistoricalRecord(date, moduleData);

      await saveHistoricalFeature(record);
      console.log(`Saved: ${date}`);
    } catch (err) {
      console.error(`Failed: ${date} - ${err.message}`);
    }
  }
}
```

---

## Feature Availability by Date Range

Not all features are available for all historical dates:

| Feature Category | Available From | Notes |
|------------------|----------------|-------|
| Cosmic/Esoteric | Any date | Calculated from ephemeris/algorithms |
| Market (S&P 500) | 1950 | Yahoo Finance historical |
| Market (Bitcoin) | 2014 | CoinGecko historical |
| Market (VIX) | 1990 | CBOE historical |
| Geophysical (Kp) | 1930 | NOAA archives |
| Geophysical (Quakes) | 2000 | USGS catalog |
| Sentiment (F&G) | 2018 | CNN/Crypto indices started recently |
| Schumann | 2010 | Tomsk data limited |

**Strategy**: For features unavailable historically, set to NULL. Correlation engine handles NULL values gracefully.

---

## Data Validation

After bootstrap, verify data quality:

```javascript
const { getCorrelationSummary, getDataRange } = require('./correlation/historical');

// Check coverage
const range = await getDataRange();
console.log(`Data from ${range.earliest} to ${range.latest}: ${range.count} records`);

// Verify minimum sample size for correlations
const summary = await getCorrelationSummary();
console.log(`Historical records: ${summary.historicalRecords}`);
console.log(`Correlations computed: ${summary.correlations.total}`);
```

Minimum thresholds:
- `count >= 30` for basic correlation analysis
- `count >= 100` for High confidence level
- `count >= 200` for Very High confidence level

---

## Maintenance

### Daily Updates

Handled automatically by scheduler calling `updateTodayRecord()`.

### Gap Filling

Run weekly to catch any missed days:

```javascript
// Check last 7 days
const coverage = await checkDataCoverage(sevenDaysAgo, today);
if (coverage.missingDates.length > 0) {
  await backfillDates(coverage.missingDates);
}
```

### Correlation Refresh

Clear and recompute correlations weekly:

```javascript
await clearOldCorrelations(7); // Remove >7 day old results
await computeAllCorrelations(); // Recalculate with latest data
```

---

## Error Handling

| Error | Handling |
|-------|----------|
| API rate limit | Exponential backoff, cache results |
| Missing data source | Set feature to NULL, continue |
| Database connection | Retry with backoff |
| Invalid date | Skip with warning |

Records with NULL outcomes are excluded from correlation calculations for that outcome but included for feature analysis.
