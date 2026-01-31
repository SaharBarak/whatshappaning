# Prediction Output System

## Overview
Transform correlation results into actionable predictions with full transparency.

## Output Structure

### Daily Predictions API Response
```json
{
  "date": "2025-01-31",
  "generatedAt": "2025-01-31T06:00:00Z",
  "dataAsOf": "2025-01-31T05:45:00Z",

  "predictions": [
    {
      "outcome": "Market Volatility",
      "outcomeId": "spx_volatile",
      "probability": 0.73,
      "confidenceInterval": [0.58, 0.84],
      "sampleSize": 47,
      "baseRate": 0.23,
      "lift": 3.17,
      "confidence": "high",
      "factors": [
        {
          "feature": "Mercury Retrograde",
          "value": true,
          "contribution": 0.18,
          "standalone": 0.42,
          "sampleSize": 156
        },
        {
          "feature": "Moon Phase",
          "value": "Full ±2 days",
          "contribution": 0.12,
          "standalone": 0.31,
          "sampleSize": 234
        },
        {
          "feature": "Kp Index",
          "value": ">4",
          "contribution": 0.08,
          "standalone": 0.28,
          "sampleSize": 189
        },
        {
          "feature": "VIX Level",
          "value": ">20",
          "contribution": 0.35,
          "standalone": 0.58,
          "sampleSize": 312
        }
      ],
      "historicalContext": "Last 5 times these conditions occurred: 4 volatile, 1 calm"
    }
  ],

  "patternAlerts": [
    {
      "alertType": "historical_match",
      "matchScore": 0.87,
      "matchingDates": ["2020-03-09", "2008-09-15", "1987-10-16"],
      "description": "Current conditions closely match pre-crash patterns",
      "commonOutcome": "High volatility within 5 trading days",
      "outcomeRate": 0.85,
      "sampleSize": 7
    }
  ],

  "actionSuggestions": [
    {
      "category": "Markets",
      "suggestion": "Elevated caution",
      "reasoning": "73% volatility probability + pattern match",
      "confidence": "medium"
    },
    {
      "category": "Timing",
      "suggestion": "Avoid major decisions",
      "reasoning": "Mercury retrograde + Void of Course Moon",
      "confidence": "low",
      "disclaimer": "Based on astrological correlation only"
    }
  ],

  "summary": {
    "overallTension": "high",
    "tensionScore": 7.2,
    "topRisks": ["Market volatility", "Geomagnetic disturbance"],
    "stableFactors": ["Low seismic activity", "Neutral sentiment baseline"]
  }
}
```

## Prediction Calculation

### Step 1: Get Today's Features
```javascript
async function getTodayFeatures() {
  return {
    mercury_retrograde: await isRetrograde('mercury'),
    moon_phase: await getMoonPhase(),
    moon_sign: await getMoonSign(),
    kp_index: await getKpIndex(),
    vix: await getVix(),
    // ... all features
  };
}
```

### Step 2: Find Matching Correlations
```javascript
async function findMatchingCorrelations(todayFeatures, outcome) {
  const correlations = await db.query(`
    SELECT * FROM correlation_results
    WHERE outcome = $1
      AND is_significant = true
    ORDER BY probability DESC
  `, [outcome]);

  return correlations.filter(corr => {
    // Check if today's features match this correlation's conditions
    return matchesFeatures(todayFeatures, corr.features);
  });
}
```

### Step 3: Combine Factors
```javascript
function combinePredictions(matchingCorrelations, baseRate) {
  if (matchingCorrelations.length === 0) {
    return { probability: baseRate, factors: [] };
  }

  // Weighted combination based on sample size and lift
  let combinedLogOdds = Math.log(baseRate / (1 - baseRate));

  const factors = matchingCorrelations.map(corr => {
    const lift = corr.probability / baseRate;
    const weight = Math.log(corr.sample_size) / 10; // Diminishing returns on sample size
    const logOddsContribution = Math.log(lift) * weight;

    combinedLogOdds += logOddsContribution;

    return {
      feature: corr.features,
      contribution: logOddsContribution,
      standalone: corr.probability,
      sampleSize: corr.sample_size
    };
  });

  // Convert back to probability
  const combinedProbability = 1 / (1 + Math.exp(-combinedLogOdds));

  // Cap at reasonable bounds
  const probability = Math.max(0.05, Math.min(0.95, combinedProbability));

  return { probability, factors };
}
```

