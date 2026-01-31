# Correlation Engine

## Overview
The core analytical engine that finds historical correlations between cosmic/esoteric inputs and measurable real-world outcomes. This is the statistical heart of the "What's Happening" prediction system.

**Design Principle:** Every prediction displays sample size, confidence intervals, and contributing factors - "show the math."

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CORRELATION ENGINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   INPUT      │    │   OUTCOME    │    │   STATS      │   │
│  │   FEATURES   │───▶│   TARGETS    │───▶│   ENGINE     │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                   │                   │            │
│         ▼                   ▼                   ▼            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              HISTORICAL DATABASE                     │    │
│  │         (All features + outcomes by date)           │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              CORRELATION RESULTS                     │    │
│  │    Pre-computed correlations + confidence intervals  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Input Features (36 Independent Variables)

### Cosmic/Esoteric Features (23)

| Feature | Type | Encoding | Description |
|---------|------|----------|-------------|
| moon_phase | categorical | 0-7 | 8 phases (0=new, 4=full) |
| moon_sign | categorical | 0-11 | Zodiac sign (0=Aries) |
| moon_illumination | continuous | 0-100 | Percent illumination |
| moon_void_of_course | binary | 0/1 | Moon VOC state |
| tzolkin_tone | categorical | 1-13 | Tzolkin tone (1-13) |
| tzolkin_sign | categorical | 0-19 | Tzolkin day sign (0-19) |
| dreamspell_kin | categorical | 1-260 | Dreamspell kin number |
| dreamspell_wavespell | categorical | 1-20 | Wavespell (1-20) |
| mercury_retrograde | binary | 0/1 | Mercury retrograde status |
| venus_retrograde | binary | 0/1 | Venus retrograde status |
| mars_retrograde | binary | 0/1 | Mars retrograde status |
| planets_retrograde_count | discrete | 0-7 | Count of retrograde planets |
| sun_sign | categorical | 0-11 | Sun zodiac sign (0=Aries) |
| major_aspects_count | discrete | 0-20 | Count of major aspects |
| eclipse_proximity | discrete | 0-365 | Days to nearest eclipse |
| hebrew_day | discrete | 1-30 | Hebrew calendar day |
| hebrew_month | categorical | 1-13 | Hebrew month (1-13) |
| parasha_index | categorical | 1-54 | Torah portion index |
| numerology_day | categorical | 1-33 | Numerology day (1-9, 11, 22, 33) |
| tarot_card | categorical | 0-77 | Tarot card index |
| iching_hexagram | categorical | 1-64 | I Ching hexagram number |
| planetary_hour | categorical | 0-6 | Planetary hour ruler (0=Sun) |
| day_of_week | categorical | 0-6 | Day of week (0=Sunday) |

### Geophysical Features (9)

| Feature | Type | Encoding | Description |
|---------|------|----------|-------------|
| kp_index | continuous | 0-9 | Geomagnetic Kp index |
| ap_index | continuous | 0-400 | Ap index |
| solar_flare_class | ordinal | 0-10 | Flare class (A=0 to X10=10) |
| sunspot_number | continuous | 0-300+ | Sunspot count |
| solar_wind_speed | continuous | 300-800 | Solar wind km/s |
| schumann_amplitude | continuous | 0-100 | Schumann resonance amplitude |
| quake_count_24h | continuous | 0-500 | Earthquakes in 24h |
| quake_max_magnitude | continuous | 0-9 | Max quake magnitude |
| quake_energy_log | continuous | - | Log10 of seismic energy (joules) |

### Sentiment Features (4)

| Feature | Type | Encoding | Description |
|---------|------|----------|-------------|
| fear_greed_cnn | continuous | 0-100 | CNN Fear & Greed index |
| fear_greed_crypto | continuous | 0-100 | Crypto Fear & Greed index |
| vix | continuous | 10-80 | VIX volatility index |
| sentiment_aggregate | continuous | 0-100 | Aggregate sentiment score |

## Continuous Feature Binning Strategy

For continuous features, we use threshold conditions rather than discrete bins. This allows testing specific hypotheses like "high Kp causes market volatility."

### Threshold Definitions

