# Dreamspell Module

## Overview
The Dreamspell is José Argüelles' modern interpretation of the Tzolkin. It uses similar structure (13 tones × 20 seals) but different correlation and additional concepts like Wavespells, Castles, Earth Families, and Power Relationships.

**Important**: Dreamspell is NOT traditional Mayan. It's a New Age system starting from July 26, 1987 (the "Galactic Synchronization"). We show both Tzolkin (spec 04) and Dreamspell for completeness.

## Data Points

| Field | Type | Description |
|-------|------|-------------|
| kin | number | 1-260 Kin number |
| tone | number | 1-13 |
| toneName | string | Tone name |
| toneKeyword | string | Tone keyword/action |
| seal | string | One of 20 Solar Seals |
| sealNumber | number | 1-20 |
| sealKeyword | string | Seal keyword/essence |
| color | string | Red, White, Blue, Yellow |
| wavespell | number | 1-20 |
| wavespellSeal | string | Seal that initiates current Wavespell |
| castle | string | Red Eastern, White Northern, Blue Western, Yellow Southern, Green Central |
| castleColor | string | Castle color |
| earthFamily | string | Polar, Cardinal, Core, Signal, Gateway |
| guidePower | string | Today's guide seal |
| analogPower | string | Support energy |
| antipodePower | string | Challenge energy |
| occultPower | string | Hidden power |
| isGAP | boolean | Galactic Activation Portal day |
| isLeapDay | boolean | February 29 (Day Out of Time) |

## 20 Solar Seals

| # | Seal | Color | Earth Family | Keyword |
|---|------|-------|--------------|---------|
| 1 | Red Dragon | Red | Gateway | Birth |
| 2 | White Wind | White | Core | Spirit |
| 3 | Blue Night | Blue | Signal | Abundance |
| 4 | Yellow Seed | Yellow | Polar | Flowering |
| 5 | Red Serpent | Red | Polar | Life Force |
| 6 | White Worldbridger | White | Signal | Death |
| 7 | Blue Hand | Blue | Core | Accomplishment |
| 8 | Yellow Star | Yellow | Gateway | Elegance |
| 9 | Red Moon | Red | Gateway | Universal Water |
| 10 | White Dog | White | Core | Love |
| 11 | Blue Monkey | Blue | Signal | Magic |
| 12 | Yellow Human | Yellow | Polar | Free Will |
| 13 | Red Skywalker | Red | Polar | Space |
| 14 | White Wizard | White | Signal | Timelessness |
| 15 | Blue Eagle | Blue | Core | Vision |
| 16 | Yellow Warrior | Yellow | Gateway | Intelligence |
| 17 | Red Earth | Red | Gateway | Navigation |
| 18 | White Mirror | White | Core | Endlessness |
| 19 | Blue Storm | Blue | Signal | Self-Generation |
| 20 | Yellow Sun | Yellow | Polar | Enlightenment |

## 13 Galactic Tones

| # | Tone | Keyword |
|---|------|---------|
| 1 | Magnetic | Purpose |
| 2 | Lunar | Challenge |
| 3 | Electric | Service |
| 4 | Self-Existing | Form |
| 5 | Overtone | Radiance |
| 6 | Rhythmic | Balance |
| 7 | Resonant | Attunement |
| 8 | Galactic | Integrity |
| 9 | Solar | Intention |
| 10 | Planetary | Manifestation |
| 11 | Spectral | Liberation |
| 12 | Crystal | Cooperation |
| 13 | Cosmic | Presence |

## 5 Castles

Each castle contains 4 wavespells (52 days):

| # | Castle | Color | Wavespells |
|---|--------|-------|------------|
| 1 | Red Eastern | Red | 1-4 |
| 2 | White Northern | White | 5-8 |
| 3 | Blue Western | Blue | 9-12 |
| 4 | Yellow Southern | Yellow | 13-16 |
| 5 | Green Central | Green | 17-20 |

## Calculation

### Epoch
Dreamspell starts from July 26, 1987 (Galactic Synchronization), which corresponds to Kin 1 (Magnetic Red Dragon).

### February 29 Handling (Leap Day)
Dreamspell does NOT count February 29. It is treated as a "Day Out of Time" that continues the same Kin as February 28. This ensures the 260-day cycle stays synchronized with the solar year.

```javascript
function getDaysSinceEpoch(date) {
  const DREAMSPELL_EPOCH = new Date('1987-07-26T00:00:00Z');
  let daysSinceEpoch = Math.floor((date - DREAMSPELL_EPOCH) / 86400000);

  // Count and subtract all leap days between epoch and target date
  const startYear = DREAMSPELL_EPOCH.getUTCFullYear();
  const endYear = date.getUTCFullYear();

  let leapDaysToSubtract = 0;

  for (let year = startYear; year <= endYear; year++) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (!isLeap) continue;

    const feb29 = new Date(`${year}-02-29T00:00:00Z`);

    // Only count if Feb 29 is between epoch and target date
    if (feb29 > DREAMSPELL_EPOCH && feb29 < date) {
      leapDaysToSubtract++;
    }

    // If target IS Feb 29, use same kin as Feb 28
    if (date.getUTCMonth() === 1 && date.getUTCDate() === 29 && year === endYear) {
      leapDaysToSubtract++;
    }
  }

  return daysSinceEpoch - leapDaysToSubtract;
}
```

### Basic Kin Calculation
```javascript
function getDreamspell(date) {
  const daysSinceEpoch = getDaysSinceEpoch(date);

  // Kin number (1-260)
  const kin = (daysSinceEpoch % 260) + 1;

  // Tone (1-13)
  const tone = ((kin - 1) % 13) + 1;

  // Seal number (1-20)
  const sealNumber = ((kin - 1) % 20) + 1;

  // Wavespell (which 13-day period, 1-20)
  const wavespell = Math.floor((kin - 1) / 13) + 1;

  return { kin, tone, sealNumber, wavespell };
}
```

