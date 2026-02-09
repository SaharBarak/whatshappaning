# Performance Monitoring & Error Tracking

## Overview

This project uses automated performance monitoring via Lighthouse CI, uptime monitoring, and lightweight client-side error tracking.

## Lighthouse CI

**Workflow:** `.github/workflows/lighthouse-ci.yml`  
**Config:** `frontend/lighthouserc.js`

Runs automatically on every PR that touches `frontend/` files. Reports performance scores, Core Web Vitals, and resource budgets as a PR comment.

### Performance Budgets

| Metric | Budget | Severity |
|--------|--------|----------|
| Performance Score | ≥ 90 | Error (blocks PR) |
| Accessibility Score | ≥ 95 | Error (blocks PR) |
| Best Practices Score | ≥ 90 | Error (blocks PR) |
| SEO Score | ≥ 90 | Warning |
| LCP | ≤ 2500ms | Error |
| TBT | ≤ 200ms | Error |
| CLS | ≤ 0.1 | Error |
| FCP | ≤ 1500ms | Warning |
| Total Resources | ≤ 500KB | Error |
| JS Size | ≤ 100KB | Error |

### Viewing Reports

Lighthouse reports are uploaded as artifacts on each workflow run and also available via temporary public storage links in the CI output.

## Uptime Monitoring

**Workflow:** `.github/workflows/uptime-monitor.yml`

Runs every 15 minutes via GitHub Actions cron. Checks both backend (`/health`) and frontend endpoints.

### Alerts

- On failure: Creates a GitHub Issue labeled `incident` + `priority:high`
- Subsequent failures: Adds comments to existing incident
- On recovery: Auto-closes the incident issue

### Configuration

Set these repository variables:
- `BACKEND_URL` — Backend base URL (e.g., `https://api.example.com`)
- `FRONTEND_URL` — Frontend base URL (e.g., `https://example.com`)

## Error Tracking

**Module:** `frontend/js/error-tracking.js`

Lightweight, zero-dependency error tracking (no Sentry required). Captures:

- Unhandled JavaScript errors
- Unhandled promise rejections
- Long tasks (>100ms)
- Core Web Vitals (FCP, LCP, CLS)

Errors are buffered and flushed to the backend `/api/errors` endpoint every 30 seconds. Falls back gracefully when the backend is unavailable.

### Manual Error Capture

```javascript
window.ErrorTracker.capture(new Error('Something went wrong'), {
  context: 'user-action',
  component: 'predictions'
});
```

## Setup Checklist

- [x] Lighthouse CI workflow on PRs
- [x] Performance budgets in `lighthouserc.js`
- [x] PR checks fail on budget violations
- [x] Uptime monitoring with GitHub Issues alerts
- [x] Client-side error tracking
- [ ] Optional: Set `LHCI_GITHUB_APP_TOKEN` secret for Lighthouse GitHub status checks
- [ ] Optional: Add `/api/errors` endpoint to backend for error collection