```javascript
const CONTINUOUS_THRESHOLDS = {
  kp_index: ['>=5', '>=7', '<3'],           // Storm levels
  ap_index: ['>=50', '>=100', '<20'],       // Storm levels (minor/major/quiet)
  solar_wind_speed: ['>=500', '>=600', '<400'], // Elevated/high/normal km/s
  sunspot_number: ['>=100', '>=200', '<50'], // Active/very active/quiet
  vix: ['>=20', '>=30', '<15'],             // Volatility levels
  fear_greed_cnn: ['<=25', '>=75', '<=40', '>=60'],    // Fear/greed zones
  fear_greed_crypto: ['<=25', '>=75', '<=40', '>=60'], // Fear/greed zones
  moon_illumination: ['>=95', '<=5', '>=50'],          // Illumination levels
  schumann_amplitude: ['>=50', '>=75'],                // Elevated Schumann
  quake_max_magnitude: ['>=6', '>=5'],                 // Significant quakes
  quake_count_24h: ['>=100', '>=200'],                 // High activity
  eclipse_proximity: ['<=7', '<=14', '<=30'],          // Eclipse windows
  planets_retrograde_count: ['>=3', '>=4'],            // Multiple retrogrades
  major_aspects_count: ['>=5', '>=3'],                 // Aspect density
};
```

**Rationale:**
- Thresholds are based on domain knowledge (e.g., Kp >= 5 is a geomagnetic storm)
- Multiple thresholds per feature test different intensity levels
- This approach preserves interpretability over arbitrary binning

## Outcome Targets (11 Dependent Variables)

### Market Outcomes (6)

| Target | Type | Definition |
|--------|------|------------|
| spx_direction | binary | 1 if SPX closes up, 0 if down |
| spx_volatile | binary | 1 if |daily return| > 1% |
| btc_direction | binary | 1 if BTC closes up, 0 if down |
| btc_volatile | binary | 1 if |daily return| > 3% |
| vix_spike | binary | 1 if VIX increases > 10% |
| gold_direction | binary | 1 if gold closes up |

### Geophysical Outcomes (3)

| Target | Type | Definition |
|--------|------|------------|
| major_quake | binary | 1 if M6+ earthquake within 24h |
| quake_above_avg | binary | 1 if quake count > 30-day average |
| geomag_storm | binary | 1 if Kp >= 5 |

### Sentiment Outcomes (2)

| Target | Type | Definition |
|--------|------|------------|
| sentiment_drop | binary | 1 if aggregate sentiment drops > 10 points |
| fear_spike | binary | 1 if Fear/Greed index < 25 |

## Statistical Methods

### 1. Conditional Probability
```javascript
function conditionalProbability(data, feature, featureValue, outcome) {
  // Filter data where feature matches condition
  const filtered = data.filter(d => matchesCondition(d[feature], featureValue));
  const matches = filtered.filter(d => d[outcome] === true);

  const probability = matches.length / filtered.length;
  const sampleSize = filtered.length;

  // Wilson score interval for confidence bounds
  const ci = wilsonConfidenceInterval(matches.length, filtered.length, 0.95);

  return {
    probability,
    sampleSize,
    confidenceLow: ci.low,
    confidenceHigh: ci.high,
    insufficient: sampleSize < 30
  };
}
```

### 2. Condition Matching
```javascript
function matchesCondition(actual, condition) {
  if (actual === undefined || actual === null) return false;

  if (typeof condition === 'string') {
    if (condition.startsWith('>=')) return actual >= parseFloat(condition.slice(2));
    if (condition.startsWith('<=')) return actual <= parseFloat(condition.slice(2));
    if (condition.startsWith('>')) return actual > parseFloat(condition.slice(1));
    if (condition.startsWith('<')) return actual < parseFloat(condition.slice(1));
  }

  return actual === condition;
}
```

### 3. Chi-Square Test
```javascript
function chiSquareTest(data, feature, featureValue, outcome) {
  // Build 2x2 contingency table
  const table = {
    a: 0, // feature present, outcome positive
    b: 0, // feature present, outcome negative
    c: 0, // feature absent, outcome positive
    d: 0, // feature absent, outcome negative
  };

  for (const row of data) {
    const hasFeature = matchesCondition(row[feature], featureValue);
    const hasOutcome = row[outcome] === true;

    if (hasFeature && hasOutcome) table.a++;
    else if (hasFeature && !hasOutcome) table.b++;
    else if (!hasFeature && hasOutcome) table.c++;
    else table.d++;
  }

  // Calculate chi-square statistic
  const n = table.a + table.b + table.c + table.d;
  const expected_a = ((table.a + table.b) * (table.a + table.c)) / n;
  const expected_b = ((table.a + table.b) * (table.b + table.d)) / n;
  const expected_c = ((table.c + table.d) * (table.a + table.c)) / n;
  const expected_d = ((table.c + table.d) * (table.b + table.d)) / n;

  const chiSq = Math.pow(table.a - expected_a, 2) / expected_a
              + Math.pow(table.b - expected_b, 2) / expected_b
              + Math.pow(table.c - expected_c, 2) / expected_c
              + Math.pow(table.d - expected_d, 2) / expected_d;

  // p-value from chi-square distribution with 1 df
  const pValue = 1 - chiSquareCDF(chiSq, 1);

  return {
    chiSquare: chiSq,
    pValue,
    significant: pValue < 0.05
  };
}
```

