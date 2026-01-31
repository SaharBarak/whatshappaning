# Astrology Module

## Overview
Full planetary positions, aspects, and current transits. Detailed view expandable from summary.

## Data Points

### Planetary Positions
| Field | Type | Description |
|-------|------|-------------|
| planet | string | Planet name |
| sign | string | Zodiac sign |
| degree | number | Degrees within sign (0-29.99) |
| retrograde | boolean | If planet is retrograde |
| house | number | House position (if using whole sign from Aries) |

### Planets to Track
- Sun, Moon, Mercury, Venus, Mars
- Jupiter, Saturn, Uranus, Neptune, Pluto
- North Node (Rahu), South Node (Ketu)
- Chiron (optional)

### Aspects
| Field | Type | Description |
|-------|------|-------------|
| planet1 | string | First planet |
| planet2 | string | Second planet |
| aspect | string | Conjunction, Opposition, Trine, Square, Sextile |
| orb | number | Degrees from exact |
| applying | boolean | If aspect is forming (true) or separating (false) |

### Aspect Orbs (default)
- Conjunction (0°): ±8°
- Opposition (180°): ±8°
- Trine (120°): ±8°
- Square (90°): ±7°
- Sextile (60°): ±6°

### Additional Data
| Field | Type | Description |
|-------|------|-------------|
| retrogrades | array | Currently retrograde planets |
| eclipseSeason | object | Proximity to next eclipse |
| voidOfCourseMoon | object | Current VOC status |

## Data Source

### Free Options:

1. **Astronomy API** (limited free tier)
   ```
   https://api.astronomyapi.com/api/v2/bodies/positions
   ```

2. **Swiss Ephemeris** (calculate locally)
   - npm: `swisseph`
   - Most accurate, no API dependency
   - Requires ephemeris files

3. **Astro.com** (scrape - not recommended for production)

4. **Open-Meteo Astronomy** (basic sun/moon only)

### Recommended: Swiss Ephemeris
```javascript
const swisseph = require('swisseph');

function getPlanetPosition(julianDay, planet) {
  const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;
  const result = swisseph.swe_calc_ut(julianDay, planet, flags);

  const longitude = result.longitude;
  const sign = Math.floor(longitude / 30);
  const degree = longitude % 30;
  const retrograde = result.longitudeSpeed < 0;

  return { sign, degree, retrograde };
}
```

## Installation & Configuration

### Swiss Ephemeris Setup

The module uses Swiss Ephemeris for precise astronomical calculations. It is configured as an **optional dependency**:

```bash
npm install --ignore-optional  # Installs without swisseph (uses fallback)
npm install                    # Attempts swisseph installation
```

**Ephemeris Files:**
- Swiss Ephemeris requires ephemeris data files for precise calculations
- Default paths: `/usr/share/swisseph/` (Unix) or system default
- The `swisseph` npm package includes embedded ephemeris data
- Environment variable: `SE_EPHE_PATH` (if custom path needed)

**Fallback Strategy:**
When Swiss Ephemeris is unavailable (installation fails, files missing), the module automatically falls back to simplified Meeus algorithms:
- Accuracy loss: ~1-2° for planetary positions
- Output includes `estimated: true` flag
- Output includes explanatory note message

### Eclipse Data Source

Eclipse data is currently **hardcoded** in the module:

```javascript
const UPCOMING_ECLIPSES = [
  { type: 'Solar', date: '2026-02-17T12:01:00Z' },
  { type: 'Lunar', date: '2026-03-03T11:33:00Z' },
  { type: 'Solar', date: '2026-08-12T17:46:00Z' },
  { type: 'Lunar', date: '2026-08-28T04:13:00Z' }
];
```

**Maintenance Requirements:**
- Update eclipse data annually for upcoming eclipses
- Source: NASA Eclipse Predictions or Swiss Ephemeris library
- After the last hardcoded date, `nextEclipse` returns `type: 'Unknown'`

**Future Enhancement:** Fetch eclipse data dynamically from NASA or compute using Swiss Ephemeris.

### Graceful Degradation

The module implements graceful degradation to ensure it always returns valid data:

| Condition | Behavior | Quality Indicator |
|-----------|----------|-------------------|
| Swiss Ephemeris available | Precise calculations | `estimated: false` |
| Swiss Ephemeris unavailable | Meeus approximation | `estimated: true` + note |
| Eclipse data outdated | Returns Unknown type | `type: 'Unknown'` |
| API/calculation error | Partial data with note | Error message in note |

### Data Quality Indicators

When data quality is degraded, the output includes:

```json
{
  "estimated": true,
  "note": "Using simplified calculations. Swiss Ephemeris not available."
}
```

## Output Example

```json
{
  "timestamp": "2025-01-31T12:00:00Z",
  "planets": [
    {
      "planet": "Sun",
      "sign": "Aquarius",
      "degree": 11.23,
      "retrograde": false,
      "glyph": "☉"
    },
    {
      "planet": "Moon",
      "sign": "Leo",
      "degree": 15.67,
      "retrograde": false,
      "glyph": "☽"
    },
    {
      "planet": "Mercury",
      "sign": "Capricorn",
      "degree": 28.45,
      "retrograde": false,
      "glyph": "☿"
    }
  ],
  "aspects": [
    {
      "planet1": "Sun",
      "planet2": "Moon",
      "aspect": "Opposition",
      "symbol": "☍",
      "orb": 4.44,
      "applying": false
    },
    {
      "planet1": "Venus",
      "planet2": "Mars",
      "aspect": "Conjunction",
      "symbol": "☌",
      "orb": 2.31,
      "applying": true
    }
  ],
  "retrogrades": ["None currently"],
  "nextEclipse": {
    "type": "Lunar",
    "date": "2025-03-14",
    "daysUntil": 42
  },
  "voidOfCourseMoon": {
    "active": false,
    "nextStart": "2025-02-01T08:23:00Z",
    "nextEnd": "2025-02-01T14:15:00Z"
  }
}
```

## Display (Collapsed)

```
♈ ASTROLOGY
─────────────
☉ Sun: 11° Aquarius
☽ Moon: 15° Leo
☿ Mercury: 28° Capricorn
No retrogrades
[Expand for full chart →]
```

## Display (Expanded)

```
♈ ASTROLOGY (Full)
═══════════════════════════════════════

PLANETS
─────────────────────────────────────
☉ Sun      11°23' Aquarius
☽ Moon     15°67' Leo
☿ Mercury  28°45' Capricorn
♀ Venus     5°12' Pisces
♂ Mars      7°43' Pisces      ☌ Venus
♃ Jupiter  14°21' Gemini
♄ Saturn   18°05' Pisces
♅ Uranus   24°33' Taurus
♆ Neptune  28°12' Pisces
♇ Pluto     3°45' Aquarius
☊ N.Node    1°20' Aries

ACTIVE ASPECTS
─────────────────────────────────────
☉ ☍ ☽  Opposition  (4.4° orb)
♀ ☌ ♂  Conjunction (2.3° orb, applying)
☿ △ ♃  Trine       (5.8° orb)

STATUS
─────────────────────────────────────
Retrogrades: None
Void Moon: No (next: Feb 1, 08:23)
Eclipse: Lunar in 42 days
```

## Update Frequency
Every 3 hours (Moon moves ~6° in 3 hours)
