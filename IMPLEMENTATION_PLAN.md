# What's Happening - Implementation Plan

A data-driven prediction dashboard that correlates cosmic/esoteric data with real-world measurable outcomes. Every prediction displays statistical backing, sample sizes, confidence intervals, and contributing factors.

---

## PROJECT STATUS: GREENFIELD - ~15% COMPLETE

> **Last Updated:** 2026-01-31
> **Implementation Progress:** ~15% - Phase 2 local calculation modules complete
> **Spec Analysis:** Complete - 25 specs analyzed, 78 gaps identified, 5 decisions required, 10 specs need updates
> **Plan Verification:** VERIFIED - All 25 specs cross-referenced with parallel subagents, plan accuracy confirmed

### Current State
- **Backend:** IN PROGRESS - `/backend/` directory structure created
- **Frontend:** NOT STARTED - `/frontend/` directory does not exist
- **Database:** NOT STARTED - No migrations or schema deployed
- **Modules:** 6/16 implemented (Tzolkin, Dreamspell, Tarot, Numerology, I Ching, Gematria)
- **Indices:** 0/3 implemented
- **Correlation Engine:** NOT STARTED
- **Prediction System:** NOT STARTED

### Verified Assets
- [x] 25 specification documents in `/specs/` (complete)
- [x] Docker configuration for Claude Code development environment (root `docker-compose.yml`)
- [x] This implementation plan (comprehensive, cross-verified with all specs)
- [x] Phase 2 local calculation modules complete (6 modules + 2 data files)

### Deep Spec Analysis Findings (2026-01-31)
- **78 gaps identified** across all specs (verified with 25 parallel subagent analysis)
- **9 static data files** must be created before module implementation
- **10 specs require updates** with missing algorithms or data
- **8 module calculations** have undefined dependencies (VOC, Dreamspell powers, chi-square helpers, pattern matching, etc.)
- **4 external APIs** have unreliable or undefined access (Schumann, Cosmic rays, CNN F&G, CBOE Put/Call)
- **Multiple comparison correction** needed in correlation engine (432+ statistical tests)
- **3 key helper functions** undefined in correlation engine (buildContingencyTable, calculateChiSquare, chiSquarePValue)

---

# PRIORITIZED IMPLEMENTATION CHECKLIST

> **Legend:**
> [ ] Not started | [~] In progress | [x] Complete
> **Priority markers:** Items are ordered by priority (most critical first within each phase)

---

## PHASE 0: PRE-IMPLEMENTATION DECISIONS

> **These decisions MUST be resolved before any code is written.**

### Required Decisions

- [ ] **DECISION 1: Update Frequencies**
  - Option A: Match specs exactly (15min/30min/hourly) - Higher API usage, potential rate limits
  - Option B: Use 3hr intervals across the board - Document deviation, safer for free tiers
  - **Recommendation:** Option B with documentation of deviation

- [ ] **DECISION 2: I Ching Changing Lines**
  - Option A: Include 25% probability per line (spec 18 allows optional)
  - Option B: Exclude for MVP (simpler daily static reading)
  - **Recommendation:** Option B for MVP

- [ ] **DECISION 3: Tarot Reversals**
  - Option A: Include 50% reversal chance (spec 11 default)
  - Option B: Exclude for MVP (simpler interpretation)
  - **Recommendation:** Option B for MVP

- [ ] **DECISION 4: Continuous Outcomes**
  - Option A: Include `spx_return` continuous outcome (requires regression analysis)
  - Option B: Binary outcomes only (simpler chi-square model)
  - **Recommendation:** Option B for MVP

- [ ] **DECISION 5: Reference Timezone**
  - Option A: Jerusalem (authentic for Hebrew calendar/Shabbat)
  - Option B: UTC (simpler, consistent)
  - **Recommendation:** UTC with Jerusalem for Shabbat times only

---

## PHASE 1: FOUNDATION [BLOCKING - All other phases depend on this]

> **Priority:** CRITICAL - No parallel work possible until complete.
> **Dependencies:** None
> **Estimated effort:** 2-3 days

### 1.1 Project Structure

- [ ] Create `/backend/` directory structure per spec 15
  ```
  /backend/src/           - Main source directory
  /backend/src/routes/    - API route handlers
  /backend/src/modules/   - 16 data collection modules
  /backend/src/indices/   - 3 composite index calculators
  /backend/src/correlation/ - Correlation engine
  /backend/src/prediction/  - Prediction system
  /backend/src/utils/     - Helper utilities
  /backend/data/          - Static data files (tarot.json, iching.json)
  /backend/migrations/    - SQL migration files
  ```

- [ ] Create `/frontend/` directory structure per spec 15
  ```
  /frontend/css/                    - Stylesheets
  /frontend/js/                     - JavaScript modules
  /frontend/js/components/          - UI components
  /frontend/js/components/modules/  - Module-specific renderers (16 files)
  ```

- [ ] Create `/backend/package.json` with dependencies:
  - express, cors, pg, node-cron, dotenv
  - swisseph (Swiss Ephemeris for astrology)
  - yahoo-finance2 (markets data)
  - rss-parser (news feeds)
  - @google/generative-ai (Gemini for news analysis)
  - google-trends-api (sentiment)
  - axios, cheerio (scraping fallbacks)

### 1.2 Database Schema [12 Tables Required]

