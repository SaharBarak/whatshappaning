# EPIC-013: Dark/Light Theme Toggle

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening has a dark theme only:

1. **No light option** - Some users prefer light themes
2. **Accessibility concerns** - Some visual impairments need high contrast light
3. **Daytime readability** - Dark themes harder to read in bright environments
4. **System preference ignored** - Doesn't respect OS dark/light mode setting

---

## Proposed Solution

Implement **Theme Toggle** with three modes:

### 1. Theme Options
- 🌙 **Dark** - Current default theme
- ☀️ **Light** - New light theme variant
- 💻 **System** - Follow OS preference

### 2. Features
- Toggle in header (moon/sun icon)
- Smooth transition animation
- Preference saved to localStorage
- Respects prefers-color-scheme media query

### 3. CSS Custom Properties
```css
:root {
  --bg-primary: #0a0a0f;
  --text-primary: #ffffff;
  /* ... */
}

[data-theme="light"] {
  --bg-primary: #ffffff;
  --text-primary: #1a1a2e;
  /* ... */
}
```

---

## Affected Components

| Component | Changes |
|-----------|---------|
| `frontend/css/styles.css` | CSS variables, light theme |
| `frontend/js/theme.js` | New - Theme manager |
| `frontend/js/app.js` | Initialize theme |
| `frontend/index.html` | Theme toggle button |

---

## Success Criteria

- [ ] **Toggle Works**: Switch between dark/light/system
- [ ] **Persistence**: Preference saved across sessions
- [ ] **System Sync**: Respects OS preference when set to "system"
- [ ] **Smooth Transition**: No jarring flash on switch
- [ ] **All Components**: Every UI element themed correctly

---

## Tasks (Post-Approval)

1. Define CSS custom properties for all colors
2. Create light theme color palette
3. Add theme toggle button to header
4. Implement theme.js manager
5. Add system preference detection
6. Test all components in both themes
7. Add transition animations

---

## Color Palette

| Token | Dark | Light |
|-------|------|-------|
| --bg-primary | #0a0a0f | #ffffff |
| --bg-secondary | #1a1a2e | #f5f5f7 |
| --text-primary | #ffffff | #1a1a2e |
| --text-secondary | #a0a0a0 | #666666 |
| --accent | #6366f1 | #4f46e5 |
| --success | #22c55e | #16a34a |
| --warning | #f59e0b | #d97706 |
| --danger | #ef4444 | #dc2626 |

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| CSS variables setup | 2 hours |
| Light theme colors | 2-3 hours |
| Theme manager JS | 1-2 hours |
| Toggle UI | 1 hour |
| Testing all components | 2-3 hours |
| **Total** | **8-11 hours** |

---

## Notes

Theme toggle is a quick win that significantly improves accessibility and user preference. Many users prefer light themes during daytime. The CSS custom properties approach makes it easy to maintain and extend with additional themes in the future.
