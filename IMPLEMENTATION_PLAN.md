# What's Happening - Implementation Plan

A data-driven prediction dashboard that correlates cosmic/esoteric data with real-world measurable outcomes. Every prediction displays statistical backing, sample sizes, confidence intervals, and contributing factors.

---

## PROJECT STATUS: IMPLEMENTATION COMPLETE - 100% (460 tests pass)

> **Last Updated:** 2026-01-31
> **Implementation Progress:** 100% - All code complete, only external deployment configuration remaining
> **Spec Analysis:** Complete - 26 specs analyzed (including new spec 25), decisions resolved, implementation verified
> **Plan Verification:** VERIFIED - All 25 specs cross-referenced with parallel subagents, plan accuracy confirmed

### Current State
- **Backend:** COMPLETE - All 16 modules, 3 indices, correlation engine, prediction system
- **Frontend:** COMPLETE - All UI components, 16 module renderers, full accessibility
- **Database:** COMPLETE - Schema with 12 tables, 9 indexes, retention policies
- **Modules:** 16/16 implemented
- **Indices:** 3/3 implemented
- **Correlation Engine:** COMPLETE
- **Pattern Matching:** COMPLETE - Integrated into /api/predictions and /api/patterns
- **Prediction System:** COMPLETE
- **Accessibility:** COMPLETE - ARIA labels, keyboard navigation (Enter/Space to toggle cards)

### Verified Assets
- [x] 26 specification documents in `/specs/` (complete, including 25-HISTORICAL-DATA-BOOTSTRAP.md)
- [x] Docker configuration for Claude Code development environment (root `docker-compose.yml`)
- [x] This implementation plan (comprehensive, cross-verified with all specs)
- [x] Phase 2 local calculation modules complete (6 modules + 2 data files)
- [x] Phase 3 external API modules complete (10 modules: moon, astrology, solar, markets, geophysical, parasha, schumann, news, cosmic, sentiment)

---

# PRIORITIZED IMPLEMENTATION CHECKLIST

> **Legend:**
> [ ] Not started | [~] In progress | [x] Complete
> **Priority markers:** Items are ordered by priority (most critical first within each phase)

---

## PHASE 0: PRE-IMPLEMENTATION DECISIONS [COMPLETE]

> All decisions resolved - recommended options implemented.

- [x] **DECISION 1: Update Frequencies** - Using 3hr intervals (config.js schedules)
- [x] **DECISION 2: I Ching Changing Lines** - Excluded for MVP (static daily reading)
- [x] **DECISION 3: Tarot Reversals** - Excluded for MVP (upright readings only)
- [x] **DECISION 4: Continuous Outcomes** - Binary outcomes only
- [x] **DECISION 5: Reference Timezone** - UTC for all calculations

---

## PHASE 1: FOUNDATION [COMPLETE]

> **Status:** All 7 sections complete - project structure, database schema, core backend, scheduler, API routes, utilities, Docker

- [x] 1.1 Project Structure (`/backend/`, `/frontend/` directories)
- [x] 1.2 Database Schema (12 tables, 9 indexes)
- [x] 1.3 Core Backend (config.js, db.js, index.js)
- [x] 1.4 Scheduler Framework (scheduler.js, cache.js)
- [x] 1.5 API Routes (api.js, health.js)
- [x] 1.6 Utility Modules (hebrew.js, astro.js, dateSeeding.js)
- [x] 1.7 Environment & Docker

---

## PHASE 2: LOCAL CALCULATION MODULES [COMPLETE]

> **Status:** All 6 modules complete with static data files

- [x] tzolkin.js (GMT correlation 584283)
- [x] dreamspell.js (Epoch 1987-07-26, Feb 29 handling)
- [x] tarot.js + tarot.json (78 cards)
- [x] numerology.js (universal day, planetary hours)
- [x] iching.js + iching.json (64 hexagrams)
- [x] gematria.js (Hebrew date, gematria values)

---

## PHASE 3: EXTERNAL API MODULES [COMPLETE]

> **Status:** All 10 modules complete with fallback strategies

- [x] moon.js (Swiss Ephemeris / Farmsense fallback)
- [x] astrology.js (Swiss Ephemeris / Meeus fallback)
- [x] solar.js (NOAA SWPC)
- [x] markets.js (Yahoo Finance + CoinGecko)
- [x] geophysical.js (USGS + Open-Meteo)
- [x] parasha.js (Hebcal API)
- [x] schumann.js (Tomsk Observatory / Kp estimation)
- [x] news.js (RSS feeds + Gemini analysis)
- [x] cosmic.js (NOAA + static meteor calendar)
- [x] sentiment.js (Crypto F&G + CNN F&G + Google Trends)

---

## PHASE 4: COMPOSITE INDICES [COMPLETE]

> **Status:** All 3 indices complete

