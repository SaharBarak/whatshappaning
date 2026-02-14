# Public API Research: New Prediction Opportunities

> Research from [github.com/public-apis/public-apis](https://github.com/public-apis/public-apis)
> Date: 2026-02-14

## Executive Summary

WhatshAppaning currently correlates cosmic/esoteric data with markets and sentiment. Below are **new prediction categories** enabled by free/freemium public APIs, cross-referenced with our existing data streams to create composite predictions.

---

## Currently Used APIs (for reference)

| Source | Data |
|--------|------|
| Yahoo Finance | S&P 500, VIX, bonds, commodities |
| CoinGecko | Crypto prices |
| Alternative.me | Crypto Fear & Greed |
| CNN Fear & Greed | Traditional market sentiment |
| NOAA SWPC | Solar activity, Kp index |
| USGS | Earthquakes |
| Open-Meteo | Weather/atmospheric |
| BBC/NYT/NPR/AJ RSS | News headlines |
| Hebcal | Hebrew calendar |
| Google Gemini | News sentiment analysis |

---

## New Prediction Ideas + Composite APIs

### 1. Solar Activity -> Currency Volatility Prediction

**Prediction:** Geomagnetic storms (Kp >= 5) predict increased forex volatility within 24-48 hours.

| API | Auth | Free Tier | Data |
|-----|------|-----------|------|
| **Fixer.io** | apiKey | 100 req/mo | 170+ currency exchange rates, historical data |
| **Alpha Vantage** | apiKey | 25 req/day | Real-time & intraday forex data |
| NOAA SWPC (existing) | none | unlimited | Kp index, solar flare alerts |

**Composite:** Correlate Kp index spikes with forex pair volatility (USD/EUR, USD/JPY). Existing solar module provides the trigger; new forex APIs provide the outcome measurement.

---

### 2. Moon Phase + Air Quality -> Public Health Sentiment

**Prediction:** Full moon periods combined with poor air quality correlate with elevated emergency-related search trends and negative health sentiment.

| API | Auth | Free Tier | Data |
|-----|------|-----------|------|
| **OpenAQ** | apiKey | generous | PM2.5, PM10, O3, NO2 from 12,000+ stations worldwide |
| **UK Carbon Intensity** | none | unlimited | Real-time carbon intensity forecasts |
| Moon module (existing) | - | - | Lunar phase, illumination |
| Google Trends (existing) | - | - | Search term tracking |

**Composite:** Overlay moon phase data with air quality readings. Track correlation against health-related Google Trends searches ("headache", "insomnia", "anxiety") and news sentiment.

---

### 3. Planetary Alignments -> Major Event / Entertainment Trends

**Prediction:** Specific planetary aspects (conjunctions, oppositions) correlate with spikes in entertainment consumption and cultural events.

| API | Auth | Free Tier | Data |
|-----|------|-----------|------|
| **Ticketmaster** | apiKey | 5,000 req/day | Event discovery - concerts, sports, festivals |
| **SeatGeek** | apiKey | generous | Event search, venue data, performer info |
| **RAWG.io** | apiKey | generous | 500,000+ game releases, popularity trends |
| Astrology module (existing) | - | - | Planetary positions, aspects |

**Composite:** Track whether major planetary alignments (Jupiter-Saturn conjunctions, Venus-Mars aspects) correspond to spikes in event listings, ticket sales activity, or game release popularity.

---

### 4. Schumann Resonance + Earthquake Activity -> Flight Disruption Prediction

**Prediction:** Elevated Schumann resonance amplitude combined with seismic upticks predict increased flight delays/cancellations within 48 hours.

| API | Auth | Free Tier | Data |
|-----|------|-----------|------|
| **Aviationstack** | apiKey | 100 req/mo | Real-time flight status, delays, cancellations |
| Schumann module (existing) | - | - | ELF amplitude and frequency |
| USGS/Geophysical (existing) | - | - | Earthquake magnitude, frequency |
| Open-Meteo (existing) | - | - | Atmospheric pressure, UV |

**Composite:** When Schumann resonance exceeds baseline AND earthquake frequency rises, check whether flight disruption rates increase. Atmospheric pressure from Open-Meteo adds a third correlation dimension.

---

### 5. Numerology Day Numbers -> Stock Market Sector Rotation

**Prediction:** Specific universal day numbers (from numerology module) correlate with sector-specific market movements.

| API | Auth | Free Tier | Data |
|-----|------|-----------|------|
| **Financial Modeling Prep** | apiKey | 250 req/day | Sector performance, ETF data, financial statements |
| **Finnhub** | apiKey | 60 req/min | Real-time quotes, sector performance, economic calendar |
| **SEC EDGAR** | none | 10 req/sec | Company filings, quarterly reports |
| Numerology module (existing) | - | - | Universal day/month/year numbers |

**Composite:** Map numerology numbers (1-9) to historical sector returns. E.g., does universal day 8 (associated with material success) actually correlate with financial sector outperformance?

---

### 6. Tzolkin/Dreamspell Cycles -> Social Sentiment & Conflict Prediction

**Prediction:** Certain Tzolkin day-signs and Dreamspell kins correlate with spikes in geopolitical tension or social unrest indicators.

| API | Auth | Free Tier | Data |
|-----|------|-----------|------|
| **REST Countries** | none | unlimited | Country data, population, region, borders |
| **Nominatim (OpenStreetMap)** | none | 1 req/sec | Geocoding for mapping events to locations |
| **ipstack** | apiKey | 100 req/mo | IP geolocation for traffic pattern analysis |
| Tzolkin/Dreamspell (existing) | - | - | Sacred calendar positions |
| News/Sentiment (existing) | - | - | AI-analyzed news themes |

**Composite:** Cross-reference Tzolkin day-signs historically associated with transformation/conflict against news sentiment spikes in specific geographic regions. Map hotspots using geocoding.

---

### 7. I Ching Hexagrams -> Commodity Price Movement

**Prediction:** Daily I Ching hexagram themes correlate with directional moves in specific commodities.

| API | Auth | Free Tier | Data |
|-----|------|-----------|------|
| **Alpha Vantage** | apiKey | 25 req/day | Commodity prices (oil, gold, silver, copper) |
| **Marketstack** | apiKey | 100 req/mo | Historical end-of-day commodity data |
| I Ching module (existing) | - | - | Daily hexagram |
| Markets module (existing) | - | - | Gold, S&P 500 |

**Composite:** Map the 64 hexagrams to commodity performance. E.g., Hexagram 29 (Water/Danger) -> oil price spikes? Hexagram 52 (Mountain/Stillness) -> gold stability?

---

### 8. Solar Flares + Gematria -> Crypto Market Crash Prediction

**Prediction:** Coincidence of X-class solar flares with specific gematria daily values predicts crypto market drawdowns of >5%.

| API | Auth | Free Tier | Data |
|-----|------|-----------|------|
| **CoinMarketCap** | apiKey | 333 req/day | Top 100 crypto prices, market cap, volume |
| **Coinpaprika** | none | 25,000 req/mo | Crypto market data, OHLCV, exchanges |
| **Binance** | apiKey | generous | Real-time order book, trade data, candlesticks |
| Solar module (existing) | - | - | Solar flare class, Kp index |
| Gematria module (existing) | - | - | Daily Hebrew gematria values |
| CoinGecko (existing) | - | - | BTC, ETH prices |

**Composite:** When X-class flares coincide with gematria values historically associated with disruption (e.g., values summing to 13, 666), measure whether crypto drawdowns follow within 24-72 hours. Multiple crypto APIs provide redundancy and depth.

---

### 9. Tarot Daily Draw -> Entertainment & Cultural Trend Prediction

**Prediction:** Tarot card archetypes drawn daily correlate with trending entertainment themes.

| API | Auth | Free Tier | Data |
|-----|------|-----------|------|
| **RAWG.io** | apiKey | generous | Trending games, new releases |
| **Marvel API** | apiKey | 3,000 req/day | Comics, characters, events |
| **Pokéapi** | none | unlimited | Pokemon data (cultural trend proxy) |
| **JokeAPI** | none | unlimited | Trending humor categories |
| Tarot module (existing) | - | - | Daily card draw |

**Composite:** When "The Tower" is drawn, do action/disaster games trend? When "The Lovers" appears, do romance-themed content spike? Track archetypal correlation with entertainment data.

---

### 10. Parasha (Torah Portion) -> Geopolitical Event Prediction

**Prediction:** Weekly Torah portions with themes of conflict, peace, or prosperity correlate with geopolitical events in the following week.

| API | Auth | Free Tier | Data |
|-----|------|-----------|------|
| **REST Countries** | none | unlimited | Country info, regional groupings |
| **OpenCage Geocoder** | apiKey | 2,500 req/day | Forward/reverse geocoding |
| Hebcal/Parasha (existing) | - | - | Weekly Torah portion, themes |
| News/Sentiment (existing) | - | - | Global news themes |

**Composite:** Categorize each Parasha by theme (war, peace, journey, covenant, judgment). Track whether the following week's news sentiment in the Middle East/globally aligns with the portion's themes.

---

### 11. Cosmic Ray Levels -> Technology Disruption Prediction

**Prediction:** Elevated cosmic ray counts predict increased tech infrastructure failures (cloud outages, exchange halts).

| API | Auth | Free Tier | Data |
|-----|------|-----------|------|
| **Finnhub** | apiKey | 60 req/min | Market halts, economic calendar, company news |
| **GitHub API** | OAuth | 5,000 req/hr | Incident/status data, trending repos (as proxy) |
| Cosmic module (existing) | - | - | Cosmic ray levels |
| Solar module (existing) | - | - | Solar activity |

**Composite:** When cosmic ray counts spike above 2 standard deviations, track whether market halts, exchange outages, or tech company negative news increase in the following 24-48 hours.

---

### 12. Full Environmental Index -> Food & Agriculture Prediction

**Prediction:** Combined atmospheric, lunar, and geophysical conditions predict food commodity price movements and supply disruptions.

| API | Auth | Free Tier | Data |
|-----|------|-----------|------|
| **Open Food Facts** | none | unlimited | Global food product database, sourcing data |
| **Edamam Nutrition** | apiKey | 100 req/day | Food/nutrition data |
| **Open Brewery DB** | none | unlimited | Brewery data (agricultural commodity proxy) |
| Moon module (existing) | - | - | Lunar phase, zodiac sign |
| Geophysical (existing) | - | - | UV, pressure, earthquakes |
| Open-Meteo (existing) | - | - | Weather conditions |

**Composite:** Agricultural planting/harvest cycles align with lunar phases. Combine moon phase + weather + UV index + atmospheric pressure to predict agricultural commodity trends.

---

## API Priority Matrix

| Priority | API | Cost | Value | Integration Effort |
|----------|-----|------|-------|-------------------|
| **HIGH** | Alpha Vantage | Free (25/day) | Forex + commodities fill major data gap | Low - REST JSON |
| **HIGH** | Finnhub | Free (60/min) | Sector data, market halts, economic calendar | Low - REST JSON |
| **HIGH** | OpenAQ | Free | Air quality adds new environmental dimension | Low - REST JSON |
| **HIGH** | CoinMarketCap | Free (333/day) | Broader crypto coverage beyond BTC/ETH | Low - REST JSON |
| **MED** | Aviationstack | Free (100/mo) | Unique flight disruption data | Low - REST JSON |
| **MED** | Ticketmaster | Free (5000/day) | Event/entertainment trend data | Low - REST JSON |
| **MED** | Financial Modeling Prep | Free (250/day) | Sector rotation data | Low - REST JSON |
| **MED** | REST Countries | Free (unlimited) | Geographic context for news | Low - REST JSON |
| **MED** | Coinpaprika | Free (25k/mo) | Redundant crypto source, no auth needed | Low - REST JSON |
| **LOW** | RAWG.io | Free | Entertainment trends (niche) | Low - REST JSON |
| **LOW** | OpenCage | Free (2500/day) | Geocoding for event mapping | Low - REST JSON |
| **LOW** | SEC EDGAR | Free | Company filings (slow-moving data) | Medium - XML/JSON |
| **LOW** | Marvel API | Free (3000/day) | Cultural trend proxy (very niche) | Low - REST JSON |

---

## Summary: Top 5 Composite Predictions to Implement First

1. **Solar Storms -> Forex Volatility** (Alpha Vantage + existing solar) - Strong scientific basis for geomagnetic effects on communications/markets
2. **Moon Phase + Air Quality -> Health Sentiment** (OpenAQ + existing moon/trends) - Novel environmental-health correlation
3. **Cosmic Events -> Crypto Crashes** (CoinMarketCap + existing solar/gematria) - Extends existing crypto tracking significantly
4. **Numerology -> Sector Rotation** (Finnhub + existing numerology) - Unique esoteric-to-sector mapping
5. **I Ching -> Commodity Direction** (Alpha Vantage + existing I Ching) - Thematic mapping with measurable outcomes
