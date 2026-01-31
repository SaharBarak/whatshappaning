# Moon Phase Module

## Data Points

| Field | Type | Description |
|-------|------|-------------|
| phase | string | "New", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full", "Waning Gibbous", "Last Quarter", "Waning Crescent" |
| illumination | number | 0-100 percentage |
| age | number | Days since new moon (0-29.5) |
| emoji | string | 🌑🌒🌓🌔🌕🌖🌗🌘 |
| sign | string | Current zodiac sign moon is in |
| nextPhase | object | { phase, date } for upcoming major phase |
| voidOfCourse | object | { active, start, end } - when moon makes no major aspects |

## Output Example

```json
{
  "phase": "Waxing Gibbous",
  "illumination": 67,
  "age": 10.3,
  "emoji": "🌔",
  "sign": "Gemini",
  "nextPhase": {
    "phase": "Full",
    "date": "2025-02-01T14:23:00Z"
  },
  "voidOfCourse": {
    "active": false,
    "start": null,
    "end": null
  }
}
```

## Calculation Method

Use astronomical algorithms (Jean Meeus) or astronomy API.

### Free APIs:
- **Farmsense Moon API**: https://api.farmsense.net/v1/moonphases/
- **Astronomy API** (limited free): https://astronomyapi.com
- **Calculate locally**: Use `astronomia` npm package

### Void of Course
Requires ephemeris calculation - when Moon's last major aspect before sign change occurs. Can use Swiss Ephemeris via `swisseph` npm package.

## Display

```
🌙 MOON
─────────────
Waxing Gibbous 🌔
67% illuminated
Moon in Gemini
Full Moon in 3 days
```

## Update Frequency
Every 3 hours (moon moves ~0.5° per hour)
