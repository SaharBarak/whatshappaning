# Project Structure

## Directory Layout

```
whatshappaning/
├── specs/                    # Specifications (you are here)
│   ├── 00-OVERVIEW.md
│   ├── 01-BACKEND-API.md
│   ├── ...
│
├── backend/                  # Node.js API server
│   ├── src/
│   │   ├── index.js          # Express app entry
│   │   ├── config.js         # Environment config
│   │   ├── db.js             # Database connection
│   │   ├── routes/
│   │   │   ├── api.js        # /api routes
│   │   │   └── health.js     # /health endpoint
│   │   ├── modules/          # Data collection modules
│   │   │   ├── moon.js
│   │   │   ├── tzolkin.js
│   │   │   ├── dreamspell.js
│   │   │   ├── parasha.js
│   │   │   ├── gematria.js
│   │   │   ├── astrology.js
│   │   │   ├── solar.js
│   │   │   ├── schumann.js
│   │   │   ├── tarot.js
│   │   │   └── news.js
│   │   ├── indices/          # Index calculations
│   │   │   ├── solarGeo.js
│   │   │   ├── astroEvents.js
│   │   │   └── calendarSync.js
│   │   ├── scheduler.js      # Cron job definitions
│   │   └── utils/
│   │       ├── cache.js      # In-memory cache
│   │       ├── hebrew.js     # Hebrew calendar utils
│   │       └── astro.js      # Astronomical calculations
│   ├── data/
│   │   └── tarot.json        # Tarot card definitions
│   ├── migrations/           # Database migrations
│   │   └── 001_initial.sql
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                 # Static SPA
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js            # Main application
│   │   ├── api.js            # API client
│   │   └── components/       # UI components
│   │       ├── card.js
│   │       ├── indices.js
│   │       └── modules/
│   │           ├── moon.js
│   │           ├── tzolkin.js
│   │           └── ...
│   ├── images/
│   │   └── tarot/            # Tarot card images
│   └── vercel.json           # Vercel config
│
├── docker-compose.yml        # Local dev with Postgres
├── Dockerfile                # Production container
├── ralph-docker.sh           # Ralph loop runner
├── loop.sh                   # Main loop script
├── PROMPT_build.md           # Build prompt
├── PROMPT_plan.md            # Plan prompt
├── AGENTS.md                 # Operational notes
├── IMPLEMENTATION_PLAN.md    # Current progress
└── README.md                 # Project documentation
```

## Backend Details

### Entry Point (src/index.js)
```javascript
const express = require('express');
const cors = require('cors');
const { startScheduler } = require('./scheduler');
const apiRoutes = require('./routes/api');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);
app.use('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startScheduler();
});
```

### Module Interface
Each module in `modules/` exports:
```javascript
module.exports = {
  name: 'moon',
  collect: async () => { /* returns data object */ },
  schedule: '0 */3 * * *', // cron expression (every 3h)
};
```

### Scheduler (src/scheduler.js)
```javascript
const cron = require('node-cron');
const modules = require('./modules');
const db = require('./db');

function startScheduler() {
  for (const mod of modules) {
    cron.schedule(mod.schedule, async () => {
      try {
        const data = await mod.collect();
        await db.saveSnapshot(mod.name, data);
      } catch (err) {
        console.error(`${mod.name} collection failed:`, err);
      }
    });
  }
}
```

## Frontend Details

### Single HTML File Approach
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>What's Happening</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div id="app">
    <header>...</header>
    <div id="indices">...</div>
    <div id="grid">...</div>
  </div>
  <script src="js/app.js" type="module"></script>
</body>
</html>
```

### No Build Step
- Vanilla JS with ES modules
- CSS variables for theming
- No bundler required
- Direct deployment to Vercel/Netlify

## Environment Variables

### Backend (.env)
```
PORT=3000
DATABASE_URL=postgres://user:pass@host:5432/dbname
GEMINI_API_KEY=your-key-here
NODE_ENV=production
```

### Frontend
```javascript
// js/config.js
export const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://api.whatshappening.app/api';
```

## Deployment

### Backend (Railway)
1. Connect GitHub repo
2. Set environment variables
3. Add PostgreSQL addon
4. Deploy

### Frontend (Vercel)
1. Connect GitHub repo
2. Set root directory to `frontend/`
3. Deploy

### vercel.json
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=300" }
      ]
    }
  ]
}
```

## Development Workflow

```bash
# Start local Postgres
docker-compose up -d postgres

# Run backend
cd backend && npm run dev

# Serve frontend (any static server)
cd frontend && npx serve .

# Or use Docker for everything
docker-compose up
```

## Testing

```bash
# Backend tests
cd backend && npm test

# Module tests
npm test -- --grep "moon module"

# API integration tests
npm run test:integration
```
