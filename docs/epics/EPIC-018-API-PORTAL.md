# EPIC-018: API Developer Portal

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening has powerful data but:

1. **No public API** - Developers can't build on our data
2. **No documentation** - Even internal API lacks dev portal
3. **No monetization** - No path to revenue from data
4. **Limited ecosystem** - Can't enable third-party apps

---

## Proposed Solution

**Developer Portal** with API access:

### 1. API Tiers
- 🆓 **Free** - 100 requests/day, basic endpoints
- 💼 **Pro** - 10,000 requests/day, all endpoints
- 🏢 **Enterprise** - Unlimited, priority support

### 2. Portal Features
- API key management
- Usage dashboard
- Interactive documentation (Swagger)
- Code examples (JS, Python, curl)
- Webhooks for real-time data

### 3. Endpoints Available
- `/api/v1/predictions` - Daily predictions
- `/api/v1/modules/:name` - Individual module data
- `/api/v1/historical/:date` - Historical data
- `/api/v1/patterns` - Pattern matches

---

## Developer Portal UI

```
┌─────────────────────────────────────┐
│  🔑 API Dashboard                   │
├─────────────────────────────────────┤
│  API Key: wh_sk_xxxxx...xxx         │
│  Plan: Free (100/day)               │
│  Usage: 47/100 requests today       │
│                                     │
│  [View Docs] [Upgrade Plan]         │
└─────────────────────────────────────┘
```

---

## Affected Components

| Component | Changes |
|-----------|---------|
| `backend/src/api/v1/` | New - Versioned API |
| `backend/src/auth/` | New - API key auth |
| `backend/src/ratelimit/` | New - Rate limiting |
| `frontend/developer/` | New - Dev portal pages |

---

## Success Criteria

- [ ] **API Keys**: Generate and manage keys
- [ ] **Rate Limiting**: Enforce tier limits
- [ ] **Documentation**: Interactive Swagger docs
- [ ] **Usage Tracking**: Dashboard with stats
- [ ] **Webhooks**: Real-time event delivery

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| API key system | 3-4 hours |
| Rate limiting | 2-3 hours |
| Versioned endpoints | 3-4 hours |
| Developer portal UI | 4-5 hours |
| Usage tracking | 2-3 hours |
| Webhooks | 3-4 hours |
| **Total** | **17-23 hours** |

---

## Notes

An API portal transforms WhatsHappening from a product to a platform. Developers building apps on our data expand reach and create potential revenue streams. Even if we keep it free initially, the infrastructure enables future monetization.
