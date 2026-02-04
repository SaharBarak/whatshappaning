# EPIC-008: User Preferences & Personalization

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening displays all 16 modules equally, but users have different interests:

1. **Information overload** - 16 modules may overwhelm new users
2. **No customization** - Can't hide modules they don't care about
3. **No memory** - Preferences reset on each visit
4. **Fixed layout** - Can't reorder modules by importance to them

Users want to personalize their dashboard experience.

---

## Proposed Solution

Implement **User Preferences** stored in localStorage (no auth required):

### 1. Module Visibility
- Toggle individual modules on/off
- "Show All" / "Show Favorites" quick toggles
- Hidden modules accessible via "More..." section

### 2. Module Order
- Drag-and-drop to reorder modules
- Pin favorite modules to top
- Remember custom order

### 3. Display Preferences
- Compact vs expanded card view
- Auto-expand predictions panel
- Default time range for charts

### 4. Notification Preferences
- (Integrates with EPIC-005)
- Which alerts to receive
- Quiet hours

---

## Affected Components

| Component | Changes Required |
|-----------|------------------|
| `frontend/js/preferences.js` | New - Preferences manager |
| `frontend/js/app.js` | Load/apply preferences |
| `frontend/js/components/modules.js` | Respect visibility/order |
| `frontend/css/styles.css` | Settings panel styles |
| `frontend/index.html` | Settings gear icon, modal |

---

## Success Criteria

- [ ] **Visibility Toggle**: Users can hide/show modules
- [ ] **Order Persistence**: Custom order saved across visits
- [ ] **Settings UI**: Clean settings panel/modal
- [ ] **Reset Option**: One-click restore defaults
- [ ] **No Backend**: All stored in localStorage

---

## Tasks (Post-Approval)

1. Create preferences manager (load/save to localStorage)
2. Add settings gear icon to header
3. Create settings modal with toggles
4. Implement module visibility filtering
5. Implement drag-and-drop reordering
6. Add compact/expanded view toggle
7. Test persistence across sessions

---

## Data Structure

```javascript
// localStorage key: 'wh_preferences'
{
  version: 1,
  modules: {
    visibility: {
      moon: true,
      tarot: true,
      markets: false,  // hidden
      // ...
    },
    order: ['predictions', 'moon', 'astrology', 'tarot', ...],
    pinned: ['moon', 'astrology']
  },
  display: {
    compactMode: false,
    autoExpandPredictions: true
  },
  notifications: {
    patternAlerts: true,
    predictionShifts: true,
    quietHours: { start: 23, end: 7 }
  }
}
```

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| Preferences manager | 2-3 hours |
| Settings UI | 3-4 hours |
| Module visibility | 2 hours |
| Drag-and-drop order | 3-4 hours |
| Testing | 2 hours |
| **Total** | **12-15 hours** |

---

## Notes

This is a frontend-only feature requiring no backend changes. It dramatically improves UX by letting users customize their experience. localStorage ensures preferences persist without requiring user accounts.
