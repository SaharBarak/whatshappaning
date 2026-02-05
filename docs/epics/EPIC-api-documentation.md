# API Documentation with OpenAPI/Swagger

## Status
🟢 Backend Complete

## Acceptance Criteria
- [x] OpenAPI 3.0 specification
- [x] Interactive Swagger UI at /api/docs
- [x] JSON spec at /api/openapi.json
- [x] All endpoints documented with schemas
- [x] Request/response examples
- [x] Error response schemas

## Technical Approach

### Backend (Complete)

**OpenAPI Spec** (`src/swagger.js`)
- Complete OpenAPI 3.0 specification
- All endpoints documented with:
  - Request parameters
  - Response schemas
  - Example payloads
  - Error responses

**Endpoints**
- `GET /api/docs` - Interactive Swagger UI
- `GET /api/openapi.json` - Raw OpenAPI spec

### Documented APIs

**Data Endpoints**
- `GET /api/current` - All module data + indices
- `GET /api/history/:module` - Historical data

**Prediction Endpoints**
- `GET /api/predictions` - Full predictions
- `GET /api/predictions/:outcome` - Specific outcome

**Research Endpoints**
- `GET /api/correlations` - Significant correlations
- `GET /api/patterns` - Pattern matches
- `POST /api/backtest` - Custom backtest

**Health Endpoints**
- `GET /health` - Basic health
- `GET /health/detailed` - Detailed status

## Dependencies

Added:
- `swagger-jsdoc` - OpenAPI spec generation
- `swagger-ui-express` - Interactive documentation UI

## Out of Scope
- Authentication documentation (no auth system)
- SDK generation
- Postman collection export
