# Backend API Specification

## Overview
Node.js Express server that aggregates all data sources on a schedule and serves them via REST API.

## Endpoints

### GET /api/current
Returns current snapshot of all module data and indices.

**Response:**
```json
{
  "timestamp": "2025-01-31T12:00:00Z",
  "dataAge": "2h 15m",
  "modules": {
    "moon": {
      "data": { /* module-specific data */ },
      "collectedAt": "2025-01-31T10:00:00Z"
    },
    "tzolkin": { "data": { }, "collectedAt": "..." },
    "dreamspell": { "data": { }, "collectedAt": "..." },
    "parasha": { "data": { }, "collectedAt": "..." },
    "gematria": { "data": { }, "collectedAt": "..." },
    "astrology": { "data": { }, "collectedAt": "..." },
    "solar": { "data": { }, "collectedAt": "..." },
    "schumann": { "data": { }, "collectedAt": "..." },
    "tarot": { "data": { }, "collectedAt": "..." },
    "news": { "data": { }, "collectedAt": "..." },
    "numerology": { "data": { }, "collectedAt": "..." },
    "iching": { "data": { }, "collectedAt": "..." },
    "cosmic": { "data": { }, "collectedAt": "..." },
    "markets": { "data": { }, "collectedAt": "..." },
    "geophysical": { "data": { }, "collectedAt": "..." },
    "sentiment": { "data": { }, "collectedAt": "..." }
  },
  "dailyData": {
    "tzolkin": { },
    "dreamspell": { },
    "tarot": { },
    "numerology": { },
    "iching": { },
    "gematria": { },
    "parasha": { }
  },
  "indices": {
    "solarGeo": {
      "value": 3.5,
      "level": "Low"
    },
    "astroEvents": {
      "count": 4,
      "level": "Active"
    },
    "calendarSync": {
      "score": 2,
      "level": "Moderate"
    }
  }
}
```

**Index Levels:**
- Solar-Geo: Calm (0-2), Low (2-4), Moderate (4-6), Elevated (6-8), High (8-10)
- Astro Events: Quiet (0), Low (1-2), Active (3-4), Busy (5-6), Intense (7+)
- Calendar Sync: None (0), Low (1), Moderate (2-3), High (4-5), Rare (6+)

### GET /api/history/:module
Returns historical data for a specific module.

**Path Parameters:**
- `module` - Module name (see valid modules below)

**Query Parameters:**
- `days` - Number of days (default: 7, max: 90)

**Valid Modules:**
- moon, tzolkin, dreamspell, parasha, gematria
- astrology, solar, schumann, tarot, news
- numerology, iching, cosmic, markets, geophysical, sentiment

**Response:**
```json
{
  "module": "moon",
  "days": 7,
  "count": 56,
  "data": [
    {
      "data": { /* module-specific data */ },
      "collectedAt": "2025-01-31T12:00:00Z"
    }
  ]
}
```

### GET /api/predictions
Returns today's full prediction payload with all outcomes, pattern alerts, and action suggestions.

**Response:**
```json
{
  "date": "2025-01-31",
  "generatedAt": "2025-01-31T12:00:00Z",
  "predictions": [
    {
      "outcome": "S&P 500 Direction",
      "outcomeId": "spx_direction",
      "probability": 0.55,
      "confidenceInterval": [0.48, 0.62],
      "sampleSize": 150,
      "baseRate": 0.52,
      "confidence": "High",
      "factors": [
        {
          "feature": "{\"moon_phase\":\"Full\"}",
          "contribution": 0.08,
          "standalone": 0.60,
          "sampleSize": 120
        }
      ]
    }
  ],
  "patternAlerts": [
    {
      "matchCount": 5,
      "avgSimilarity": 0.85,
      "matchingDates": ["2024-03-15", "2023-11-22"],
      "outcomes": { "spx_direction": 0.80 }
    }
  ],
  "actionSuggestions": [
    {
      "category": "Markets",
      "suggestion": "Elevated caution",
      "reasoning": "65% volatility probability",
      "confidence": "Medium"
    }
  ],
  "summary": {
    "overallTension": "medium",
    "tensionScore": 4.5,
    "topRisks": ["Market Volatility", "VIX Spike"],
    "stableFactors": ["Low Major Earthquake probability"]
  },
  "disclaimer": "These predictions are based on historical statistical correlations..."
}
```

