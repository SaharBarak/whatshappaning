## Build & Run

```bash
cd backend
npm install --ignore-optional  # swisseph requires Python for compilation
npm run dev                     # Development mode with auto-reload
npm start                       # Production mode
```

## Validation

Run these after implementing to get immediate feedback:

- Tests: `cd backend && npm test`
- Module test: `node -e "const m = require('./src/modules/MODULE_NAME'); m.collect().then(console.log)"`
- API test: `curl http://localhost:3000/api/current`

## Operational Notes

- **Database**: Requires PostgreSQL. Use `docker-compose up -d postgres` from backend/ for local dev
- **swisseph**: Optional native dependency for accurate planetary calculations. Falls back to simple algorithms if unavailable
- **Environment**: Copy `.env.example` to `.env` and configure DATABASE_URL

### Codebase Patterns

- **Modules**: Export `{ name, schedule, collect() }` - scheduler calls collect() on cron
- **Data Files**: Static JSON in `/backend/data/` - loaded at module require time
- **Date Seeding**: Use `utils/dateSeeding.js` for deterministic daily selections (Tarot, I Ching)