- [ ] Create `/backend/migrations/001_initial.sql` with ALL 12 tables:

  **Core Tables (spec 14):**
  - [ ] `snapshots` - Time-series module data (90 days retention)
  - [ ] `daily_data` - Daily aggregations + ADD `numerology JSONB`, `iching JSONB` columns (missing from spec 14)
  - [ ] `indices_history` - Index trends (1 year retention)
  - [ ] `news_themes` - News analysis (30 days retention)
  - [ ] `system_status` - Health monitoring (7 days retention)

  **Market Tables (spec 20):**
  - [ ] `market_daily` - OHLCV data for SPX, BTC, VIX, Gold, DXY
  - [ ] `market_sentiment` - Fear/greed metrics, put/call ratio

  **Geophysical Tables (spec 21):**
  - [ ] `quakes_daily` - Earthquake statistics
  - [ ] `geophysical_daily` - AP index, pressure, UV, AQI, tides

  **Sentiment Tables (spec 22):**
  - [ ] `sentiment_daily` - Sentiment component scores

  **Correlation Tables (spec 23):**
  - [ ] `correlation_results` - Pre-computed correlations with Wilson CI
  - [ ] `historical_features` - 35 feature columns + 12 outcome columns

- [ ] Create all 9 required indexes:
  - `idx_snapshots_module_time` ON snapshots (module, collected_at DESC)
  - `idx_snapshots_time` ON snapshots (collected_at DESC)
  - `idx_indices_time` ON indices_history (calculated_at DESC)
  - `idx_news_time` ON news_themes (analyzed_at DESC)
  - `idx_status_module_time` ON system_status (module, checked_at DESC)
  - `idx_market_symbol_date` ON market_daily (symbol, date DESC)
  - `idx_corr_outcome` ON correlation_results (outcome)
  - `idx_corr_significant` ON correlation_results (is_significant, outcome)
  - `idx_historical_features_date` ON historical_features (date)

### 1.3 Core Backend

- [ ] Create `/backend/src/config.js` - Environment variables (PORT, DATABASE_URL, GEMINI_API_KEY, NODE_ENV)
- [ ] Create `/backend/src/db.js` - Connection pool + query helpers (saveSnapshot, getLatestSnapshot, saveDailyData, saveSystemStatus)
- [ ] Create `/backend/src/index.js` - Express app entry point with CORS, JSON parsing, route mounting

### 1.4 Scheduler Framework

- [ ] Create `/backend/src/scheduler.js` - Cron job orchestration, dynamic module loader, error handling
- [ ] Create `/backend/src/utils/cache.js` - In-memory TTL cache (default 5 min)

### 1.5 API Routes

- [ ] Create `/backend/src/routes/api.js` with endpoints:
  - `GET /api/current` - All current module data + indices (16 modules)
  - `GET /api/history/:module` - Historical data (query: `days`, default 7, max 90)
  - `GET /api/predictions` - Today's full predictions
  - `GET /api/predictions/:outcome` - Specific outcome prediction
  - `GET /api/correlations` - ADD query params: `feature`, `outcome`, `minSampleSize`, `minLift`
  - `GET /api/patterns` - Current pattern matches
  - `POST /api/backtest` - Custom backtest (body: features, outcome, startDate, endDate)

- [ ] Create `/backend/src/routes/health.js` - Health check endpoints (/health, /health/detailed)

### 1.6 Utility Modules

- [ ] Create `/backend/src/utils/hebrew.js` - Gematria values (aleph=1 to tav=400), Hebrew date parsing
- [ ] Create `/backend/src/utils/astro.js` - Swiss Ephemeris wrapper, Julian day, aspects, zodiac, retrograde detection
- [ ] Create `/backend/src/utils/dateSeeding.js` - Deterministic RNG for Tarot/I Ching selection

### 1.7 Environment & Docker

- [ ] Create `/backend/.env.example` - Template with all required environment variables
- [ ] Create `/backend/Dockerfile` - Multi-stage build for production
- [ ] Create `/backend/docker-compose.yml` - PostgreSQL for local development
  - NOTE: Root `docker-compose.yml` is for Claude Code sandbox, not application
  - Application docker-compose needs: PostgreSQL service, backend service, volume mounts

---

## PHASE 2: LOCAL CALCULATION MODULES [No External Dependencies]

> **Priority:** HIGH - Enables all indices and correlation
> **Dependencies:** Phase 1 complete
> **Parallelizable:** Yes - all 6 modules can be developed simultaneously
> **Estimated effort:** 2-3 days

### Modules (in implementation order)

- [x] Create `/backend/src/modules/tzolkin.js`
  - Algorithm: GMT correlation 584283
  - Output: tone (1-13), toneName, daySign (20 signs), daySignName, meaning
  - Schedule: Daily at 00:00 UTC

- [x] Create `/backend/src/modules/dreamspell.js`
  - Algorithm: Epoch 1987-07-26, skip Feb 29
  - **CRITICAL:** Feb 29 handling undefined in spec - implement as "Day Out of Time" (same kin as Feb 28)
  - Output: kin (1-260), seal (20 seals), tone (13 tones), wavespell, isGAP
  - **ADD:** guidePower, analogPower, antipodePower, occultPower (in spec output but calculation missing)
  - Schedule: Daily at 00:00 UTC

- [x] Create `/backend/data/tarot.json` - 78 cards with id, name, arcana, suit, keywords, element
- [x] Create `/backend/src/modules/tarot.js`
  - Algorithm: hash(YYYY-MM-DD) % 78
  - Output: card, number, arcana, suit, keywords, interpretation
  - Schedule: Daily at 00:00 UTC