### 4. Wilson Confidence Interval
More accurate than normal approximation for proportions, especially near 0 or 1:
```javascript
function wilsonConfidenceInterval(successes, total, confidence = 0.95) {
  if (total === 0) return { low: 0, high: 1 };

  const z = 1.96; // 95% confidence
  const p = successes / total;
  const n = total;

  const denominator = 1 + z * z / n;
  const center = (p + z * z / (2 * n)) / denominator;
  const margin = (z / denominator) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));

  return {
    low: Math.max(0, center - margin),
    high: Math.min(1, center + margin)
  };
}
```

### 5. Lift Calculation
```javascript
function calculateLift(conditionalProb, baseRate) {
  if (baseRate === 0 || baseRate === null) return null;
  return conditionalProb / baseRate;
}
```

A lift > 1 indicates the feature increases the outcome probability; lift < 1 indicates it decreases it.

### 6. Multiple Comparison Correction

With 36 features × 12 outcomes = 432+ tests, we apply Benjamini-Hochberg correction to control false discovery rate:

```javascript
function benjaminiHochbergCorrection(results, alpha = 0.05) {
  // Sort by p-value ascending
  const sorted = [...results].sort((a, b) => a.pValue - b.pValue);
  const m = sorted.length;

  for (let i = 0; i < m; i++) {
    const threshold = (alpha * (i + 1)) / m;
    sorted[i].adjustedPValue = sorted[i].pValue * m / (i + 1);
    sorted[i].significant = sorted[i].pValue <= threshold;
  }

  return sorted;
}
```

## Key Feature Combinations

Pre-defined combinations to test based on astrological and esoteric hypotheses:

```javascript
const KEY_COMBINATIONS = [
  // Mercury retrograde + Full Moon
  // Hypothesis: Communication disruptions during Mercury Rx are amplified at Full Moon
  {
    name: 'mercury_rx_full_moon',
    features: [
      { name: 'mercury_retrograde', value: 1 },
      { name: 'moon_phase', value: 4 }, // Full moon
    ]
  },

  // High Kp + New Moon
  // Hypothesis: Geomagnetic storms during New Moon affect market sentiment
  {
    name: 'high_kp_new_moon',
    features: [
      { name: 'kp_index', value: '>=5' },
      { name: 'moon_phase', value: 0 }, // New moon
    ]
  },

  // Multiple retrogrades + VIX elevated
  // Hypothesis: Multiple retrograde planets correlate with market uncertainty
  {
    name: 'multiple_rx_vix_elevated',
    features: [
      { name: 'planets_retrograde_count', value: '>=3' },
      { name: 'vix', value: '>=20' },
    ]
  },

  // Eclipse proximity + Fear
  // Hypothesis: Eclipse windows coincide with fear spikes
  {
    name: 'eclipse_fear',
    features: [
      { name: 'eclipse_proximity', value: '<=7' },
      { name: 'fear_greed_cnn', value: '<=30' },
    ]
  },

  // VOC Moon + Major aspects
  // Hypothesis: Moon Void of Course with major aspects increases unpredictability
  {
    name: 'voc_major_aspects',
    features: [
      { name: 'moon_void_of_course', value: 1 },
      { name: 'major_aspects_count', value: '>=3' },
    ]
  },

  // Mercury retrograde + High VIX
  // Hypothesis: Mercury Rx during high volatility extends uncertainty
  {
    name: 'mercury_rx_high_vix',
    features: [
      { name: 'mercury_retrograde', value: 1 },
      { name: 'vix', value: '>=25' },
    ]
  },

  // Full moon + High sentiment
  // Hypothesis: Full moon during high sentiment amplifies greed
  {
    name: 'full_moon_high_sentiment',
    features: [
      { name: 'moon_phase', value: 4 },
      { name: 'sentiment_aggregate', value: '>=70' },
    ]
  },

  // Solar flare + Geomagnetic activity
  // Hypothesis: M-class+ flares with Kp >= 4 affect seismic activity
  {
    name: 'flare_geomag',
    features: [
      { name: 'solar_flare_class', value: '>=4' }, // M-class or higher
      { name: 'kp_index', value: '>=4' },
    ]
  },

  // New moon + Low sentiment
  // Hypothesis: New moon during fear amplifies negative sentiment
  {
    name: 'new_moon_low_sentiment',
    features: [
      { name: 'moon_phase', value: 0 },
      { name: 'sentiment_aggregate', value: '<=30' },
    ]
  },

  // Multiple retrogrades only
  // Hypothesis: 4+ retrograde planets correlate with market volatility
  {
    name: 'many_retrogrades',
    features: [
      { name: 'planets_retrograde_count', value: '>=4' },
    ]
  },

  // High Schumann + Full moon
  // Hypothesis: Elevated Schumann resonance at Full Moon affects collective behavior
  {
    name: 'high_schumann_full_moon',
    features: [
      { name: 'schumann_amplitude', value: '>=50' },
      { name: 'moon_phase', value: 4 },
    ]
  },

  // Extreme fear (both indices)
  // Hypothesis: Double extreme fear is a contrarian indicator
  {
    name: 'extreme_fear',
    features: [
      { name: 'fear_greed_cnn', value: '<=20' },
      { name: 'fear_greed_crypto', value: '<=20' },
    ]
  },
];
```

