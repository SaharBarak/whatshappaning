# EPIC-006: Historical Comparison View

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening has rich historical data (markets since 1950, earthquakes since 2000, astrology for any date) and a powerful correlation engine. However:

1. **No direct comparison** - Users can't compare today's readings to a specific past date
2. **Pattern context missing** - When pattern alerts fire, users can't explore the matching historical days
3. **Learning opportunity lost** - Users can't study what cosmic conditions preceded major events
4. **Research friction** - Power users want to explore "what did the cosmos look like on X date?"

The data exists - we just need a way to surface it comparatively.

---

## Proposed Solution

Add a **Historical Comparison View** that shows side-by-side data:

### 1. Date Picker
- Calendar widget to select any historical date
- Quick presets: "Pattern match dates", "Major market moves", "Significant earthquakes"
- Date range validation (within available data)

### 2. Side-by-Side Layout
```
┌─────────────────────┬─────────────────────┐
│      TODAY          │   Feb 14, 2024      │
├─────────────────────┼─────────────────────┤
│ Moon: Waxing Gibb.  │ Moon: Full Moon     │
│ Mercury: Direct     │ Mercury: Retrograde │
│ Tarot: The Tower    │ Tarot: 3 of Cups    │
│ ...                 │ ...                 │
├─────────────────────┼─────────────────────┤
│ SPX: +0.3%          │ SPX: -2.1%          │
│ BTC: +1.2%          │ BTC: -5.4%          │
└─────────────────────┴─────────────────────┘
```

### 3. Difference Highlighting
- Color-code matching vs different values
- Show similarity percentage between dates
- Highlight which factors differ most

### 4. Outcome Context
- Show what happened after the historical date
- "3 days later: SPX dropped 4%"
- "Week following: M6.2 earthquake in Japan"

---

## Affected Components

| Component | Changes Required |
|-----------|------------------|
| `backend/src/routes/api.js` | New endpoint: GET /api/historical/:date |
| `backend/src/modules/` | Ensure all modules can calculate for any date |
| `frontend/js/comparison.js` | New - Comparison view logic |
| `frontend/js/app.js` | Add comparison mode toggle |
| `frontend/css/styles.css` | Comparison layout styles |
| `frontend/index.html` | Date picker, comparison panel |

---

## Success Criteria

- [ ] **Date Picker**: Calendar widget with valid date range
- [ ] **Historical Data**: Fetch complete module data for any past date
- [ ] **Side-by-Side**: Clean comparison layout
- [ ] **Similarity Score**: Show % match between dates
- [ ] **Outcome Context**: What happened after the historical date
- [ ] **Pattern Integration**: Jump to comparison from pattern alerts
- [ ] **Mobile Responsive**: Works on all screen sizes

---

## Tasks (Post-Approval)

1. **Create historical data endpoint**
   ```javascript
   // GET /api/historical/:date
   // Returns all module data calculated for that date
   app.get('/api/historical/:date', async (req, res) => {
     const date = new Date(req.params.date);
     const modules = await calculateAllModulesForDate(date);
     const outcomes = await getOutcomesAfterDate(date);
     res.json({ modules, outcomes });
   });
   ```

2. **Add date picker component**
   - Use native date input or lightweight picker library
   - Validate date is within data range
   - Show quick preset buttons

3. **Create comparison layout**
   - Two-column responsive grid
   - Module cards render twice (today + selected)
   - Visual diff highlighting

4. **Calculate similarity**
   - Reuse pattern matching logic from patterns.js
   - Show feature-by-feature comparison

5. **Add outcome context**
   - Query market_data for days following
   - Query earthquake data for following week
   - Display as timeline or summary

6. **Integrate with pattern alerts**
   - "Compare to this date" button on alerts
   - Deep link: /?compare=2024-02-14

---

## API Response Example

```json
{
  "date": "2024-02-14",
  "modules": {
    "moon": { "phase": "Full Moon", "illumination": 0.98 },
    "astrology": { "sun_sign": "Aquarius", "mercury_retrograde": true },
    "tarot": { "card": "Three of Cups", "meaning": "..." }
  },
  "outcomes": {
    "spx_1d": -0.8,
    "spx_3d": -2.1,
    "btc_1d": -3.2,
    "earthquake_7d": { "count": 2, "max_magnitude": 5.4 }
  },
  "similarity_to_today": 0.72
}
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Slow historical calculation | Cache common dates, precompute on backfill |
| Missing data for old dates | Show "N/A" gracefully, note data availability |
| Complex mobile layout | Stacked view on mobile, tabs for switching |
| API abuse | Rate limit historical endpoint |

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| Historical API endpoint | 3-4 hours |
| Date picker UI | 2 hours |
| Comparison layout | 3-4 hours |
| Similarity scoring | 2 hours |
| Outcome context | 2-3 hours |
| Pattern integration | 1-2 hours |
| Testing & polish | 2-3 hours |
| **Total** | **15-18 hours** |

---

## Dependencies

- Historical data populated via backfill script
- All modules support date parameter for calculation

---

## Notes

This epic unlocks the research potential of WhatsHappening. Users can study historical patterns, understand what preceded major events, and validate the correlation engine's predictions. It transforms the dashboard from "what's happening now" to "what's happened before - and what might happen next."

The comparison view also makes pattern alerts more actionable - instead of just seeing "85% match with Feb 14, 2024", users can explore exactly what was similar and different.