- [x] Create `/backend/src/modules/numerology.js`
  - Algorithm: Reduce date digits to single/master number (11, 22, 33 preserved)
  - Output: universalDay, dayMeaning, dayRuler, planetaryHours[], currentHourRuler
  - **DEPENDENCY:** Requires sunrise/sunset data (source undefined in spec - use Open-Meteo or Hebcal)
  - Schedule:
    - Universal day: Daily at 00:00 UTC
    - Planetary hours: Every 30 minutes (spec 17 requirement)

- [x] Create `/backend/data/iching.json` - 64 hexagrams with number, name, chinese, trigrams, judgment
- [x] Create `/backend/src/modules/iching.js`
  - Algorithm: hash(YYYY-MM-DD) % 64 + 1
  - Output: number, name, chinese, upperTrigram, lowerTrigram, judgment, keywords
  - Schedule: Daily at 00:00 UTC

- [x] Create `/backend/src/modules/gematria.js`
  - Dependencies: utils/hebrew.js, parasha module
  - Output: hebrewDate, dateGematria, reducedValue, parashaGematria
  - Schedule: Daily at 00:00 UTC

---

## PHASE 3: EXTERNAL API MODULES [Risk: API Failures]

> **Priority:** HIGH - Required for indices and correlation
> **Dependencies:** Phase 1 complete
> **Parallelizable:** Yes - all 10 modules can be developed simultaneously
> **Risk:** External API failures - each module needs fallback strategy
> **Estimated effort:** 4-5 days

### High Priority (needed for indices/correlation)

- [ ] Create `/backend/src/modules/moon.js`
  - Primary: Swiss Ephemeris | Fallback: Farmsense API
  - Output: phase, phaseName, illumination, age, sign, voidOfCourse, nextPhase
  - Schedule: Every 3 hours

- [ ] Create `/backend/src/modules/astrology.js`
  - Primary: Swiss Ephemeris (local - no external dependency)
  - **SETUP:** Download and configure ephemeris files (.se1) - location and size unspecified in spec
  - Output: planets[] (12 bodies), aspects[], retrogrades[], eclipseInfo, voidOfCourseMoon
  - **GAP:** VOC calculation algorithm not specified - requires tracking Moon's last/next aspects
  - **GAP:** Eclipse data source not specified (Swiss Ephemeris can calculate)
  - Schedule: Every 3 hours

- [ ] Create `/backend/src/modules/solar.js`
  - Primary: NOAA SWPC (5 endpoints) | Fallback: Cache last known
  - Output: kpIndex, apIndex, flareClass, sunspotNumber, solarWind
  - Schedule: Every 3 hours

- [ ] Create `/backend/src/modules/markets.js`
  - Primary: Yahoo Finance + CoinGecko + Fear/Greed APIs | Fallback: Cache
  - Output: spx{}, btc{}, vix{}, gold{}, dxy{}, cryptoFearGreed{}
  - **GAP:** Put/Call Ratio and VIX Term Structure (spec 20) - CBOE data access undefined
    - Option A: Scrape from CBOE website (unreliable)
    - Option B: Use yahoo-finance2 for VIX only, skip Put/Call for MVP
  - **GAP:** Volume anomaly detection thresholds undefined (spec shows output but no rules)
  - Schedule: Every 3 hours (spec requires 15min - see DECISION 1)

