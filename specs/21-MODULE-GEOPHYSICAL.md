# Geophysical Module

## Overview
Measurable Earth data: seismic activity, atmospheric conditions, tides, and environmental metrics.

## Data Points

### Seismic (USGS)
| Field | Type | Description |
|-------|------|-------------|
| quakeCount24h | number | Earthquakes in last 24h |
| quakeCountByMag | object | Count by magnitude range |
| largestQuake | object | Biggest in last 24h |
| significantQuakes | array | M5.0+ events |
| globalEnergy | number | Total seismic energy released |

### Atmospheric
| Field | Type | Description |
|-------|------|-------------|
| globalPressure | object | Pressure anomalies |
| uvIndex | number | UV radiation level |
| airQuality | object | AQI for major cities |
| geomagneticAp | number | Ap index (daily geomagnetic) |

### Tides & Ocean
| Field | Type | Description |
|-------|------|-------------|
| tidalExtreme | boolean | Extreme high/low tide today |
| moonDistance | number | km (perigee/apogee affects tides) |
| seaTemp | object | Ocean temperature anomalies |

## Data Sources

### USGS Earthquake API (Free, no auth)
```
https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-01-30&minmagnitude=2.5
```

Parameters:
- `starttime`, `endtime` - Date range
- `minmagnitude` - Minimum magnitude
- `limit` - Max results

```javascript
async function getRecentQuakes(hours = 24, minMag = 2.5) {
  const endTime = new Date().toISOString();
  const startTime = new Date(Date.now() - hours * 3600000).toISOString();

  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&endtime=${endTime}&minmagnitude=${minMag}`;

  const response = await fetch(url);
  const data = await response.json();

  return data.features.map(f => ({
    magnitude: f.properties.mag,
    place: f.properties.place,
    time: new Date(f.properties.time),
    depth: f.geometry.coordinates[2],
    coords: [f.geometry.coordinates[1], f.geometry.coordinates[0]]
  }));
}
```

### NOAA Geomagnetic (Ap Index)
```
https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json
```
Ap is derived from Kp (daily average).

### Open-Meteo (Free weather API)
```
https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=surface_pressure,uv_index
```

### World Air Quality Index (WAQI)
```
https://api.waqi.info/feed/here/?token=demo
```
Demo token for testing; get free token for production.

### NOAA Tides
```
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=9414290&product=predictions&datum=MLLW&units=metric&time_zone=gmt&format=json
```

## Historical Data Storage

### Table: quakes_daily
```sql
CREATE TABLE quakes_daily (
  date DATE PRIMARY KEY,
  count_total INTEGER,
  count_m3 INTEGER,
  count_m4 INTEGER,
  count_m5 INTEGER,
  count_m6plus INTEGER,
  max_magnitude DECIMAL(3,1),
  total_energy_joules DECIMAL(20,2)
);
```

### Table: geophysical_daily
```sql
CREATE TABLE geophysical_daily (
  date DATE PRIMARY KEY,
  ap_index INTEGER,
  avg_pressure DECIMAL(6,2),
  max_uv_index DECIMAL(3,1),
  avg_aqi INTEGER,
  tidal_range_cm INTEGER
);
```

## Seismic Energy Calculation

Richter magnitude to energy (Joules):
```javascript
function magnitudeToEnergy(mag) {
  // log10(E) = 1.5*M + 4.8 (in Joules)
  return Math.pow(10, 1.5 * mag + 4.8);
}

function totalSeismicEnergy(quakes) {
  return quakes.reduce((sum, q) => sum + magnitudeToEnergy(q.magnitude), 0);
}
```

## Output Example

```json
{
  "timestamp": "2025-01-31T12:00:00Z",
  "seismic": {
    "count24h": 127,
    "byMagnitude": {
      "2.5-3.0": 82,
      "3.0-4.0": 31,
      "4.0-5.0": 11,
      "5.0-6.0": 3,
      "6.0+": 0
    },
    "largest": {
      "magnitude": 5.4,
      "location": "South of Fiji Islands",
      "time": "2025-01-31T08:23:00Z",
      "depth": 520
    },
    "totalEnergy": 2.3e12,
    "energyTrend": "above average",
    "activityLevel": "Elevated"
  },
  "atmospheric": {
    "apIndex": 12,
    "apLevel": "Unsettled",
    "uvIndex": 6,
    "uvLevel": "High",
    "globalPressure": "normal"
  },
  "tides": {
    "extremeToday": false,
    "moonDistance": 384400,
    "moonDistanceStatus": "average",
    "nextExtreme": "2025-02-10"
  }
}
```

## Display

```
🌍 GEOPHYSICAL
─────────────
Quakes 24h: 127
  M5+: 3 (largest 5.4)
  Energy: ▲ Elevated

Ap Index: 12 (Unsettled)
UV Index: 6 (High)

Tides: Normal
Moon: 384,400 km
```

## Seismic Activity Levels

| Level | Criteria |
|-------|----------|
| Low | M5+ count = 0, energy < 50% avg |
| Normal | M5+ count ≤ 2, energy 50-150% avg |
| Elevated | M5+ count 3-5, energy 150-300% avg |
| High | M5+ count > 5, or energy > 300% avg |
| Extreme | M7+ event in 24h |

## Historical Depth

- USGS: 1900+ for significant quakes, 2000+ for all M2.5+
- Ap Index: 1930+
- Tides: Station-dependent, typically 20+ years

## Update Frequency
- Seismic: Every hour (USGS updates continuously)
- Atmospheric: Every 3 hours
- Tides: Daily
