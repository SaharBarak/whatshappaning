# EPIC-003: Progressive Web App (PWA) Capabilities

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening is a daily-use prediction dashboard that users want quick access to. Currently:

1. **No installability** - Users must open browser, type URL, navigate
2. **No offline access** - Dashboard fails completely without network
3. **No app-like experience** - No home screen icon, no splash screen
4. **No caching strategy** - Every visit fetches everything anew
5. **Mobile experience friction** - Browser chrome takes screen space

Users checking daily predictions should have instant, app-like access.

---

## Proposed Solution

Implement **Progressive Web App (PWA)** capabilities:

### 1. Web App Manifest
- App name, icons, theme colors
- Standalone display mode (no browser chrome)
- Start URL and scope

### 2. Service Worker
- Cache static assets (HTML, CSS, JS)
- Cache last known data for offline viewing
- Background sync when online
- Network-first strategy for API, cache-first for assets

### 3. Offline Experience
- Show last cached predictions when offline
- Clear "offline" indicator in UI
- Queue pattern refresh for when online

### 4. Install Experience
- Install prompt on mobile and desktop
- Custom install banner after 2+ visits
- Proper icons for all platforms

---

## Affected Components

| Component | Changes Required |
|-----------|------------------|
| `frontend/manifest.json` | New - Web app manifest |
| `frontend/sw.js` | New - Service worker |
| `frontend/index.html` | Add manifest link, SW registration |
| `frontend/images/` | Add PWA icons (192x192, 512x512) |
| `frontend/js/app.js` | Add offline detection, install prompt |
| `frontend/css/styles.css` | Add offline indicator styles |

---

## Success Criteria

- [ ] **Installable**: "Add to Home Screen" prompt works on iOS/Android/Desktop
- [ ] **Offline Ready**: Shows last data when offline with clear indicator
- [ ] **Fast**: Assets cached, instant repeat loads (<1s)
- [ ] **App-like**: Standalone mode, splash screen, theme color
- [ ] **Lighthouse PWA**: Passes Lighthouse PWA audit
- [ ] **Icons**: Proper icons on all platforms

---

## Tasks (Post-Approval)

1. **Create Web App Manifest** (`frontend/manifest.json`)
   ```json
   {
     "name": "What's Happening",
     "short_name": "WhatsHapp",
     "description": "Data-driven cosmic prediction dashboard",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#0a0a0f",
     "theme_color": "#1a1a2e",
     "icons": [...]
   }
   ```

2. **Create Service Worker** (`frontend/sw.js`)
   - Precache static assets
   - Runtime caching for API responses
   - Offline fallback logic

3. **Generate PWA Icons**
   - 192x192 (Android)
   - 512x512 (Android splash)
   - 180x180 (iOS)
   - 32x32, 16x16 (favicon)

4. **Update index.html**
   ```html
   <link rel="manifest" href="/manifest.json">
   <meta name="theme-color" content="#1a1a2e">
   <link rel="apple-touch-icon" href="/images/icon-180.png">
   ```

5. **Register Service Worker** (in `app.js`)
   ```javascript
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('/sw.js');
   }
   ```

6. **Add Offline Indicator**
   - Detect `navigator.onLine` changes
   - Show banner: "You're offline. Showing cached data."
   - Style cached data differently

7. **Install Prompt**
   - Capture `beforeinstallprompt` event
   - Show custom install button after criteria met

8. **Lighthouse Audit**
   - Run Lighthouse PWA audit
   - Fix any failing criteria

---

## Caching Strategy

| Resource | Strategy | TTL |
|----------|----------|-----|
| HTML, CSS, JS | Cache-first | Until SW update |
| API `/api/current` | Network-first | Cache fallback |
| API `/api/predictions` | Network-first | Cache fallback |
| Static images | Cache-first | Long-term |
| Fonts | Cache-first | Long-term |

---

## Offline Behavior

```
┌─────────────────────────────────────────┐
│ ⚠️ You're offline                        │
│ Showing cached data from 2 hours ago    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ [Module Cards - slightly dimmed]        │
│ [Predictions - cached values]           │
│ [Indices - last known state]            │
└─────────────────────────────────────────┘
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Stale cached data | Show cache timestamp, auto-refresh when online |
| SW update issues | Use skipWaiting, clients.claim for immediate activation |
| iOS limitations | Follow iOS PWA best practices, test on Safari |
| Large cache size | Limit API cache to last 24h of data |

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| Manifest & icons | 2 hours |
| Service worker | 3-4 hours |
| Offline UI | 2 hours |
| Install prompt | 1 hour |
| Testing & Lighthouse | 2-3 hours |
| **Total** | **10-12 hours** |

---

## Dependencies

- Frontend deployed to HTTPS (required for service workers)
- Icon assets created (can generate from existing or create new)

---

## Notes

A PWA transforms WhatsHappening from "a website you visit" to "an app you use daily." This is especially valuable for a prediction dashboard where users want quick morning access to see the day's outlook. The offline capability ensures users aren't left empty-handed during network issues - they see the last known predictions rather than an error page.
