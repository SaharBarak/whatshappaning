# EPIC-007: Data Export & Social Sharing

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening generates beautiful, data-rich predictions daily. However:

1. **No export capability** - Users can't save today's readings for later reference
2. **No sharing** - Can't share predictions on social media or with friends
3. **No archival** - Daily readings are ephemeral, lost when data updates
4. **Community growth limited** - No viral loop for discovering the platform

Users want to share "Look what the cosmos says today!" on Twitter/Instagram.

---

## Proposed Solution

Add **Export & Sharing** capabilities:

### 1. Image Export (Screenshot-like)
- Generate shareable image of predictions panel
- Styled card format optimized for social media
- Include date, key predictions, and branding
- Sizes: Square (1:1), Story (9:16), Wide (16:9)

### 2. PDF Report
- Full daily report as downloadable PDF
- All module data, predictions, pattern alerts
- Professional formatting for printing/archiving

### 3. Share Actions
- Direct share to Twitter, Facebook, WhatsApp
- Copy link with preview metadata (Open Graph)
- Embed code for blogs/websites

### 4. API Export
- JSON export of current data
- CSV export for spreadsheet users
- Timestamped for reproducibility

---

## Image Export Example

```
┌────────────────────────────────────┐
│  🌙 WHAT'S HAPPENING               │
│     February 4, 2026               │
├────────────────────────────────────┤
│                                    │
│  📈 MARKET VOLATILITY: 73%         │
│     ████████████░░░░ HIGH          │
│                                    │
│  🌕 Full Moon in Leo               │
│  ☿️ Mercury Direct                 │
│  🎴 Tarot: The Tower               │
│                                    │
│  Pattern Match: 85% with 2024-02-14│
│                                    │
├────────────────────────────────────┤
│  whatshappening.app                │
└────────────────────────────────────┘
```

---

## Affected Components

| Component | Changes Required |
|-----------|------------------|
| `backend/src/routes/api.js` | Export endpoints (image, PDF, JSON, CSV) |
| `backend/src/export/` | New - Export generation logic |
| `backend/package.json` | Add puppeteer (or canvas), pdfkit |
| `frontend/js/share.js` | New - Share button logic |
| `frontend/index.html` | Share/export buttons, modal |
| `frontend/css/styles.css` | Share UI, export card styles |

---

## Success Criteria

- [ ] **Image Export**: Generate styled PNG for sharing
- [ ] **PDF Report**: Downloadable daily report
- [ ] **Social Share**: Twitter, Facebook, WhatsApp buttons
- [ ] **Copy Link**: Shareable URL with preview
- [ ] **JSON/CSV**: Data export for power users
- [ ] **Mobile**: Share sheet integration on mobile
- [ ] **Branding**: Consistent, attractive share cards

---

## Tasks (Post-Approval)

1. **Create image export endpoint**
   ```javascript
   // GET /api/export/image?format=square
   // Uses puppeteer or canvas to render styled card
   app.get('/api/export/image', async (req, res) => {
     const format = req.query.format || 'square';
     const data = await getCurrentPredictions();
     const image = await renderShareCard(data, format);
     res.type('image/png').send(image);
   });
   ```

2. **Create PDF export endpoint**
   ```javascript
   // GET /api/export/pdf
   // Full daily report with all modules
   ```

3. **Add share card HTML template**
   - Styled HTML for image rendering
   - Dark theme matching main site
   - Logo and branding elements

4. **Add share buttons to frontend**
   ```html
   <div class="share-buttons">
     <button class="share-twitter">Share on Twitter</button>
     <button class="share-image">Download Image</button>
     <button class="share-pdf">Download PDF</button>
   </div>
   ```

5. **Implement Web Share API**
   ```javascript
   // Use native share on mobile
   if (navigator.share) {
     navigator.share({
       title: "Today's Cosmic Predictions",
       text: summary,
       url: window.location.href
     });
   }
   ```

6. **Add Open Graph metadata**
   ```html
   <meta property="og:title" content="What's Happening - Feb 4, 2026">
   <meta property="og:image" content="/api/export/image?date=2026-02-04">
   <meta property="og:description" content="Market volatility 73%...">
   ```

7. **Add JSON/CSV export**
   ```javascript
   // GET /api/export/json
   // GET /api/export/csv
   ```

---

## Share Card Formats

| Format | Dimensions | Use Case |
|--------|-----------|----------|
| Square | 1080x1080 | Instagram, Twitter |
| Story | 1080x1920 | Instagram Stories, TikTok |
| Wide | 1200x630 | Twitter, Facebook, LinkedIn |
| Compact | 600x315 | Open Graph preview |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Puppeteer heavy | Use canvas for simpler renders, puppeteer for complex |
| Image generation slow | Cache generated images, async generation |
| Large PDF files | Optimize images, limit history |
| Server load | Rate limit exports, queue heavy jobs |

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| Image export endpoint | 4-5 hours |
| Share card template | 2-3 hours |
| PDF export | 3-4 hours |
| Share buttons UI | 2 hours |
| Web Share API | 1 hour |
| Open Graph metadata | 1 hour |
| JSON/CSV export | 1-2 hours |
| Testing & polish | 2-3 hours |
| **Total** | **16-20 hours** |

---

## Dependencies

- Puppeteer or node-canvas for image generation
- PDFKit or similar for PDF generation
- Deployed backend for image URLs

---

## Notes

Sharing is the viral growth mechanism for WhatsHappening. When users share "The cosmos says market volatility is 73% today!" on Twitter, it drives discovery. The styled share cards create intrigue and establish the platform's aesthetic identity.

The export feature also serves archival needs - users can save daily reports to track accuracy over time, building trust in the prediction system.
