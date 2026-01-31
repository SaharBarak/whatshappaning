# Correlation Engine

## Overview
The core analytical engine that finds historical correlations between cosmic/esoteric inputs and measurable real-world outcomes.

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

## Input Features (Independent Variables)

### Cosmic/Esoteric
| Feature | Type | Encoding |
|---------|------|----------|
| moon_phase | categorical | 0-7 (8 phases) |
| moon_sign | categorical | 0-11 (zodiac) |
| moon_illumination | continuous | 0-100 |
| moon_void_of_course | binary | 0/1 |
| tzolkin_tone | categorical | 1-13 |
| tzolkin_sign | categorical | 0-19 |
| dreamspell_kin | categorical | 1-260 |
| dreamspell_wavespell | categorical | 1-20 |
| mercury_retrograde | binary | 0/1 |
| venus_retrograde | binary | 0/1 |
| mars_retrograde | binary | 0/1 |
| planets_retrograde_count | discrete | 0-7 |
| sun_sign | categorical | 0-11 |
| major_aspects_count | discrete | 0-20 |
| eclipse_proximity | discrete | days to nearest eclipse |
| hebrew_day | discrete | 1-30 |
| hebrew_month | categorical | 1-13 |
| parasha_index | categorical | 1-54 |
| numerology_day | categorical | 1-9, 11, 22 |
| tarot_card | categorical | 0-77 |
| iching_hexagram | categorical | 1-64 |
| planetary_hour | categorical | 0-6 |
| day_of_week | categorical | 0-6 |

### Geophysical
| Feature | Type | Encoding |
|---------|------|----------|
| kp_index | continuous | 0-9 |
| ap_index | continuous | 0-400 |
| solar_flare_class | ordinal | 0-10 (A=0 to X10=10) |
| sunspot_number | continuous | 0-300+ |
| solar_wind_speed | continuous | 300-800 km/s |
| schumann_amplitude | continuous | 0-100 |
| quake_count_24h | continuous | 0-500 |
| quake_max_magnitude | continuous | 0-9 |
| quake_energy_log | continuous | log10(joules) |

### Sentiment
| Feature | Type | Encoding |
|---------|------|----------|
| fear_greed_cnn | continuous | 0-100 |
| fear_greed_crypto | continuous | 0-100 |
| vix | continuous | 10-80 |
| sentiment_aggregate | continuous | 0-100 |

## Outcome Targets (Dependent Variables)

### Market Outcomes
| Target | Type | Definition |
|--------|------|------------|
| spx_direction | binary | 1 if SPX up, 0 if down |
| spx_volatile | binary | 1 if |return| > 1% |
| spx_return | continuous | Daily % return |
| btc_direction | binary | 1 if BTC up, 0 if down |
| btc_volatile | binary | 1 if |return| > 3% |
| vix_spike | binary | 1 if VIX up > 10% |
| gold_direction | binary | 1 if gold up |

### Geophysical Outcomes
| Target | Type | Definition |
|--------|------|------------|
| major_quake | binary | 1 if M6+ within 24h |
| quake_above_avg | binary | 1 if count > 30d avg |
| geomag_storm | binary | 1 if Kp >= 5 |

### Sentiment Outcomes
| Target | Type | Definition |
|--------|------|------------|
| sentiment_drop | binary | 1 if aggregate drops > 10 |
| fear_spike | binary | 1 if Fear/Greed < 25 |

## Statistical Methods

### 1. Conditional Probability
```javascript
function conditionalProbability(feature, featureValue, outcome, outcomeValue, data) {
  // P(outcome | feature)
  const filtered = data.filter(d => d[feature] === featureValue);
  const matches = filtered.filter(d => d[outcome] === outcomeValue);

  const probability = matches.length / filtered.length;
  const sampleSize = filtered.length;

  // Wilson score interval for confidence
  const ci = wilsonConfidenceInterval(matches.length, filtered.length, 0.95);

  return {
    probability,
    sampleSize,
    confidenceLow: ci.low,
    confidenceHigh: ci.high
  };
}
```

