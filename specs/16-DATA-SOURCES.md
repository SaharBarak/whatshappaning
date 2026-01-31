# Data Sources Reference

## Summary

| Category | Sources | Auth |
|----------|---------|------|
| Cosmic/Esoteric | Hebcal, calculations | Free |
| Solar/Space | NOAA SWPC | Free |
| Markets | Yahoo Finance, CoinGecko, CNN | Free |
| Geophysical | USGS, Open-Meteo, NOAA | Free |
| Sentiment | alternative.me, CNN, Google Trends | Free |
| AI | Gemini | API key (free tier) |

## Free APIs (No Auth Required)

### 1. Hebcal - Hebrew Calendar
**Base URL**: `https://www.hebcal.com/`

| Endpoint | Purpose |
|----------|---------|
| `/converter?cfg=json&date=YYYY-MM-DD&g2h=1` | Gregorian to Hebrew date |
| `/shabbat?cfg=json&geonameid=293397` | Weekly parasha + Shabbat times |

**Example**:
```
https://www.hebcal.com/converter?cfg=json&date=2025-01-31&g2h=1
```

**Response**:
```json
{
  "gy": 2025, "gm": 1, "gd": 31,
  "hy": 5785, "hm": "Shevat", "hd": 2,
  "hebrew": "ב׳ שְׁבָט תשפ״ה"
}
```

---

### 2. NOAA Space Weather - Solar Activity
**Base URL**: `https://services.swpc.noaa.gov/`

| Endpoint | Purpose |
|----------|---------|
| `/products/noaa-planetary-k-index.json` | Kp index |
| `/json/goes/primary/xrays-7-day.json` | Solar flares |
| `/json/solar-cycle/sunspots.json` | Sunspot numbers |
| `/products/noaa-scales.json` | Storm levels |
| `/products/solar-wind/plasma-7-day.json` | Solar wind |

**Example** (Kp Index):
```
https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json
```

---

### 3. Farmsense - Moon Phase (Basic)
**Base URL**: `https://api.farmsense.net/v1/moonphases/`

| Endpoint | Purpose |
|----------|---------|
| `?d=UNIX_TIMESTAMP` | Moon phase for date |

**Example**:
```
https://api.farmsense.net/v1/moonphases/?d=1706745600
```

---

### 4. RSS Feeds - News
No auth required, XML parsing.

| Source | Feed URL |
|--------|----------|
| BBC World | `http://feeds.bbci.co.uk/news/world/rss.xml` |
| AP News | `https://rsshub.app/apnews/topics/apf-topnews` |
| Reuters | `https://www.reutersagency.com/feed/` |

---

## APIs Requiring Free Registration

### 5. Google Gemini AI
**Console**: https://aistudio.google.com/

**Free Tier Limits**:
- 15 RPM (requests per minute)
- 1M TPM (tokens per minute)
- 1,500 RPD (requests per day)

**Model**: `gemini-1.5-flash` (fastest, sufficient for theme extraction)

**Setup**:
1. Go to AI Studio
2. Get API key
3. Set `GEMINI_API_KEY` env var

---

### 6. Astronomy API (Optional)
**URL**: https://astronomyapi.com/

**Free Tier**: 100 requests/month (limited, use sparingly)

Better alternative: Calculate locally with Swiss Ephemeris.

---

## Local Calculations (No API)

### 7. Swiss Ephemeris - Astrology
**NPM Package**: `swisseph`

```bash
npm install swisseph
```

Calculates:
- Planetary positions
- Aspects
- House cusps
- Moon phases (accurate)
- Void of course

**Ephemeris files**: Download from astro.com or use built-in approximations.

---

### 8. Tzolkin/Dreamspell - Mayan Calendar
**No external dependency** - pure calculation.

```javascript
// Tzolkin: GMT correlation 584283
function getTzolkinDay(date) {
  const julian = getJulianDay(date);
  const days = julian - 584283;
  return {
    tone: ((days % 13) + 13) % 13 + 1,
    sign: ((days % 20) + 20) % 20
  };
}

// Dreamspell: Starts July 26, 1987
function getDreamspellKin(date) {
  const epoch = new Date('1987-07-26');
  const days = Math.floor((date - epoch) / 86400000);
  // Handle leap day (Feb 29) - skip it
  return ((days % 260) + 260) % 260 + 1;
}
```

