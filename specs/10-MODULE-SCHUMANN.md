# Schumann Resonance Module

## Overview
Earth's electromagnetic resonance, the "heartbeat of Earth." Base frequency ~7.83 Hz with harmonics at 14.3, 20.8, 27.3, 33.8 Hz.

## Data Points

| Field | Type | Description |
|-------|------|-------------|
| baseFrequency | number | Current measured base (typically 7.83 Hz) |
| amplitude | number | Signal strength |
| peakFrequency | number | Highest detected resonance today |
| activity | string | "Low", "Normal", "Elevated", "High", "Extreme" |
| harmonics | array | Status of harmonic frequencies |
| spikes | array | Notable amplitude spikes in last 24h |
| source | string | Data source location |

## Background

The Schumann resonances are electromagnetic waves in the cavity between Earth's surface and ionosphere. Lightning excites these resonances.

- **7.83 Hz** - First harmonic (most studied)
- **14.3 Hz** - Second harmonic
- **20.8 Hz** - Third harmonic
- **27.3 Hz** - Fourth harmonic
- **33.8 Hz** - Fifth harmonic

## Activity Levels

| Level | Amplitude | Interpretation |
|-------|-----------|----------------|
| Low | < 5 | Very calm |
| Normal | 5-15 | Baseline |
| Elevated | 15-30 | Increased activity |
| High | 30-50 | Significant activity |
| Extreme | > 50 | Major disturbance |

## Data Source

**Challenge**: No official free API exists. Options:

### 1. Space Observing System (Russia)
Website shows live spectrogram:
```
http://sosrff.tsu.ru/?page_id=7
```
Requires scraping the image/data - unreliable.

### 2. HeartMath Institute
Sometimes publishes data but no public API.

### 3. GCI (Global Coherence Initiative)
```
https://www.heartmath.org/gci/gcms/live-data/
```
Visual only, no API.

### 4. Create Our Own Approximation
Use geomagnetic/solar data as proxy for SR activity (correlation exists).

### Recommended Approach
1. Try to scrape from sosrff.tsu.ru spectrogram
2. Fallback to "estimated from geomagnetic data"
3. Be transparent about data limitations

## Scraping Strategy

The Russian site shows a spectrogram image. We could:
1. Fetch the image every 3h
2. Save to public storage
3. Display image directly
4. Add note: "Source: Space Observing System, Tomsk"

```javascript
async function fetchSchumannImage() {
  // The spectrogram updates periodically
  const url = 'http://sosrff.tsu.ru/new/shm.jpg';
  // Fetch and cache the image
  return imageUrl;
}
```

## Output Example

```json
{
  "timestamp": "2025-01-31T12:00:00Z",
  "baseFrequency": 7.83,
  "currentAmplitude": 12,
  "activity": "Normal",
  "peak24h": {
    "frequency": 33.8,
    "amplitude": 42,
    "time": "2025-01-31T03:15:00Z"
  },
  "spectrogramUrl": "https://our-cdn.com/schumann/2025-01-31-12.jpg",
  "source": "Space Observing System, Tomsk",
  "note": "Live data from Russian monitoring station"
}
```

## Display

```
🌍 SCHUMANN
─────────────
Base: 7.83 Hz
Amplitude: 12 (Normal)
24h Peak: 42 @ 03:15

[Spectrogram Image]

Source: Tomsk, Russia
```

## Alternative Display (if no scrape)

```
🌍 SCHUMANN
─────────────
Estimated: Normal

Based on geomagnetic data:
Kp: 3 → SR likely normal

⚠️ Direct measurement
   unavailable
```

## Update Frequency
Every 3 hours (or when spectrogram image updates)

## Notes

Be honest with users:
- Schumann data is hard to get programmatically
- Russian site is the main public source
- May be unavailable at times
- Consider showing "Data unavailable" rather than fake data
