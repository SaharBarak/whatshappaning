# Backend API Specification

## Overview
Node.js Express server that aggregates all data sources on a schedule and serves them via REST API.

## Endpoints

### GET /api/current
Returns current snapshot of all data.

```json
{
  "timestamp": "2025-01-31T12:00:00Z",
  "dataAge": "2h 15m",
  "modules": {
    "moon": { ... },
    "tzolkin": { ... },
    "dreamspell": { ... },
    "parasha": { ... },
    "gematria": { ... },
    "astrology": { ... },
    "solar": { ... },
    "schumann": { ... },
    "tarot": { ... },
    "news": { ... }
  },
  "indices": {
    "solarGeo": { ... },
    "astronomical": { ... },
    "calendarSync": { ... }
  }
}
```

### GET /api/history/:module
Returns historical data for a specific module.

Query params:
- `days` - number of days (default 7, max 90)

### GET /api/health
Health check endpoint.

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
├─────────────────────────────────────────┤
│ Daily at 00:00 UTC:                     │
│   - Tzolkin day calculation             │
│   - Dreamspell kin calculation          │
│   - Gematria calculation                │
│   - Tarot card selection (date seed)    │
├─────────────────────────────────────────┤
│ Weekly (Friday sunset):                 │
│   - Parasha update                      │
└─────────────────────────────────────────┘
```

## Database Schema

### Table: data_snapshots
```sql
CREATE TABLE data_snapshots (
  id SERIAL PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_module_time (module, collected_at)
);
```

### Table: daily_cards
```sql
CREATE TABLE daily_cards (
  date DATE PRIMARY KEY,
  tarot_card JSONB NOT NULL,
  tzolkin JSONB NOT NULL,
  dreamspell JSONB NOT NULL,
  gematria JSONB NOT NULL
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
- Never expose internal errors to client

## Rate Limiting

- 100 requests per minute per IP
- Cache responses for 5 minutes at edge

## CORS

Allow all origins (public API).