## Power Relationships

Each seal has fixed relationships with other seals. These power relationships create a daily "oracle" showing the energetic influences.

### Analog Power (Support)
The Analog is the seal's supportive partner. Analog pairs share complementary qualities.

**Rule:** Pre-defined in seal data. Examples:
- Red Dragon (1) ↔ Yellow Star (8)
- White Wind (2) ↔ Blue Hand (7)
- Blue Night (3) ↔ Yellow Star (8)

### Antipode Power (Challenge)
The Antipode represents the challenging or opposing energy. It's always the seal 10 positions away (same color family, opposite polarity).

**Rule:** `antipode = ((sealNumber + 9) % 20) + 1`

Examples:
- Red Dragon (1) ↔ Blue Monkey (11) — difference of 10
- White Wind (2) ↔ Yellow Human (12)

### Occult Power (Hidden)
The Occult represents hidden or unconscious influences. The seal numbers add up to 21.

**Rule:** `occult = 21 - sealNumber`

Examples:
- Red Dragon (1) + Yellow Sun (20) = 21
- White Wind (2) + Blue Storm (19) = 21
- Blue Night (3) + White Mirror (18) = 21

### Guide Power
The Guide changes based on the current tone position within the wavespell. Each seal has 5 guide seals (for different tone groups).

**Rule:** The guide depends on where the tone falls in the wavespell:
- Tones 1, 2, 3, 4 → Guide index 0 (same seal as daily seal)
- Tones 5, 6, 7, 8 → Guide index 1
- Tones 9, 10, 11, 12 → Guide index 2
- Tone 13 → Guide index 3

The guide seals for each seal are pre-computed in the seal data:

```javascript
function getGuidePower(tone, sealNumber, sealData) {
  let guideIndex;
  if (tone <= 4) guideIndex = 0;
  else if (tone <= 8) guideIndex = 1;
  else if (tone <= 12) guideIndex = 2;
  else guideIndex = 3;

  return sealData.guide[guideIndex];
}
```

Example for Red Dragon:
- Tones 1-4: Guide = Red Dragon (1) — self-guided
- Tones 5-8: Guide = Red Skywalker (13)
- Tones 9-12: Guide = Red Moon (9)
- Tone 13: Guide = Red Serpent (5)

## Galactic Activation Portal (GAP) Days

52 days in the 260-day cycle have special significance as "portals" of increased energy. These are fixed kin numbers:

```javascript
const GAP_KINS = [
  1, 20, 22, 39, 43, 50, 51, 58, 64, 69,
  72, 77, 85, 88, 93, 96, 106, 107, 108, 109,
  110, 111, 112, 113, 146, 147, 148, 149, 150,
  151, 152, 153, 165, 168, 173, 176, 184, 189,
  192, 197, 202, 211, 213, 218, 222, 229, 233,
  240, 241, 248, 253, 260
];
```

GAP days are distributed in a specific pattern within the Tzolkin, forming two columns of 10 days each, plus scattered portal days.

## Static Data Files

### dreamspell_seals.json
Contains all 20 seals with their properties:
```json
{
  "number": 1,
  "name": "Red Dragon",
  "keyword": "Birth",
  "color": "Red",
  "earthFamily": "Gateway",
  "guide": [1, 13, 9, 5, 1],
  "analog": 8,
  "antipode": 11,
  "occult": 20
}
```

### tzolkin_tones.json
Contains all 13 tones (shared with Tzolkin module):
```json
{
  "number": 1,
  "name": "Magnetic",
  "keyword": "Purpose"
}
```

## Output Example

```json
{
  "date": "2026-01-31",
  "kin": 138,
  "tone": 8,
  "toneName": "Galactic",
  "toneKeyword": "Integrity",
  "seal": "White Mirror",
  "sealNumber": 18,
  "sealKeyword": "Endlessness",
  "color": "White",
  "wavespell": 11,
  "wavespellSeal": "Blue Monkey",
  "castle": "Blue Western",
  "castleColor": "Blue",
  "earthFamily": "Core",
  "guidePower": "White Wizard",
  "analogPower": "Blue Night",
  "antipodePower": "Yellow Star",
  "occultPower": "Blue Night",
  "isGAP": false,
  "isLeapDay": false
}
```

## Display

```
🌈 DREAMSPELL
─────────────
Kin 138
Galactic White Mirror
Wavespell 11 (Blue Monkey)
Blue Western Castle

Powers:
  Guide: White Wizard
  Analog: Blue Night
  Antipode: Yellow Star
  Occult: Blue Night

Core Earth Family
```

## Update Frequency
Daily at 00:00 UTC (Dreamspell day changes at midnight local, but we use UTC for consistency with all modules).

## Implementation

**File:** `backend/src/modules/dreamspell.js`

Key exports:
- `calculate(date)` - Calculate Dreamspell for a date
- `getForDate(dateStr)` - Get Dreamspell for date string
- `getNextKin(targetKin, fromDate)` - Find next occurrence of a kin
- `getGAPDaysInYear(year)` - Get all GAP days in a year
- `collect()` - Scheduler function

## Disclaimer

The Dreamspell system was created by José Argüelles in 1987 and is NOT a traditional Mayan calendar system. It uses the same 13 × 20 matrix as the Tzolkin but with different correlation to Gregorian dates and additional modern concepts. For traditional Mayan calculations, refer to the Tzolkin module (spec 04) which uses the GMT correlation constant 584283.
