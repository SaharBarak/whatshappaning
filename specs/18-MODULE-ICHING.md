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

Store in `data/iching.json`:
```json
{
  "hexagrams": [
    {
      "number": 1,
      "name": "The Creative",
      "chineseName": "乾",
      "pinyin": "qián",
      "unicode": "䷀",
      "upperTrigram": "Qian",
      "lowerTrigram": "Qian",
      "judgment": "The Creative works sublime success, furthering through perseverance.",
      "image": "The movement of heaven is full of power.",
      "keywords": ["strength", "initiative", "creation", "heaven"]
    }
  ]
}
```

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

## Update Frequency
Daily at 00:00 UTC

## Notes

- I Ching complements Tarot (Eastern/Western divination)
- Date-seeding ensures same hexagram globally per day
- Different seed than Tarot so they're independent
- Can show changing lines or keep simple (just hexagram)
