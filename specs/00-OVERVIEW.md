# What's Happening - Data-Driven Prediction Dashboard

## Vision
A grounded, statistically-backed dashboard that correlates cosmic/esoteric data with real-world measurable outcomes. Shows raw data, historical correlations, and probability predictions with full transparency.

## Core Principle
**Show the math.** Every prediction displays sample size, confidence intervals, and contributing factors. Users see exactly why a prediction is made.

## Audience
Global esoteric/research community. English UI.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                         │
│                  Static HTML/CSS/JS                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Railway)                     │
│                    Node.js + Express                         │
│              ┌─────────────────────────────┐                │
│              │   CORRELATION ENGINE        │                │
│              │   - Historical backtesting  │                │
│              │   - Pattern matching        │                │
│              │   - Probability calculation │                │
│              └─────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│              - Historical features (all dates)              │
│              - Correlation results (pre-computed)           │
│              - Daily snapshots                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Modules (16 Total)

### Cosmic/Esoteric (13 modules)
| # | Module | Type |
|---|--------|------|
| 1 | Moon Phase | Calculated |
| 2 | Tzolkin | Calculated |
| 3 | Dreamspell | Calculated |
| 4 | Parasha | API (Hebcal) |
| 5 | Gematria | Calculated |
| 6 | Astrology | Calculated (Swiss Ephemeris) |
| 7 | Solar Activity | API (NOAA) |
| 8 | Schumann | Scraped |
| 9 | Tarot | Date-seeded |
| 10 | News Themes | Scrape + Gemini |
| 11 | Numerology + Planetary Hour | Calculated |
| 12 | I Ching | Date-seeded |
| 13 | Cosmic Rays + Meteors | API + Calendar |

### Grounded/Measurable (3 modules)
| # | Module | Sources |
|---|--------|---------|
| 14 | Markets | Yahoo Finance, CoinGecko, CNN |
| 15 | Geophysical | USGS, NOAA, Open-Meteo |
| 16 | Sentiment | Fear/Greed indices, Google Trends |

## Prediction Outputs

### Outcome Targets
- Market volatility (SPX, BTC)
- Market direction
- Major earthquake (M6+)
- Geomagnetic storm
- Sentiment shifts

### Output Format
```
MARKET VOLATILITY: 73% [58-84%] (n=47)
├─ VIX > 20:           +35% contribution
├─ Mercury Retrograde: +18% contribution
├─ Full Moon ±2d:      +12% contribution
└─ Kp Index > 4:       +8% contribution
Base rate: 23% | Lift: 3.2x | Confidence: HIGH
```

### Pattern Alerts
When current conditions match historical patterns (>80% similarity), alert with:
- Matching historical dates
- What happened next
- Confidence level

### Action Suggestions
Statistically-derived suggestions:
- Favorable conditions for X
- Caution advised for Y
- Always with disclaimers

## Indices (3)

1. **Solar-Geo Index** - Combined space weather intensity
2. **Astronomical Events** - Count of active retrogrades, eclipses, aspects
3. **Calendar Sync** - Convergences between calendar systems

## Historical Data

| Data Type | Historical Depth |
|-----------|-----------------|
| S&P 500 | 1950+ |
| Bitcoin | 2014+ |
| Earthquakes | 2000+ |
| Solar/Kp | 1930+ |
| Fear/Greed | 2018+ |
| Astrology | Calculated for any date |

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS
- **Backend**: Node.js, Express, node-cron
- **Database**: PostgreSQL (historical data + correlations)
- **AI**: Gemini (news analysis only)
- **Calculations**: Swiss Ephemeris, custom algorithms
- **Hosting**: Vercel (frontend) + Railway (backend + DB)

## Statistical Methods

- Conditional probability with Wilson confidence intervals
- Chi-square tests for significance
- Sample size requirements (n ≥ 30)
- Pattern matching via feature similarity scoring

## Computation Strategy

- **Weekly**: Full correlation recomputation
- **Daily**: New data ingestion, incremental updates
- **Hourly**: Live predictions using cached correlations
- **Real-time**: Pattern matching on request

## Design Principles

- Dark theme, data-dense
- Every number shows its confidence
- Expandable detail on every prediction
- Full factor breakdown visible
- Clear disclaimers on all predictions