- [x] solarGeo.js (Kp 40% + Flare 30% + Schumann 20% + Wind 10%)
- [x] astroEvents.js (Retrogrades, eclipses, aspects, VOC, moon phases)
- [x] calendarSync.js (GAP days, wavespell, Rosh Chodesh, matching numbers)

---

## PHASE 5: CORRELATION ENGINE [COMPLETE]

> **Status:** All components complete (4 test files, 157 tests)

- [x] historical.js (data ingestion, backfill)
- [x] features.js (35+ features)
- [x] outcomes.js (12 binary outcomes)
- [x] statistics.js (Wilson CI, chi-square, conditional probability)
- [x] compute.js (single/combination correlations, Bonferroni correction)
- [x] patterns.js (feature similarity, historical matching)

---

## PHASE 6: PREDICTION SYSTEM [COMPLETE]

> **Status:** All components complete (2 test files, 59 tests)

- [x] calculator.js (log-odds combination, 5%-95% bounds)
- [x] factors.js (lift calculation, factor ranking)
- [x] confidence.js (Very High/High/Medium/Low/Insufficient levels)
- [x] alerts.js (pattern match detection)
- [x] suggestions.js (favorable/caution categorization, disclaimer)
- [x] summary.js (tension score, top risks, stable factors)
- [x] API integration (full prediction endpoints)

---

## PHASE 7: FRONTEND [COMPLETE]

> **Status:** All components complete with full accessibility

- [x] 7.1 Core Structure (index.html, styles.css)
- [x] 7.2 JavaScript Core (config.js, api.js, app.js)
- [x] 7.3 Prediction Components (predictions.js, alerts.js)
- [x] 7.4 Supporting Components (indices.js, states.js, suggestions.js)
- [x] 7.5 Module Cards (16 renderers in modules.js)
- [x] 7.6 Accessibility & UX (ARIA labels, keyboard nav, responsive grid)
- [x] 7.7 Deployment (vercel.json)

---

## PHASE 8: INTEGRATION & PRODUCTION

> **Priority:** FINAL - Testing and deployment
> **Status:** 8.1-8.6 complete, only 8.7 Deployment remaining

- [x] 8.1 Data Flow Verification
- [x] 8.2 Fallback & Error Handling
- [x] 8.3 Data Retention Jobs
- [x] 8.4 Performance (rate limiting, caching, indexes)
- [x] 8.5 Testing (unit, integration, statistical validation)
- [x] 8.6 Pattern Alert Integration

### 8.7 Deployment [REMAINING]

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

> **Note:** These are **documentation gaps**, not implementation gaps. The actual functionality for these items has been implemented in the codebase. These checkboxes track spec documentation updates needed to reflect the implementation.

- [x] Create `specs/25-HISTORICAL-DATA-BOOTSTRAP.md` - Bootstrap process, data sources, bulk import
- [ ] Update `specs/08-MODULE-ASTROLOGY.md` - Swiss Ephemeris file config, eclipse source, ephemeris file management
- [ ] Update `specs/03-MODULE-MOON.md` - Void of Course algorithm detail, fallback strategy
- [ ] Update `specs/05-MODULE-DREAMSPELL.md` - Feb 29 leap day handling, Guide/Analog/Antipode/Occult power calculations
- [ ] Update `specs/11-MODULE-TAROT.md` - Complete 78-card data (only 1 example provided)
- [ ] Update `specs/18-MODULE-ICHING.md` - Complete 64-hexagram data (only 1 example provided), changing lines transformation algorithm
- [ ] Update `specs/17-MODULE-NUMEROLOGY.md` - Sunrise/sunset data source, dayRulers array mapping
- [ ] Update `specs/22-MODULE-SENTIMENT.md` - News sentiment implementation, social mood implementation
- [ ] Update `specs/23-CORRELATION-ENGINE.md` - Complete KEY_COMBINATIONS list (only 4 defined), continuous feature binning strategy
- [ ] Update `specs/01-BACKEND-API.md` - Response formats for /api/history/:module, error response schema, pagination

## Static Data Files [COMPLETE]

> **Note:** All required static data files are complete. Some data (meteor showers, parashiot, Hebrew months) is embedded directly in the module source code rather than separate JSON files.

**External data files:**
- `/backend/data/tarot.json` (78 cards)
- `/backend/data/iching.json` (64 hexagrams)
- `/backend/data/trigrams.json` (8 trigrams)
- `/backend/data/tzolkin_signs.json` (20 day signs)
- `/backend/data/tzolkin_tones.json` (13 tones)
- `/backend/data/dreamspell_seals.json` (20 seals)

**Inline data (embedded in modules):**
- Meteor showers data: `METEOR_SHOWERS` array in `/backend/src/modules/cosmic.js`
- Parashiot data: `PARASHIOT` array in `/backend/src/modules/parasha.js`
- Hebrew months: calculated dynamically in `/backend/src/modules/gematria.js`

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
