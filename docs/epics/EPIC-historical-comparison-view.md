# Historical Comparison View

## Status
🟢 Backend Complete

## Acceptance Criteria
- [x] API to get available date range
- [x] API to get all module data for a specific date
- [x] Significant dates highlighting (high-lift correlations)
- [x] Prediction archive integration
- [x] Frontend API client functions

## Technical Approach

### Backend (Complete)

**New API Endpoints**

`GET /api/historical/range`
Returns available date range and significant dates:
```json
{
  "range": {
    "minDate": "2024-01-01",
    "maxDate": "2026-02-05",
    "totalDays": 400
  },
  "significantDates": ["2026-02-01", "2026-01-28", ...]
}
```

`GET /api/historical/:date`
Returns all data for a specific date:
```json
{
  "date": "2026-02-01",
  "dailyData": { ... },
  "modules": {
    "moon": { "data": {...}, "collectedAt": "..." },
    ...
  },
  "predictions": [
    { "outcomeId": "spx_direction", "probability": 0.65, ... }
  ],
  "hasData": true
}
```

### Frontend (API Client)
Added functions to `frontend/js/api.js`:
- `getHistoricalRange()` - Fetch date range
- `getHistoricalData(date)` - Fetch data for specific date

### Frontend (Pending)
- Date picker UI
- Side-by-side comparison layout
- Difference highlighting

## Out of Scope
- Date range comparison (only single date vs today)
- Animated transitions between dates
- Export comparison as PDF
