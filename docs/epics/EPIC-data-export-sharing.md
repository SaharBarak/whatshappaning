# Data Export & Social Sharing

## Status
🟢 Frontend Implementation Complete

## Acceptance Criteria
- [x] Share button in header
- [x] Share modal with social platforms (Twitter, Facebook, WhatsApp, LinkedIn)
- [x] Copy link to clipboard functionality
- [x] Export image in multiple formats (square, story, wide)
- [x] Export data as PDF, JSON, CSV
- [x] Native Web Share API on mobile
- [x] Toast notifications for feedback
- [x] Accessible modal with focus trap and escape to close
- [x] Light/dark theme compatible

## Technical Approach

### Files Modified
- `frontend/index.html` - Added share button and modal
- `frontend/css/styles.css` - Share modal and button styles
- `frontend/js/app.js` - Integrated share initialization

### Files Added (Now Tracked)
- `frontend/js/share.js` - Share and export module

### Implementation Details

1. **Share Button**
   - Located in header next to live indicator
   - 📤 emoji icon, 44px touch target
   - On mobile: triggers native Web Share API
   - On desktop: opens share modal

2. **Share Modal**
   - Social sharing buttons (Twitter, Facebook, WhatsApp, LinkedIn)
   - Copy link button with clipboard API
   - Export image buttons (3 aspect ratios)
   - Export data buttons (PDF, JSON, CSV)
   - Focus trap for accessibility
   - Escape key to close

3. **Social Sharing**
   - Twitter: Opens tweet intent with pre-filled text
   - Facebook: Opens sharer dialog
   - WhatsApp: Opens wa.me with message
   - LinkedIn: Opens share-offsite dialog

4. **Export Functions**
   - Image exports call `/api/export/image?format=`
   - PDF exports call `/api/export/pdf`
   - JSON exports call `/api/export/json`
   - CSV exports call `/api/export/csv`
   - All use blob download pattern

5. **Native Share API**
   - Detects `navigator.share` support
   - Falls back to modal if unavailable
   - Better UX on mobile devices

## API Endpoints (Backend)
- `GET /api/export/image?format=<format>` - Generate share image
- `GET /api/export/pdf` - Generate PDF report
- `GET /api/export/json` - Export raw JSON data
- `GET /api/export/csv` - Export CSV data

## Out of Scope
- Server-side image generation (backend team)
- PDF template design (backend team)
- Share analytics tracking
- Scheduled export emails