**Valid Outcomes:**
- spx_direction, spx_volatile, btc_direction, btc_volatile
- vix_spike, gold_direction, major_quake, quake_above_avg
- geomag_storm, sentiment_drop, fear_spike

**Confidence Levels:**
- Very High: n > 200, CI width < 0.15, p < 0.001
- High: n > 100, CI width < 0.20, p < 0.01
- Medium: n > 50, CI width < 0.30, p < 0.05
- Low: n > 30, CI width < 0.40, p < 0.10
- Insufficient: n < 30 or p > 0.10

### GET /api/predictions/:outcome
Returns prediction for a specific outcome with detailed factors.

**Path Parameters:**
- `outcome` - Outcome ID (see valid outcomes above)

**Response:**
```json
{
  "outcome": "S&P 500 Direction",
  "outcomeId": "spx_direction",
  "factors": [
    {
      "features": { "moon_phase": "Full" },
      "outcome": "spx_direction",
      "probability": 0.58,
      "sample_size": 120,
      "confidence_low": 0.49,
      "confidence_high": 0.67,
      "lift": 1.12,
      "is_significant": true
    }
  ]
}
```

### GET /api/correlations
Returns all significant correlations for research purposes.

**Query Parameters:**
- `feature` - Filter by feature name (optional)
- `outcome` - Filter by outcome (optional)
- `minSampleSize` - Minimum sample size (default: 30)
- `minLift` - Minimum lift value (default: 1.0)

**Response:**
```json
{
  "count": 25,
  "correlations": [
    {
      "type": "single",
      "features": { "mercury_retrograde": true },
      "outcome": "spx_volatile",
      "probability": 0.62,
      "sample_size": 85,
      "base_rate": 0.45,
      "confidence_low": 0.51,
      "confidence_high": 0.72,
      "chi_squared": 8.5,
      "p_value": 0.003,
      "lift": 1.38,
      "is_significant": true
    }
  ]
}
```

### GET /api/patterns
Returns current pattern matches based on today's features.

**Response (when matches found):**
```json
{
  "patterns": [
    {
      "matchCount": 5,
      "avgSimilarity": 0.85,
      "matchingDates": ["2024-03-15", "2023-11-22"],
      "outcomes": {
        "spx_direction": 0.80,
        "spx_volatile": 0.60
      }
    }
  ],
  "todayFeatures": {
    "moon_phase": "Full",
    "moon_sign": "Leo",
    "mercury_retrograde": false
  },
  "matchCount": 5,
  "avgSimilarity": 0.85
}
```

**Response (when no matches):**
```json
{
  "patterns": [],
  "todayFeatures": { },
  "note": "No patterns with >80% similarity found. This requires at least 30 historical data points."
}
```

### POST /api/backtest
Run a custom backtest query on historical data.

**Request Body:**
```json
{
  "features": { "moon_phase": "Full", "mercury_retrograde": true },
  "outcome": "spx_volatile",
  "startDate": "2020-01-01",
  "endDate": "2024-12-31"
}
```

**Response:**
```json
{
  "features": { "moon_phase": "Full", "mercury_retrograde": true },
  "outcome": "spx_volatile",
  "dateRange": { "start": "2020-01-01", "end": "2024-12-31" },
  "results": {
    "totalSamples": 150,
    "positiveOutcomes": 85,
    "probability": 0.567
  }
}
```

### GET /health
Basic health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T12:00:00Z",
  "database": "connected"
}
```

**Status Values:**
- `healthy` - All systems operational
- `degraded` - Database disconnected

### GET /health/detailed
Detailed health check with module status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T12:00:00Z",
  "uptime": "5d 12h 30m",
  "uptimeSeconds": 477000,
  "database": {
    "connected": true
  },
  "cache": {
    "entries": 15,
    "hitRate": 0.85
  },
  "modules": {
    "moon": {
      "status": "success",
      "lastCheck": "2025-01-31T12:00:00Z",
      "responseTime": 150,
      "error": null
    }
  },
  "summary": {
    "totalModules": 16,
    "healthy": 15,
    "errors": 1
  }
}
```

