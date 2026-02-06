# Accessibility Audit Report

**Generated:** 2/6/2026, 11:11:05 AM

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 0 |
| 🟠 Serious | 8 |
| 🟡 Moderate | 10 |
| 🟢 Minor | 0 |
| **Total** | **18** |

## Pages Audited

### Home (/)

- **Violations:** 9
- **Passes:** 38

### Analytics (/analytics.html)

- **Violations:** 9
- **Passes:** 38

## Detailed Violations

### Home

#### 🟠 aria-dialog-name (serious)

**Description:** Ensure every ARIA dialog and alertdialog node has an accessible name

**Help:** ARIA dialog and alertdialog nodes should have an accessible name

**More info:** [https://dequeuniversity.com/rules/axe/4.11/aria-dialog-name?application=playwright](https://dequeuniversity.com/rules/axe/4.11/aria-dialog-name?application=playwright)

**Affected elements:** 1

<details>
<summary>View affected elements</summary>

```html
<div class="consent-banner visible" role="dialog" aria-labelledby="consent-title" aria-describedby="consent-description">
```

**Fix:** Fix any of the following:
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute

</details>

#### 🟠 color-contrast (serious)

**Description:** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Help:** Elements must meet minimum color contrast ratio thresholds

**More info:** [https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright)

**Affected elements:** 3

<details>
<summary>View affected elements</summary>

```html
<span class="section-title">PREDICTIONS</span>
```

**Fix:** Fix any of the following:
  Element has insufficient color contrast of 4.34 (foreground color: #64748b, background color: #f1f5f9, font size: 9.4pt (12.6px), font weight: normal). Expected contrast ratio of 4.5:1

```html
<button type="submit" id="email-submit-btn" class="email-submit-btn">
              Subscribe
            </button>
```

**Fix:** Fix any of the following:
  Element has insufficient color contrast of 3.67 (foreground color: #3b82f6, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

```html
<div class="disclaimer">
        Predictions based on historical correlations. Not financial, medical, or professional advice. Past patterns ≠ future outcomes.
      </div>
```

**Fix:** Fix any of the following:
  Element has insufficient color contrast of 2.56 (foreground color: #94a3b8, background color: #ffffff, font size: 7.9pt (10.5px), font weight: normal). Expected contrast ratio of 4.5:1

</details>

#### 🟡 region (moderate)

**Description:** Ensure all page content is contained by landmarks

**Help:** All page content should be contained by landmarks

**More info:** [https://dequeuniversity.com/rules/axe/4.11/region?application=playwright](https://dequeuniversity.com/rules/axe/4.11/region?application=playwright)

**Affected elements:** 5

<details>
<summary>View affected elements</summary>

```html
<span class="section-title">PREDICTIONS</span>
```

**Fix:** Fix any of the following:
  Some page content is not contained by landmarks

```html
<section class="modules-section">
```

**Fix:** Fix any of the following:
  Some page content is not contained by landmarks

```html
<div>
            <h2 class="email-signup-title">Get Daily Predictions</h2>
            <p class="email-signup-subtitle">Delivered to your inbox every morning</p>
          </div>
```

**Fix:** Fix any of the following:
  Some page content is not contained by landmarks

```html
<input type="email" id="email-input" class="email-input" placeholder="your@email.com" required="" autocomplete="email" aria-label="Email address">
```

**Fix:** Fix any of the following:
  Some page content is not contained by landmarks

```html
<div class="email-preferences">
```

**Fix:** Fix any of the following:
  Some page content is not contained by landmarks

</details>

### Analytics

#### 🟠 aria-dialog-name (serious)

**Description:** Ensure every ARIA dialog and alertdialog node has an accessible name

**Help:** ARIA dialog and alertdialog nodes should have an accessible name

**More info:** [https://dequeuniversity.com/rules/axe/4.11/aria-dialog-name?application=playwright](https://dequeuniversity.com/rules/axe/4.11/aria-dialog-name?application=playwright)

**Affected elements:** 1

<details>
<summary>View affected elements</summary>

```html
<div class="consent-banner visible" role="dialog" aria-labelledby="consent-title" aria-describedby="consent-description">
```

**Fix:** Fix any of the following:
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute

</details>

#### 🟠 color-contrast (serious)

**Description:** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Help:** Elements must meet minimum color contrast ratio thresholds

**More info:** [https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright)

**Affected elements:** 3

<details>
<summary>View affected elements</summary>

```html
<span class="section-title">PREDICTIONS</span>
```

**Fix:** Fix any of the following:
  Element has insufficient color contrast of 4.34 (foreground color: #64748b, background color: #f1f5f9, font size: 9.4pt (12.6px), font weight: normal). Expected contrast ratio of 4.5:1

```html
<button type="submit" id="email-submit-btn" class="email-submit-btn">
              Subscribe
            </button>
```

**Fix:** Fix any of the following:
  Element has insufficient color contrast of 3.67 (foreground color: #3b82f6, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

```html
<div class="disclaimer">
        Predictions based on historical correlations. Not financial, medical, or professional advice. Past patterns ≠ future outcomes.
      </div>
```

**Fix:** Fix any of the following:
  Element has insufficient color contrast of 2.56 (foreground color: #94a3b8, background color: #ffffff, font size: 7.9pt (10.5px), font weight: normal). Expected contrast ratio of 4.5:1

</details>

#### 🟡 region (moderate)

**Description:** Ensure all page content is contained by landmarks

**Help:** All page content should be contained by landmarks

**More info:** [https://dequeuniversity.com/rules/axe/4.11/region?application=playwright](https://dequeuniversity.com/rules/axe/4.11/region?application=playwright)

**Affected elements:** 5

<details>
<summary>View affected elements</summary>

```html
<span class="section-title">PREDICTIONS</span>
```

**Fix:** Fix any of the following:
  Some page content is not contained by landmarks

```html
<section class="modules-section">
```

**Fix:** Fix any of the following:
  Some page content is not contained by landmarks

```html
<div>
            <h2 class="email-signup-title">Get Daily Predictions</h2>
            <p class="email-signup-subtitle">Delivered to your inbox every morning</p>
          </div>
```

**Fix:** Fix any of the following:
  Some page content is not contained by landmarks

```html
<input type="email" id="email-input" class="email-input" placeholder="your@email.com" required="" autocomplete="email" aria-label="Email address">
```

**Fix:** Fix any of the following:
  Some page content is not contained by landmarks

```html
<div class="email-preferences">
```

**Fix:** Fix any of the following:
  Some page content is not contained by landmarks

</details>

