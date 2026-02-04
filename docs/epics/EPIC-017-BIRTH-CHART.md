# EPIC-017: Personalized Birth Chart Predictions

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening shows universal predictions, but:

1. **No personalization** - Same predictions for everyone
2. **Missing natal context** - Transits affect people differently based on birth chart
3. **Generic advice** - Can't tell users when THEY specifically are affected
4. **Engagement limit** - Users want to know about their personal cosmic weather

---

## Proposed Solution

**Birth Chart Integration** for personalized predictions:

### 1. Birth Data Input
- Date, time, and place of birth
- Optional: Save profile in localStorage
- Optional: Multiple profiles (family members)

### 2. Personalized Features
- Natal chart calculation
- Personal transits (planets to natal positions)
- Personal aspect alerts
- "This affects you because..." explanations

### 3. Display
- Personal predictions section
- Natal chart visualization
- Transit calendar for user

---

## Example Personalization

```
┌─────────────────────────────────────┐
│  🌟 PERSONAL FORECAST              │
├─────────────────────────────────────┤
│  Today's transits to YOUR chart:   │
│                                     │
│  ⚡ Mars conjunct natal Venus      │
│     Energy for romance/creativity   │
│                                     │
│  🔄 Saturn square natal Sun        │
│     Challenges to ego/authority     │
│                                     │
│  ✨ Jupiter trine natal Moon       │
│     Emotional expansion, good luck  │
└─────────────────────────────────────┘
```

---

## Affected Components

| Component | Changes |
|-----------|---------|
| `backend/src/natal/` | New - Birth chart calculations |
| `backend/src/routes/api.js` | Personal prediction endpoints |
| `frontend/js/profile.js` | New - Birth data management |
| `frontend/js/personal.js` | New - Personal predictions UI |

---

## Success Criteria

- [ ] **Birth Input**: Easy date/time/place entry
- [ ] **Chart Calculation**: Accurate natal positions
- [ ] **Transit Detection**: Current planets to natal
- [ ] **Personal Predictions**: Meaningful interpretations
- [ ] **Privacy**: Data stays in localStorage (no server storage)

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| Birth data input UI | 2-3 hours |
| Natal chart calculation | 4-5 hours |
| Transit calculations | 3-4 hours |
| Personal predictions | 3-4 hours |
| Interpretation text | 3-4 hours |
| Testing | 2-3 hours |
| **Total** | **17-23 hours** |

---

## Notes

This transforms WhatsHappening from "cosmic weather report" to "YOUR cosmic weather report." Personalization dramatically increases engagement and perceived value. Users return daily to see what's happening in THEIR chart.
