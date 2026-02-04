# EPIC-005: Push Notifications for Pattern Alerts

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening detects pattern matches when current conditions match historical patterns with >80% similarity. However:

1. **Users must be on the site** to see alerts
2. **No proactive notification** when important patterns emerge
3. **Missed opportunities** - patterns may form while user is away
4. **Daily ritual friction** - users must remember to check

The spec (24-PREDICTION-OUTPUT.md) defines pattern alerts, but there's no mechanism to reach users who aren't actively viewing the dashboard.

---

## Proposed Solution

Implement **Web Push Notifications** to alert users of significant events:

### 1. Notification Types

| Type | Trigger | Priority |
|------|---------|----------|
| Pattern Alert | >80% similarity match detected | High |
| Prediction Shift | Major probability change (>20%) | Medium |
| Daily Summary | Morning digest (opt-in) | Low |
| Rare Event | Eclipse, major aspect, etc. | High |

### 2. User Preferences
- Subscribe/unsubscribe toggle
- Notification type preferences
- Quiet hours setting
- Threshold customization

### 3. Technical Implementation
- Web Push API with service worker
- Push server (can use web-push npm package)
- Subscription storage in database
- VAPID keys for authentication

---

## Affected Components

| Component | Changes Required |
|-----------|------------------|
| `backend/src/notifications/` | New - Push notification service |
| `backend/src/routes/api.js` | Subscription endpoints |
| `backend/src/scheduler.js` | Trigger notifications on events |
| `backend/src/db.js` | Add push_subscriptions table |
| `frontend/sw.js` | Handle push events (from PWA epic) |
| `frontend/js/notifications.js` | New - Subscription management |
| `frontend/index.html` | Notification preferences UI |

---

## Success Criteria

- [ ] **Subscription Flow**: Users can subscribe with one click
- [ ] **Pattern Alerts**: Push sent when >80% pattern match detected
- [ ] **Delivery**: Notifications work on desktop and mobile
- [ ] **Preferences**: Users control which notifications they receive
- [ ] **Unsubscribe**: Easy one-click unsubscribe
- [ ] **Privacy**: No tracking beyond subscription, GDPR compliant

---

## Tasks (Post-Approval)

1. **Generate VAPID keys**
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Create database table**
   ```sql
   CREATE TABLE push_subscriptions (
     id SERIAL PRIMARY KEY,
     endpoint TEXT UNIQUE NOT NULL,
     keys_p256dh TEXT NOT NULL,
     keys_auth TEXT NOT NULL,
     preferences JSONB DEFAULT '{}',
     created_at TIMESTAMP DEFAULT NOW(),
     last_used TIMESTAMP
   );
   ```

3. **Create push service** (`backend/src/notifications/push.js`)
   ```javascript
   const webpush = require('web-push');
   
   webpush.setVapidDetails(
     'mailto:alerts@whatshappening.app',
     process.env.VAPID_PUBLIC_KEY,
     process.env.VAPID_PRIVATE_KEY
   );
   
   async function sendPatternAlert(subscription, pattern) {
     const payload = JSON.stringify({
       title: '🔮 Pattern Match Detected',
       body: `${pattern.similarity}% match with ${pattern.matchDate}`,
       icon: '/images/icon-192.png',
       data: { url: '/?highlight=pattern' }
     });
     
     await webpush.sendNotification(subscription, payload);
   }
   ```

4. **Add subscription endpoints**
   ```javascript
   // POST /api/notifications/subscribe
   // DELETE /api/notifications/unsubscribe
   // PATCH /api/notifications/preferences
   ```

5. **Frontend subscription UI**
   ```javascript
   async function subscribeToPush() {
     const registration = await navigator.serviceWorker.ready;
     const subscription = await registration.pushManager.subscribe({
       userVisibleOnly: true,
       applicationServerKey: VAPID_PUBLIC_KEY
     });
     
     await api.post('/notifications/subscribe', subscription);
   }
   ```

6. **Handle push in service worker**
   ```javascript
   self.addEventListener('push', (event) => {
     const data = event.data.json();
     event.waitUntil(
       self.registration.showNotification(data.title, {
         body: data.body,
         icon: data.icon,
         data: data.data
       })
     );
   });
   ```

7. **Integrate with pattern detection**
   - When pattern.js finds >80% match, trigger notification
   - Respect user preferences and quiet hours

---

## Notification Examples

### Pattern Alert
```
🔮 Pattern Match Detected
85% similarity with Feb 14, 2024
Tap to view prediction details
```

### Prediction Shift
```
📊 Market Volatility Alert
SPX volatility prediction jumped from 45% to 72%
Contributing factors: Mercury Rx + Full Moon
```

### Daily Summary (Opt-in)
```
🌅 Today's Cosmic Weather
High: Calendar Sync (3 systems aligned)
Watch: Saturn-Uranus square exact today
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Notification fatigue | Limit to 2-3/day max, user controls |
| Browser support | Graceful degradation, show in-app only |
| VAPID key exposure | Store in env, never commit |
| Spam perception | Clear value, easy unsubscribe |

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| VAPID setup & DB | 1-2 hours |
| Push service | 2-3 hours |
| Subscription endpoints | 2 hours |
| Frontend UI | 2-3 hours |
| Service worker handler | 1 hour |
| Integration & testing | 2-3 hours |
| **Total** | **10-14 hours** |

---

## Dependencies

- **Requires EPIC-003 (PWA)**: Service worker needed for push handling
- HTTPS required for Web Push API
- VAPID keys generated and stored as secrets

---

## Notes

Push notifications complete the "always aware" experience. Combined with the PWA epic, users install the app and receive pattern alerts even when not actively viewing. This is particularly valuable for the prediction dashboard use case - users want to know when cosmic conditions align with historical patterns, not discover it hours later.

The notification bell icon with a red dot for unread alerts is a familiar UX pattern that creates engagement without being intrusive.
