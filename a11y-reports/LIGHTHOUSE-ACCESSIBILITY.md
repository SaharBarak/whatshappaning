# Lighthouse Accessibility Report

**Generated:** 2/6/2026, 11:11:35 AM

## Summary

**Average Accessibility Score:** 🟢 91/100

| Page | Score | Failed Audits |
|------|-------|---------------|
| Home | 🟢 91/100 | 2 |
| Analytics | 🟢 91/100 | 2 |

## Failed Audits by Page

### Home (Score: 91/100)

#### ❌ Elements with `role="dialog"` or `role="alertdialog"` do not have accessible names.

ARIA dialog elements without accessible names may prevent screen readers users from discerning the purpose of these elements. [Learn how to make ARIA dialog elements more accessible](https://dequeuniversity.com/rules/axe/4.9/aria-dialog-name).

**Affected elements:**

```html
<div class="consent-banner visible" role="dialog" aria-labelledby="consent-title" aria-describedby="consent-description">
```

#### ❌ Background and foreground colors do not have a sufficient contrast ratio.

Low-contrast text is difficult or impossible for many users to read. [Learn how to provide sufficient color contrast](https://dequeuniversity.com/rules/axe/4.9/color-contrast).

**Affected elements:**

```html
<span class="section-title">
```

```html
<button type="submit" id="email-submit-btn" class="email-submit-btn">
```

```html
<div class="disclaimer">
```

### Analytics (Score: 91/100)

#### ❌ Elements with `role="dialog"` or `role="alertdialog"` do not have accessible names.

ARIA dialog elements without accessible names may prevent screen readers users from discerning the purpose of these elements. [Learn how to make ARIA dialog elements more accessible](https://dequeuniversity.com/rules/axe/4.9/aria-dialog-name).

**Affected elements:**

```html
<div class="consent-banner visible" role="dialog" aria-labelledby="consent-title" aria-describedby="consent-description">
```

#### ❌ Background and foreground colors do not have a sufficient contrast ratio.

Low-contrast text is difficult or impossible for many users to read. [Learn how to provide sufficient color contrast](https://dequeuniversity.com/rules/axe/4.9/color-contrast).

**Affected elements:**

```html
<span class="section-title">
```

```html
<button type="submit" id="email-submit-btn" class="email-submit-btn">
```

```html
<div class="disclaimer">
```

## Scoring Guide

- 🟢 **90-100**: Good accessibility
- 🟡 **50-89**: Needs improvement
- 🔴 **0-49**: Poor accessibility

## HTML Reports

Full Lighthouse HTML reports are available in the `a11y-reports/` folder.
