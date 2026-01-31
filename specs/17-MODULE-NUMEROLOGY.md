# Numerology & Planetary Hours Module

## Overview
Daily numerology (date reduced to single digit) plus current planetary hour.

## Data Points

### Numerology
| Field | Type | Description |
|-------|------|-------------|
| universalDay | number | 1-9 (or 11, 22 master numbers) |
| calculation | string | Shows the reduction (e.g., "31+1+2025 = 2057 → 14 → 5") |
| meaning | string | Brief meaning of the number |
| vibration | string | Energy keyword |

### Planetary Hours
| Field | Type | Description |
|-------|------|-------------|
| currentHour | string | Planet ruling current hour |
| planetSymbol | string | ☉☽♂☿♃♀♄ |
| dayRuler | string | Planet ruling the day |
| hourStart | string | When current hour started |
| hourEnd | string | When current hour ends |
| sequence | array | All 24 hours for today |

## Numerology Calculation

```javascript
function getUniversalDay(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  let sum = day + month + year;

  // Reduce to single digit (preserve 11, 22 as master numbers)
  while (sum > 9 && sum !== 11 && sum !== 22) {
    sum = String(sum).split('').reduce((a, b) => a + parseInt(b), 0);
  }

  return sum;
}
```

### Number Meanings
| Number | Vibration | Keywords |
|--------|-----------|----------|
| 1 | Leadership | New beginnings, independence, initiative |
| 2 | Partnership | Balance, cooperation, diplomacy |
| 3 | Expression | Creativity, communication, joy |
| 4 | Foundation | Stability, hard work, order |
| 5 | Change | Freedom, adventure, versatility |
| 6 | Harmony | Love, responsibility, nurturing |
| 7 | Wisdom | Introspection, spirituality, analysis |
| 8 | Power | Abundance, authority, karma |
| 9 | Completion | Humanitarianism, endings, wisdom |
| 11 | Intuition | Master number, spiritual insight |
| 22 | Master Builder | Master number, manifestation |

## Planetary Hours

Ancient system dividing day into 24 unequal hours ruled by planets.

### Day Rulers (Chaldean order)
| Day | Ruler |
|-----|-------|
| Sunday | Sun ☉ |
| Monday | Moon ☽ |
| Tuesday | Mars ♂ |
| Wednesday | Mercury ☿ |
| Thursday | Jupiter ♃ |
| Friday | Venus ♀ |
| Saturday | Saturn ♄ |

### Hour Sequence
Hours cycle through: Saturn → Jupiter → Mars → Sun → Venus → Mercury → Moon → repeat

First hour after sunrise = day ruler, then follow sequence.

### Calculation
```javascript
function getPlanetaryHour(date, sunrise, sunset) {
  const planets = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
  const dayRulers = [6, 0, 3, 5, 4, 2, 1]; // Sun=3, Mon=0, etc.

  const dayOfWeek = date.getDay();
  const startPlanet = dayRulers[dayOfWeek];

  // Day hours: sunrise to sunset divided by 12
  // Night hours: sunset to next sunrise divided by 12

  const isDay = date >= sunrise && date < sunset;
  const periodStart = isDay ? sunrise : sunset;
  const periodEnd = isDay ? sunset : nextSunrise;
  const hourLength = (periodEnd - periodStart) / 12;

  const hourIndex = Math.floor((date - periodStart) / hourLength);
  const planetIndex = (startPlanet + hourIndex + (isDay ? 0 : 12)) % 7;

  return planets[planetIndex];
}
```

### Day Rulers Index Mapping

The `dayRulers` array maps JavaScript's `Date.getDay()` output (0=Sunday through 6=Saturday) to planet indices:

```javascript
const DAY_RULERS = {
  0: 'Sun',      // Sunday (getDay() returns 0)
  1: 'Moon',     // Monday
  2: 'Mars',     // Tuesday
  3: 'Mercury',  // Wednesday
  4: 'Jupiter',  // Thursday
  5: 'Venus',    // Friday
  6: 'Saturn'    // Saturday
};
```

## Sunrise/Sunset Data Source

### Current Implementation (MVP)

The current implementation uses **fixed times** as a workaround for the MVP:

```javascript
// Fixed sunrise/sunset for MVP (spec gap workaround)
const SUNRISE_HOUR = 6;  // 6:00 AM local time
const SUNSET_HOUR = 18;  // 6:00 PM local time
```

**Implications:**
- Each planetary "hour" is exactly 60 minutes (not traditional unequal hours)
- Does not vary by season or latitude
- Approximation is sufficient for general use

### Future Enhancement

For location-aware planetary hours, integrate with an astronomical API:

**Option 1: Open-Meteo API (Recommended)**
```javascript
const response = await fetch(
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=sunrise,sunset`
);
const { sunrise, sunset } = await response.json().daily;
```

**Option 2: Calculate from coordinates**
- Use astronomical algorithms (NOAA Solar Calculator)
- Requires latitude/longitude input

### Impact of Fixed Times

| Condition | Traditional | Current Implementation |
|-----------|-------------|------------------------|
| Summer (long days) | Day hours > 60 min | Day hours = 60 min |
| Winter (short days) | Day hours < 60 min | Day hours = 60 min |
| Polar regions | Variable | Day hours = 60 min |
| Equinox | ~60 min | 60 min (accurate) |

## Output Example

```json
{
  "numerology": {
    "universalDay": 5,
    "calculation": "31 + 1 + 2025 = 2057 → 14 → 5",
    "meaning": "Day of change, freedom, and unexpected events",
    "vibration": "Change"
  },
  "planetaryHour": {
    "current": "Jupiter",
    "symbol": "♃",
    "dayRuler": "Venus",
    "daySymbol": "♀",
    "hourStart": "14:23",
    "hourEnd": "15:31",
    "isDay": true
  }
}
```

## Display

```
🔮 NUMEROLOGY
─────────────
Universal Day: 5
Change • Freedom
31+1+2025 → 5

Planetary Hour: ♃ Jupiter
Day Ruler: ♀ Venus (Friday)
Hour ends: 15:31
```

## Update Frequency
- Numerology: Daily at 00:00 UTC
- Planetary Hour: Every 30 minutes (hours are ~1h but vary by season)
