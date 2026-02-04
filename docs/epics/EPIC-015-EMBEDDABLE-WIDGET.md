# EPIC-015: Embeddable Widget

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening content stays on the site:

1. **No embedding** - Can't add predictions to other sites
2. **Limited reach** - Content confined to main domain
3. **No partnerships** - Astrology blogs can't feature our data
4. **Missing distribution** - Users can't share live widgets

---

## Proposed Solution

**Embeddable Widgets** for external sites:

### 1. Widget Types
- 🌙 **Mini Dashboard** - Compact predictions overview
- 🌕 **Moon Widget** - Current moon phase only
- 📊 **Prediction Card** - Single prediction with factors
- 📅 **Daily Summary** - Today's key highlights

### 2. Customization
- Size options (small/medium/large)
- Theme (dark/light/transparent)
- Show/hide specific modules
- Custom accent color

### 3. Embed Code
```html
<iframe 
  src="https://whatshappening.app/embed/mini"
  width="300" height="400"
  frameborder="0">
</iframe>

<!-- Or script embed -->
<div id="wh-widget" data-type="moon"></div>
<script src="https://whatshappening.app/widget.js"></script>
```

---

## Widget Sizes

| Type | Small | Medium | Large |
|------|-------|--------|-------|
| Mini Dashboard | 250x300 | 300x400 | 400x500 |
| Moon Widget | 150x150 | 200x200 | 300x300 |
| Prediction Card | 250x150 | 300x200 | 400x250 |

---

## Affected Components

| Component | Changes |
|-----------|---------|
| `frontend/embed/` | New - Widget pages |
| `frontend/widget.js` | New - Script embed |
| `backend/src/routes/embed.js` | New - Widget API |
| `frontend/css/widget.css` | New - Widget styles |

---

## Success Criteria

- [ ] **iframe Embed**: Simple copy-paste code
- [ ] **Script Embed**: Auto-sizing widgets
- [ ] **Customization**: Size, theme, modules
- [ ] **Responsive**: Works in any container
- [ ] **Fast**: <1s load time
- [ ] **CORS**: Works on any domain

---

## Tasks (Post-Approval)

1. Create widget HTML templates
2. Build widget-specific CSS (minimal, isolated)
3. Create embed routes (/embed/mini, /embed/moon, etc.)
4. Build widget.js loader script
5. Add customization parameters
6. Create "Get Widget" UI on main site
7. Test on various external sites

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| Widget templates | 3-4 hours |
| Widget CSS | 2-3 hours |
| Embed routes | 2 hours |
| Script loader | 2-3 hours |
| Customization UI | 2 hours |
| Testing | 2-3 hours |
| **Total** | **13-17 hours** |

---

## Notes

Embeddable widgets turn every astrology blog into a distribution channel. When bloggers embed WhatsHappening widgets, they drive awareness and traffic. The widgets also serve as a constant, live advertisement for the full dashboard.
