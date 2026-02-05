# EPIC-020: Mobile App Wrapper

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening is web-only:

1. **No app store presence** - Missing discovery via app stores
2. **PWA limitations** - iOS PWA has restrictions
3. **No native features** - Can't access widgets, Siri, etc.
4. **Perception gap** - "Real apps" seem more legitimate

---

## Proposed Solution

**Native App Wrapper** using web technologies:

### 1. Technology Options
- **Capacitor** (recommended) - Wrap existing web app
- **React Native WebView** - Alternative wrapper
- **TWA** (Trusted Web Activity) - Android only

### 2. Platforms
- 📱 iOS (App Store)
- 🤖 Android (Google Play)

### 3. Native Enhancements
- Home screen widgets (today's predictions)
- Push notifications (native, not web push)
- Siri Shortcuts ("Hey Siri, what's my cosmic forecast?")
- Apple Watch complication (moon phase)
- Share sheet integration

---

## App Features

```
┌─────────────────────────────────────┐
│  📱 WhatsHappening App              │
├─────────────────────────────────────┤
│  • Full web app functionality       │
│  • Native push notifications        │
│  • iOS Widget (Today's forecast)    │
│  • Apple Watch moon phase           │
│  • Siri integration                 │
│  • Offline mode (via PWA cache)     │
│  • Dark/light following system      │
└─────────────────────────────────────┘
```

---

## Affected Components

| Component | Changes |
|-----------|---------|
| `/mobile/` | New - Capacitor project |
| `/mobile/ios/` | iOS native code |
| `/mobile/android/` | Android native code |
| `capacitor.config.ts` | App configuration |

---

## Success Criteria

- [ ] **iOS App**: Approved on App Store
- [ ] **Android App**: Approved on Google Play
- [ ] **Widgets**: Home screen widgets working
- [ ] **Notifications**: Native push working
- [ ] **Performance**: Native-feel performance

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| Capacitor setup | 2-3 hours |
| iOS configuration | 3-4 hours |
| Android configuration | 2-3 hours |
| Native widgets | 5-6 hours |
| Push notifications | 3-4 hours |
| App Store submission | 2-3 hours |
| Play Store submission | 2-3 hours |
| **Total** | **19-26 hours** |

---

## Notes

A native app wrapper gives WhatsHappening app store presence without rebuilding from scratch. Capacitor wraps the existing PWA while enabling native features. Home screen widgets showing "today's cosmic weather" provide constant visibility and drive daily engagement.
