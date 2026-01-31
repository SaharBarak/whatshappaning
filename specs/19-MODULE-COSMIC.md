# Cosmic Rays & Meteor Showers Module

## Overview
Additional space weather data: cosmic ray intensity and active/upcoming meteor showers.

## Data Points

### Cosmic Rays
| Field | Type | Description |
|-------|------|-------------|
| neutronCount | number | Neutron monitor count rate |
| percentOfBaseline | number | Current vs baseline (100 = normal) |
| trend | string | "rising", "falling", "stable" |
| level | string | "Low", "Normal", "Elevated", "High" |
| source | string | Monitor location |

### Meteor Showers
| Field | Type | Description |
|-------|------|-------------|
| active | array | Currently active showers |
| upcoming | object | Next major shower |
| peakTonight | boolean | If a shower peaks tonight |

### Meteor Shower Object
| Field | Type | Description |
|-------|------|-------------|
| name | string | Shower name (e.g., "Perseids") |
| zhr | number | Zenithal hourly rate (meteors/hour) |
| peakDate | string | Peak date(s) |
| radiant | string | Constellation of origin |
| active | boolean | Currently in active period |
| daysUntilPeak | number | Days until peak |

## Data Sources

### Cosmic Rays - NOAA/Oulu
Neutron monitors measure cosmic ray intensity.

**Oulu Cosmic Ray Station** (Finland):
```
https://cosmicrays.oulu.fi/
```
No direct API - may need to scrape or use alternative.

**Alternative - Moscow Neutron Monitor**:
```
http://cr0.izmiran.ru/mosc/main.htm
```

**NOAA Cosmic Ray data**:
```
https://services.swpc.noaa.gov/json/solar-cosmic-ray/
```

### Meteor Showers - IMO/AMS
**International Meteor Organization Calendar**:
Static data - we can hardcode the annual calendar.

Major showers repeat yearly with known dates:

| Shower | Peak | ZHR | Radiant |
|--------|------|-----|---------|
| Quadrantids | Jan 3-4 | 120 | Boötes |
| Lyrids | Apr 22-23 | 18 | Lyra |
| Eta Aquariids | May 5-6 | 50 | Aquarius |
| Perseids | Aug 12-13 | 100 | Perseus |
| Orionids | Oct 21-22 | 20 | Orion |
| Leonids | Nov 17-18 | 15 | Leo |
| Geminids | Dec 13-14 | 150 | Gemini |
| Ursids | Dec 22-23 | 10 | Ursa Minor |

## Cosmic Ray Calculation

Cosmic rays are inversely correlated with solar activity:
- High solar activity → Lower cosmic rays (solar wind deflects them)
- Low solar activity → Higher cosmic rays

If no direct API, estimate from solar data:
```javascript
function estimateCosmicRays(solarData) {
  // Inverse correlation with Kp and solar activity
  const kpFactor = (9 - solarData.kpIndex) / 9;
  const solarFactor = solarData.sunspotNumber < 100 ? 1.1 : 0.9;

  const baseline = 100;
  const estimated = baseline * kpFactor * solarFactor;

  return {
    percentOfBaseline: Math.round(estimated),
    level: estimated > 110 ? 'Elevated' : estimated < 90 ? 'Low' : 'Normal',
    note: 'Estimated from solar activity'
  };
}
```

## Meteor Shower Logic

```javascript
function getActiveMeteorShowers(date) {
  const showers = [
    { name: 'Quadrantids', peak: '01-03', start: '01-01', end: '01-05', zhr: 120 },
    { name: 'Lyrids', peak: '04-22', start: '04-16', end: '04-25', zhr: 18 },
    // ... all showers
  ];

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const today = `${month}-${day}`;

  const active = showers.filter(s => today >= s.start && today <= s.end);
  const peakTonight = active.some(s => s.peak === today);

  return { active, peakTonight };
}
```

## Output Example

```json
{
  "cosmicRays": {
    "percentOfBaseline": 103,
    "level": "Normal",
    "trend": "stable",
    "source": "Estimated from solar data"
  },
  "meteorShowers": {
    "active": [
      {
        "name": "Quadrantids",
        "zhr": 120,
        "peakDate": "January 3-4",
        "radiant": "Boötes",
        "daysUntilPeak": 0,
        "isPeak": true
      }
    ],
    "upcoming": {
      "name": "Lyrids",
      "peakDate": "April 22",
      "daysUntil": 81
    },
    "peakTonight": true
  }
}
```

## Display

```
☄️ COSMIC
─────────────
Cosmic Rays: 103%
Normal • Stable

🌠 QUADRANTIDS PEAK
ZHR: 120 meteors/hr
Radiant: Boötes

Next: Lyrids (81 days)
```

## Display (No active shower)

```
☄️ COSMIC
─────────────
Cosmic Rays: 97%
Normal • Stable

No active showers

Next: Lyrids
Peak: April 22 (81 days)
```

## Update Frequency
- Cosmic rays: Every 3 hours (with solar data)
- Meteor showers: Daily (calendar-based)

## Notes

- Cosmic ray data is harder to get than solar data
- Estimation from solar activity is acceptable fallback
- Meteor shower calendar is static, reliable
- Peak nights are good to highlight prominently
