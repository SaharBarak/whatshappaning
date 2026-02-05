# Data Export & Social Sharing

## Status
🟢 Complete

## Acceptance Criteria
- [x] Shareable image generation (square, story, wide, compact)
- [x] PDF report generation
- [x] JSON data export
- [x] CSV data export
- [x] Open Graph metadata for link previews
- [x] Share text generation for social platforms
- [x] Share button/modal UI
- [x] Copy-to-clipboard functionality
- [x] Direct social sharing links (Twitter, Facebook, WhatsApp, LinkedIn)
- [x] Native Web Share API on mobile

## Technical Approach

### Backend (Complete)

**Export Service** (`src/export/index.js`)
- Canvas-based image generation with prediction cards
- PDFKit-based report generation
- Multiple image formats for different platforms
- Dark theme matching the app design

**API Endpoints**

Export:
- `GET /api/export/image?format=` - Generate shareable image (square, story, wide, compact)
- `GET /api/export/pdf` - Generate PDF report
- `GET /api/export/json` - Export data as JSON
- `GET /api/export/csv` - Export data as CSV
- `GET /api/export/og` - Open Graph metadata for link previews
- `GET /api/export/share-text` - Share text for social platforms

### Frontend (Complete)

**Share Module** (`frontend/js/share.js`)
- Download functions for image, PDF, JSON, CSV exports
- Social sharing functions (Twitter, Facebook, WhatsApp, LinkedIn)
- Copy link to clipboard functionality
- Native Web Share API support on mobile
- Toast notifications for user feedback

**UI Components**
- Header share button with icon
- Share modal with three sections:
  - Social sharing buttons
  - Image export (Square/Story/Wide formats)
  - Data export (PDF/JSON/CSV)
- Accessible with keyboard navigation and ARIA labels
- Responsive design (icon-only on mobile, with text on desktop)

## Configuration

Image formats:
- `square`: 1080x1080 (Instagram, Facebook)
- `story`: 1080x1920 (Instagram Stories)
- `wide`: 1200x630 (Twitter, LinkedIn)
- `compact`: 600x315 (Small previews)

## Dependencies

Optional (for image/PDF):
- `canvas` - Image generation
- `pdfkit` - PDF generation

Falls back gracefully if not installed.

## Out of Scope
- Video generation
- Animated GIFs
- Print-optimized layouts
