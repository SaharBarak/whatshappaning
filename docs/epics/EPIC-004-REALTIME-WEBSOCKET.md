# EPIC-004: Real-time WebSocket Updates

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening currently uses HTTP polling to fetch data updates. This approach has limitations:

1. **Latency** - Users see stale data between poll intervals
2. **Inefficiency** - Polling wastes bandwidth when nothing changed
3. **No push alerts** - Pattern matches aren't pushed immediately
4. **Battery drain** - Mobile devices polling constantly drain battery
5. **Missed moments** - Critical astrological moments (exact aspects, phase changes) may be missed

For a real-time prediction dashboard, users expect live updates.

---

## Proposed Solution

Implement **WebSocket** support for real-time bidirectional communication:

### 1. WebSocket Server
- Add Socket.io or native WebSocket to backend
- Broadcast events when data changes
- Maintain connection pool for all clients

### 2. Event Types

| Event | Trigger | Payload |
|-------|---------|---------|
| `module:update` | Module data refreshes | Module name + new data |
| `prediction:change` | Prediction probability shifts >5% | Outcome + new prediction |
| `pattern:alert` | New pattern match detected | Pattern details |
| `index:update` | Index value changes | Index name + value |

### 3. Frontend Integration
- WebSocket client in app.js
- Graceful fallback to polling if WS fails
- Visual indicator when connected live

### 4. Smart Updates
- Only push diffs, not full payloads
- Debounce rapid changes
- Respect scheduler cadence (don't push faster than data updates)

---

## Affected Components

| Component | Changes Required |
|-----------|------------------|
| `backend/package.json` | Add socket.io dependency |
| `backend/src/index.js` | Initialize WebSocket server |
| `backend/src/websocket.js` | New - WebSocket handler |
| `backend/src/scheduler.js` | Emit events on data refresh |
| `frontend/js/app.js` | WebSocket client, event handlers |
| `frontend/js/config.js` | WebSocket URL config |
| `frontend/index.html` | Connection status indicator |

---

## Success Criteria

- [ ] **WebSocket Server**: Running on backend alongside HTTP
- [ ] **Live Updates**: Data changes push to clients instantly
- [ ] **Pattern Alerts**: Immediate notification when patterns match
- [ ] **Connection Status**: UI shows "Live" indicator when connected
- [ ] **Fallback**: Graceful degradation to polling if WS unavailable
- [ ] **Efficiency**: No unnecessary messages, proper debouncing

---

## Tasks (Post-Approval)

1. **Install dependencies**
   ```bash
   cd backend && npm install socket.io
   ```

2. **Create WebSocket server** (`backend/src/websocket.js`)
   ```javascript
   const { Server } = require('socket.io');
   
   function initWebSocket(httpServer) {
     const io = new Server(httpServer, {
       cors: { origin: config.corsOrigins }
     });
     
     io.on('connection', (socket) => {
       console.log('Client connected:', socket.id);
       // Send current state on connect
       socket.emit('state:current', getCurrentState());
     });
     
     return io;
   }
   ```

3. **Integrate with scheduler**
   ```javascript
   // In scheduler.js, after module collects data:
   io.emit('module:update', { module: moduleName, data: result });
   ```

4. **Create frontend client** (in `app.js`)
   ```javascript
   const socket = io(config.wsUrl);
   
   socket.on('module:update', ({ module, data }) => {
     updateModuleCard(module, data);
   });
   
   socket.on('pattern:alert', (pattern) => {
     showPatternAlert(pattern);
   });
   ```

5. **Add connection indicator**
   ```html
   <div class="connection-status">
     <span class="status-dot"></span>
     <span class="status-text">Live</span>
   </div>
   ```

6. **Implement fallback**
   ```javascript
   socket.on('disconnect', () => {
     startPollingFallback();
   });
   ```

---

## Event Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Scheduler  │────▶│  WebSocket  │────▶│   Clients   │
│  (cron)     │     │   Server    │     │  (browser)  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                    │
      │ module.collect()  │                    │
      │──────────────────▶│ emit('module:update')
      │                   │───────────────────▶│
      │                   │                    │ updateUI()
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| WebSocket not supported | Fallback to polling (current behavior) |
| Connection drops | Auto-reconnect with exponential backoff |
| Server memory (many clients) | Connection limits, heartbeat cleanup |
| Railway WebSocket support | Railway supports WS on same port |

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| WebSocket server setup | 2-3 hours |
| Scheduler integration | 2 hours |
| Frontend client | 2-3 hours |
| Connection indicator | 1 hour |
| Fallback & testing | 2-3 hours |
| **Total** | **9-12 hours** |

---

## Dependencies

- Backend deployed (Railway supports WebSockets)
- Frontend deployed (Vercel handles WS upgrade)
- CORS configured for WebSocket connections

---

## Notes

Real-time updates transform the dashboard from "check periodically" to "always current." This is especially impactful for pattern alerts - when a >80% similarity pattern match is detected, users see it immediately rather than on their next poll. The "Live" indicator also builds user confidence that they're seeing the latest cosmic data.