---

### 9. Gematria - Hebrew Numerology
**No external dependency** - pure calculation.

Letter value mapping stored locally.

---

### 10. Tarot - Daily Card
**No external dependency** - date-seeded RNG.

Card data stored in `data/tarot.json`.

---

## Web Scraping (Fallback)

### 11. Schumann Resonance
**Source**: http://sosrff.tsu.ru/?page_id=7

Strategy:
1. Attempt to fetch spectrogram image
2. Cache locally
3. Fallback to "estimated from geomagnetic"

**Note**: Russian server, sometimes unreliable.

---

---

## Markets APIs

### Yahoo Finance (yfinance)
**NPM Package**: `yahoo-finance2`

```javascript
const yahooFinance = require('yahoo-finance2').default;
await yahooFinance.quote('^GSPC'); // S&P 500
await yahooFinance.historical('^GSPC', { period1: '2020-01-01' });
```

Symbols: `^GSPC` (S&P), `^VIX` (VIX), `GC=F` (Gold), `DX-Y.NYB` (DXY)

### CoinGecko (Free, no auth)
```
https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true
```

Rate limit: 10-30 calls/min (free)

### Crypto Fear & Greed
```
https://api.alternative.me/fng/?limit=30
```

Returns last 30 days of fear/greed index.

### CNN Fear & Greed (Unofficial)
```
https://production.dataviz.cnn.io/index/fearandgreed/graphdata
```

---

## Geophysical APIs

### USGS Earthquakes (Free, no auth)
```
https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-01-01&minmagnitude=2.5
```

Parameters: `starttime`, `endtime`, `minmagnitude`, `limit`

### Open-Meteo Weather (Free, no auth)
```
https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=surface_pressure,uv_index
```

### NOAA Tides
```
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=9414290&product=predictions&datum=MLLW&format=json
```

### World Air Quality Index
```
https://api.waqi.info/feed/here/?token=demo
```

Get free token at: https://aqicn.org/data-platform/token/

---

## Sentiment APIs

### Google Trends (Unofficial)
**NPM Package**: `google-trends-api`

```javascript
const googleTrends = require('google-trends-api');
await googleTrends.interestOverTime({
  keyword: 'recession',
  startTime: new Date('2025-01-01')
});
```

Rate limited, use sparingly.

---

## API Reliability Matrix

| Module | Primary Source | Fallback | Reliability |
|--------|---------------|----------|-------------|
| Moon | Swiss Ephemeris | Farmsense API | High |
| Tzolkin | Local calc | - | 100% |
| Dreamspell | Local calc | - | 100% |
| Parasha | Hebcal | Local calc | High |
| Gematria | Local calc | - | 100% |
| Astrology | Swiss Ephemeris | Astronomy API | High |
| Solar | NOAA | Cached data | High |
| Schumann | Tomsk scrape | Estimate from KP | Low |
| Tarot | Local calc | - | 100% |
| News | RSS + Gemini | Cached themes | Medium |
| Numerology | Local calc | - | 100% |
| I Ching | Local calc | - | 100% |
| Cosmic/Meteors | NOAA + Calendar | Cached | High |
| Markets | Yahoo Finance | CoinGecko | High |
| Geophysical | USGS + NOAA | Cached | High |
| Sentiment | Fear/Greed APIs | Cached | Medium |

---

## Rate Limiting Strategy

| API | Limit | Our Usage | Buffer |
|-----|-------|-----------|--------|
| Hebcal | Unlimited | 8/day | OK |
| NOAA | Unlimited | 64/day | OK |
| Gemini | 1500/day | 8/day | 99% margin |
| Farmsense | Unknown | 8/day | Should be OK |

---

## Error Handling Priority

1. **Never fail completely** - show cached/calculated data
2. **Log all errors** - for debugging
3. **Mark stale data** - user sees "2h old" vs "live"
4. **Graceful degradation** - if Schumann fails, show "-"
