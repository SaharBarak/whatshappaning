# EPIC-017: Advanced Filtering & Search

## Problem Statement
Users currently see all predictions and data modules at once. As the platform grows with more data sources and prediction types, users need ways to filter, search, and focus on what matters most to them.

## Proposed Solution
Add comprehensive filtering and search capabilities across the dashboard:
- Filter predictions by category (astrology, numerology, biorhythm, etc.)
- Filter by confidence level (high/medium/low)
- Date range filtering for historical comparisons
- Search functionality for specific patterns or keywords
- Saved filter presets for quick access

## Affected Components
- **Frontend**: New filter UI components, search bar, preset management
- **Backend**: Filter query parameters on API endpoints, search indexing
- **Database**: Index optimizations for filtered queries

## Success Criteria
- [ ] Filter bar visible on main dashboard
- [ ] Users can filter by at least 3 criteria simultaneously
- [ ] Search returns results in <200ms
- [ ] Filter presets persist across sessions
- [ ] Mobile-responsive filter UI
- [ ] No performance degradation on unfiltered views

## Technical Approach

### Frontend Components
```javascript
// components/filters.js
- FilterBar component with collapsible advanced options
- CategoryFilter (checkboxes for module types)
- ConfidenceSlider (range selector)
- DateRangePicker (start/end date)
- SearchInput with debounced queries
- PresetManager (save/load/delete presets)
```

### Backend Endpoints
```
GET /api/predictions?category=astrology,numerology&confidence=high&from=2026-01-01&to=2026-02-04
GET /api/search?q=mercury+retrograde
GET /api/filter-presets (CRUD for saved presets)
```

### User Preferences Integration
Integrates with EPIC-008 User Preferences:
- Default filters saved to user profile
- Filter presets stored per-user

## Dependencies
- EPIC-008 User Preferences (for persistence)
- EPIC-010 Performance (for query optimization)

## Estimated Effort
- Frontend: 3-4 days
- Backend: 2-3 days
- Testing: 1-2 days
- **Total: ~1 week**

## Team Assignment
- **Stream**: Filter UI components
- **Frame**: API query parameters, search endpoint
- **Grid**: Database indexing
- **Verify**: Filter combination testing
