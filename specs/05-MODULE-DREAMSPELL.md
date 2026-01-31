# Dreamspell Module

## Overview
The Dreamspell is José Argüelles' modern interpretation of the Tzolkin. It uses similar structure (13 tones × 20 seals) but different correlation and additional concepts like Wavespells, Castles, and Earth Families.

**Important**: Dreamspell is NOT traditional Mayan. It's a New Age system starting from July 26, 1987. We show both for completeness.

## Data Points

| Field | Type | Description |
|-------|------|-------------|
| kin | number | 1-260 Kin number |
| tone | number | 1-13 |
| toneName | string | Tone name |
| seal | string | One of 20 Solar Seals |
| sealNumber | number | 0-19 |
| color | string | Red, White, Blue, Yellow |
| wavespell | number | 1-20 |
| wavespellSeal | string | Seal that initiates current Wavespell |
| castle | string | Red, White, Blue, Yellow, Green |
| earthFamily | string | Polar, Cardinal, Core, Signal, Gateway |
| guidePower | string | Today's guide seal |
| analogPower | string | Support energy |
| antipodePower | string | Challenge energy |
| occultPower | string | Hidden power |

## 20 Solar Seals (Dreamspell names)

| # | Seal | Color | Earth Family |
|---|------|-------|--------------|
| 1 | Red Dragon | Red | Gateway |
| 2 | White Wind | White | Core |
| 3 | Blue Night | Blue | Signal |
| 4 | Yellow Seed | Yellow | Polar |
| 5 | Red Serpent | Red | Polar |
| 6 | White Worldbridger | White | Signal |
| 7 | Blue Hand | Blue | Core |
| 8 | Yellow Star | Yellow | Gateway |
| 9 | Red Moon | Red | Gateway |
| 10 | White Dog | White | Core |
| 11 | Blue Monkey | Blue | Signal |
| 12 | Yellow Human | Yellow | Polar |
| 13 | Red Skywalker | Red | Polar |
| 14 | White Wizard | White | Signal |
| 15 | Blue Eagle | Blue | Core |
| 16 | Yellow Warrior | Yellow | Gateway |
| 17 | Red Earth | Red | Gateway |
| 18 | White Mirror | White | Core |
| 19 | Blue Storm | Blue | Signal |
| 20 | Yellow Sun | Yellow | Polar |

## Calculation

Dreamspell starts from July 26, 1987 (Galactic Synchronization).

```javascript
function getDreamspell(date) {
  const EPOCH = new Date('1987-07-26');
  const daysSinceEpoch = Math.floor((date - EPOCH) / 86400000);

  // Kin number (1-260)
  const kin = ((daysSinceEpoch % 260) + 260) % 260 + 1;

  // Tone (1-13)
  const tone = ((kin - 1) % 13) + 1;

  // Seal (0-19, then add 1 for display)
  const seal = ((kin - 1) % 20);

  // Wavespell (which 13-day period)
  const wavespell = Math.floor((kin - 1) / 13) + 1;

  return { kin, tone, seal, wavespell };
}
```

**Note**: Dreamspell skips Feb 29 (leap day) - treated as "Day Out of Time" doubled. Needs special handling.

## Output Example

```json
{
  "kin": 138,
  "tone": 8,
  "toneName": "Galactic",
  "seal": "White Mirror",
  "sealNumber": 18,
  "color": "White",
  "wavespell": 11,
  "wavespellSeal": "Blue Monkey",
  "castle": "Blue Western",
  "earthFamily": "Core",
  "guidePower": "White Wizard",
  "analogPower": "Red Dragon",
  "antipodePower": "Yellow Star",
  "occultPower": "Blue Night"
}
```

## Display

```
🌈 DREAMSPELL
─────────────
Kin 138
Galactic White Mirror
Wavespell 11 (Monkey)
Blue Castle of Burning
Core Earth Family
```

## Update Frequency
Daily at 00:00 UTC (Dreamspell day changes at midnight local, but we use UTC for consistency)
