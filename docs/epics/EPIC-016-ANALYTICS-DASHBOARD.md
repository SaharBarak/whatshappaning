# EPIC-016: Analytics & Prediction Accuracy Dashboard

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening makes predictions but:

1. **No accuracy tracking** - Don't know if predictions are right
2. **No transparency** - Users can't verify historical accuracy
3. **No insights** - Which modules are most predictive?
4. **Missing trust** - "Show the math" incomplete without results

---

## Proposed Solution

**Analytics Dashboard** showing prediction accuracy:

### 1. Accuracy Metrics
- Overall prediction accuracy by outcome
- Accuracy by confidence level
- Best/worst performing features
- Accuracy over time (improving?)

### 2. Visualizations
- Accuracy charts (line, bar)
- Confusion matrices
- Feature importance rankings
- Calibration plots

### 3. Public Transparency
- Public-facing accuracy page
- Historical prediction archive
- "We predicted X, Y happened" records

---

## Dashboard Sections

### Overall Accuracy
```
┌─────────────────────────────────────┐
│  PREDICTION ACCURACY (Last 90 Days) │
├─────────────────────────────────────┤
│  SPX Up:      67% accurate (n=62)   │
│  BTC Up:      71% accurate (n=62)   │
│  Volatility:  73% accurate (n=62)   │
│  Earthquake:  54% accurate (n=62)   │
└─────────────────────────────────────┘
```

### By Confidence Level
```
Very High confidence: 82% accurate
High confidence:      71% accurate
Medium confidence:    58% accurate
Low confidence:       52% accurate
```

---

## Affected Components

| Component | Changes |
|-----------|---------|
| `backend/src/analytics/` | New - Accuracy calculation |
| `backend/src/routes/api.js` | Analytics endpoints |
| `frontend/analytics.html` | New - Analytics page |
| `frontend/js/analytics.js` | New - Charts & viz |

---

## Success Criteria

- [ ] **Accuracy Calculation**: Compare predictions to outcomes
- [ ] **Historical Archive**: Store all predictions with results
- [ ] **Visualizations**: Clear charts and graphs
- [ ] **Public Page**: Transparent accuracy display
- [ ] **Auto-Update**: Daily accuracy recalculation

---

## Tasks (Post-Approval)

1. Create predictions archive table
2. Build outcome verification system
3. Calculate accuracy metrics
4. Create analytics API endpoints
5. Build analytics page with charts
6. Add to main navigation
7. Schedule daily recalculation

---

## Database Schema

```sql
CREATE TABLE prediction_archive (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  outcome_id TEXT NOT NULL,
  predicted_probability DECIMAL(5,4),
  confidence_level TEXT,
  actual_result BOOLEAN,
  verified_at TIMESTAMP,
  UNIQUE(date, outcome_id)
);

CREATE INDEX idx_archive_date ON prediction_archive(date);
CREATE INDEX idx_archive_outcome ON prediction_archive(outcome_id);
```

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| Archive schema & storage | 2-3 hours |
| Outcome verification | 3-4 hours |
| Accuracy calculations | 2-3 hours |
| API endpoints | 2 hours |
| Analytics page & charts | 4-5 hours |
| Testing & validation | 2-3 hours |
| **Total** | **15-20 hours** |

---

## Notes

This epic completes the "show the math" philosophy. Making prediction accuracy public builds trust and credibility. It also provides valuable feedback for improving the correlation engine. Users can see which types of predictions are most reliable and calibrate their expectations accordingly.