**Overall Status Values:**
- `healthy` - All modules operational
- `warning` - 1-3 module errors
- `degraded` - More than 3 module errors
- `critical` - Database disconnected

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error type description",
  "message": "Detailed error message",
  "validModules": ["moon", "tzolkin", ...],
  "validOutcomes": ["spx_direction", ...]
}
```

**HTTP Status Codes:**
- 200 - Success
- 400 - Bad Request (invalid module, outcome, or parameters)
- 500 - Internal Server Error
- 503 - Service Unavailable (database disconnected)

## Data Collection Schedule

```
┌─────────────────────────────────────────┐
│            CRON SCHEDULE                │
├─────────────────────────────────────────┤
│ Every 3 hours:                          │
│   - Astrology positions                 │
│   - Solar activity                      │
│   - Schumann resonance                  │
│   - News scrape + Gemini analysis       │
│   - Moon phase update                   │
│   - Markets data                        │
│   - Geophysical data                    │
│   - Cosmic data                         │
│   - Sentiment aggregation               │
├─────────────────────────────────────────┤
│ Every 30 minutes:                       │
│   - Numerology (planetary hours)        │
├─────────────────────────────────────────┤
│ Daily at 00:00 UTC:                     │
│   - Tzolkin day calculation             │
│   - Dreamspell kin calculation          │
│   - Gematria calculation                │
│   - Tarot card selection (date seed)    │
│   - I Ching hexagram selection          │
├─────────────────────────────────────────┤
│ Weekly (Friday sunset):                 │
│   - Parasha update                      │
└─────────────────────────────────────────┘
```

## Database Schema

> **Note:** See `specs/14-DATABASE.md` for complete schema. Key tables below.

### Table: snapshots
```sql
CREATE TABLE snapshots (
  id SERIAL PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_snapshots_module_time ON snapshots(module, collected_at DESC);
```

### Table: daily_data
```sql
CREATE TABLE daily_data (
  date DATE PRIMARY KEY,
  tzolkin JSONB,
  dreamspell JSONB,
  tarot JSONB,
  numerology JSONB,
  iching JSONB,
  gematria JSONB,
  parasha JSONB
);
```

### Table: correlation_results
```sql
CREATE TABLE correlation_results (
  id SERIAL PRIMARY KEY,
  correlation_type VARCHAR(20) NOT NULL,
  features JSONB NOT NULL,
  outcome VARCHAR(50) NOT NULL,
  probability DECIMAL(5,4),
  sample_size INTEGER,
  base_rate DECIMAL(5,4),
  confidence_low DECIMAL(5,4),
  confidence_high DECIMAL(5,4),
  chi_squared DECIMAL(10,4),
  p_value DECIMAL(10,6),
  lift DECIMAL(6,4),
  is_significant BOOLEAN DEFAULT false,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: historical_features
```sql
CREATE TABLE historical_features (
  date DATE PRIMARY KEY,
  -- 36 feature columns (see spec 23)
  -- 12 outcome columns (boolean)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Environment Variables

```
PORT=3000
DATABASE_URL=postgres://...
GEMINI_API_KEY=...
NODE_ENV=production
```

## Error Handling

- If external API fails, serve cached data with `stale: true` flag
- Log all errors to stdout for monitoring
- Never expose internal stack traces to client
- Include helpful context in error responses (e.g., valid modules list)

## Rate Limiting

- 100 requests per minute per IP
- Cache responses at API level:
  - `/api/current`: 5 minutes
  - `/api/predictions`: 3 hours
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## CORS

Allow all origins (public API):
```
Access-Control-Allow-Origin: *
```

## Caching Strategy

| Endpoint | Cache Duration | Cache Key |
|----------|---------------|-----------|
| /api/current | 5 minutes | `api:current` |
| /api/predictions | 3 hours | `api:predictions` |
| /api/history/:module | None (real-time) | - |
| /api/correlations | None (research) | - |
| /api/patterns | None (real-time) | - |
