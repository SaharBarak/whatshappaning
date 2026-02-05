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

- [x] **API Keys**: Generate and manage keys
- [x] **Rate Limiting**: Enforce tier limits
- [ ] **Documentation**: Interactive Swagger docs
- [x] **Usage Tracking**: Dashboard with stats
- [ ] **Webhooks**: Real-time event delivery

---

## Backend Implementation (Stream)

### Database Schema (`migrations/002_api_keys.sql`)
- `api_keys` - Key storage with tier and limits
- `api_usage` - Daily usage tracking per key
- `api_request_log` - Detailed request logs (7d retention)
- `api_tiers` - Reference table for tier limits

### Service Layer (`src/services/apiKeyService.js`)
- `createKey({ name, tier, ownerEmail })` - Generate new API key
- `validateKey(secretKey)` - Validate and return key info
- `getKeyById(keyId)` - Get key by public ID
- `listKeys({ activeOnly, tier, limit })` - List all keys
- `revokeKey(keyId)` - Revoke a key
- `updateKeyTier(keyId, tier)` - Change tier
- `recordUsage(keyId, endpoint)` - Track usage
- `getUsageStats(keyId, days)` - Get usage statistics
- `isLimitExceeded(keyId, dailyLimit)` - Check daily limit

### Middleware (`src/middleware/apiKeyAuth.js`)
- `apiKeyAuth({ required })` - Configurable auth middleware
- `requireApiKeyAuth` - Required key auth
- `optionalApiKeyAuth` - Optional key auth
- Extracts key from `Authorization: Bearer` or `X-API-Key` header
- Enforces both daily limits and per-minute rate limits by tier

### API Routes (`src/routes/apiKeys.js`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/keys` | Create new API key |
| GET | `/api/keys` | List all keys |
| GET | `/api/keys/:keyId` | Get key details |
| GET | `/api/keys/:keyId/usage` | Get usage stats |
| PATCH | `/api/keys/:keyId` | Update key tier |
| DELETE | `/api/keys/:keyId` | Revoke key |

### Tier Limits
| Tier | Daily Limit | Per-Minute |
|------|-------------|------------|
| Free | 100 | 10 |
| Pro | 10,000 | 100 |
| Enterprise | Unlimited | Unlimited |

### Tests
- 30 new unit tests for pure functions and validation logic
- All 490 tests pass

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
