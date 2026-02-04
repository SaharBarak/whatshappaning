# EPIC-011: Multi-language Support (i18n)

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening serves a "global esoteric/research community" but:

1. **English only** - Excludes non-English speakers
2. **No RTL support** - Hebrew, Arabic users disadvantaged
3. **Hardcoded strings** - Text embedded in code
4. **Cultural localization** - Date formats, number formats vary

The cosmic data is universal - the interface should be too.

---

## Proposed Solution

Implement **internationalization (i18n)** with initial languages:

### Phase 1: Infrastructure
- Extract all UI strings to translation files
- Implement i18n library (i18next or similar)
- Language selector in UI
- Store preference in localStorage

### Phase 2: Initial Languages
- 🇺🇸 English (default)
- 🇮🇱 Hebrew (RTL)
- 🇪🇸 Spanish
- 🇫🇷 French

### Phase 3: Localization
- Date/time formatting per locale
- Number formatting (1,000 vs 1.000)
- RTL layout support for Hebrew/Arabic

---

## Translation Scope

| Category | Strings Est. |
|----------|--------------|
| UI Labels | ~50 |
| Module Names | 16 |
| Prediction Text | ~30 |
| Error Messages | ~15 |
| Tooltips/Help | ~20 |
| **Total** | **~130 strings** |

---

## Affected Components

| Component | Changes |
|-----------|---------|
| `frontend/js/i18n.js` | New - i18n manager |
| `frontend/locales/*.json` | New - Translation files |
| `frontend/js/*.js` | Replace hardcoded strings |
| `frontend/css/styles.css` | RTL support |
| `frontend/index.html` | Language selector, dir attribute |

---

## Success Criteria

- [ ] **Language Selector**: Easy switching in UI
- [ ] **4 Languages**: EN, HE, ES, FR supported
- [ ] **RTL Support**: Hebrew displays correctly
- [ ] **Persistence**: Language preference saved
- [ ] **Fallback**: Missing translations fall back to English
- [ ] **Format Localization**: Dates/numbers localized

---

## Tasks (Post-Approval)

1. Install i18n library (i18next)
2. Extract all strings to JSON files
3. Create English base translation
4. Implement language selector
5. Add RTL CSS support
6. Create Hebrew translation
7. Create Spanish translation
8. Create French translation
9. Localize date/number formats
10. Test all languages

---

## Translation File Structure

```
frontend/
  locales/
    en.json      # English (base)
    he.json      # Hebrew
    es.json      # Spanish
    fr.json      # French
```

```json
// en.json
{
  "app": {
    "title": "What's Happening",
    "loading": "Loading...",
    "offline": "You're offline"
  },
  "modules": {
    "moon": "Moon Phase",
    "tarot": "Daily Tarot",
    "astrology": "Astrology"
  },
  "predictions": {
    "title": "Predictions",
    "confidence": "Confidence",
    "factors": "Contributing Factors"
  }
}
```

---

## RTL Considerations

```css
/* RTL support */
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .module-card {
  flex-direction: row-reverse;
}

[dir="rtl"] .prediction-bar {
  transform: scaleX(-1);
}
```

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| i18n infrastructure | 3-4 hours |
| String extraction | 2-3 hours |
| Language selector | 1-2 hours |
| RTL CSS | 2-3 hours |
| Translations (4 langs) | 4-6 hours |
| Testing | 2-3 hours |
| **Total** | **14-21 hours** |

---

## Future Languages (Backlog)

Once infrastructure is in place, community can contribute:
- 🇩🇪 German
- 🇵🇹 Portuguese
- 🇯🇵 Japanese
- 🇷🇺 Russian
- 🇸🇦 Arabic (RTL)
- 🇨🇳 Chinese

---

## Notes

The overview spec states the audience is the "global esoteric/research community." Multi-language support dramatically expands reach. Hebrew support is particularly relevant given the Gematria, Parasha, and Hebrew calendar modules - native Hebrew speakers would benefit greatly from a localized interface.
