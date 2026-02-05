# EPIC: CI/CD Pipeline & Deployment Automation

**Epic ID:** cicd-deployment-automation  
**Status:** 🟡 In Review (PR #67)  
**Branch:** `epic/cicd-deployment-automation`  
**Created:** 2026-02-05  
**Author:** ProdEng Arc

---

## Overview

Automated CI/CD pipeline for WhatsHappening that runs tests on every PR, blocks broken code from merging, and auto-deploys to production on merge to main.

## Problem Statement

WhatsHappening has comprehensive test coverage (460+ tests) but deployment is manual. This creates risk of:
- Deploying untested code
- Human error in deployment process
- Inconsistent environments
- No visibility into deployment status

## Solution

GitHub Actions workflow that provides:

### Continuous Integration
- **Backend Tests:** Runs full test suite on every push/PR
- **Frontend Validation:** Validates HTML structure, checks for broken references
- Blocks merging if tests fail

### Continuous Deployment  
- **Backend → Render:** Auto-deploys via deploy hook on merge to main
- **Frontend → Vercel:** Auto-deploys via Vercel CLI on merge to main

---

## Technical Implementation

### Workflow: `.github/workflows/ci.yml`

**Jobs:**
| Job | Trigger | Timeout | Description |
|-----|---------|---------|-------------|
| `backend-test` | All pushes/PRs | 15 min | Run npm test on backend |
| `frontend-validate` | All pushes/PRs | 5 min | Validate HTML/CSS/JS structure |
| `deploy-backend` | Push to main | 10 min | Trigger Render deploy hook |
| `deploy-frontend` | Push to main | 10 min | Deploy to Vercel via CLI |

**Security Features:**
- Explicit `permissions:` block with least privilege (contents: read)
- Actions pinned to commit SHAs (not mutable tags)
- Secrets passed via environment variables, not in conditionals
- Deployment URLs not logged (contain sensitive tokens)
- Concurrency controls prevent duplicate deployments

**Required Secrets:**
| Secret | Required For | How to Get |
|--------|--------------|------------|
| `RENDER_DEPLOY_HOOK_URL` | Backend deploy | Render Dashboard → Service → Settings → Deploy Hook |
| `VERCEL_TOKEN` | Frontend deploy | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Frontend deploy | `vercel whoami` or dashboard |
| `VERCEL_PROJECT_ID` | Frontend deploy | `.vercel/project.json` after `vercel link` |

### Graceful Degradation

If secrets aren't configured, deploys skip gracefully with clear instructions rather than failing. This allows:
- Forks to run CI without deploy access
- New contributors to validate their changes
- Staged rollout of deployment credentials

---

## Acceptance Criteria

- [x] All PRs run backend tests automatically
- [x] All PRs validate frontend structure
- [x] PRs are blocked if tests fail
- [x] Merge to main triggers backend deployment
- [x] Merge to main triggers frontend deployment
- [x] Secrets handled securely (not logged, least privilege)
- [x] Actions pinned to SHAs
- [x] Concurrency prevents duplicate deploys
- [x] Jobs have timeout limits
- [ ] Verify end-to-end deploy works (post-merge)

---

## Files Changed

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | New comprehensive CI/CD workflow |
| `docs/epics/EPIC-cicd-deployment-automation.md` | This documentation |

---

## Out of Scope

- Staging/preview environments (future enhancement)
- Database migrations (manual for now)
- Rollback automation
- Slack/Discord notifications
- Code coverage reporting

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Deploy hook URL exposure | Stored as GitHub Secret, never logged |
| Flaky tests blocking deploys | Tests are deterministic, mock external APIs |
| Concurrent deploy conflicts | Concurrency group cancels in-progress runs |
| Long-running jobs | Timeout limits on all jobs |

---

## Related

- **EPIC-001:** Original CI/CD proposal (superseded by this implementation)
- **PR #67:** Implementation pull request
