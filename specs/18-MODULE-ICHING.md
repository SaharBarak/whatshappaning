# I Ching Module

## Overview
Daily hexagram from the I Ching (Book of Changes), selected deterministically by date like the tarot card.

## Data Points

| Field | Type | Description |
|-------|------|-------------|
| number | number | 1-64 hexagram number |
| name | string | Traditional name |
| chineseName | string | Chinese characters |
| pinyin | string | Romanized pronunciation |
| hexagram | string | Unicode hexagram (䷀-䷿) |
| upperTrigram | object | Upper trigram info |
| lowerTrigram | object | Lower trigram info |
| judgment | string | Core meaning |
| image | string | Traditional image |
| keywords | array | Key concepts |
| changingLines | array | Any changing lines (optional) |

## The 8 Trigrams

| # | Name | Chinese | Symbol | Element | Attribute |
|---|------|---------|--------|---------|-----------|
| 1 | Qian | 乾 | ☰ | Heaven | Creative |
| 2 | Kun | 坤 | ☷ | Earth | Receptive |
| 3 | Zhen | 震 | ☳ | Thunder | Arousing |
| 4 | Kan | 坎 | ☵ | Water | Abysmal |
| 5 | Gen | 艮 | ☶ | Mountain | Stillness |
| 6 | Xun | 巽 | ☴ | Wind | Gentle |
| 7 | Li | 離 | ☲ | Fire | Clinging |
| 8 | Dui | 兌 | ☱ | Lake | Joyous |

## Date-Seeded Selection

```javascript
function getDailyHexagram(date) {
  const dateString = date.toISOString().split('T')[0];
  const seed = hashString(dateString + 'iching'); // Different seed than tarot
  const rng = seededRandom(seed);

  // Select hexagram 1-64
  const hexagramNumber = Math.floor(rng() * 64) + 1;

  // Optionally determine changing lines
  const changingLines = [];
  for (let i = 1; i <= 6; i++) {
    if (rng() < 0.25) { // 25% chance per line
      changingLines.push(i);
    }
  }

  return { hexagramNumber, changingLines };
}
```

## Hexagram Data Structure

The complete 64-hexagram database is stored in `/backend/data/iching.json`.

### Data Format

The actual implementation uses a slightly different field naming:

```json
[
  {
    "number": 1,
    "name": "The Creative",
    "chinese": "乾",
    "pinyin": "qián",
    "unicode": "䷀",
    "upperTrigram": {
      "name": "Qian",
      "symbol": "☰",
      "element": "Heaven",
      "attribute": "Creative"
    },
    "lowerTrigram": {
      "name": "Qian",
      "symbol": "☰",
      "element": "Heaven",
      "attribute": "Creative"
    },
    "judgment": "The Creative works sublime success, furthering through perseverance.",
    "image": "The movement of heaven is full of power.",
    "keywords": ["strength", "initiative", "creation", "heaven"]
  },
  {
    "number": 29,
    "name": "The Abysmal",
    "chinese": "坎",
    "pinyin": "kǎn",
    "unicode": "䷜",
    "upperTrigram": {
      "name": "Kan",
      "symbol": "☵",
      "element": "Water",
      "attribute": "Abysmal"
    },
    "lowerTrigram": {
      "name": "Kan",
      "symbol": "☵",
      "element": "Water",
      "attribute": "Abysmal"
    },
    "judgment": "Repetition of danger. If sincere, success in the heart.",
    "image": "Water flows on and reaches the goal.",
    "keywords": ["danger", "depth", "persistence", "flow"]
  }
]
```

### Field Name Differences

| Spec Field | Implementation Field | Notes |
|------------|---------------------|-------|
| `chineseName` | `chinese` | Shortened field name |
| `hexagram` | `unicode` | Clearer naming |
| `upperTrigram` (string) | `upperTrigram` (object) | Enhanced with symbol, element, attribute |
| `lowerTrigram` (string) | `lowerTrigram` (object) | Enhanced with symbol, element, attribute |

### Trigram Object Structure

Each trigram includes:
- `name`: Trigram name (Qian, Kun, Zhen, Kan, Gen, Xun, Li, Dui)
- `symbol`: Unicode trigram character (☰, ☷, ☳, ☵, ☶, ☴, ☲, ☱)
- `element`: Associated element (Heaven, Earth, Thunder, Water, Mountain, Wind, Fire, Lake)
- `attribute`: Descriptive quality (Creative, Receptive, Arousing, etc.)

### Complete Data Location

The full 64-hexagram database is at:
```
/backend/data/iching.json
```

This file contains all 64 hexagrams with complete metadata, judgment texts, images, and keywords.

## Output Example

```json
{
  "date": "2025-01-31",
  "hexagram": {
    "number": 29,
    "name": "The Abysmal (Water)",
    "chineseName": "坎",
    "pinyin": "kǎn",
    "unicode": "䷜",
    "upperTrigram": {
      "name": "Kan",
      "symbol": "☵",
      "element": "Water"
    },
    "lowerTrigram": {
      "name": "Kan",
      "symbol": "☵",
      "element": "Water"
    },
    "judgment": "Repetition of danger. If sincere, success in the heart.",
    "image": "Water flows on and reaches the goal.",
    "keywords": ["danger", "depth", "persistence", "flow"]
  },
  "changingLines": [3, 5]
}
```

## Display

```
☯️ I CHING
─────────────
29 · The Abysmal
坎 (kǎn)

    ䷜
  ☵ Water
  ☵ Water

"Water flows on and
reaches the goal"

danger • depth • flow
```

## Changing Lines

If changing lines are included:
- Show which lines are changing (1-6 from bottom)
- Optionally show the resulting hexagram

```
Changing: lines 3, 5
Transforms to: #47 Oppression
```

### Transformation Algorithm

When lines change, a yang (solid) line becomes yin (broken) and vice versa:

```javascript
function transformHexagram(hexagramNumber, changingLines) {
  // Convert hexagram to binary (6 bits, line 1 = LSB)
  // For each changing line, flip the bit
  // Convert back to hexagram number (1-64)

  // Example: Hexagram 1 (all yang) with lines 3,5 changing:
  // Binary: 111111 → flip bits 3,5 → 101011 → Hexagram 47
}
```

**Implementation Note:** The current implementation calculates changing lines (25% chance per line) but the transformation to a resulting hexagram is computed dynamically based on the bit-flip algorithm.

## Update Frequency
Daily at 00:00 UTC

## Notes

- I Ching complements Tarot (Eastern/Western divination)
- Date-seeding ensures same hexagram globally per day
- Different seed than Tarot so they're independent
- Can show changing lines or keep simple (just hexagram)
