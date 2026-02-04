# EPIC-002: API Documentation with OpenAPI/Swagger

**Status:** Proposed  
**Created:** 2026-02-04  
**Author:** Arc (Project Manager)

---

## Problem Statement

WhatsHappening's backend exposes a comprehensive API with multiple endpoints for predictions, historical data, pattern matching, and module data. However:

1. **No interactive documentation** - Developers must read code to understand the API
2. **No API playground** - Can't test endpoints without curl/Postman
3. **No schema validation docs** - Response formats are undocumented externally
4. **Barrier to contribution** - New developers struggle to understand available endpoints

The project philosophy is "Show the math" - but the API itself isn't showing its structure.

---

## Proposed Solution

Implement **OpenAPI 3.0 specification** with **Swagger UI** for interactive documentation:

### 1. OpenAPI Specification
- Document all existing API endpoints
- Define request/response schemas
- Include example payloads
- Document error responses

### 2. Swagger UI Integration
- Interactive API explorer at `/api/docs`
- Try-it-now functionality
- Authentication documentation (if added later)

### 3. API Endpoints to Document

Based on `specs/01-BACKEND-API.md`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/current` | GET | All module data and indices |
| `/api/history/:module` | GET | Historical data for a module |
| `/api/predictions` | GET | Today's predictions with factors |
| `/api/predictions/:outcome` | GET | Specific outcome prediction |
| `/api/patterns` | GET | Pattern matches and alerts |
| `/api/correlations` | GET | Correlation results |
| `/api/health` | GET | Service health check |

---

## Affected Components

| Component | Changes Required |
|-----------|------------------|
| `backend/src/routes/` | Add swagger annotations or separate spec file |
| `backend/package.json` | Add swagger-ui-express, swagger-jsdoc deps |
| `backend/src/index.js` | Mount Swagger UI route |
| `docs/` | Link to live API docs |

---

## Success Criteria

- [ ] **OpenAPI Spec**: Complete spec file covering all endpoints
- [ ] **Swagger UI**: Accessible at `/api/docs`
- [ ] **Schemas**: All request/response types defined
- [ ] **Examples**: Real example payloads for each endpoint
- [ ] **Errors**: Error responses documented (400, 404, 500)
- [ ] **CORS**: Swagger UI works from docs page

---

## Tasks (Post-Approval)

1. **Install dependencies**
   ```bash
   npm install swagger-ui-express swagger-jsdoc
   ```

2. **Create OpenAPI spec** (`backend/src/swagger.js` or `openapi.yaml`)
   - Document all endpoints from 01-BACKEND-API.md
   - Define component schemas for modules, predictions, patterns

3. **Mount Swagger UI**
   ```javascript
   // In index.js
   app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
   ```

4. **Add response schemas**
   - Module data schema
   - Prediction response schema
   - Pattern match schema
   - Correlation result schema

5. **Test & verify**
   - Ensure all endpoints documented
   - Verify examples work
   - Test from frontend origin (CORS)

---

## Example OpenAPI Entry

```yaml
paths:
  /api/predictions:
    get:
      summary: Get today's predictions
      description: Returns all outcome predictions with contributing factors, confidence levels, and statistical backing
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  predictions:
                    type: array
                    items:
                      $ref: '#/components/schemas/Prediction'
                  summary:
                    $ref: '#/components/schemas/PredictionSummary'
              example:
                predictions:
                  - outcome: "spx_up"
                    probability: 0.62
                    confidence: "high"
                    sampleSize: 156
                    factors:
                      - name: "Mercury Direct"
                        contribution: 0.18
                        direction: "positive"
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Spec becomes stale | Use JSDoc annotations that live with code |
| Performance overhead | Swagger UI only loads on `/api/docs` |
| Security exposure | Docs show public API; no auth secrets exposed |

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|------------------|
| OpenAPI spec creation | 3-4 hours |
| Swagger UI integration | 1 hour |
| Schema definitions | 2-3 hours |
| Examples & testing | 1-2 hours |
| **Total** | **7-10 hours** |

---

## Dependencies

- Backend deployed (or running locally for testing)
- Access to 01-BACKEND-API.md spec for endpoint details

---

## Notes

This epic aligns with the project's "show the math" philosophy by making the API structure itself transparent and explorable. Interactive documentation lowers the barrier for new contributors and enables faster debugging during development.
