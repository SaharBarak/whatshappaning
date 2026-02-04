# EPIC-001: CI/CD Pipeline & Automated Deployment

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening is 100% implementation complete (v0.0.39, 460 tests passing), but deployment remains manual. The implementation plan identifies Railway (backend) and Vercel (frontend) as deployment targets, but there's no automated pipeline to:

1. Run tests on every push
2. Prevent broken code from reaching production
3. Automate deployments on merge to main
4. Provide deployment status visibility

Currently, developers must manually deploy after each change, risking human error and inconsistent environments.

---

## Proposed Solution

Implement a comprehensive CI/CD pipeline using **GitHub Actions** that:

### 1. Continuous Integration (CI)
- Run on every push and pull request
- Execute the full test suite (`npm test` - 460 tests)
- Lint code for consistency
- Check for security vulnerabilities

### 2. Continuous Deployment (CD)
- **Backend → Railway**: Auto-deploy on merge to main
- **Frontend → Vercel**: Auto-deploy on merge to main (Vercel has native GitHub integration, minimal config needed)

### 3. Environment Management
- Staging environment for pre-production testing
- Production environment for live deployment
- Environment-specific configuration via GitHub Secrets

---

## Affected Components

| Component | Changes Required |
|-----------|------------------|
| `.github/workflows/` | New CI/CD workflow files |
| `backend/` | Ensure test scripts work in CI |
| `frontend/` | Verify Vercel config is correct |
| `docs/` | Add deployment documentation |
| `IMPLEMENTATION_PLAN.md` | Mark 8.7 Deployment as complete |

---

## Success Criteria

- [ ] **CI Pipeline**: All 460 tests pass in GitHub Actions
- [ ] **PR Checks**: PRs blocked if tests fail
- [ ] **Backend CD**: Backend auto-deploys to Railway on merge
- [ ] **Frontend CD**: Frontend auto-deploys to Vercel on merge
- [ ] **Documentation**: Clear deployment guide in docs/
- [ ] **Secrets Management**: All credentials stored as GitHub Secrets
- [ ] **Status Badges**: README shows build/deploy status

---

## Tasks (Post-Approval)

1. **Create CI workflow** (`.github/workflows/ci.yml`)
   - Install dependencies
   - Run linting
   - Run test suite
   - Security audit

2. **Create Backend CD workflow** (`.github/workflows/deploy-backend.yml`)
   - Trigger on main branch push
   - Deploy to Railway via Railway CLI or API

3. **Configure Vercel** 
   - Verify `frontend/vercel.json` is correct
   - Connect GitHub repo to Vercel project
   - Set environment variables

4. **Add GitHub Secrets**
   - `RAILWAY_TOKEN`
   - `DATABASE_URL` (for CI tests)
   - `GEMINI_API_KEY` (for CI tests, if needed)

5. **Update Documentation**
   - Create `docs/DEPLOYMENT.md`
   - Add status badges to README

6. **Verify End-to-End**
   - Test full deployment cycle
   - Verify health endpoints respond
   - Confirm frontend loads data

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Railway token exposure | Use GitHub Secrets, never commit tokens |
| Test flakiness in CI | Ensure tests are deterministic, mock external APIs |
| Deployment downtime | Use Railway's rolling deploys |
| Database migrations | Test migrations in CI before deploying |

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| CI Pipeline | 2-3 hours |
| Backend CD | 2-3 hours |
| Frontend CD | 1 hour (Vercel native) |
| Documentation | 1-2 hours |
| Testing & Verification | 2-3 hours |
| **Total** | **8-12 hours** |

---

## Dependencies

- Railway account with project created
- Vercel account with project created
- GitHub repository admin access for secrets
- Valid API keys for external services (for CI environment)

---

## Notes

This epic completes **Phase 8.7 Deployment** from the implementation plan, marking the project as fully production-ready. Once merged, WhatsHappening will have a professional, automated deployment pipeline suitable for ongoing development.