### Step 4: Pattern Matching
```javascript
async function findPatternMatches(todayFeatures) {
  const historical = await db.query(`
    SELECT date, * FROM historical_features
    ORDER BY date DESC
  `);

  const matches = [];

  for (const day of historical) {
    const similarity = calculateSimilarity(todayFeatures, day);

    if (similarity > 0.8) {
      matches.push({
        date: day.date,
        similarity,
        nextDayOutcomes: await getNextDayOutcomes(day.date)
      });
    }
  }

  return groupAndAnalyzeMatches(matches);
}

function calculateSimilarity(a, b) {
  const keys = Object.keys(a);
  let matches = 0;

  for (const key of keys) {
    if (a[key] === b[key]) matches++;
    else if (typeof a[key] === 'number') {
      // Continuous variables: check if within 10%
      const diff = Math.abs(a[key] - b[key]) / Math.max(a[key], b[key]);
      if (diff < 0.1) matches += 0.5;
    }
  }

  return matches / keys.length;
}
```

## Confidence Levels

| Level | Criteria |
|-------|----------|
| Very High | n > 200, CI width < 0.15, p < 0.001 |
| High | n > 100, CI width < 0.20, p < 0.01 |
| Medium | n > 50, CI width < 0.30, p < 0.05 |
| Low | n > 30, CI width < 0.40, p < 0.10 |
| Insufficient | n < 30 or p > 0.10 |

## Display Format

### Main Predictions Panel
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 TODAY'S PREDICTIONS                      Jan 31, 2025   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ MARKET VOLATILITY                                           │
│ ████████████████████░░░░░░░░  73% [58-84%] n=47            │
│                                                             │
│ Contributing Factors:                                       │
│ ├─ VIX > 20              +35%  (n=312) ████████████        │
│ ├─ Mercury Retrograde    +18%  (n=156) ██████              │
│ ├─ Full Moon ±2d         +12%  (n=234) ████                │
│ └─ Kp Index > 4          +8%   (n=189) ███                 │
│                                                             │
│ Base rate: 23%  |  Lift: 3.2x  |  Confidence: HIGH         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ MAJOR EARTHQUAKE (M6+)                                      │
│ █████░░░░░░░░░░░░░░░░░░░░░░░  18% [12-26%] n=89            │
│                                                             │
│ Contributing Factors:                                       │
│ ├─ New Moon ±3d          +5%   (n=201) ██                  │
│ └─ High solar activity   +3%   (n=145) █                   │
│                                                             │
│ Base rate: 12%  |  Lift: 1.5x  |  Confidence: MEDIUM       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ SENTIMENT DROP                                              │
│ ██████████████░░░░░░░░░░░░░░  52% [41-63%] n=67            │
│                                                             │
│ Base rate: 35%  |  Lift: 1.5x  |  Confidence: MEDIUM       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pattern Alert Panel
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ PATTERN ALERT                              Match: 87%   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Current conditions closely match:                           │
│                                                             │
│ • March 9, 2020      (COVID crash)                         │
│ • September 15, 2008 (Lehman collapse)                     │
│ • October 16, 1987   (Black Monday week)                   │
│                                                             │
│ Historical outcome:                                         │
│ 6 of 7 instances (86%) saw high volatility within 5 days   │
│                                                             │
│ Matching features:                                          │
│ Mercury Rx ✓ | VIX elevated ✓ | Fear sentiment ✓           │
│ Full Moon ✓  | Multiple retrogrades ✓                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Action Suggestions Panel
```
┌─────────────────────────────────────────────────────────────┐
│ 💡 SUGGESTIONS                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ FAVORABLE FOR:                                              │
│ • Introspection, planning (Mercury Rx)                     │
│ • Completing existing projects                              │
│ • Review and revision                                       │
│                                                             │
│ CAUTION ADVISED:                                            │
│ • Major financial decisions (73% volatility)               │
│ • New contracts/agreements (Mercury Rx)                    │
│ • Travel during void-of-course moon (14:23-18:45)         │
│                                                             │
│ ℹ️ Suggestions based on statistical correlations.          │
│    Not financial advice. Historical patterns ≠ guarantees. │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### GET /api/predictions
Returns today's full prediction payload.

### GET /api/predictions/:outcome
Returns prediction for specific outcome.

### GET /api/correlations
Returns all significant correlations (for research).

Query params:
- `feature` - Filter by feature
- `outcome` - Filter by outcome
- `minSampleSize` - Minimum n
- `minLift` - Minimum lift value

### GET /api/patterns
Returns current pattern matches.

### GET /api/backtest
Run custom backtest query.
```json
{
  "features": {
    "mercury_retrograde": true,
    "moon_phase": [3, 4, 5]
  },
  "outcome": "spx_volatile",
  "startDate": "2000-01-01",
  "endDate": "2025-01-31"
}
```

## Disclaimers (Required)

Every prediction output must include:

```
DISCLAIMER: These predictions are based on historical statistical
correlations and are provided for informational/entertainment purposes
only. Past patterns do not guarantee future outcomes. This is not
financial, medical, or professional advice. Always consult qualified
professionals for important decisions.
```

## Update Frequency
- Predictions: Regenerated every 3 hours
- Pattern matching: Real-time on request
- Correlation database: Weekly full refresh
