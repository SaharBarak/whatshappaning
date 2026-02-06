# EPIC-009: Accessibility Audit & WCAG Compliance

## Status
🟢 In Progress

## Overview
Run automated accessibility audits using industry-standard tools (axe-core, Lighthouse) to identify and document accessibility issues across all pages.

## Completed Tasks

### Issue #115: Accessibility Audit - axe-core + Lighthouse ✅
- Installed axe-core and Lighthouse as dev dependencies
- Created automated audit scripts in `frontend/scripts/`
- Added npm scripts: `a11y:axe`, `a11y:lighthouse`, `a11y:audit`, `a11y:report`
- Generated comprehensive accessibility reports
- Added CI workflow job for automated accessibility testing
- Reports saved to `frontend/a11y-reports/` and `docs/accessibility-audit-report.md`

## Audit Results Summary

### Lighthouse Accessibility Score
- **Home Page:** 91/100 🟢
- **Analytics Page:** 91/100 🟢
- **Average:** 91/100 🟢

### Axe-core Findings
| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 Critical | 0 | None found |
| 🟠 Serious | 8 | Color contrast, ARIA dialog names |
| 🟡 Moderate | 10 | Landmark regions |
| 🟢 Minor | 0 | None found |
| **Total** | 18 | |

## Issues Found (Prioritized)

### 1. Color Contrast (SERIOUS) - 6 elements
Elements with insufficient color contrast:
- Section titles (4.34:1, needs 4.5:1)
- Subscribe button (3.67:1, needs 4.5:1)
- Disclaimer text (2.56:1, needs 4.5:1)

**Fix:** Update colors to meet WCAG AA 4.5:1 minimum contrast ratio

### 2. ARIA Dialog Name (SERIOUS) - 2 elements
Consent banner dialog missing accessible name:
- `aria-labelledby` references non-existent element

**Fix:** Add `consent-title` element or use `aria-label`

### 3. Landmark Regions (MODERATE) - 10 elements
Content not contained by landmarks:
- Modules section lacks proper role
- Email signup content outside main landmark

**Fix:** Add appropriate ARIA roles or wrap in semantic elements

## Technical Implementation

### New Files Added
- `frontend/scripts/run-axe-audit.js` - Axe-core automation
- `frontend/scripts/run-lighthouse-audit.js` - Lighthouse automation
- `frontend/scripts/generate-a11y-report.js` - Combined report generator
- `frontend/lighthouserc.js` - Lighthouse CI configuration
- `docs/accessibility-audit-report.md` - Latest audit results

### NPM Scripts
```bash
# Run axe-core audit
npm run a11y:axe

# Run Lighthouse audit
npm run a11y:lighthouse

# Run both audits
npm run a11y:audit

# Generate combined report
npm run a11y:report
```

### CI Integration
Added `accessibility-audit` job to `.github/workflows/ci.yml`:
- Runs axe-core on every PR
- Fails build if critical issues found
- Warns on serious issues
- Uploads reports as artifacts

## Remaining Tasks

### Issue #116: Fix Color Contrast & Focus Indicators
- [ ] Update section title colors for better contrast
- [ ] Fix subscribe button text color
- [ ] Darken disclaimer text
- [ ] Add visible focus indicators to all interactive elements

### Issue #117: Keyboard Navigation & ARIA
- [ ] Fix consent banner aria-labelledby
- [ ] Add landmark roles to main sections
- [ ] Verify tab order is logical
- [ ] Test with screen readers

## Acceptance Criteria
- [x] axe-core report generated
- [x] Lighthouse accessibility score documented
- [x] Issues categorized by severity
- [x] CI integration for ongoing monitoring
- [ ] Critical/Serious issues fixed
- [ ] Lighthouse score ≥ 95

## References
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://dequeuniversity.com/rules/axe/)
- [Lighthouse Accessibility Audits](https://web.dev/lighthouse-accessibility/)