- [ ] Create `/backend/src/modules/geophysical.js`
  - Primary: USGS + Open-Meteo + NOAA Tides | Fallback: Cache
  - Output: quakeCount, maxMagnitude, significantQuakes[], weather{}, activityLevel
  - **GAP:** Activity level thresholds undefined - need baseline "average" for comparison
    - Implement: Use rolling 30-day average as baseline (spec 21 mentions but doesn't define)
    - Levels: Low (<50% avg), Normal (50-150%), Elevated (150-300%), High (>300%)
  - **GAP:** Seismic energy formula defined (log10(E) = 1.5*M + 4.8) but no baseline specified
  - Schedule: Every 3 hours (spec requires hourly - see DECISION 1)

### Medium Priority

- [ ] Create `/backend/src/modules/parasha.js`
  - Primary: Hebcal API | Fallback: Static 54 portions
  - Output: name, hebrewName, book, chapters, hebrewDate, shabbatTime
  - Schedule: Weekly (Friday sunset)
  - **GAP:** Hebrew leap year handling undefined - double parashiot (combined portions) in non-leap years
  - **GAP:** Holiday conflict handling - major holidays interrupt regular Torah reading schedule

- [ ] Create `/backend/src/modules/schumann.js` [HIGH RISK - Unreliable source]
  - Primary: Tomsk Observatory image scraping (http://sosrff.tsu.ru/new/shm.jpg)
  - **GAP:** Image parsing algorithm undefined - spectrogram is visual, not structured data
  - **WORKAROUND:** Cache spectrogram image + estimate amplitude from Kp correlation
  - Fallback: Estimate from Kp index (high Kp → elevated Schumann activity)
  - Output: baseFrequency, amplitude, activity, source, isEstimated, spectrogramUrl
  - Schedule: Every 3 hours

- [ ] Create `/backend/src/modules/news.js` [Requires GEMINI_API_KEY]
  - Primary: RSS feeds (BBC, AP, Reuters) + Gemini analysis | Fallback: Cache
  - Output: themes[], dominantTheme, sentiment, articleCount
  - Schedule: Every 3 hours

- [ ] Create `/backend/src/modules/cosmic.js`
  - Primary: NOAA cosmic ray data + static meteor calendar
  - **GAP:** No confirmed API for cosmic ray data (spec mentions Oulu, Moscow monitors but no API)
  - **WORKAROUND:** Estimate cosmic rays from solar activity (inverse correlation: high solar = low cosmic)
  - Meteor showers: Use static `/backend/data/meteor_showers.json` (annual calendar)
  - Output: cosmicRayLevel, neutronCount (estimated), activeShowers[], nextPeak
  - Schedule: Every 3 hours

- [ ] Create `/backend/src/modules/sentiment.js`
  - Primary: Crypto F&G + CNN F&G + Google Trends | Fallback: Cache
  - Output: cryptoFearGreed, cnnFearGreed, trends{}, aggregate
  - **GAP:** newsSentiment source/implementation undefined (spec mentions 20% weight but no details)
  - **GAP:** socialMood source/implementation undefined (spec mentions 20% weight but no details)
  - **GAP:** CNN F&G scraping - no code provided, endpoint is unofficial (`production.dataviz.cnn.io`)
    - Implement: Use axios + cheerio to scrape, or treat as unreliable and weight toward Crypto F&G
  - **GAP:** Put/Call Ratio source (CBOE) - access method not detailed, may require paid API
  - **WORKAROUND:** Redistribute weights: Crypto 30%, CNN 30%, Google Trends 40% (if social/news unavailable)
  - Schedule: Every 3 hours (spec requires hourly - see DECISION 1)

---

## PHASE 4: COMPOSITE INDICES [Requires Phase 2+3 Data]

> **Priority:** MEDIUM - Required for predictions
> **Dependencies:** Phases 2 and 3 modules complete
> **Estimated effort:** 1 day

- [ ] Create `/backend/src/indices/solarGeo.js`
  - Formula: Kp(40%) + Flare(30%) + Schumann(20%) + Wind(10%)
  - Levels: Calm (0-2), Low (2-4), Moderate (4-6), Elevated (6-8), High (8-10)
  - **GAP:** "trend" field shown in spec 13 output but calculation undefined
    - Implement: Compare current value to 24h ago - "rising" if +0.5, "falling" if -0.5, else "stable"
  - Update: Every 3 hours

- [ ] Create `/backend/src/indices/astroEvents.js`
  - Points: Retrogrades (+1 each, Mercury +1 bonus), Eclipse proximity (+2-4), Major aspects (+1), VOC (+0.5), Full/New moon (+1)
  - Levels: Quiet (0), Low (1-2), Active (3-4), Busy (5-6), Intense (7+)
  - **GAP:** Define "outer planets" for major aspect scoring (assume: Jupiter, Saturn, Uranus, Neptune, Pluto)
  - **GAP:** Define aspect types that count as "major" (assume: conjunction, opposition only for outer planets)
  - Update: Every 3 hours

- [ ] Create `/backend/src/indices/calendarSync.js`
  - Points: GAP day (+2), Wavespell start (+1), Rosh Chodesh (+1), Full/New moon on Shabbat (+1), Matching numbers (+1)
  - Levels: None (0), Low (1), Moderate (2-3), High (4-5), Rare (6+)
  - **Include 52 GAP_DAYS array per spec 13**
  - Update: Daily

---

## PHASE 5: CORRELATION ENGINE [Requires ALL Modules + Historical Data]

> **Priority:** CRITICAL - Core differentiator of the application
> **Dependencies:** ALL Phase 2+3 modules complete, 30+ days of collected data
> **Estimated effort:** 4-5 days
> **Statistical Requirements:**
> - Minimum sample size: n >= 30
> - Wilson confidence intervals (not normal approximation)
> - Chi-square test with p < 0.05
> - Probability bounds: 5%-95%

### Historical Data

- [ ] Create `/backend/src/correlation/historical.js`
  - Data ingestion and backfill scripts
  - Sources: S&P 500 (1950+), Bitcoin (2014+), Earthquakes (2000+), Solar/Kp (1930+)

### Feature Engineering

- [ ] Create `/backend/src/correlation/features.js`
  - 35+ features from spec 23:
    - Cosmic/Esoteric (23): moon_phase, moon_sign, moon_illumination, moon_void_of_course, tzolkin_tone, tzolkin_sign, dreamspell_kin, dreamspell_wavespell, mercury_retrograde, venus_retrograde, mars_retrograde, planets_retrograde_count, sun_sign, major_aspects_count, eclipse_proximity, hebrew_day, hebrew_month, parasha_index, numerology_day, tarot_card, iching_hexagram, planetary_hour, day_of_week
    - Geophysical (9): kp_index, ap_index, solar_flare_class, sunspot_number, solar_wind_speed, schumann_amplitude, quake_count_24h, quake_max_magnitude, **quake_energy_log** (ADD - missing from plan)
    - Sentiment (4): fear_greed_cnn, fear_greed_crypto, vix, sentiment_aggregate (consider adding **put_call_ratio**)

### Outcomes

- [ ] Create `/backend/src/correlation/outcomes.js`
  - 12 binary outcomes from spec 23:
    - Market: spx_direction, spx_volatile, btc_direction, btc_volatile, vix_spike, gold_direction
    - Geophysical: major_quake, quake_above_avg, geomag_storm
    - Sentiment: sentiment_drop, fear_spike
  - (spx_return continuous outcome excluded per DECISION 4)

### Statistical Engine

- [ ] Create `/backend/src/correlation/statistics.js`
  - **Wilson Confidence Interval**: `center = (p + z^2/2n) / (1 + z^2/n)`
  - **Chi-Square Test**: Contingency table, chi-square statistic, p-value
  - **Conditional Probability**: P(outcome | feature)
  - **Validation**: Require n >= 30, p < 0.05
  - **CRITICAL GAP:** Must implement these helper functions (undefined in spec 23):
    - `buildContingencyTable(data, feature, outcome)` - Create 2x2 contingency table
    - `calculateChiSquare(table)` - Compute chi-square statistic from table
    - `chiSquarePValue(chiSq, df)` - Look up p-value from chi-square distribution
  - **ADD:** Continuous feature binning strategy (spec 23 undefined - implement quartiles or custom thresholds)

### Computation

- [ ] Create `/backend/src/correlation/compute.js`
  - Single feature correlations (all feature x outcome combinations)
  - Key combinations (spec 23 only defines 4 - need to expand):
    1. Mercury retrograde + Full Moon
    2. High Kp (>=5) + New Moon
    3. Multiple retrogrades (>=3) + VIX elevated (>=20)
    4. Eclipse proximity (<=7 days) + Fear index (<=30)
    5. **ADD:** VOC Moon + Major aspect count (>=3)
    6. **ADD:** GAP day + Mercury retrograde
    7. **ADD:** Hebrew month start + Full moon
    8. **ADD:** Solar flare (M+) + High Schumann amplitude
  - Schedule: Weekly full (Sunday), daily incremental
  - Storage: correlation_results table (only if n >= 30 and p < 0.05)
  - **CRITICAL:** Add Bonferroni correction for multiple comparisons (36 features × 12 outcomes = 432 tests)

### Pattern Matching

- [ ] Create `/backend/src/correlation/patterns.js`
  - Feature similarity scoring (>80% match threshold)
  - Historical date matching and outcome analysis
  - Match score: Categorical (exact=1, else=0), Continuous (within 10%=0.5, exact=1)
  - **CRITICAL GAP:** Must implement these functions (undefined in spec 23/24):
    - `matchesFeatures(todayFeatures, correlationCondition)` - Match today's data to correlation rules
    - `calculateSimilarity(featuresA, featuresB)` - Compute similarity % between feature sets
    - `groupAndAnalyzeMatches(matches)` - Aggregate multiple historical matches
  - **ADD:** Define feature weighting (are all features equally important? spec unclear)

---

## PHASE 6: PREDICTION SYSTEM [Requires Correlation Engine]

> **Priority:** CRITICAL - User-facing predictions
> **Dependencies:** Phase 5 complete
> **Estimated effort:** 3-4 days

### Prediction Calculator

- [ ] Create `/backend/src/prediction/calculator.js`
  - Get today's features from all modules
  - Find matching correlations from database
  - Log-odds combination:
    ```
    combinedLogOdds = log(baseRate / (1-baseRate))
    for each factor: lift = probability / baseRate, weight = log(sampleSize) / 10
    combinedLogOdds += log(lift) * weight
    probability = 1 / (1 + exp(-combinedLogOdds))
    ```
  - Apply bounds: 5% to 95%

### Factor Analysis

- [ ] Create `/backend/src/prediction/factors.js`
  - Individual factor contribution calculation
  - Lift: probability / base_rate
  - Rank factors by impact

### Confidence Assessment

- [ ] Create `/backend/src/prediction/confidence.js`
  - Levels per spec 24:
    - Very High: n > 200, CI width < 0.15, p < 0.001
    - High: n > 100, CI width < 0.20, p < 0.01
    - Medium: n > 50, CI width < 0.30, p < 0.05
    - Low: n > 30, CI width < 0.40, p < 0.10
    - Insufficient: n < 30 or p > 0.10

### Alerts and Suggestions

- [ ] Create `/backend/src/prediction/alerts.js`
  - Pattern match detection (>80% similarity)
  - Historical outcome retrieval for matching dates

- [ ] Create `/backend/src/prediction/suggestions.js`
  - Favorable/Caution categorization
  - **Required disclaimer:**
    > "These predictions are based on historical statistical correlations and are provided for informational/entertainment purposes only. Past patterns do not guarantee future outcomes. This is not financial, medical, or professional advice."

### Prediction Summary [NEW - Missing from original plan]

- [ ] Create `/backend/src/prediction/summary.js`
  - `overallTension`: "high" | "medium" | "low"
  - `tensionScore`: 0.0-10.0
  - `topRisks[]`: Array of highest probability negative outcomes
  - `stableFactors[]`: Array of stability indicators

### API Integration

- [ ] Update `/backend/src/routes/api.js` with full prediction endpoints
  - Full payload generation per spec 24
  - Caching: Regenerate every 3 hours

---

## PHASE 7: FRONTEND [Can Start After Phase 1]

> **Priority:** MEDIUM - User interface
> **Dependencies:** Phase 1 (structure), All backend phases (testing)
> **Parallelizable:** Can begin structure after Phase 1; full testing needs complete backend
> **Estimated effort:** 4-5 days

### 7.1 Core Structure

- [ ] Create `/frontend/index.html` - Semantic HTML5, meta viewport, ES module scripts
- [ ] Create `/frontend/css/styles.css`
  - CSS variables: --bg-primary (#0a0a0f), --bg-card (#12121a), --text-primary (#e0e0e0)
  - Confidence colors: --confidence-high (#4ade80), --confidence-medium (#fbbf24), --confidence-low (#f87171)
  - Typography: Inter (body), JetBrains Mono (numbers)
  - Responsive grid: 4 cols desktop, 2 tablet, 1 mobile

### 7.2 JavaScript Core

- [ ] Create `/frontend/js/config.js` - API URL detection (localhost vs production)
- [ ] Create `/frontend/js/api.js` - Fetch wrapper, caching, retry logic
- [ ] Create `/frontend/js/app.js` - Main orchestration, 30min auto-refresh

### 7.3 Prediction Components [Primary UI]

- [ ] Create `/frontend/js/components/predictions.js`
  - Probability bar visualization
  - Confidence interval display [low-high%]
  - Sample size badges (n=XX)
  - Factor expansion (collapsible)

- [ ] Create `/frontend/js/components/alerts.js`
  - Pattern alert panel (conditional - only show if match >80%)
  - Match score badge, historical dates

### 7.4 Supporting Components

- [ ] Create `/frontend/js/components/indices.js` - Three indices inline display with trend arrows
- [ ] Create `/frontend/js/components/states.js` - Loading skeletons, error states, freshness badges
- [ ] Create `/frontend/js/components/suggestions.js` - Favorable/Caution lists, **mandatory disclaimer**

### 7.5 Module Cards (16 total)

- [ ] Create `/frontend/js/components/modules/moon.js`
- [ ] Create `/frontend/js/components/modules/tzolkin.js`
- [ ] Create `/frontend/js/components/modules/dreamspell.js`
- [ ] Create `/frontend/js/components/modules/parasha.js`
- [ ] Create `/frontend/js/components/modules/gematria.js`
- [ ] Create `/frontend/js/components/modules/astrology.js`
- [ ] Create `/frontend/js/components/modules/solar.js`
- [ ] Create `/frontend/js/components/modules/schumann.js`
- [ ] Create `/frontend/js/components/modules/tarot.js`
- [ ] Create `/frontend/js/components/modules/numerology.js`
- [ ] Create `/frontend/js/components/modules/iching.js`
- [ ] Create `/frontend/js/components/modules/cosmic.js`
- [ ] Create `/frontend/js/components/modules/markets.js`
- [ ] Create `/frontend/js/components/modules/geophysical.js`
- [ ] Create `/frontend/js/components/modules/sentiment.js`
- [ ] Create `/frontend/js/components/modules/news.js`

### 7.6 Accessibility & UX (Gap from Spec 02)

- [ ] Add ARIA labels to all interactive elements
- [ ] Implement keyboard navigation for expandable cards
- [ ] Define tablet breakpoint (spec only has mobile ≤640px and desktop ≥1200px)
- [ ] Font loading strategy (FOUT vs FOIT) for Inter and JetBrains Mono
- [ ] Define animation durations for expand/collapse (only probability bar 0.3s specified)

### 7.7 Deployment

- [ ] Create `/frontend/vercel.json` - SPA rewrites, cache headers (max-age=300)

---

## PHASE 8: INTEGRATION & PRODUCTION

> **Priority:** FINAL - Testing and deployment
> **Dependencies:** All previous phases functional
> **Estimated effort:** 3-4 days

### 8.1 Data Flow Verification

- [ ] Verify module -> scheduler -> database flow (all 16 modules)
- [ ] Verify database -> API -> frontend flow
- [ ] Test correlation engine with real data (minimum 30 samples)
- [ ] Test prediction generation end-to-end
- [ ] Verify all 3 indices calculate correctly

### 8.2 Fallback & Error Handling

- [ ] Implement fallbacks for all external APIs per spec 16:
  - Moon: Swiss Ephemeris (local) <- Farmsense (API)
  - Astrology: Swiss Ephemeris only
  - Parasha: Hebcal <- Static 54-portion cycle
  - Solar: NOAA <- Cache last known
  - Schumann: Tomsk <- Estimate from Kp
  - News: RSS + Gemini <- Cache
  - Markets: Yahoo Finance <- CoinGecko <- Cache
  - Geophysical: USGS <- Cache
  - Sentiment: Multiple APIs <- Cache
- [ ] Add stale data flags when using cached data
- [ ] Create error logging to stdout (for Railway)
- [ ] Implement system_status tracking

### 8.3 Data Retention Jobs

- [ ] Implement cleanup cron jobs:
  - Daily: Delete snapshots > 90 days, system_status > 7 days
  - Weekly: Delete news_themes > 30 days
  - Monthly: Delete indices_history > 1 year

### 8.4 Performance

- [ ] Add rate limiting (100 req/min/IP)
- [ ] API response caching (5 min TTL)
- [ ] Verify database indexes with EXPLAIN ANALYZE

### 8.5 Testing

- [ ] Unit tests for local modules (Tzolkin, Dreamspell, Tarot, Numerology, I Ching, Gematria)
- [ ] Integration tests for API endpoints
- [ ] Statistical engine validation (Wilson interval, chi-square)

### 8.6 Deployment

- [ ] Railway setup:
  - Connect GitHub repository
  - Add PostgreSQL addon
  - Set environment variables (DATABASE_URL, GEMINI_API_KEY, NODE_ENV)
  - Configure custom domain (optional)

- [ ] Vercel setup:
  - Connect GitHub repository
  - Set root directory to `frontend/`
  - Automatic deployments on push

- [ ] Post-deployment verification:
  - Health check endpoint responds
  - All modules collecting data
  - Frontend loads and displays data

---

# CRITICAL GAPS & SPEC INCONSISTENCIES

## Database Schema Gaps

| Table | Spec Source | Issue |
|-------|-------------|-------|
| `daily_data` | spec 14 | Missing `numerology`, `iching` JSONB columns |
| `market_daily` | spec 20 | Not in main spec 14 - add to migration |
| `market_sentiment` | spec 20 | Not in main spec 14 - add to migration |
| `quakes_daily` | spec 21 | Not in main spec 14 - add to migration |
| `geophysical_daily` | spec 21 | Not in main spec 14 - add to migration |
| `sentiment_daily` | spec 22 | Not in main spec 14 - add to migration |
| `correlation_results` | spec 23 | Full schema needed in migration |
| `historical_features` | spec 23 | Says "34 features" but lists 35+ |

## Update Frequency Inconsistencies

| Module | Spec Frequency | Plan Frequency | Decision Required |
|--------|----------------|----------------|-------------------|
| Markets (prices) | Every 15 min | Every 3 hours | DECISION 1 |
| Markets (sentiment) | Every hour | Every 3 hours | DECISION 1 |
| Geophysical (seismic) | Every hour | Every 3 hours | DECISION 1 |
| Sentiment (F&G) | Every hour | Every 3 hours | DECISION 1 |
| Numerology (planetary hour) | Every 30 min | Daily | FIX: Update to 30min |

## Missing Specification Items

- [ ] Create `specs/25-HISTORICAL-DATA-BOOTSTRAP.md` - Bootstrap process, data sources, bulk import
- [ ] Update `specs/08-MODULE-ASTROLOGY.md` - Swiss Ephemeris file config, eclipse source, ephemeris file management
- [ ] Update `specs/03-MODULE-MOON.md` - Void of Course algorithm detail, fallback strategy
- [ ] Update `specs/05-MODULE-DREAMSPELL.md` - Feb 29 leap day handling, Guide/Analog/Antipode/Occult power calculations
- [ ] Update `specs/11-MODULE-TAROT.md` - Complete 78-card data (only 1 example provided)
- [ ] Update `specs/18-MODULE-ICHING.md` - Complete 64-hexagram data (only 1 example provided), changing lines transformation algorithm
- [ ] Update `specs/17-MODULE-NUMEROLOGY.md` - Sunrise/sunset data source, dayRulers array mapping
- [ ] Update `specs/22-MODULE-SENTIMENT.md` - News sentiment implementation, social mood implementation
- [ ] Update `specs/23-CORRELATION-ENGINE.md` - Complete KEY_COMBINATIONS list (only 4 defined), continuous feature binning strategy
- [ ] Update `specs/01-BACKEND-API.md` - Response formats for /api/history/:module, error response schema, pagination

## Missing Static Data Files (Must Create Before Module Implementation)

| File | Contents | Source Needed |
|------|----------|---------------|
| `/backend/data/tarot.json` | 78 cards: id, name, arcana, suit, keywords, element, upright/reversed meanings | Rider-Waite-Smith public domain |
| `/backend/data/iching.json` | 64 hexagrams: number, name, chinese, pinyin, unicode, trigrams, judgment, image, keywords | I Ching translations |
| `/backend/data/trigrams.json` | 8 trigrams: name, chinese, symbol, element, attribute | Standard reference |
| `/backend/data/tzolkin_signs.json` | 20 day signs: name, glyph, direction, meaning | Mayan calendar reference |
| `/backend/data/tzolkin_tones.json` | 13 tones: number, name, meaning, energy | Mayan calendar reference |
| `/backend/data/dreamspell_seals.json` | 20 seals: name, color, earth family, guide/analog/antipode/occult relationships | Dreamspell reference |
| `/backend/data/meteor_showers.json` | 8+ showers: name, peak dates, ZHR, radiant, active period | IMO annual data |
| `/backend/data/parasha.json` | 54 portions: name, hebrew, book, chapters, haftarah | Hebcal reference |
| `/backend/data/hebrew_months.json` | 12-13 months: name, hebrew, gematria, season | Hebrew calendar reference |

## Spec Internal Inconsistencies

| Issue | Location | Resolution |
|-------|----------|------------|
| Table naming | spec 01 vs spec 14 | Use spec 14 naming (`snapshots` not `data_snapshots`) |
| Module count | spec 15 vs spec 00 | Use 16 modules (spec 00 is authoritative) |
| Feature count | spec 23 | Treat enumeration as authoritative (36 features including day_of_week) |
| Ap Index | spec 09 title mentions it but body omits it | Add Ap index calculation from Kp (daily average) |
| Dreamspell output | spec 05 | JSON shows Guide/Analog/Antipode powers but no calculation defined |
| Trigram format | spec 18 | Example shows string but output shows object - use object format |
| Confidence levels | spec 24 | "Very High" level defined but no p < 0.001 requirement - add it |
| Pattern match threshold | specs 23/24 | Both say >80% but calculateSimilarity() gives categorical exact match only |
| Update frequency | spec 17 | Planetary hours every 30min but module header says daily - use 30min |
| Sentiment weights | spec 22 | Weights sum to 100% but newsSentiment/socialMood undefined - redistribute |

## Module Output Inconsistencies

| Module | Spec Says | But Also Shows | Resolution |
|--------|-----------|----------------|------------|
| Tzolkin (04) | `daySign: string` | Example has `daySignNumber` | Include both: `daySign` (name) and `daySignNumber` (0-19) |
| Dreamspell (05) | Basic kin/seal/tone | Example has Guide/Analog/etc | Add power relationships to output |
| I Ching (18) | `lowerTrigram: string` | Output shows object with name/symbol/element | Use object format |
| Astrology (08) | `voidOfCourse` | No calculation algorithm | Implement: track Moon's last major aspect to next ingress |
| Solar (09) | `kpIndex` | Ap Index in title | Add Ap Index (daily Kp average) |

---

# API ENDPOINT GAPS (Spec 01)

| Endpoint | Gap | Resolution |
|----------|-----|------------|
| `GET /api/history/:module` | Response format undefined | Define: `{ module, data: [...], startDate, endDate }` |
| `GET /api/health` | Response format undefined | Define: `{ status, modules: {...}, database, uptime }` |
| All endpoints | Error response format undefined | Define: `{ error, message, code, timestamp }` |
| `GET /api/history/:module` | Pagination missing | Add: `?page=1&limit=100` params |
| `GET /api/current` | Module order undefined | Define consistent alphabetical order |

---

# EXTERNAL API RISK MATRIX

| API/Source | Reliability | Impact | Mitigation |
|------------|-------------|--------|------------|
| Swiss Ephemeris | 100% (local) | N/A | None needed |
| NOAA SWPC (Solar) | High | Medium | Cache 24h, mark stale |
| Hebcal | High | Low | Static fallback |
| Yahoo Finance | Medium | High | CoinGecko fallback + cache |
| CoinGecko | Medium | Medium | Cache + rate limit awareness |
| USGS Earthquakes | High | Medium | Cache, historical fallback |
| Tomsk Schumann | **Low** | Low | Estimate from Kp |
| RSS Feeds | Medium | Low | Multiple sources, cache |
| Gemini AI | High | Medium | Cache last analysis |
| Google Trends | **Low** | Low | Cache 24h, reduce frequency |
| CNN Fear & Greed | **Low** (unofficial) | Medium | Crypto F&G primary |

---

# STATISTICAL REQUIREMENTS REFERENCE

- **Minimum Sample Size**: n >= 30 (Wilson interval assumption)
- **Confidence Intervals**: Wilson score method (better for proportions near 0 or 1)
- **Significance Testing**: Chi-square with p < 0.05
- **Pattern Matching**: >80% feature similarity threshold
- **Probability Bounds**: Clamp predictions to 5%-95% range
- **Confidence Levels**:
  - Very High: n > 200, CI width < 0.15, p < 0.001
  - High: n > 100, CI width < 0.20, p < 0.01
  - Medium: n > 50, CI width < 0.30, p < 0.05
  - Low: n > 30, CI width < 0.40, p < 0.10
  - Insufficient: n < 30 or p > 0.10

---

# CRITICAL PATH DIAGRAM

```
PHASE 0 (Decisions) -----> PHASE 1 (Foundation) -----> PHASE 2 (Local Modules) ----+
                                   |                            |                   |
                                   |                            v                   |
                                   +----------------> PHASE 3 (External APIs) ------+
                                                                                    |
                                                                                    v
                                                                         PHASE 4 (Indices)
                                                                                    |
                                                                                    v
                                                                         PHASE 5 (Correlation)
                                                                                    |
                                                                                    v
                                                                         PHASE 6 (Predictions)
                                                                                    |
                                   PHASE 7 (Frontend) <-----------------------------+
                                          |                                         |
                                          v                                         |
                                   PHASE 8 (Integration) <--------------------------+
```

**Blocking Dependencies:**
- Phase 0: MUST complete before any code
- Phase 1: BLOCKS all other phases
- Phase 2+3: Can run in parallel after Phase 1
- Phase 4: Requires Phase 2+3 data
- Phase 5: Requires ALL modules + 30+ days of data
- Phase 6: Requires Phase 5 (Correlation Engine)
- Phase 7: Can start structure after Phase 1, needs all backend for testing
- Phase 8: Requires all phases functional

---

# TECH STACK REFERENCE

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Vanilla HTML/CSS/JS | No build tools, direct Vercel deploy |
| Backend | Node.js + Express | API server |
| Database | PostgreSQL + JSONB | Historical data + correlations |
| Scheduling | node-cron | Data collection timing |
| Astrology | swisseph | Planetary calculations (local) |
| Markets | yahoo-finance2 | Stock/index data |
| News | rss-parser + @google/generative-ai | Feed parsing + Gemini analysis |
| Hosting (Backend) | Railway | Node.js + PostgreSQL |
| Hosting (Frontend) | Vercel | Static files + CDN |

---

# ESTIMATED TIMELINE

| Phase | Effort | Cumulative |
|-------|--------|------------|
| Phase 0: Decisions | 1 day | 1 day |
| Phase 1: Foundation | 2-3 days | 4 days |
| Phase 2: Local Modules | 2-3 days | 7 days |
| Phase 3: External APIs | 4-5 days | 12 days |
| Phase 4: Indices | 1 day | 13 days |
| Phase 5: Correlation | 4-5 days | 18 days |
| Phase 6: Predictions | 3-4 days | 22 days |
| Phase 7: Frontend | 4-5 days | 27 days |
| Phase 8: Integration | 3-4 days | 31 days |

**Total Estimated: 4-5 weeks**

Note: Phases 2+3 can overlap. Phase 7 can start after Phase 1 and continue alongside backend development.
