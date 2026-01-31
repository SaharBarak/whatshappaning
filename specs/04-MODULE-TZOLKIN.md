# Tzolkin Module

## Overview
The Tzolkin is the 260-day Mayan sacred calendar. It combines 20 day signs (glyphs) with 13 tones (numbers), creating a 260-day cycle.

## Data Points

| Field | Type | Description |
|-------|------|-------------|
| tone | number | 1-13 |
| toneName | string | "Magnetic", "Lunar", "Electric", etc. |
| daySign | string | One of 20 signs |
| daySignNumber | number | 0-19 position in sign cycle |
| glyph | string | Unicode/emoji representation |
| meaning | string | Brief meaning of the day |
| dayInCycle | number | 1-260 position in Tzolkin round |

## 13 Tones

| # | Name | Energy |
|---|------|--------|
| 1 | Magnetic | Unity, Purpose |
| 2 | Lunar | Challenge, Polarity |
| 3 | Electric | Service, Activation |
| 4 | Self-Existing | Form, Definition |
| 5 | Overtone | Empowerment, Radiance |
| 6 | Rhythmic | Balance, Organization |
| 7 | Resonant | Attunement, Channeling |
| 8 | Galactic | Integrity, Harmony |
| 9 | Solar | Intention, Pulse |
| 10 | Planetary | Manifestation, Perfection |
| 11 | Spectral | Liberation, Release |
| 12 | Crystal | Cooperation, Dedication |
| 13 | Cosmic | Presence, Transcendence |

## 20 Day Signs

| # | Sign | Glyph | Direction |
|---|------|-------|-----------|
| 0 | Imix (Dragon) | 🐊 | East |
| 1 | Ik (Wind) | 💨 | North |
| 2 | Akbal (Night) | 🌙 | West |
| 3 | Kan (Seed) | 🌱 | South |
| 4 | Chicchan (Serpent) | 🐍 | East |
| 5 | Cimi (Death) | 💀 | North |
| 6 | Manik (Hand) | 🤚 | West |
| 7 | Lamat (Star) | ⭐ | South |
| 8 | Muluc (Moon) | 🌊 | East |
| 9 | Oc (Dog) | 🐕 | North |
| 10 | Chuen (Monkey) | 🐒 | West |
| 11 | Eb (Road) | 🛤️ | South |
| 12 | Ben (Reed) | 🎋 | East |
| 13 | Ix (Jaguar) | 🐆 | North |
| 14 | Men (Eagle) | 🦅 | West |
| 15 | Cib (Owl) | 🦉 | South |
| 16 | Caban (Earth) | 🌍 | East |
| 17 | Etznab (Mirror) | 🪞 | North |
| 18 | Cauac (Storm) | ⛈️ | West |
| 19 | Ahau (Sun) | ☀️ | South |

## Calculation

The correlation constant connects Gregorian to Mayan Long Count. Most common: **GMT correlation 584283** (Goodman-Martinez-Thompson).

```javascript
function getTzolkin(date) {
  const CORRELATION = 584283;
  const julianDay = getJulianDay(date);
  const daysSinceEpoch = julianDay - CORRELATION;

  const tone = ((daysSinceEpoch % 13) + 13) % 13 + 1;
  const daySign = ((daysSinceEpoch % 20) + 20) % 20;

  return { tone, daySign };
}
```

## Output Example

```json
{
  "tone": 4,
  "toneName": "Self-Existing",
  "daySign": "Ahau",
  "daySignNumber": 19,
  "glyph": "☀️",
  "meaning": "Structure and foundation on a day of completion and enlightenment",
  "dayInCycle": 212
}
```

## Display

```
🔆 TZOLKIN
─────────────
4 Ahau ☀️
Tone: Self-Existing (4)
Sign: Sun/Lord
Day 212 of 260
```

## Update Frequency
Daily at 00:00 UTC (Tzolkin day changes at sunrise in Mesoamerica, but UTC midnight is reasonable approximation)