### 2. Chi-Square Test
Test if correlation is statistically significant:
```javascript
function chiSquareTest(feature, outcome, data) {
  // Build contingency table
  const table = buildContingencyTable(data, feature, outcome);

  // Calculate chi-square statistic
  const chiSq = calculateChiSquare(table);
  const df = (table.rows - 1) * (table.cols - 1);
  const pValue = chiSquarePValue(chiSq, df);

  return {
    chiSquare: chiSq,
    degreesOfFreedom: df,
    pValue,
    significant: pValue < 0.05
  };
}
```

### 3. Wilson Confidence Interval
More accurate than normal approximation for proportions:
```javascript
function wilsonConfidenceInterval(successes, total, confidence = 0.95) {
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

### 4. Multi-Feature Combinations
Test combinations of features:
```javascript
function testFeatureCombination(features, outcome, data) {
  // Filter data where ALL features match
  const filtered = data.filter(d =>
    features.every(f => d[f.name] === f.value)
  );

  if (filtered.length < 30) {
    return { insufficient: true, sampleSize: filtered.length };
  }

  return conditionalProbability(
    null, null, outcome, 1, filtered
  );
}
```

## Pre-Computation Pipeline

### Daily Batch Job
```javascript
async function computeCorrelations() {
  const data = await loadHistoricalData();

  const results = [];

  // Single feature correlations
  for (const feature of FEATURES) {
    for (const outcome of OUTCOMES) {
      for (const value of getUniqueValues(data, feature)) {
        const result = conditionalProbability(
          feature, value, outcome, 1, data
        );

        if (result.sampleSize >= 30) {
          results.push({
            type: 'single',
            feature,
            featureValue: value,
            outcome,
            ...result
          });
        }
      }
    }
  }

  // Key combinations (pre-defined)
  for (const combo of KEY_COMBINATIONS) {
    for (const outcome of OUTCOMES) {
      const result = testFeatureCombination(combo, outcome, data);
      if (!result.insufficient) {
        results.push({
          type: 'combination',
          features: combo,
          outcome,
          ...result
        });
      }
    }
  }

  await saveCorrelationResults(results);
}
```

### Key Combinations to Test
```javascript
const KEY_COMBINATIONS = [
  // Mercury retrograde + Full Moon
  [{ name: 'mercury_retrograde', value: 1 }, { name: 'moon_phase', value: 4 }],

  // High Kp + New Moon
  [{ name: 'kp_index', value: '>=5' }, { name: 'moon_phase', value: 0 }],

  // Multiple retrogrades + VIX elevated
  [{ name: 'planets_retrograde_count', value: '>=3' }, { name: 'vix', value: '>=20' }],

  // Eclipse proximity + Fear
  [{ name: 'eclipse_proximity', value: '<=7' }, { name: 'fear_greed_cnn', value: '<=30' }],

  // Add more meaningful combinations...
];
```

## Database Schema

### Table: correlation_results
```sql
CREATE TABLE correlation_results (
  id SERIAL PRIMARY KEY,
  correlation_type VARCHAR(20), -- 'single' or 'combination'
  features JSONB NOT NULL,
  outcome VARCHAR(50) NOT NULL,
  probability DECIMAL(5,4),
  sample_size INTEGER,
  confidence_low DECIMAL(5,4),
  confidence_high DECIMAL(5,4),
  chi_square DECIMAL(10,4),
  p_value DECIMAL(10,8),
  is_significant BOOLEAN,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_corr_outcome ON correlation_results (outcome);
CREATE INDEX idx_corr_significant ON correlation_results (is_significant, outcome);
```

### Table: historical_features
```sql
CREATE TABLE historical_features (
  date DATE PRIMARY KEY,
  -- All features as columns
  moon_phase INTEGER,
  moon_sign INTEGER,
  mercury_retrograde BOOLEAN,
  kp_index DECIMAL(3,1),
  -- ... all features
  -- All outcomes as columns
  spx_direction BOOLEAN,
  spx_volatile BOOLEAN,
  -- ... all outcomes
);
```

## Update Frequency
- Full recomputation: Weekly (Sunday night)
- Incremental update: Daily (add new day's data)
- Live scoring: Real-time using cached correlations
