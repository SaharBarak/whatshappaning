# Grounded Indices Specification

## Overview
Aggregate measurable data into meaningful indices. These are calculated values, not interpretations.

## Index 1: Solar-Geo Index

### Purpose
Combined measure of solar and geomagnetic activity affecting Earth.

### Components
| Component | Weight | Range | Source |
|-----------|--------|-------|--------|
| Kp Index | 40% | 0-9 | NOAA |
| Solar Flare Class | 30% | 0-10 (A=0, X10=10) | NOAA |
| Schumann Amplitude | 20% | 0-100 normalized | Tomsk |
| Solar Wind Speed | 10% | 300-800 km/s → 0-10 | NOAA |

### Calculation
```javascript
function calculateSolarGeoIndex(data) {
  const kpNorm = data.kpIndex / 9 * 10;           // 0-10
  const flareNorm = flareToNumber(data.flareClass); // 0-10
  const schumannNorm = data.schumannAmplitude / 50 * 10; // 0-10 (cap at 50)
  const windNorm = (data.solarWind - 300) / 500 * 10;    // 0-10

  const index = (
    kpNorm * 0.4 +
    flareNorm * 0.3 +
    schumannNorm * 0.2 +
    windNorm * 0.1
  );

  return Math.round(index * 10) / 10; // One decimal
}

function flareToNumber(flareClass) {
  const classes = { A: 0, B: 1, C: 2, M: 5, X: 8 };
  const letter = flareClass[0];
  const number = parseFloat(flareClass.slice(1)) || 1;
  return Math.min(10, classes[letter] + number / 10);
}
```

### Output
```json
{
  "value": 4.2,
  "level": "Moderate",
  "components": {
    "kp": 3,
    "flare": "C2.1",
    "schumann": 12,
    "wind": 423
  },
  "trend": "stable"
}
```

### Levels
| Value | Level | Color |
|-------|-------|-------|
| 0-2 | Calm | Green |
| 2-4 | Low | Light Green |
| 4-6 | Moderate | Yellow |
| 6-8 | Elevated | Orange |
| 8-10 | High | Red |

---

## Index 2: Astronomical Events

### Purpose
Count of significant astronomical events currently active or imminent.

### Components
| Event | Points | Condition |
|-------|--------|-----------|
| Planet Retrograde | 1 each | Currently retrograde |
| Mercury Retrograde | +1 bonus | Extra significance |
| Eclipse within 14 days | 2 | Approaching or recent |
| Eclipse within 3 days | +2 | Imminent |
| Major Aspect (outer planets) | 1 | Conjunction/Opposition within 3° |
| Void of Course Moon | 0.5 | Currently active |
| Full/New Moon within 24h | 1 | Peak lunar phase |

### Calculation
```javascript
function calculateAstroEvents(data) {
  let points = 0;
  const events = [];

  // Retrogrades
  data.retrogrades.forEach(planet => {
    points += 1;
    events.push(`${planet} retrograde`);
    if (planet === 'Mercury') {
      points += 1; // Bonus for Mercury
    }
  });

  // Eclipse proximity
  if (data.daysToEclipse <= 14) {
    points += 2;
    events.push(`Eclipse in ${data.daysToEclipse} days`);
    if (data.daysToEclipse <= 3) {
      points += 2;
    }
  }

  // Major aspects
  data.aspects
    .filter(a => isOuterPlanet(a.planet1) || isOuterPlanet(a.planet2))
    .filter(a => ['conjunction', 'opposition'].includes(a.type))
    .filter(a => a.orb <= 3)
    .forEach(a => {
      points += 1;
      events.push(`${a.planet1} ${a.type} ${a.planet2}`);
    });

  // Void of course
  if (data.voidOfCourse.active) {
    points += 0.5;
    events.push('Moon void of course');
  }

  // Lunar phase
  if (data.hoursToFullOrNew <= 24) {
    points += 1;
    events.push(`${data.nextPhase} Moon imminent`);
  }

  return { points: Math.round(points), events };
}
```

### Output
```json
{
  "count": 3,
  "events": [
    "Eclipse in 12 days",
    "Saturn square Uranus (2.1°)",
    "Full Moon in 18 hours"
  ],
  "level": "Active"
}
```

### Levels
| Count | Level |
|-------|-------|
| 0 | Quiet |
| 1-2 | Low |
| 3-4 | Active |
| 5-6 | Busy |
| 7+ | Intense |

---

## Index 3: Calendar Sync

### Purpose
Identify interesting convergences between calendar systems.

### Components
| Convergence | Points | Example |
|-------------|--------|---------|
| Tzolkin portal day | 2 | Galactic Activation Portal |
| Dreamspell wavespell start | 1 | Day 1 of 13-day cycle |
| Hebrew month start (Rosh Chodesh) | 1 | New Hebrew month |
| Full/New moon on Shabbat | 1 | Lunar-weekly sync |
| Same number across systems | 1 | Day 7 in Hebrew + Tone 7 |
| Parasha name matches energy | 1 | e.g., "Bo" (come) on movement day |

### Galactic Activation Portals (GAP)
52 specific Tzolkin days considered energetically significant:
```javascript
const GAP_DAYS = [
  1, 20, 22, 39, 43, 50, 51, 58, 64, 69,
  72, 77, 85, 88, 93, 96, 106, 107, 108, 109,
  110, 111, 112, 113, 146, 147, 148, 149, 150,
  151, 152, 153, 165, 168, 173, 176, 184, 189,
  192, 197, 202, 211, 213, 218, 222, 229, 233,
  240, 241, 248, 253, 260
];
```

### Output
```json
{
  "score": 3,
  "level": "Moderate",
  "convergences": [
    "Galactic Activation Portal day",
    "Rosh Chodesh Shevat",
    "Tone 1 = Wavespell begins"
  ],
  "note": "Multiple calendar systems mark transitions today"
}
```

### Levels
| Score | Level |
|-------|-------|
| 0 | None |
| 1 | Low |
| 2-3 | Moderate |
| 4-5 | High |
| 6+ | Rare Convergence |

---

## Display (Top Banner)

```
┌─────────────────────────────────────────────────────────────┐
│  📊 INDICES                                                  │
│                                                              │
│  Solar-Geo: 4.2 (Moderate)  │  Astro Events: 3  │  Sync: 2  │
│      ████████░░                   Active           Moderate  │
└─────────────────────────────────────────────────────────────┘
```

## Update Frequency
- Solar-Geo: Every 3 hours (follows solar data)
- Astro Events: Every 3 hours (follows astrology)
- Calendar Sync: Daily (calendar-based)
