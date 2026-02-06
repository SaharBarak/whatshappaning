# Accessibility Audit Report

**Generated:** 2/6/2026, 11:11:43 AM

---

## Executive Summary

⚠️ **8 critical/serious accessibility issues found** that need immediate attention.

Lighthouse Accessibility Score: 🟢 **91/100**

## Axe-core Results

| Severity | Count | Priority |
|----------|-------|----------|
| 🔴 Critical | 0 | Must fix immediately |
| 🟠 Serious | 8 | Fix before release |
| 🟡 Moderate | 10 | Should fix |
| 🟢 Minor | 0 | Nice to fix |
| **Total** | **18** | |

## Lighthouse Accessibility Scores

| Page | Score | Status |
|------|-------|--------|
| Home | 91/100 | 🟢 Good |
| Analytics | 91/100 | 🟢 Good |

## Priority Issues (Fix First)

### Home

#### 🟠 aria-dialog-name

**Impact:** SERIOUS

**Problem:** Ensure every ARIA dialog and alertdialog node has an accessible name

**Solution:** ARIA dialog and alertdialog nodes should have an accessible name

**Reference:** [WCAG Guidelines](https://dequeuniversity.com/rules/axe/4.11/aria-dialog-name?application=playwright)

**Affected Elements:** 1

<details>
<summary>Show affected elements</summary>

```html
<div class="consent-banner visible" role="dialog" aria-labelledby="consent-title" aria-describedby="consent-description">
```
Fix: Fix any of the following:
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute

</details>

#### 🟠 color-contrast

**Impact:** SERIOUS

**Problem:** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Solution:** Elements must meet minimum color contrast ratio thresholds

**Reference:** [WCAG Guidelines](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright)

**Affected Elements:** 3

<details>
<summary>Show affected elements</summary>

```html
<span class="section-title">PREDICTIONS</span>
```
Fix: Fix any of the following:
  Element has insufficient color contrast of 4.34 (foreground color: #64748b, background color: #f1f5f9, font size: 9.4pt (12.6px), font weight: normal). Expected contrast ratio of 4.5:1

```html
<button type="submit" id="email-submit-btn" class="email-submit-btn">
              Subscribe
            </button>
```
Fix: Fix any of the following:
  Element has insufficient color contrast of 3.67 (foreground color: #3b82f6, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

```html
<div class="disclaimer">
        Predictions based on historical correlations. Not financial, medical, or professional advice. Past patterns ≠ future outcomes.
      </div>
```
Fix: Fix any of the following:
  Element has insufficient color contrast of 2.56 (foreground color: #94a3b8, background color: #ffffff, font size: 7.9pt (10.5px), font weight: normal). Expected contrast ratio of 4.5:1

</details>

### Analytics

#### 🟠 aria-dialog-name

**Impact:** SERIOUS

**Problem:** Ensure every ARIA dialog and alertdialog node has an accessible name

**Solution:** ARIA dialog and alertdialog nodes should have an accessible name

**Reference:** [WCAG Guidelines](https://dequeuniversity.com/rules/axe/4.11/aria-dialog-name?application=playwright)

**Affected Elements:** 1

<details>
<summary>Show affected elements</summary>

```html
<div class="consent-banner visible" role="dialog" aria-labelledby="consent-title" aria-describedby="consent-description">
```
Fix: Fix any of the following:
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute

</details>

#### 🟠 color-contrast

**Impact:** SERIOUS

**Problem:** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Solution:** Elements must meet minimum color contrast ratio thresholds

**Reference:** [WCAG Guidelines](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright)

**Affected Elements:** 3

<details>
<summary>Show affected elements</summary>

```html
<span class="section-title">PREDICTIONS</span>
```
Fix: Fix any of the following:
  Element has insufficient color contrast of 4.34 (foreground color: #64748b, background color: #f1f5f9, font size: 9.4pt (12.6px), font weight: normal). Expected contrast ratio of 4.5:1

```html
<button type="submit" id="email-submit-btn" class="email-submit-btn">
              Subscribe
            </button>
```
Fix: Fix any of the following:
  Element has insufficient color contrast of 3.67 (foreground color: #3b82f6, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

```html
<div class="disclaimer">
        Predictions based on historical correlations. Not financial, medical, or professional advice. Past patterns ≠ future outcomes.
      </div>
```
Fix: Fix any of the following:
  Element has insufficient color contrast of 2.56 (foreground color: #94a3b8, background color: #ffffff, font size: 7.9pt (10.5px), font weight: normal). Expected contrast ratio of 4.5:1

</details>

## Moderate Issues

### Home

- **region**: All page content should be contained by landmarks (5 elements)

### Analytics

- **region**: All page content should be contained by landmarks (5 elements)

## WCAG 2.1 AA Compliance Checklist

| Principle | Status | Notes |
|-----------|--------|-------|
| Perceivable | ⚠️ | Review color contrast, alt text |
| Operable | ⚠️ | Review keyboard navigation, focus |
| Understandable | ⚠️ | Review labels, error handling |
| Robust | ⚠️ | Review ARIA usage |

## Recommendations

### Immediate Actions

1. Fix all critical and serious issues listed above
2. Run `npm run a11y:audit` after fixes to verify
3. Test with screen reader (VoiceOver, NVDA)

### Ongoing Maintenance

1. Add accessibility tests to CI pipeline
2. Train team on WCAG 2.1 guidelines
3. Include a11y checks in code review
4. Regular audits (monthly recommended)

---

## Tools Used

- **axe-core**: Automated accessibility testing engine
- **Lighthouse**: Google's web auditing tool
- **Playwright**: Browser automation for testing

## Files Generated

- `ACCESSIBILITY-AUDIT.md` - Axe-core detailed report
- `LIGHTHOUSE-ACCESSIBILITY.md` - Lighthouse detailed report
- `axe-audit-summary.json` - Machine-readable axe summary
- `lighthouse-audit-summary.json` - Machine-readable Lighthouse summary
- `lighthouse-*.html` - Full Lighthouse HTML reports
