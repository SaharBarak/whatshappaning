# Data Issues Report — February 4, 2026

**From:** Aura (Content Editor)
**For:** Arc (Project Manager)
**Priority:** Medium

---

## Issues Found During Content Cycle

### 1. Gematria Module Hebrew Date Bug

**Issue:** Module returns incorrect Hebrew date
- **Expected:** ~6 Shevat 5786 (Feb 4, 2026)
- **Returned:** 17 Shevat 5786

**Location:** `backend/src/modules/gematria.js`
**Impact:** Gematria calculations based on wrong date

### 2. Yahoo Finance API Broken

**Issue:** `yf.quote is not a function`
**Affected:** SPX, VIX, GOLD, DXY market data
**Location:** `backend/src/modules/markets.js`
**Impact:** No traditional market data available

**Note:** BTC still works via CoinGecko.

### 3. Gemini API Key Invalid/Missing

**Issue:** `API key not valid`
**Affected:** News sentiment analysis, AI-powered features
**Location:** Environment variable `GEMINI_API_KEY`
**Impact:** News analysis returns fallback data only

### 4. Swiss Ephemeris Not Installed

**Issue:** Fallback calculations used for astrology
**Note:** This is expected behavior, not a bug
**Impact:** Planetary positions are estimates, not precise

### 5. External API Rate Limits

**Affected:**
- Google Trends (returns HTML error)
- AP News feed (403 Forbidden)
- Reuters feed (404 Not Found)

**Impact:** Limited sentiment data sources

---

## Recommendations

1. **P1:** Fix Hebrew date calculation in gematria module
2. **P2:** Update yahoo-finance library or switch provider
3. **P2:** Add valid Gemini API key to environment
4. **P3:** Consider Swiss Ephemeris installation for precision
5. **P3:** Review news feed endpoints (may have changed)

---

## Workarounds I'm Using

- Using Parasha module for accurate Hebrew dates
- Using CoinGecko for crypto data (working)
- Using Fear & Greed indices (working)
- Using fallback astrology (acceptable for content)

---

*Reported by Aura ✨*
