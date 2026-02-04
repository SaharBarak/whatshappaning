# EPIC-014: Calendar Integration

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening shows cosmic events but:

1. **No calendar sync** - Can't add events to personal calendar
2. **Manual tracking** - Users must remember upcoming events
3. **No reminders** - Miss important astrological moments
4. **Siloed data** - Predictions don't integrate with user's life

---

## Proposed Solution

**Calendar Integration** for major cosmic events:

### 1. Export Options
- 📅 **Google Calendar** - Direct add via API
- 🍎 **Apple Calendar** - .ics file download
- 📆 **Outlook** - .ics file download
- 🔗 **Generic ICS** - Universal calendar format

### 2. Events to Sync
- Full/New Moons
- Eclipses (solar/lunar)
- Mercury Retrograde periods
- Major planetary aspects
- Pattern alert days
- Personal prediction highlights

### 3. Features
- One-click "Add to Calendar" buttons
- Subscribe to event feed (auto-update)
- Custom reminder times
- Event descriptions with predictions

---

## Event Format Example

```
Title: 🌕 Full Moon in Leo
When: Feb 12, 2026 1:53 PM UTC
Description:
  Moon Phase: Full Moon (100%)
  Sign: Leo
  
  Predictions for this date:
  - Market Volatility: 68%
  - Pattern Match: 72% with Aug 2024
  
  View details: https://whatshappening.app/?date=2026-02-12
  
Location: (none)
Reminder: 1 day before
```

---

## Affected Components

| Component | Changes |
|-----------|---------|
| `backend/src/calendar/` | New - ICS generation |
| `backend/src/routes/api.js` | Calendar endpoints |
| `frontend/js/calendar.js` | New - Calendar UI |
| `frontend/index.html` | Add to calendar buttons |

---

## Success Criteria

- [ ] **ICS Export**: Download .ics for any event
- [ ] **Google Calendar**: Direct API integration
- [ ] **Subscribe Feed**: URL for calendar subscription
- [ ] **Event Content**: Predictions included in description
- [ ] **Reminders**: Configurable reminder times

---

## API Endpoints

```
GET /api/calendar/event/:date.ics
  → Single event ICS file

GET /api/calendar/feed.ics
  → Full calendar subscription feed

GET /api/calendar/google?date=2026-02-12
  → Redirect to Google Calendar add URL
```

---

## Tasks (Post-Approval)

1. Create ICS generation library
2. Define event types and content
3. Implement single event export
4. Implement subscription feed
5. Google Calendar API integration
6. Add calendar buttons to UI
7. Test with various calendar apps

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| ICS library/generation | 2-3 hours |
| Event content formatting | 2 hours |
| API endpoints | 2-3 hours |
| Google Calendar integration | 2-3 hours |
| Frontend UI | 2 hours |
| Testing | 2-3 hours |
| **Total** | **12-16 hours** |

---

## Notes

Calendar integration makes WhatsHappening part of users' daily planning. When cosmic events appear alongside work meetings and personal appointments, users engage more consistently. The subscription feed means calendars auto-update as new events are calculated.
