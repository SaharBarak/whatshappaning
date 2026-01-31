# Tarot Module

## Overview
Daily tarot card, deterministically selected based on the date. Same card globally for everyone on the same day.

## Data Points

| Field | Type | Description |
|-------|------|-------------|
| card | string | Card name |
| number | number/string | Card number (0-21 for Major, or suit number) |
| arcana | string | "Major" or "Minor" |
| suit | string | For Minor: Wands, Cups, Swords, Pentacles |
| keywords | array | Key meanings |
| element | string | Associated element |
| planet | string | Associated planet (Major only) |
| zodiac | string | Associated sign (if applicable) |
| imageUrl | string | Card image URL |
| reversedIncluded | boolean | Whether reversal is possible |
| isReversed | boolean | If card drawn reversed |

## Deck Structure

### Major Arcana (22 cards)
| # | Card | Planet/Sign |
|---|------|-------------|
| 0 | The Fool | Uranus |
| I | The Magician | Mercury |
| II | The High Priestess | Moon |
| III | The Empress | Venus |
| IV | The Emperor | Aries |
| V | The Hierophant | Taurus |
| VI | The Lovers | Gemini |
| VII | The Chariot | Cancer |
| VIII | Strength | Leo |
| IX | The Hermit | Virgo |
| X | Wheel of Fortune | Jupiter |
| XI | Justice | Libra |
| XII | The Hanged Man | Neptune |
| XIII | Death | Scorpio |
| XIV | Temperance | Sagittarius |
| XV | The Devil | Capricorn |
| XVI | The Tower | Mars |
| XVII | The Star | Aquarius |
| XVIII | The Moon | Pisces |
| XIX | The Sun | Sun |
| XX | Judgement | Pluto |
| XXI | The World | Saturn |

### Minor Arcana (56 cards)
4 suits × 14 cards each:
- **Wands** (Fire): Ace-10 + Page, Knight, Queen, King
- **Cups** (Water): Ace-10 + Page, Knight, Queen, King
- **Swords** (Air): Ace-10 + Page, Knight, Queen, King
- **Pentacles** (Earth): Ace-10 + Page, Knight, Queen, King

## Date-Seeded Selection

```javascript
function getDailyCard(date) {
  // Create deterministic seed from date
  const dateString = date.toISOString().split('T')[0]; // "2025-01-31"
  const seed = hashString(dateString);

  // Use seeded random to select card (0-77 for full deck)
  const rng = seededRandom(seed);
  const cardIndex = Math.floor(rng() * 78);

  // Optionally determine reversal
  const isReversed = rng() < 0.5;

  return { cardIndex, isReversed };
}

function hashString(str) {
  // Simple hash function for seeding
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  // Mulberry32 PRNG
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
```

## Card Database

Store card data in JSON:
```json
{
  "major": [
    {
      "number": 0,
      "name": "The Fool",
      "keywords": ["beginnings", "innocence", "spontaneity", "free spirit"],
      "element": "Air",
      "planet": "Uranus",
      "uprightMeaning": "New beginnings, optimism, trust in life",
      "reversedMeaning": "Holding back, recklessness, risk-taking"
    }
  ],
  "minor": {
    "wands": [...],
    "cups": [...],
    "swords": [...],
    "pentacles": [...]
  }
}
```

## Output Example

```json
{
  "date": "2025-01-31",
  "card": {
    "name": "The Tower",
    "number": "XVI",
    "arcana": "Major",
    "suit": null,
    "keywords": ["sudden change", "upheaval", "revelation", "awakening"],
    "element": "Fire",
    "planet": "Mars",
    "isReversed": false,
    "meaning": "Sudden upheaval, broken pride, disaster, revelation"
  },
  "imageUrl": "/images/tarot/major/16-tower.jpg"
}
```

## Display

```
🎴 TAROT OF THE DAY
─────────────
XVI - The Tower

[Card Image]

Keywords:
sudden change • upheaval
revelation • awakening

Element: Fire
Planet: Mars
```

## Card Images

Options:
1. **Public domain deck** (Rider-Waite-Smith is public domain)
2. **Generate with AI** (one-time, store locally)
3. **Unicode/Emoji** representation (minimal)
4. **ASCII art** (terminal aesthetic)

Recommended: Use public domain RWS images or simple symbolic representations.

## Reversal Policy

Options:
1. No reversals (simpler)
2. 50% chance reversed (traditional)
3. User preference (store in settings)

Default: Include reversals (50% chance)

## Update Frequency
Daily at 00:00 UTC
