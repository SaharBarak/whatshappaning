# Performance Optimization & Monitoring

## Status
🟢 Implementation Complete

## Acceptance Criteria

### Frontend
- [x] Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB, INP)
- [x] Performance budget thresholds defined
- [x] Console logging with visual indicators (✅ good, ⚠️ needs improvement, ❌ poor)
- [x] Resource timing analysis (JS, CSS, images, fonts)
- [x] Connection quality detection
- [x] Metrics reporting on page unload
- [x] Performance budget JSON config
- [x] GA4 analytics with consent management

### Backend
- [x] Response time tracking with X-Response-Time header
- [x] Slow request logging (>500ms warnings)
- [x] Gzip compression for responses >1KB
- [x] Performance metrics collection (p50, p95, p99)
- [x] `/metrics` endpoint for monitoring
- [x] Analytics API for prediction accuracy tracking
- [x] Memory and uptime monitoring

## Technical Approach

### Frontend

**Files Added:**
- `frontend/js/performance.js` - Core Web Vitals monitoring module
- `frontend/js/ga4.js` - GA4 tracking module with consent mode
- `frontend/js/ga4-config.js` - GA4 configuration
- `frontend/js/ga4-events.js` - Event tracking definitions
- `frontend/js/components/consent-banner.js` - GDPR-compliant consent banner
- `frontend/css/consent-banner.css` - Consent banner styles
- `performance-budget.json` - Lighthouse CI performance budget
- `docs/analytics-events.md` - Analytics events documentation

**Files Modified:**
- `frontend/js/app.js` - Integrated performance monitoring and GA4

#### Core Web Vitals Tracked

| Metric | Good | Needs Improvement | Description |
|--------|------|-------------------|-------------|
| LCP | < 2.5s | < 4.0s | Largest Contentful Paint |
| FID | < 100ms | < 300ms | First Input Delay |
| CLS | < 0.1 | < 0.25 | Cumulative Layout Shift |
| FCP | < 1.8s | < 3.0s | First Contentful Paint |
| TTFB | < 800ms | < 1.8s | Time to First Byte |
| INP | < 200ms | < 500ms | Interaction to Next Paint |

#### Performance Budget Targets
- **Total page weight:** < 500 KB
- **JavaScript:** < 100 KB
- **CSS:** < 30 KB
- **Images:** < 100 KB
- **Fonts:** < 100 KB
- **Lighthouse Performance Score:** ≥ 90

#### Frontend Implementation Details

1. **PerformanceObserver API**
   - Uses native browser APIs for accurate measurements
   - Observes paint, layout-shift, first-input, and event entries
   - Buffered entries ensure no missed metrics

2. **Resource Timing**
   - Analyzes all loaded resources
   - Categorizes by type (js, css, img, font)
   - Reports total size and load duration

3. **Console Output**
   - Real-time metric logging with emoji indicators
   - Budget warnings when thresholds exceeded
   - Final metrics summary on page unload

4. **Developer API**
   - `window.getPerformanceMetrics()` returns all collected metrics
   - Can be extended to report to analytics endpoint

5. **GA4 Analytics**
   - Consent mode for GDPR/CCPA compliance
   - 40+ tracked events across 7 categories
   - API error tracking
   - Engagement metrics

### Backend

**Files Added:**
- `backend/src/middleware/performance.js` - Performance middleware
- `backend/src/analytics/index.js` - Prediction accuracy tracking service
- `backend/src/routes/analytics.js` - Analytics API endpoints
- `backend/migrations/003_prediction_archive.sql` - Archive table migration

**Files Modified:**
- `backend/src/index.js` - Wired middleware and routes

#### Performance Middleware
- `responseTime` - Logs request duration, adds X-Response-Time header
- `compression` - Gzip compression for responses >1KB
- `metricsCollector` - Collects latency samples per endpoint
- `performanceMetrics` - Singleton for p50/p95/p99 calculations

#### Analytics Service
- Prediction accuracy tracking
- Accuracy by confidence level
- Accuracy over time trends
- Calibration data for reliability diagrams
- Feature contribution analysis

#### API Endpoints

**Performance:**
- `GET /metrics` - System metrics (endpoints, uptime, memory)

**Analytics:**
- `GET /api/analytics` - Full analytics report
- `GET /api/analytics/accuracy` - Overall accuracy
- `GET /api/analytics/accuracy/:outcome` - Per-outcome accuracy
- `GET /api/analytics/by-confidence` - Accuracy by confidence level
- `GET /api/analytics/over-time` - Accuracy trends
- `GET /api/analytics/calibration` - Reliability diagram data
- `GET /api/analytics/history` - Prediction archive
- `GET /api/analytics/features` - Top contributing features

## Configuration

Performance thresholds:
- Slow request warning: >500ms
- Compression threshold: >1KB
- Compression level: 6 (default)

## CI/CD Integration
- `performance-budget.json` compatible with Lighthouse CI
- Can be used in GitHub Actions for automated budgeting
- See `.github/workflows/lighthouse.yml` for integration

## Out of Scope
- Real-time monitoring dashboard
- Historical trend analysis
- APM integration (Datadog, New Relic)
- Distributed tracing
- Custom alerting
