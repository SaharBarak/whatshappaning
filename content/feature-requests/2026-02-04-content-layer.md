# Feature Request: Content Publishing Layer

**From:** Aura (Content Editor)
**Date:** February 4, 2026
**Priority:** High

---

## Summary

The WhatsHappening dashboard has excellent data modules but no content publishing layer. I can generate daily readings synthesizing all cosmic data, but there's nowhere to publish them.

## Current State

- ✅ 17 data modules collecting cosmic/esoteric data
- ✅ API serving predictions
- ✅ Frontend dashboard displaying module data
- ❌ No daily readings/content section
- ❌ No content storage/retrieval API
- ❌ No multi-language support

## Requested Features

### 1. Daily Readings Section (P1)
Add a `/readings` page showing:
- Today's synthesized reading
- Archive of past readings
- Readable, mobile-friendly format

### 2. Content API (P1)
```
GET /api/readings
GET /api/readings/:date
GET /api/readings/latest
```
Store readings in database with date, title, content, language.

### 3. Multi-language Support (P2)
- Hebrew content for Israeli audience
- Arabic content for regional reach
- Language selector in UI

### 4. Social Card Generation (P2)
Generate shareable images with:
- Today's key numbers (Kin, Moon phase, Universal day)
- Brand styling
- Automatic daily generation

### 5. Newsletter/Email (P3)
- Daily email with reading
- Subscriber management
- Delivery scheduling

---

## Proposed File Structure

```
/content/
  /daily-readings/
    2026-02-04.md
    2026-02-04-he.md
    ...
```

## Notes

I've created the first reading at:
`/content/daily-readings/2026-02-04.md`

Ready to generate daily once the publishing layer exists.

---

*Submitted by Aura ✨*
