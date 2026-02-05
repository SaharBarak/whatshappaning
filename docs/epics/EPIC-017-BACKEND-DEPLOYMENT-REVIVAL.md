# EPIC-017: Backend Deployment Revival

**Status:** 🚨 CRITICAL - Service Suspended
**Created:** 2025-02-05
**Updated:** 2025-02-05

## Issue Summary

The Render backend service `whatshappening-api` is returning **503 Service Unavailable** with the message:
> "This service has been suspended by its owner."

**Health Endpoint:** https://whatshappaning.onrender.com/health → 503 Suspended

## Root Cause Analysis

### Likely Causes (in order of probability):
1. **Free Tier Limitation** - Render free tier services spin down after 15 minutes of inactivity AND get suspended after 90 days
2. **Manual Suspension** - Someone suspended the service in the Render dashboard
3. **Billing Issue** - Payment method expired or failed (if on paid plan)
4. **Deployment Failure** - Last deployment failed, causing service suspension

## Required Actions

### 🔧 Step 1: Access Render Dashboard (Manual Action Required)
1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Navigate to the `whatshappening-api` service
3. Check the service status and any warning banners

### 🔧 Step 2: Resume/Unsuspend Service
If service is suspended:
1. Click **"Resume Service"** or **"Unsuspend"** button
2. Wait for deployment to complete (2-5 minutes)

### 🔧 Step 3: Verify Environment Variables
Ensure these are set in Render Dashboard → Environment:

| Variable | Status | Notes |
|----------|--------|-------|
| `DATABASE_URL` | Required | Auto-linked from `whatshappening-db` |
| `GEMINI_API_KEY` | Required | Manual entry (sync: false) |
| `NODE_ENV` | Required | Should be `production` |
| `PORT` | Required | Should be `10000` |

### 🔧 Step 4: Check Database Status
1. Navigate to Databases → `whatshappening-db`
2. Verify database is active and not suspended
3. Check connection string is valid

### 🔧 Step 5: Trigger Redeploy
1. Go to Service → Events tab
2. Click **"Manual Deploy"** → Deploy latest commit
3. Or push a commit to trigger auto-deploy

### 🔧 Step 6: Verify Health Endpoint
After deployment completes:
```bash
curl -s https://whatshappaning.onrender.com/health
# Expected: {"status":"healthy","timestamp":"...","database":"connected"}
```

## Service Configuration (from render.yaml)

```yaml
services:
  - type: web
    name: whatshappening-api
    runtime: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    healthCheckPath: /health
```

## Deployment Verification Checklist

- [ ] Health endpoint returns 200: `GET /health`
- [ ] Database connected: response includes `"database":"connected"`
- [ ] API root responds: `GET /` returns service info
- [ ] Current data endpoint: `GET /api/current` returns 16 modules
- [ ] Detailed health: `GET /health/detailed` shows module status

## Uptime Monitoring Setup

### Option A: UptimeRobot (Free)
1. Sign up at https://uptimerobot.com
2. Add HTTP(s) Monitor:
   - URL: `https://whatshappaning.onrender.com/health`
   - Interval: 5 minutes
   - Alert contacts: your email
3. Add second monitor for API:
   - URL: `https://whatshappaning.onrender.com/api/current`

### Option B: Render's Built-in Health Checks
Already configured via `healthCheckPath: /health` in render.yaml

### Option C: BetterUptime (Free tier)
1. Sign up at https://betterstack.com/better-uptime
2. Add monitor with same endpoints

## Keeping Free Tier Services Alive

Render free tier services spin down after 15 minutes of inactivity. Options:

1. **Upgrade to paid plan** ($7/month for Starter)
2. **External pinger** - Use cron job or monitoring service to hit /health every 10 minutes
3. **GitHub Action cron** - Add workflow to ping endpoint:

```yaml
# .github/workflows/keep-alive.yml
name: Keep Backend Alive
on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -s https://whatshappaning.onrender.com/health
```

## Backend Code Status

✅ **Code is healthy** - Backend code has been reviewed:
- Express server with proper health endpoints
- Database connection handling with graceful degradation
- Migration system runs on startup
- All 16 modules properly routed

## Next Steps After Revival

1. Verify all 16 module endpoints return data
2. Check data collection scheduler is running
3. Review deploy logs for any warnings
4. Set up monitoring to prevent future outages
5. Consider upgrading to paid tier for production reliability

## Contact / Escalation

If dashboard access is unavailable or issues persist:
- Render Support: support@render.com
- Status Page: https://status.render.com
