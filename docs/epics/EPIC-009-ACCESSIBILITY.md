# EPIC-009: Accessibility Audit & WCAG Compliance

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening has basic accessibility (ARIA labels, keyboard nav), but hasn't undergone a full audit:

1. **Unknown compliance level** - May not meet WCAG 2.1 AA
2. **Screen reader gaps** - Some dynamic content may not announce
3. **Color contrast issues** - Dark theme may have insufficient contrast
4. **Focus management** - Modal/panel focus trapping incomplete
5. **Mobile accessibility** - Touch targets may be too small

Accessibility isn't optional - it's essential for all users.

---

## Proposed Solution

Conduct **full accessibility audit** and fix issues:

### 1. Automated Testing
- Run axe-core on all pages
- Lighthouse accessibility audit
- Document all issues by severity

### 2. Manual Testing
- Screen reader testing (VoiceOver, NVDA)
- Keyboard-only navigation
- High contrast mode
- Reduced motion preferences

### 3. Fixes by Category

**Semantic HTML**
- Proper heading hierarchy
- Landmark regions
- Lists for repeated content

**ARIA**
- Live regions for dynamic updates
- Expanded/collapsed states
- Loading announcements

**Visual**
- Color contrast (4.5:1 minimum)
- Focus indicators
- Touch target sizes (44x44px min)

**Interaction**
- Focus trapping in modals
- Skip links
- Error announcements

---

## Success Criteria

- [ ] **Lighthouse Accessibility**: 100%
- [ ] **axe-core**: 0 critical/serious issues
- [ ] **Keyboard**: Full navigation possible
- [ ] **Screen Reader**: All content accessible
- [ ] **WCAG 2.1 AA**: Full compliance

---

## Affected Components

| Component | Likely Changes |
|-----------|----------------|
| `frontend/index.html` | Skip link, landmarks, heading structure |
| `frontend/css/styles.css` | Focus styles, contrast fixes |
| `frontend/js/app.js` | Focus management, announcements |
| `frontend/js/components/*.js` | ARIA attributes, roles |

---

## Tasks (Post-Approval)

1. Run automated audits (axe, Lighthouse)
2. Document all issues with severity
3. Fix critical issues (blocking)
4. Fix serious issues (major barriers)
5. Fix moderate issues (inconveniences)
6. Manual screen reader testing
7. Final audit verification

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| Automated audit | 1-2 hours |
| Issue documentation | 1 hour |
| Critical fixes | 2-4 hours |
| Serious fixes | 3-5 hours |
| Moderate fixes | 2-3 hours |
| Manual testing | 2-3 hours |
| **Total** | **11-18 hours** |

---

## Notes

Accessibility improvements benefit everyone - better keyboard nav, clearer focus states, and semantic structure improve the experience for all users, not just those using assistive technology. This also reduces legal risk and expands the potential audience.
