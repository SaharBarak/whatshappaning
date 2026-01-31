# Solar Activity Module

## Overview
Real-time solar and geomagnetic data from NOAA Space Weather Prediction Center.

## Data Points

| Field | Type | Description |
|-------|------|-------------|
| kpIndex | number | Planetary K-index (0-9) |
| kpCategory | string | "Quiet", "Unsettled", "Active", "Storm" |
| solarFlareClass | string | Latest flare class (A, B, C, M, X) |
| solarFlareTime | string | Time of latest significant flare |
| sunspotNumber | number | Daily sunspot count |
| solarWindSpeed | number | km/s |
| solarWindDensity | number | protons/cm³ |
| xrayFlux | string | Current X-ray background level |
| geomagneticStorm | boolean | If G1+ storm in progress |
| stormLevel | string | G1-G5 if active |
| protonFlux | number | Solar energetic particles |

## Kp Index Scale

| Kp | Category | Effects |
|----|----------|---------|
| 0-2 | Quiet | Baseline geomagnetic activity |
| 3 | Unsettled | Minor fluctuations |
| 4 | Active | Increased activity |
| 5 | Minor Storm (G1) | Weak power grid fluctuations |
| 6 | Moderate Storm (G2) | High-latitude power issues |
| 7 | Strong Storm (G3) | Voltage corrections needed |
| 8 | Severe Storm (G4) | Widespread voltage problems |
| 9 | Extreme Storm (G5) | Grid collapse possible |

## Solar Flare Classes

| Class | Intensity | Effect |
|-------|-----------|--------|
| A | < 10⁻⁷ W/m² | Minimal |
| B | 10⁻⁷ to 10⁻⁶ | Minor |
| C | 10⁻⁶ to 10⁻⁵ | Small |
| M | 10⁻⁵ to 10⁻⁴ | Moderate (radio blackouts) |
| X | > 10⁻⁴ | Major (significant disruptions) |

Each class has subdivisions 1-9 (e.g., M5.2, X1.4)

## Data Source

**NOAA SWPC** (free, no auth):

### Kp Index
```
https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json
```

### Solar Flares
```
https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json
```

### Sunspot Number
```
https://services.swpc.noaa.gov/json/solar-cycle/sunspots.json
```

### Geomagnetic Storms
```
https://services.swpc.noaa.gov/products/noaa-scales.json
```

### Solar Wind
```
https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json
```

## Output Example

```json
{
  "timestamp": "2025-01-31T12:00:00Z",
  "kpIndex": 3,
  "kpCategory": "Unsettled",
  "kpTrend": "rising",
  "latestFlare": {
    "class": "C2.1",
    "time": "2025-01-31T08:23:00Z",
    "region": "AR3901"
  },
  "sunspotNumber": 142,
  "solarWind": {
    "speed": 423,
    "density": 5.2
  },
  "xrayBackground": "B4.5",
  "geomagneticStorm": false,
  "stormLevel": null,
  "protonFlux": 0.8,
  "forecast24h": {
    "flareM": 25,
    "flareX": 5,
    "stormG1": 15
  }
}
```

## Display

```
☀️ SOLAR ACTIVITY
─────────────
Kp Index: 3 (Unsettled) ↑
Latest Flare: C2.1 @ 08:23
Sunspots: 142
Solar Wind: 423 km/s

24h Forecast:
M-flare: 25% | X-flare: 5%
```

## Color Coding

| Kp | Color |
|----|-------|
| 0-2 | Green |
| 3-4 | Yellow |
| 5-6 | Orange |
| 7+ | Red |

## Update Frequency
Every 3 hours (NOAA updates hourly, but 3h is sufficient)