**Future Combination Ideas:**
- GAP days (Dreamspell Galactic Activation Portals) + any outcome
- Specific Tzolkin tones (e.g., Tone 10 - Manifestation) + market direction
- Hebrew calendar milestones (Rosh Chodesh) + sentiment

## Pre-Computation Pipeline

### Weekly Full Recomputation
```javascript
async function computeWeeklyCorrelations() {
  const data = await loadHistoricalData();

  // 1. Compute all single feature correlations
  const singleResults = computeSingleCorrelations(data);

  // 2. Compute key combination correlations
  const combinationResults = computeCombinationCorrelations(data);

  // 3. Apply multiple comparison correction
  const allResults = [...singleResults, ...combinationResults];
  const corrected = benjaminiHochbergCorrection(allResults.filter(r => r.pValue !== null));

  // 4. Filter to significant results
  const significant = corrected.filter(r => r.significant);

  // 5. Save to database
  await db.saveCorrelationResults(significant);

  return {
    total: allResults.length,
    significant: significant.length,
    singleFeature: singleResults.length,
    combinations: combinationResults.length,
  };
}
```

### Daily Incremental Update
```javascript
async function computeDailyUpdate() {
  // Add today's data to historical_features
  await updateTodayRecord();

  // Recompute correlations (could optimize to only update affected)
  return computeWeeklyCorrelations();
}
```

### Live Scoring
```javascript
async function scoreTodaysFeatures(todayFeatures) {
  // Load pre-computed correlations
  const correlations = await db.getSignificantCorrelations();

  // Find matching correlations for today's features
  const matches = findMatchingCorrelations(todayFeatures, correlations);

  // Group by outcome
  return groupByOutcome(matches);
}
```

## Database Schema

### Table: correlation_results
```sql
CREATE TABLE correlation_results (
  id SERIAL PRIMARY KEY,
  correlation_type VARCHAR(20) NOT NULL, -- 'single' or 'combination'
  features JSONB NOT NULL,             -- Feature(s) and value(s)
  outcome VARCHAR(50) NOT NULL,        -- Outcome name
  probability DECIMAL(5,4),            -- Conditional probability
  sample_size INTEGER,                 -- n
  base_rate DECIMAL(5,4),              -- Base rate for outcome
  confidence_low DECIMAL(5,4),         -- Wilson CI lower bound
  confidence_high DECIMAL(5,4),        -- Wilson CI upper bound
  chi_squared DECIMAL(10,4),           -- Chi-square statistic
  p_value DECIMAL(10,8),               -- p-value
  lift DECIMAL(6,4),                   -- Lift (conditional/base)
  is_significant BOOLEAN DEFAULT false,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_corr_outcome ON correlation_results(outcome);
CREATE INDEX idx_corr_significant ON correlation_results(is_significant, outcome);
CREATE INDEX idx_corr_lift ON correlation_results(lift DESC) WHERE is_significant = true;
```

