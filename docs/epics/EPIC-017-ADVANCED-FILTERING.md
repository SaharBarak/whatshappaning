# Advanced Filtering & Search

## Status
🟢 Backend Complete

## Acceptance Criteria
- [x] Filter predictions by category (market, geophysical, sentiment)
- [x] Filter by confidence level
- [x] Filter by probability range
- [x] Search predictions by name
- [x] Sub-200ms response with filters

## Technical Approach

### Backend (Complete)

**Enhanced `/api/predictions` Endpoint**

Query parameters (all optional):
| Parameter | Description | Example |
|-----------|-------------|---------|
| `category` | Filter by category | `market`, `geophysical`, `sentiment` |
| `confidence` | Filter by confidence level | `high`, `medium`, `low`, `insufficient` |
| `minProbability` | Minimum probability (0-1) | `0.6` |
| `maxProbability` | Maximum probability (0-1) | `0.8` |
| `search` | Search term for names | `bitcoin` |

**Category Mapping:**
- `market`: SPX, BTC, VIX, Gold outcomes
- `geophysical`: Earthquake, geomagnetic outcomes
- `sentiment`: Sentiment drop, fear spike

**Response Enhancement:**
When filters applied, response includes:
```json
{
  "predictions": [...],
  "filtered": true,
  "totalCount": 11,
  "filteredCount": 4
}
```

### Frontend (Pending)
- Filter bar UI component
- Search input with debounce
- Filter preset save/load (localStorage)
- Mobile-responsive filter drawer

## Performance
- Filters applied to cached predictions (no DB hit)
- Response time: <50ms with filters
- Full predictions cached for 3 hours

## Out of Scope
- Server-side filter preset storage (using localStorage)
- Full-text search across all data
- Saved search history
