# Public API Research V2: 10 New Composite Predictions

> Deep research from [github.com/public-apis/public-apis](https://github.com/public-apis/public-apis)
> Date: 2026-02-15
> Builds on: `public-api-predictions.md` (12 predictions already documented)

---

## Prediction 13: Bird Migration Anomalies + Solar/Seismic Activity -> Natural Disaster Early Warning

### Theory

Animals — especially migratory birds — are biologically sensitive to Earth's electromagnetic field and geomagnetic disturbances. Documented scientific studies show birds alter flight paths before earthquakes and during geomagnetic storms. By tracking real-time bird observation anomalies against our existing solar/seismic data, we can build an early-warning composite index for natural disasters and extreme weather events.

### Data Flow

```
[eBird API] Bird observation counts by region, unusual sighting locations
     +
[Movebank API] Animal movement/migration GPS tracks, departure anomalies
     +
[iNaturalist API] Species observation frequency, geographic distribution shifts
     ↕ CORRELATE WITH ↕
[Solar module - EXISTING] Kp index, geomagnetic storm alerts
[USGS/Geophysical - EXISTING] Earthquake frequency, magnitude
[Schumann module - EXISTING] ELF resonance amplitude shifts
[Open-Meteo - EXISTING] Atmospheric pressure, storm systems
```

### APIs

| API | Auth | Free Tier | Endpoint Examples | Data Fields |
|-----|------|-----------|-------------------|-------------|
| **eBird** (Cornell Lab) | apiKey | 200 req/day | `GET /v2/data/obs/{regionCode}/recent` | species code, location, observation count, date, lat/lng, is_notable (boolean) |
| **Movebank** | none | unlimited | `GET /api/v1/study/{studyId}` | animal ID, GPS coordinates, timestamp, speed, heading, altitude |
| **iNaturalist** | apiKey | generous | `GET /v1/observations?taxon_id=3&quality_grade=research` | species, location, date, out_of_range flag, positional_accuracy |
| Solar module (existing) | - | - | internal | Kp index, flare class, sunspot number |
| USGS (existing) | - | - | internal | magnitude, depth, location, frequency |
| Schumann (existing) | - | - | internal | amplitude, frequency deviation |

### Prediction Logic

1. **Baseline:** Establish 90-day rolling average of bird observations per region from eBird
2. **Anomaly Detection:** Flag when observations drop >30% below baseline OR notable/out-of-range species spike >200%
3. **Composite Trigger:** When bird anomaly AND (Kp >= 4 OR earthquake frequency +50% OR Schumann amplitude >2σ)
4. **Prediction:** "Natural disruption event likely within 72 hours in [region]"
5. **Verification:** Track against subsequent USGS earthquake events, NOAA storm alerts, and news headlines

### Prediction Output Example

```json
{
  "prediction": "natural_disaster_early_warning",
  "confidence": 0.72,
  "region": "Pacific Northwest",
  "trigger_signals": {
    "bird_observation_anomaly": -42,
    "kp_index": 5,
    "schumann_deviation_sigma": 2.3,
    "earthquake_frequency_change": "+35%"
  },
  "window_hours": 72,
  "historical_accuracy": "67% (based on 18 months backtest)"
}
```

### Why This Is Interesting

This is the only prediction in the system that uses biological sentinels as data. Birds have magnetoreception organs (cryptochrome proteins) that physically respond to geomagnetic changes — this isn't pseudoscience, it's documented biophysics (Wiltschko & Wiltschko, 2005). Combined with our existing geophysical stack, it creates a multi-layered early warning system.

---

## Prediction 14: Sacred Texts Cross-Reference + Gematria -> Collective Consciousness / Thematic Convergence Index

### Theory

WhatshAppaning already calculates daily Hebrew gematria values and tracks weekly Torah portions. By cross-referencing these values with passages from **multiple sacred text traditions** (Bible, Quran, Bhagavad Gita, classical poetry), we can identify days when themes converge across independent traditions — creating a "collective consciousness resonance" score. The hypothesis: days of high thematic convergence across unrelated sacred traditions predict unusual collective behavior (market volatility, social media virality, protest activity).

### Data Flow

```
[Bible-api] Verse of the day, chapter text, keyword extraction
     +
[Quran Cloud API] Ayah of the day, surah themes, Arabic+English text
     +
[Bhagavad Gita API] Daily shloka, chapter themes, Sanskrit+English
     +
[PoetryDB] Random classical poem, theme extraction
     ↕ CROSS-REFERENCE WITH ↕
[Gematria module - EXISTING] Daily Hebrew numerical value
[Parasha module - EXISTING] Weekly Torah portion theme
[Numerology module - EXISTING] Universal day number
[Gemini AI - EXISTING] Theme extraction and semantic similarity
```

### APIs

| API | Auth | Free Tier | Endpoint Examples | Data Fields |
|-----|------|-----------|-------------------|-------------|
| **Bible-api** | none | unlimited | `GET /v1/verses/kjv/Genesis 1:1` | text, book, chapter, verse, translation |
| **Quran Cloud** | none | unlimited | `GET /v1/ayah/{reference}/en.sahih` | text (Arabic+English), surah name, ayah number, juz |
| **Bhagavad Gita API** | apiKey | generous | `GET /api/v1/chapters/{ch}/verses/{v}` | text (Sanskrit+English), word_meanings, chapter theme |
| **PoetryDB** | none | unlimited | `GET /random` | title, author, lines[], linecount |
| **Rig Veda API** | none | unlimited | `GET /api/v1/hymns` | mandala, hymn, deity, text |
| Gematria (existing) | - | - | internal | daily_value, hebrew_letters, torah_connections |
| Parasha (existing) | - | - | internal | portion_name, themes, hebrew_date |
| Gemini AI (existing) | - | - | internal | theme_extraction, sentiment, semantic_similarity |

### Prediction Logic

1. **Daily Collection:** Fetch verse/passage from each tradition keyed to the day (day-of-year modulo for cycling through texts)
2. **Theme Extraction:** Use existing Gemini AI module to extract 3-5 themes from each text passage
3. **Convergence Score:** Calculate Jaccard similarity between theme sets across all traditions (0.0 = no overlap, 1.0 = perfect alignment)
4. **Gematria Overlay:** Map whether the daily gematria value has historical associations with the convergent themes
5. **Prediction:** When convergence_score > 0.6 AND gematria alignment, predict "high collective resonance day" — expect unusual market moves, viral social events, or significant news

### Prediction Output Example

```json
{
  "prediction": "collective_consciousness_convergence",
  "convergence_score": 0.73,
  "date": "2026-02-15",
  "themes_converging": ["transformation", "justice", "renewal"],
  "sources": {
    "bible": "Isaiah 40:31 - 'They that wait upon the LORD shall renew their strength'",
    "quran": "Surah Ash-Sharh 94:5 - 'Verily, with hardship comes ease'",
    "gita": "Chapter 2, Verse 22 - 'As a person puts on new garments, giving up old ones'",
    "poetry": "Shelley - 'If Winter comes, can Spring be far behind?'"
  },
  "gematria_daily_value": 72,
  "gematria_association": "Chesed (Mercy/Kindness) — aligned with renewal theme",
  "numerology_universal_day": 7,
  "prediction_text": "High thematic convergence across 4 traditions on transformation/renewal. Expect paradigm-shifting news or market pivot within 24 hours."
}
```

### Why This Is Interesting

No other prediction platform cross-references multiple sacred text APIs programmatically. This creates an entirely new data dimension — "inter-traditional thematic resonance" — that is unique to WhatshAppaning. The Gemini AI module already exists for theme extraction, making implementation straightforward.

---

## Prediction 15: E-Sports + Chess Data + Planetary Aspects -> Human Performance Under Cosmic Influence Index

### Theory

Competitive gaming and chess provide massive datasets of human cognitive performance measured in real-time (reaction speed, decision quality, error rates). By correlating these with planetary aspects from our existing astrology module, we can test whether specific cosmic configurations measurably affect human strategic thinking and reaction time at a population level.

### Data Flow

```
[Chess.com API] Game outcomes, accuracy scores, blunder rates, time-per-move
     +
[Lichess API] Puzzle success rates, tournament results, player rating changes
     +
[PandaScore API] E-sports match results, upset frequencies, round durations
     ↕ CORRELATE WITH ↕
[Astrology module - EXISTING] Mercury position (communication/thinking), Mars aspects (aggression/competition)
[Moon module - EXISTING] Lunar phase, void-of-course status
[Numerology module - EXISTING] Planetary hours (Chaldean system)
[Solar module - EXISTING] Kp index (geomagnetic disturbance)
```

### APIs

| API | Auth | Free Tier | Endpoint Examples | Data Fields |
|-----|------|-----------|-------------------|-------------|
| **Chess.com** | none | unlimited | `GET /pub/player/{username}/games/{YYYY}/{MM}` | result, accuracy, time_control, rated, pgn, eco (opening) |
| **Lichess** | OAuth (optional) | generous | `GET /api/puzzle/daily`, `GET /api/tournament` | puzzle_rating, success, nb_players, avg_rating, performance |
| **PandaScore** | apiKey | 1,000 req/hr | `GET /matches?filter[status]=finished` | winner, opponents, games[], duration, tournament_tier |
| **Dota 2 API** | apiKey | generous | `GET /IDOTA2Match_570/GetMatchHistory` | match_id, radiant_win, duration, first_blood_time, tower_kills |
| Astrology (existing) | - | - | internal | planet_positions, aspects[], retrograde_status, void_of_course |
| Moon (existing) | - | - | internal | phase, illumination, zodiac_sign |
| Numerology (existing) | - | - | internal | planetary_hour, ruling_planet |

### Prediction Logic

1. **Daily Aggregation:** Collect aggregate chess/e-sports performance metrics:
   - Average blunder rate per 1,000 games (Chess.com)
   - Daily puzzle success rate (Lichess)
   - Upset frequency in professional matches (PandaScore)
2. **Cosmic State Mapping:**
   - Mercury retrograde or afflicted → expect higher blunder rates
   - Mars in hard aspect (square/opposition) → expect more aggressive play, shorter games
   - Moon void-of-course → expect lower puzzle accuracy
   - High Kp index → expect overall cognitive performance dip
3. **Performance Index:** 0-100 scale combining all cognitive performance metrics
4. **Market Proxy:** If collective human decision-making quality drops, predict increased market volatility (more emotional/impulsive trading)

### Prediction Output Example

```json
{
  "prediction": "human_cognitive_performance_index",
  "index_value": 38,
  "index_label": "Below Average - Impaired Decision Making",
  "date": "2026-02-15",
  "signals": {
    "chess_blunder_rate": "+23% above 90-day avg",
    "lichess_puzzle_success": "61% (avg: 72%)",
    "esports_upset_frequency": "4 upsets in 12 matches (33%, avg: 18%)",
    "mercury_status": "retrograde in Aquarius",
    "moon_void_of_course": true,
    "kp_index": 4
  },
  "market_prediction": "Elevated volatility expected — collective decision quality compromised",
  "confidence": 0.68
}
```

### Why This Is Interesting

This uses competitive gaming as a **real-time proxy for collective human cognitive state**. Millions of chess games are played daily — it's the largest continuous dataset of human strategic decision-making in existence. No other platform correlates this with astrological data to predict market behavior.

---

## Prediction 16: Marine/Ocean Weather + Moon Phase -> Shipping Disruption & Maritime Commodity Prediction

### Theory

The Moon's gravitational pull directly causes tidal forces. Storm Glass API provides hyper-specific marine weather data (wave height, swell period, sea surface temperature). Combined with our existing moon phase data and atmospheric pressure readings, we can predict maritime shipping disruptions — which directly impact commodity prices (oil tanker delays, grain shipment bottlenecks, port closures).

### Data Flow

```
[Storm Glass API] Wave height, swell direction, sea surface temp, wind speed at sea
     +
[7Timer API] Marine weather forecasts, astronomical seeing conditions
     +
[MeteoStat API] Historical weather patterns, climate normals for comparison
     ↕ CORRELATE WITH ↕
[Moon module - EXISTING] Phase, illumination %, perigee/apogee (tidal force multiplier)
[Geophysical - EXISTING] Atmospheric pressure, UV index
[Markets - EXISTING] Oil, gold, S&P 500
[News/Sentiment - EXISTING] Shipping/supply-chain headline tracking
```

### APIs

| API | Auth | Free Tier | Endpoint Examples | Data Fields |
|-----|------|-----------|-------------------|-------------|
| **Storm Glass** | apiKey | 50 req/day | `GET /v2/weather/point?lat={lat}&lng={lng}` | waveHeight, wavePeriod, windSpeed, seaLevel, waterTemperature, swellDirection, swellHeight |
| **7Timer** | none | unlimited | `GET /bin/marine.php?lon={lon}&lat={lat}` | wind_speed, wind_direction, cloud_cover, precipitation_type, significant_wave_height |
| **MeteoStat** | none | unlimited | `GET /v2/stations/daily?station={id}` | tavg, tmin, tmax, prcp, wspd, pres, historical_normals |
| Moon (existing) | - | - | internal | phase, illumination, zodiac_sign, perigee_apogee |
| Geophysical (existing) | - | - | internal | pressure, UV_index |
| Markets (existing) | - | - | internal | oil, gold, shipping_indices |

### Key Maritime Chokepoints to Monitor

| Location | Coordinates | Why It Matters |
|----------|-------------|---------------|
| Strait of Hormuz | 26.5°N, 56.3°E | 21% of global oil passes through |
| Strait of Malacca | 2.5°N, 101.5°E | 25% of global trade |
| Suez Canal approaches | 30.0°N, 32.5°E | 12% of global trade |
| Panama Canal approaches | 9.0°N, 79.5°W | 5% of global trade |
| Cape of Good Hope | 34.4°S, 18.5°E | Alternative route when Suez blocked |
| English Channel | 50.5°N, 1.0°W | Northern European trade |

### Prediction Logic

1. **Marine Weather Collection:** Query Storm Glass + 7Timer for each chokepoint every 3 hours
2. **Tidal Force Calculation:** Moon phase + perigee/apogee distance = tidal force multiplier
3. **Disruption Risk Score:**
   - wave_height > 4m = +25 risk points
   - wind_speed > 40 knots = +25 risk points
   - Full moon + perigee (supermoon) = +15 risk points (extreme tides)
   - Atmospheric pressure dropping >10hPa/12hr = +20 risk points
   - Historical: if same conditions caused disruptions previously = +15 risk points
4. **Commodity Impact:** Map disruption_risk_score per chokepoint → expected commodity price impact
5. **Verification:** Cross-reference against oil futures (existing markets module) and shipping news (existing news module)

### Prediction Output Example

```json
{
  "prediction": "maritime_disruption_forecast",
  "date": "2026-02-15",
  "chokepoints": {
    "strait_of_hormuz": {
      "risk_score": 72,
      "risk_level": "HIGH",
      "wave_height_m": 4.8,
      "wind_speed_knots": 45,
      "moon_tidal_force": "elevated (waxing gibbous, approaching perigee)",
      "expected_commodity_impact": "Oil +1.2-2.5% within 48 hours"
    },
    "english_channel": {
      "risk_score": 31,
      "risk_level": "LOW",
      "wave_height_m": 2.1,
      "wind_speed_knots": 18
    }
  },
  "overall_maritime_risk": "MODERATE-HIGH",
  "portfolio_recommendation": "Consider overweighting energy commodities"
}
```

### Why This Is Interesting

This is the first prediction that monitors **specific geographic chokepoints** — the physical bottlenecks of global trade. The Moon's gravitational effect on tides is pure physics, not esoteric. Combined with marine weather APIs, this creates an actionable shipping disruption predictor with direct commodity price implications.

---

## Prediction 17: NASA Near-Earth Objects + Cosmic Rays + Schumann -> "Cosmic Bombardment Index" for Infrastructure Reliability

### Theory

NASA tracks Near-Earth Objects (asteroids, comets) that create secondary cosmic ray showers when passing through Earth's orbital neighborhood. These secondary particles can cause single-event upsets (SEUs) in semiconductors — documented causes of satellite glitches, aviation computer errors, and data center failures. Combined with our existing Schumann resonance and solar data, we can predict windows of elevated technology failure risk.

### Data Flow

```
[NASA NeoWs API] Near-Earth Object approaches, size, velocity, miss distance
     +
[NASA DONKI API] Space weather notifications, CME predictions, solar energetic particles
     +
[Open Notify API] ISS location (proxy for orbital environment conditions)
     ↕ CORRELATE WITH ↕
[Cosmic module - EXISTING] Cosmic ray intensity levels
[Solar module - EXISTING] Kp index, solar flare class, proton flux
[Schumann module - EXISTING] ELF resonance anomalies
[Markets - EXISTING] Tech sector tracking (NASDAQ proxy)
[News - EXISTING] Tech outage headline detection
```

### APIs

| API | Auth | Free Tier | Endpoint Examples | Data Fields |
|-----|------|-----------|-------------------|-------------|
| **NASA NeoWs** | apiKey (free) | 1,000 req/hr | `GET /neo/rest/v1/feed?start_date={date}` | neo_id, name, estimated_diameter_km, close_approach_date, miss_distance_km, relative_velocity_kmps, is_potentially_hazardous |
| **NASA DONKI** | apiKey (free) | 1,000 req/hr | `GET /DONKI/notifications?type=all` | messageType (CME, FLR, SEP, GST), messageBody, messageIssueTime |
| **Open Notify** | none | unlimited | `GET /iss-now.json`, `GET /astros.json` | iss_position (lat/lng), number_of_people_in_space |
| Cosmic (existing) | - | - | internal | cosmic_ray_intensity, neutron_monitor_count |
| Solar (existing) | - | - | internal | kp_index, flare_class, proton_flux |
| Schumann (existing) | - | - | internal | amplitude, frequency, anomaly_flag |

### Prediction Logic

1. **NEO Proximity Score:** Closer + larger + faster = higher cosmic particle shower potential
   - Distance < 10 lunar distances = significant
   - Diameter > 100m = significant
   - Velocity > 20 km/s = significant
2. **Space Weather Overlay:** NASA DONKI CME/SEP alerts + existing solar flare data
3. **Cosmic Bombardment Index (CBI):** Weighted composite:
   - NEO proximity score × 0.15
   - Cosmic ray intensity (existing) × 0.30
   - Solar proton flux × 0.25
   - Schumann anomaly × 0.15
   - Kp index × 0.15
4. **Infrastructure Risk Mapping:**
   - CBI > 70: HIGH — expect satellite anomalies, GPS degradation, data center cooling issues
   - CBI 40-70: MODERATE — elevated single-event upset probability
   - CBI < 40: LOW — normal operations
5. **Market Impact:** When CBI > 70, predict tech sector underperformance within 24-48 hours

### Prediction Output Example

```json
{
  "prediction": "cosmic_bombardment_index",
  "cbi_score": 78,
  "risk_level": "HIGH",
  "date": "2026-02-15",
  "components": {
    "neo_closest_approach": {
      "name": "2026 AB3",
      "diameter_m": 230,
      "miss_distance_lunar": 4.2,
      "velocity_kmps": 24.1,
      "approach_date": "2026-02-16"
    },
    "cosmic_ray_intensity": "127% of baseline",
    "solar_proton_flux": "elevated (M-class flare 12hrs ago)",
    "schumann_anomaly": true,
    "kp_index": 5
  },
  "infrastructure_predictions": [
    "GPS accuracy degradation probable",
    "Increased satellite anomaly risk",
    "Data center UPS events possible"
  ],
  "market_prediction": "NASDAQ underperformance likely (-0.5 to -1.5%) within 48hrs",
  "people_in_space": 12,
  "iss_warning": "Crew may need to shelter during passage"
}
```

### Why This Is Interesting

NASA's NEO API is free and tracks every known asteroid approach to Earth. Combined with our existing cosmic/solar/Schumann stack, this creates a genuinely novel **infrastructure reliability forecast** grounded in documented physics (SEU effects on semiconductors are well-studied by NASA and CERN). The "number of people in space" from Open Notify adds a human element.

---

## Prediction 18: FRED Economic Data + World Bank + Tzolkin Cycles -> Macroeconomic Cycle Prediction

### Theory

The Federal Reserve Economic Data (FRED) API provides 800,000+ economic time series — GDP, unemployment, inflation, yield curves, money supply. The World Bank provides international development indicators. By overlaying these massive macroeconomic datasets with Tzolkin (260-day) and Dreamspell cycles, we can test whether sacred calendar periodicities correlate with macroeconomic turning points — and potentially predict recessions, rate changes, and growth inflections.

### Data Flow

```
[FRED API] GDP, CPI, unemployment, yield curve, M2 money supply, consumer confidence
     +
[World Bank API] International GDP growth, trade volumes, FDI flows
     +
[Econdb API] Global macroeconomic aggregates, leading indicators
     ↕ CORRELATE WITH ↕
[Tzolkin module - EXISTING] Day-sign, trecena (13-day cycle), 260-day position
[Dreamspell module - EXISTING] Kin number, Tone, Seal, Wavespell
[Numerology module - EXISTING] Universal year/month/day numbers
[Parasha module - EXISTING] Torah portion economic themes
[Markets module - EXISTING] S&P 500, VIX, Gold, USD Index
```

### APIs

| API | Auth | Free Tier | Endpoint Examples | Data Fields |
|-----|------|-----------|-------------------|-------------|
| **FRED** (Federal Reserve) | apiKey | 120 req/min | `GET /series/observations?series_id=GDP` | date, value, realtime_start, realtime_end |
| **World Bank** | none | unlimited | `GET /v2/country/all/indicator/NY.GDP.MKTP.KD.ZG` | country, date, value, indicator_name |
| **Econdb** | none | generous | `GET /api/series/?dataset=GDP` | ticker, description, frequency, data[] |
| **Aletheia** | apiKey | generous | `GET /v1/insider-trades` | insider_name, company, shares, value, trade_type |
| Tzolkin (existing) | - | - | internal | day_sign, trecena, position_in_260 |
| Dreamspell (existing) | - | - | internal | kin, tone, seal, wavespell |
| Numerology (existing) | - | - | internal | universal_day, universal_month, universal_year |

### Key FRED Series to Track

| Series ID | Name | Frequency | Significance |
|-----------|------|-----------|-------------|
| `GDP` | Gross Domestic Product | Quarterly | Core economic health |
| `UNRATE` | Unemployment Rate | Monthly | Labor market |
| `CPIAUCSL` | Consumer Price Index | Monthly | Inflation |
| `T10Y2Y` | 10Y-2Y Treasury Spread | Daily | Yield curve (recession predictor) |
| `M2SL` | M2 Money Supply | Monthly | Monetary policy |
| `UMCSENT` | Consumer Sentiment | Monthly | Forward-looking spending |
| `VIXCLS` | VIX Close | Daily | Market fear |
| `DTWEXBGS` | Trade-Weighted Dollar Index | Daily | Currency strength |
| `BAMLH0A0HYM2` | High-Yield Bond Spread | Daily | Credit stress |

### Prediction Logic

1. **Macro State Vector:** Combine 9 FRED series into normalized composite (Z-scores relative to 10-year history)
2. **Tzolkin Mapping:** Map each of the 20 day-signs to historical macro performance:
   - Which day-signs historically correlate with yield curve inversions?
   - Which trecenas (13-day periods) align with GDP report surprises?
   - Does the 260-day Tzolkin cycle align with any known economic periodicities?
3. **Sacred Economics Index:** Score each day 0-100 based on:
   - Tzolkin day-sign historical macro correlation × 0.35
   - Dreamspell Tone (creative vs. stabilizing) × 0.20
   - Universal day number economic association × 0.15
   - Parasha economic theme (when applicable) × 0.15
   - FRED macro state vector direction × 0.15
4. **Insider Trading Cross-Reference:** Use Aletheia API to check if insider trading patterns align with sacred calendar signals
5. **Prediction:** Generate macro-outlook forecast combining sacred calendars with hard economic data

### Prediction Output Example

```json
{
  "prediction": "macroeconomic_cycle_position",
  "date": "2026-02-15",
  "sacred_economics_index": 34,
  "outlook": "CAUTIOUS - Contraction Signals Forming",
  "macro_state": {
    "yield_curve_spread": -0.12,
    "unemployment_trend": "rising (3.9% -> 4.1%)",
    "consumer_sentiment": "declining",
    "vix": 22.4,
    "high_yield_spread": "widening"
  },
  "calendar_signals": {
    "tzolkin_day_sign": "Cimi (Death/Transformation)",
    "tzolkin_historical_note": "Cimi days have preceded 7 of 11 yield curve inversions since 1990",
    "dreamspell_tone": "Tone 10 (Planetary/Manifesting)",
    "universal_year": 1,
    "parasha_theme": "Mishpatim (Laws/Judgments) — historically correlates with regulatory announcements"
  },
  "insider_activity": "Net selling ratio 3.2:1 (bearish)",
  "prediction_text": "Multiple sacred calendar systems converge on transformation themes while macro indicators deteriorate. Recession probability elevated for Q3 2026."
}
```

### Why This Is Interesting

FRED is the gold standard for macroeconomic data — 800,000+ time series, all free. This prediction bridges the most rigorous economic data available with the most ancient calendrical systems. The Tzolkin's 260-day cycle has never been systematically tested against modern economic periodicity — this could reveal genuinely novel patterns.

---

## Prediction 19: FDA Drug Approvals + Clinical Trials + Tarot Archetypes -> Pharmaceutical & Biotech Prediction

### Theory

The FDA publishes drug approval decisions, and ClinicalTrials.gov tracks 400,000+ studies. The Tarot's Major Arcana represent archetypal transformation cycles (Death = transformation, Tower = sudden disruption, Star = hope/recovery, Wheel of Fortune = cyclical change). By mapping daily Tarot draws to pharma regulatory events, we can predict which biotech stocks will experience significant moves — and in which direction.

### Data Flow

```
[FDA OpenFDA API] Drug approval dates, adverse event reports, recall notices
     +
[ClinicalTrials.gov API] Trial phase transitions, completion dates, results postings
     +
[WallstreetBets Sentiment API] Biotech/pharma social sentiment
     ↕ CORRELATE WITH ↕
[Tarot module - EXISTING] Daily Major/Minor Arcana draw, reversed/upright
[Numerology module - EXISTING] Universal day number
[Astrology module - EXISTING] Planetary aspects (esp. Neptune = pharma, Pluto = transformation)
[News/Sentiment module - EXISTING] Pharma headline tracking
[Markets module - EXISTING] S&P 500 health sector proxy
```

### APIs

| API | Auth | Free Tier | Endpoint Examples | Data Fields |
|-----|------|-----------|-------------------|-------------|
| **OpenFDA** | apiKey (optional) | 240 req/min (no key), 120k/day (with key) | `GET /drug/event.json?search=receivedate:[date]` | patient_reactions, drug_name, serious (1/0), outcome, report_date |
| **ClinicalTrials.gov** | none | unlimited | `GET /api/v2/studies?query.cond={condition}` | nct_id, status, phase, start_date, conditions, interventions, results_first_posted |
| **WallstreetBets** | none | unlimited | `GET /api/sentiment?ticker={symbol}` | ticker, sentiment_score, mentions_count, bullish_pct |
| **StockData** | apiKey | 100 req/day | `GET /api/v1/data/quote?symbols=XBI,IBB` | price, change_pct, volume, market_cap |
| Tarot (existing) | - | - | internal | card_name, arcana (major/minor), suit, number, upright/reversed, archetype |
| Astrology (existing) | - | - | internal | neptune_aspects, pluto_aspects |
| News (existing) | - | - | internal | pharma_headlines, sentiment |

### Tarot-to-Pharma Archetype Mapping

| Major Arcana | Pharma Interpretation | Expected Signal |
|-------------|----------------------|-----------------|
| The Fool (0) | New drug application filed | Speculative bullish |
| The Magician (I) | Innovative mechanism of action | Strong bullish for biotech |
| Death (XIII) | Drug discontinuation / pipeline death | Bearish for specific company |
| The Tower (XVI) | Unexpected FDA rejection / safety alert | Strongly bearish |
| The Star (XVII) | Breakthrough therapy designation | Strongly bullish |
| The Wheel of Fortune (X) | Phase transition (Phase 2→3) | Directional change |
| Judgement (XX) | PDUFA date / FDA decision day | High-volatility event |
| The World (XXI) | Full FDA approval | Bullish completion |

### Prediction Logic

1. **Regulatory Calendar:** Pull upcoming PDUFA dates and clinical trial readouts from ClinicalTrials.gov
2. **Tarot Overlay:** Map daily Tarot draw to pharma archetype table
3. **Astrological Filter:** Neptune aspects (pharma planet) amplify or dampen the Tarot signal
4. **Social Sentiment:** WallstreetBets API for retail investor sentiment on biotech names
5. **Composite Prediction:** When Tarot archetype aligns with upcoming regulatory catalyst AND social sentiment is extreme → high-confidence directional prediction
6. **Adverse Event Monitoring:** Track OpenFDA adverse events for early safety signal detection

### Prediction Output Example

```json
{
  "prediction": "pharma_biotech_catalyst",
  "date": "2026-02-15",
  "tarot_draw": {
    "card": "The Star (XVII)",
    "position": "upright",
    "pharma_archetype": "Breakthrough therapy / Hope"
  },
  "upcoming_catalysts": [
    {
      "company": "ACME Biotech",
      "event": "PDUFA date",
      "date": "2026-02-18",
      "drug": "ACM-4521 (oncology)",
      "clinical_phase": "NDA review"
    }
  ],
  "neptune_status": "Neptune trine Jupiter (expansive pharma energy)",
  "wsb_sentiment": {
    "ticker": "ACME",
    "sentiment_score": 0.82,
    "mentions_24h": 1247,
    "bullish_pct": 78
  },
  "prediction_text": "Star archetype + upcoming PDUFA + positive Neptune aspect + strong social sentiment → FDA approval likely. Bullish on ACME Biotech.",
  "confidence": 0.71
}
```

### Why This Is Interesting

OpenFDA has the most comprehensive drug safety database in the world — and it's free. ClinicalTrials.gov tracks every registered study globally. Combining these with Tarot archetypes creates a uniquely WhatshAppaning approach to biotech investing. The WallstreetBets API adds a real-time retail mania detector.

---

## Prediction 20: Pollen Forecast + Full Cosmic State + Consumer Data -> Consumer Behavior & Retail Prediction

### Theory

Pollen levels directly affect 30%+ of the population (allergy sufferers). High pollen days correlate with reduced outdoor activity, increased online shopping, higher OTC pharmaceutical sales, and shifts in food delivery volume. When combined with moon phase (affects sleep quality) and solar activity (affects mood via melatonin disruption), we can predict consumer spending pattern shifts across sectors.

### Data Flow

```
[BreezoMeter Pollen API] Tree/grass/weed pollen counts, forecasts by location
     +
[IQAir API] Real-time air quality + pollen combined index
     +
[Best Buy API / Kroger API] Product trends, inventory signals (retail proxies)
     +
[Spoonacular API] Food/recipe trending (dietary shift proxy)
     ↕ CORRELATE WITH ↕
[Moon module - EXISTING] Phase (full moon = poor sleep = irritability = impulse buying)
[Solar module - EXISTING] Kp index (geomagnetic disturbance = melatonin disruption)
[Astrology module - EXISTING] Venus position (spending, luxury, pleasure)
[Sentiment module - EXISTING] Fear/greed index (consumer confidence proxy)
[Markets module - EXISTING] Consumer discretionary sector tracking
```

### APIs

| API | Auth | Free Tier | Endpoint Examples | Data Fields |
|-----|------|-----------|-------------------|-------------|
| **BreezoMeter Pollen** | apiKey | 100 req/day | `GET /v2/pollen/forecast/daily?lat={lat}&lon={lon}` | tree_pollen (index 0-5), grass_pollen, weed_pollen, dominant_species, risk_level |
| **IQAir** | apiKey | 10,000 req/mo | `GET /v2/city?city={city}&state={state}&country={country}` | aqi, temperature, humidity, wind, dominant_pollutant |
| **Spoonacular** | apiKey | 150 req/day | `GET /food/search?query=trending` | food_trends, seasonal_ingredients, recipe_popularity |
| **Kroger** | apiKey | generous | `GET /v1/products?filter.term={term}` | product_id, price, availability, category |
| Moon (existing) | - | - | internal | phase, illumination, zodiac_sign |
| Solar (existing) | - | - | internal | kp_index, uv_index |
| Astrology (existing) | - | - | internal | venus_sign, venus_aspects |
| Sentiment (existing) | - | - | internal | fear_greed_composite |

### Prediction Logic

1. **Allergen Misery Index:** Composite of tree + grass + weed pollen × air quality degradation
2. **Cosmic Mood Modifier:**
   - Full moon + high Kp → sleep disrupted → impulse buying up +15%
   - New moon + low Kp → deep sleep → considered purchases
   - Venus in Taurus/Libra → luxury spending elevated
3. **Consumer Behavior Score:** 0-100 scale predicting:
   - Online vs. in-store shopping ratio
   - OTC pharma demand (antihistamines, sleep aids)
   - Food delivery vs. dining out ratio
   - Comfort food vs. health food trending
4. **Sector Impact:** Map behavior score to retail sub-sectors

### Prediction Output Example

```json
{
  "prediction": "consumer_behavior_forecast",
  "date": "2026-02-15",
  "allergen_misery_index": 82,
  "pollen": {
    "tree": 4,
    "grass": 3,
    "weed": 2,
    "dominant": "Oak",
    "risk_level": "HIGH"
  },
  "cosmic_mood": {
    "moon_phase": "Waxing Gibbous (87% illuminated)",
    "kp_index": 3,
    "sleep_quality_prediction": "poor",
    "venus_position": "Taurus (luxury spending elevated)"
  },
  "consumer_predictions": {
    "online_shopping_uplift": "+18%",
    "otc_pharma_demand": "+32% (antihistamines, eye drops)",
    "food_delivery_uplift": "+22%",
    "trending_foods": ["soup", "tea", "comfort meals"],
    "impulse_buying_risk": "HIGH (sleep-deprived + Venus in Taurus)"
  },
  "sector_recommendations": {
    "overweight": ["e-commerce", "pharma OTC", "food delivery"],
    "underweight": ["brick-and-mortar retail", "outdoor recreation", "restaurants"]
  }
}
```

### Why This Is Interesting

BreezoMeter's pollen API is uniquely specific — it identifies which species are dominant (oak, birch, ragweed) and forecasts days ahead. Combined with cosmic mood modifiers, this predicts real consumer behavior shifts that directly impact retail and CPG sectors. Allergy sufferers are 30%+ of the population — this is a genuinely large addressable signal.

---

## Prediction 21: US Legislature + Court Data + Sacred Calendars -> Legal/Policy Decision Prediction

### Theory

The OpenStates API tracks every bill in every US state legislature. CourtListener tracks federal court opinions. The Hebrew calendar, Tzolkin, and numerology all have day-types associated with judgment, justice, and authority. By mapping sacred calendar "justice days" to legislative/judicial activity, we can predict windows when landmark policy decisions or court rulings are most likely to be handed down — and their probable direction.

### Data Flow

```
[OpenStates API] US state bills, votes, legislators, committee actions
     +
[CourtListener API] Federal court opinions, SCOTUS oral arguments, case filings
     +
[UK Parliament API] Parliamentary debates, votes, bill stages (international context)
     ↕ CORRELATE WITH ↕
[Parasha module - EXISTING] Torah portions with justice/law themes (Mishpatim, Shoftim, etc.)
[Tzolkin module - EXISTING] Day-signs associated with authority (Ahau/Sun, Men/Eagle)
[Numerology module - EXISTING] Universal day 8 (authority/power), 4 (structure/law)
[I Ching module - EXISTING] Hexagrams of judgment (#21 Biting Through, #56 The Wanderer)
[Astrology module - EXISTING] Saturn aspects (structure/authority), Jupiter aspects (law/expansion)
[News module - EXISTING] Legal/political headline tracking
```

### APIs

| API | Auth | Free Tier | Endpoint Examples | Data Fields |
|-----|------|-----------|-------------------|-------------|
| **OpenStates** | apiKey | generous | `GET /v3/bills?jurisdiction=us&session=2026` | bill_id, title, status, latest_action, sponsors, votes[], subjects[] |
| **CourtListener** | none | unlimited | `GET /api/rest/v4/opinions/?date_filed__gte={date}` | case_name, court, date_filed, plain_text, citation, precedential_status |
| **UK Parliament** | none | unlimited | `GET /api/v1/Bills?Session=2025-26` | bill_title, current_stage, sponsors, last_updated, bill_type |
| **Nager.Date** | none | unlimited | `GET /api/v3/PublicHolidays/{year}/{countryCode}` | date, name, countryCode (for recess scheduling) |
| Parasha (existing) | - | - | internal | portion_name, themes, hebrew_date |
| Tzolkin (existing) | - | - | internal | day_sign, number, authority_association |
| Numerology (existing) | - | - | internal | universal_day, power_associations |
| I Ching (existing) | - | - | internal | hexagram, judgment_theme |
| Astrology (existing) | - | - | internal | saturn_aspects, jupiter_aspects |

### Sacred Calendar Justice Mapping

| System | Justice/Authority Signals | Historical Association |
|--------|--------------------------|----------------------|
| **Torah Portions** | Mishpatim (Laws), Shoftim (Judges), Devarim (Words/Deuteronomy) | Major legislation weeks |
| **Tzolkin Day-Signs** | Ahau (Sun Lord), Men (Eagle/Vision), Cib (Wisdom) | Authoritative decisions |
| **Numerology** | Day 8 (Authority/Power), Day 4 (Structure/Foundation) | Structural policy changes |
| **I Ching** | Hex 21 (Biting Through/Justice), Hex 49 (Revolution), Hex 18 (Repair) | Legal enforcement |
| **Astrology** | Saturn conjunct/square Sun, Jupiter in Sagittarius/Pisces | Regulatory cycles |

### Prediction Logic

1. **Legislative Calendar Scan:** Pull active bills approaching vote from OpenStates, upcoming SCOTUS opinions from CourtListener
2. **Sacred Justice Score:** How many sacred calendar systems signal "justice/authority" today?
   - 1 system: baseline (no prediction)
   - 2-3 systems: "legal activity elevated"
   - 4+ systems: "landmark decision window"
3. **Saturn/Jupiter Filter:** Saturn aspects indicate restriction/enforcement; Jupiter aspects indicate expansion/leniency
4. **Direction Prediction:** Saturn dominant → restrictive ruling/regulation; Jupiter dominant → permissive/expansive
5. **Sector Impact:** Map predicted legal/policy direction to affected market sectors (energy, tech, pharma, finance)

### Prediction Output Example

```json
{
  "prediction": "legal_policy_decision_window",
  "date": "2026-02-15",
  "sacred_justice_score": 4,
  "convergence_level": "LANDMARK DECISION WINDOW",
  "calendar_signals": {
    "parasha": "Mishpatim (Laws) - active this week",
    "tzolkin": "Ahau (Sun Lord) - authority day-sign",
    "numerology": "Universal day 8 (Power/Authority)",
    "i_ching": "Hexagram 21 (Biting Through / Legal Enforcement)"
  },
  "planetary": {
    "saturn": "Saturn square Mars (enforcement energy)",
    "jupiter": "Jupiter trine Venus (favorable outcomes for financial regulation)"
  },
  "active_catalysts": {
    "scotus": ["SEC v. TechCorp - securities regulation case, opinion expected"],
    "state_legislature": ["California AB-1234 (AI regulation) - floor vote scheduled"],
    "uk_parliament": ["Online Safety Bill - third reading"]
  },
  "direction_prediction": "Restrictive/enforcement (Saturn dominant)",
  "sector_impact": {
    "negative": ["Big Tech", "AI companies", "social media"],
    "positive": ["cybersecurity", "compliance tech", "legal services"]
  }
}
```

### Why This Is Interesting

OpenStates provides real-time legislative tracking for all 50 US states — completely free. CourtListener gives access to every federal court opinion. Mapping sacred "justice days" to real legislative/judicial calendars is unprecedented. The prediction has direct, measurable market impact (regulatory decisions move stocks instantly).

---

## Prediction 22: Music Listening Trends + Planetary Hours + Sentiment -> Cultural Mood Prediction & Virality Forecast

### Theory

Music listening patterns reflect collective emotional state in real-time. Last.fm tracks what millions of people listen to globally. When collective listening shifts toward specific genres (e.g., surge in melancholy music, aggressive music, or euphoric dance music), this is a leading indicator of societal mood — which in turn predicts consumer confidence, social media virality patterns, and even protest/celebration activity. Combined with planetary hours (Chaldean system from existing numerology module) and existing sentiment data, we can build a "Cultural Mood Index."

### Data Flow

```
[Last.fm API] Top tracks, top artists, trending tags globally and by region
     +
[MusicBrainz API] Genre/mood classification metadata for tracks
     +
[Lyrics.ovh API] Lyric text for sentiment analysis
     +
[Genius API] Song annotations, cultural context, trending songs
     ↕ CORRELATE WITH ↕
[Numerology module - EXISTING] Planetary hours (Chaldean: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn)
[Astrology module - EXISTING] Venus (art/beauty), Neptune (music/dreams), Moon (emotions)
[Sentiment module - EXISTING] Fear/Greed composite
[News module - EXISTING] Cultural event headlines
[Gemini AI - EXISTING] Lyric sentiment analysis
```

### APIs

| API | Auth | Free Tier | Endpoint Examples | Data Fields |
|-----|------|-----------|-------------------|-------------|
| **Last.fm** | apiKey | unlimited | `GET /2.0/?method=chart.gettoptracks`, `GET /2.0/?method=tag.getTopTags` | track_name, artist, listeners, playcount, tags[], top_tags_global |
| **MusicBrainz** | none | 1 req/sec | `GET /ws/2/recording/{mbid}?inc=tags` | genre_tags, mood_tags, recording_length, artist_credit |
| **Lyrics.ovh** | none | unlimited | `GET /v1/{artist}/{title}` | lyrics (full text) |
| **Genius** | OAuth | generous | `GET /search?q={query}` | song_id, title, annotation_count, page_views, hot (boolean) |
| **Audd** | apiKey | 300 req/day | `GET /findLyrics/?q={query}` | lyrics, artist, title, media (Spotify/Apple links) |
| Numerology (existing) | - | - | internal | planetary_hour, ruling_planet |
| Astrology (existing) | - | - | internal | venus_sign, neptune_aspects, moon_sign |
| Sentiment (existing) | - | - | internal | fear_greed_score |
| Gemini AI (existing) | - | - | internal | text_sentiment_analysis |

### Genre-to-Mood Mapping

| Genre Trend Shift | Mood Signal | Market Implication |
|-------------------|------------|-------------------|
| Surge in sad/acoustic | Collective melancholy | Consumer confidence declining |
| Surge in aggressive/metal | Collective frustration | Social unrest indicators rising |
| Surge in euphoric/dance | Collective optimism | Consumer spending increasing |
| Surge in nostalgic/classic | Collective uncertainty | Flight to safety (gold, bonds) |
| Surge in ambient/meditation | Collective anxiety seeking calm | Healthcare/wellness sector up |
| Surge in protest/political | Collective activism | Volatility across sectors |

### Prediction Logic

1. **Music Trend Collection:** Hourly top tags and track data from Last.fm → genre distribution shifts
2. **Lyric Sentiment Analysis:** Top 10 trending songs → fetch lyrics → Gemini AI sentiment scoring → aggregate mood vector
3. **Planetary Hour Overlay:** Current Chaldean planetary hour amplifies/dampens specific moods:
   - Venus hour + euphoric music = strong bullish consumer signal
   - Saturn hour + melancholy music = strong bearish signal
   - Mars hour + aggressive music = conflict/volatility signal
4. **Cultural Mood Index:** 0-100 composite (50 = neutral)
   - < 30: Deep pessimism — predict market downturn, reduced consumer activity
   - 30-45: Cautious — predict sideways markets
   - 45-55: Neutral
   - 55-70: Optimistic — predict market uptick, spending increase
   - > 70: Euphoria — potential bubble indicator (contrarian signal)
5. **Virality Forecast:** When mood index shifts >15 points in 24 hours, predict viral cultural moment within 48 hours

### Prediction Output Example

```json
{
  "prediction": "cultural_mood_index",
  "index_value": 29,
  "mood_label": "Deep Pessimism",
  "date": "2026-02-15T14:00:00Z",
  "music_signals": {
    "trending_genre_shift": "sad/acoustic +340% vs 7-day avg",
    "top_tag_today": "#heartbreak #loss #reflection",
    "trending_tracks_sentiment": -0.72,
    "lyric_themes": ["loss", "darkness", "searching", "rain"]
  },
  "planetary_overlay": {
    "current_hour": "Saturn (restriction, melancholy)",
    "venus_status": "Venus square Saturn (blocked pleasure)",
    "neptune_status": "Neptune in Aries (disillusionment with ideals)"
  },
  "existing_sentiment": {
    "fear_greed": 28,
    "news_sentiment": -0.45
  },
  "predictions": {
    "market": "S&P 500 likely to close red (-0.8% to -1.5%)",
    "consumer": "Online retail activity expected to drop 12%",
    "virality": "Emotional/memorial content likely to go viral within 48hrs",
    "wellness": "Meditation app downloads expected to spike +25%"
  }
}
```

### Why This Is Interesting

Last.fm processes billions of scrobbles. Music listening is one of the most honest signals of human emotion — people don't curate their listening habits the way they curate social media posts. This creates a "collective unconscious mood detector" that, when combined with planetary hours and existing sentiment data, becomes a powerful cultural and market predictor.

---

## API Priority Matrix (New APIs Only — V2)

| Priority | API | Auth | Free Tier | Predictions Served | Integration Effort |
|----------|-----|------|-----------|-------------------|-------------------|
| **CRITICAL** | NASA NeoWs/DONKI | apiKey (free) | 1,000 req/hr | #17 Cosmic Bombardment | Low - REST JSON |
| **CRITICAL** | FRED | apiKey (free) | 120 req/min | #18 Macroeconomic Cycles | Low - REST JSON |
| **CRITICAL** | Last.fm | apiKey | unlimited | #22 Cultural Mood | Low - REST JSON |
| **HIGH** | eBird | apiKey | 200 req/day | #13 Bird Migration Warning | Low - REST JSON |
| **HIGH** | OpenFDA | optional apiKey | 240 req/min | #19 Pharma Prediction | Low - REST JSON |
| **HIGH** | Storm Glass | apiKey | 50 req/day | #16 Maritime Disruption | Low - REST JSON |
| **HIGH** | OpenStates | apiKey | generous | #21 Legal/Policy Prediction | Low - REST JSON |
| **HIGH** | BreezoMeter Pollen | apiKey | 100 req/day | #20 Consumer Behavior | Low - REST JSON |
| **MED** | Bible-api | none | unlimited | #14 Sacred Text Convergence | Low - REST JSON |
| **MED** | Quran Cloud | none | unlimited | #14 Sacred Text Convergence | Low - REST JSON |
| **MED** | Bhagavad Gita API | apiKey | generous | #14 Sacred Text Convergence | Low - REST JSON |
| **MED** | Chess.com | none | unlimited | #15 Cognitive Performance | Low - REST JSON |
| **MED** | Lichess | none/OAuth | generous | #15 Cognitive Performance | Low - REST JSON |
| **MED** | PandaScore | apiKey | 1,000 req/hr | #15 E-Sports Correlation | Low - REST JSON |
| **MED** | ClinicalTrials.gov | none | unlimited | #19 Pharma Prediction | Low - REST JSON |
| **MED** | CourtListener | none | unlimited | #21 Legal Prediction | Low - REST JSON |
| **MED** | World Bank | none | unlimited | #18 Macro Prediction | Low - REST JSON |
| **LOW** | IQAir | apiKey | 10,000 req/mo | #20 Consumer Behavior | Low - REST JSON |
| **LOW** | MusicBrainz | none | 1 req/sec | #22 Music Mood | Low - REST JSON |
| **LOW** | Lyrics.ovh | none | unlimited | #22 Lyric Sentiment | Low - REST JSON |
| **LOW** | Movebank | none | unlimited | #13 Animal Migration | Medium - REST JSON |
| **LOW** | PoetryDB | none | unlimited | #14 Sacred Text Convergence | Low - REST JSON |
| **LOW** | 7Timer | none | unlimited | #16 Marine Weather | Low - REST JSON |
| **LOW** | MeteoStat | none | unlimited | #16 Historical Weather | Low - REST JSON |
| **LOW** | UK Parliament | none | unlimited | #21 Int'l Legal Context | Low - REST JSON |

---

## Implementation Roadmap: Recommended Build Order

### Phase 1 — Quick Wins (1-2 days each, highest impact)

1. **#17 Cosmic Bombardment Index** — NASA APIs are free, unlimited, and perfectly complement existing solar/cosmic/Schumann modules. Immediate infrastructure reliability value.
2. **#18 Macroeconomic Cycle Prediction** — FRED API is the most powerful free data source in existence. 800,000+ time series. Pairs perfectly with existing Tzolkin/numerology.
3. **#22 Cultural Mood Index** — Last.fm is unlimited and free. Music data is the most honest collective mood signal available.

### Phase 2 — Medium Effort (2-4 days each)

4. **#13 Bird Migration Early Warning** — eBird has clean REST API; requires establishing regional baselines over 30+ days
5. **#19 Pharma/Biotech Prediction** — OpenFDA is extremely generous; ClinicalTrials.gov is unlimited. Tarot mapping is the creative differentiator.
6. **#21 Legal/Policy Prediction** — OpenStates + CourtListener are both free and well-documented.

### Phase 3 — Rich Data Layer (3-5 days each)

7. **#16 Maritime Disruption** — Storm Glass free tier is limited (50/day) but 6 chokepoints × 8 queries/day = 48 queries. Tight but workable.
8. **#20 Consumer Behavior** — BreezoMeter pollen is unique data; requires multi-API orchestration.
9. **#14 Sacred Texts Convergence** — Multiple text APIs are all free/unlimited; main effort is Gemini AI theme extraction pipeline.
10. **#15 Cognitive Performance Index** — Chess.com + Lichess are unlimited; PandaScore adds e-sports. Requires statistical baseline establishment.

---

## Total API Count Summary

| Category | V1 (existing doc) | V2 (this doc) | Total Unique New APIs |
|----------|-------------------|---------------|-----------------------|
| Predictions | 12 | 10 | 22 total |
| New APIs referenced | 13 | 24 | 37 unique |
| Free/No-auth APIs | 4 | 13 | 17 total |
| API-key-only (free tier) | 9 | 11 | 20 total |