### Table: historical_features
```sql
CREATE TABLE historical_features (
  date DATE PRIMARY KEY,

  -- Cosmic/Esoteric features (23)
  moon_phase INTEGER,
  moon_sign INTEGER,
  moon_illumination DECIMAL(5,2),
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

  -- Geophysical features (9)
  kp_index DECIMAL(3,1),
  ap_index DECIMAL(5,1),
  solar_flare_class INTEGER,
  sunspot_number INTEGER,
  solar_wind_speed DECIMAL(6,1),
  schumann_amplitude DECIMAL(5,2),
  quake_count_24h INTEGER,
  quake_max_magnitude DECIMAL(3,1),
  quake_energy_log DECIMAL(10,4),

  -- Sentiment features (4)
  fear_greed_cnn INTEGER,
  fear_greed_crypto INTEGER,
  vix DECIMAL(5,2),
  sentiment_aggregate DECIMAL(5,2),

  -- Outcome columns (11)
  spx_direction BOOLEAN,
  spx_volatile BOOLEAN,
  btc_direction BOOLEAN,
  btc_volatile BOOLEAN,
  vix_spike BOOLEAN,
  gold_direction BOOLEAN,
  major_quake BOOLEAN,
  quake_above_avg BOOLEAN,
  geomag_storm BOOLEAN,
  sentiment_drop BOOLEAN,
  fear_spike BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historical_date ON historical_features(date DESC);
```

## Update Frequency
- **Full recomputation:** Weekly (Sunday night UTC)
- **Incremental update:** Daily (add new day's data)
- **Live scoring:** Real-time using cached correlations

## Pattern Matching

Beyond single correlations, we identify dates with similar overall feature profiles:

```javascript
async function findPatternMatches(todayFeatures, minSimilarity = 0.8) {
  const historical = await db.getHistoricalFeatures();
  const matches = [];

  for (const record of historical) {
    const similarity = calculateSimilarity(todayFeatures, record);
    if (similarity >= minSimilarity) {
      matches.push({
        date: record.date,
        similarity,
        outcomes: {
          spx_direction: record.spx_direction,
          spx_volatile: record.spx_volatile,
          // ... all outcomes
        }
      });
    }
  }

  if (matches.length === 0) return null;

  // Calculate outcome rates for matching dates
  const outcomeRates = {};
  for (const outcome of OUTCOME_NAMES) {
    const positive = matches.filter(m => m.outcomes[outcome] === true).length;
    outcomeRates[outcome] = positive / matches.length;
  }

  return {
    matchCount: matches.length,
    avgSimilarity: matches.reduce((s, m) => s + m.similarity, 0) / matches.length,
    matchingDates: matches.slice(0, 5).map(m => m.date),
    outcomes: outcomeRates,
  };
}
```

### Similarity Calculation
```javascript
function calculateSimilarity(today, historical) {
  const features = getAllFeatureNames();
  let matches = 0;
  let total = 0;

  for (const feature of features) {
    if (today[feature] === null || historical[feature] === null) continue;

    total++;
    const def = getFeatureDefinition(feature);

    if (def.type === 'binary' || def.type === 'categorical') {
      // Exact match for categorical
      if (today[feature] === historical[feature]) matches++;
    } else if (def.type === 'continuous' && def.range) {
      // Within 10% of range for continuous
      const [min, max] = def.range;
      const threshold = (max - min) * 0.1;
      if (Math.abs(today[feature] - historical[feature]) <= threshold) {
        matches++;
      } else if (Math.abs(today[feature] - historical[feature]) <= threshold * 2) {
        matches += 0.5; // Partial credit
      }
    }
  }

  return total > 0 ? matches / total : 0;
}
```

## Minimum Requirements

- **Sample Size:** n >= 30 for any correlation to be reported
- **Significance:** p < 0.05 after Benjamini-Hochberg correction
- **Confidence Intervals:** Always reported using Wilson method
- **Pattern Matching:** >= 80% similarity threshold

## Implementation Files

- `backend/src/correlation/features.js` - Feature extraction and definitions
- `backend/src/correlation/outcomes.js` - Outcome extraction
- `backend/src/correlation/statistics.js` - Statistical functions
- `backend/src/correlation/compute.js` - Correlation computation
- `backend/src/correlation/patterns.js` - Pattern matching
- `backend/src/correlation/historical.js` - Historical data management
- `backend/src/correlation/index.js` - Module exports
