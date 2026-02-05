# What's Happening

[![Deploy to GitHub Pages](https://github.com/SaharBarak/whatshappaning/actions/workflows/deploy.yml/badge.svg)](https://github.com/SaharBarak/whatshappaning/actions/workflows/deploy.yml)

> Data-driven prediction dashboard correlating cosmic and esoteric data with real-world measurable outcomes.

## 🚀 Live Demo

- **GitHub Pages**: [View Dashboard](https://saharbarak.github.io/whatshappaning/)
- **Vercel**: *Configure Root Directory to `frontend` in Vercel dashboard*

## 📁 Project Structure

```
whatshappaning/
├── frontend/          # Static frontend (HTML/CSS/JS)
│   ├── index.html     # Main dashboard
│   ├── analytics.html # Analytics page
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript modules
│   └── vercel.json    # Vercel configuration
├── backend/           # Node.js API server
├── docs/              # Documentation & epics
└── specs/             # Specifications
```

## 🛠️ Development

### Backend

```bash
cd backend
npm install --ignore-optional  # swisseph requires Python
npm run dev                     # Development mode
npm start                       # Production mode
```

### Frontend

The frontend is static HTML/CSS/JS - just open `frontend/index.html` in a browser or serve with any static server:

```bash
cd frontend
npx serve .
```

## 🚢 Deployment

### GitHub Pages (Automatic)

Deploys automatically on push to `main` via `.github/workflows/deploy.yml`.

### Vercel

**Important**: This is a monorepo. Configure Vercel with:
- **Root Directory**: `frontend`
- **Build Command**: (leave empty - static site)
- **Output Directory**: `.`

### Backend (Render/Docker)

See `render.yaml` or `docker-compose.yml` for backend deployment options.

## 📊 Features

- 16 data modules (Moon phases, Tzolkin, I Ching, Tarot, Solar activity, etc.)
- Real-time predictions based on historical correlations
- Pattern matching alerts
- Mobile-responsive design
- Offline-capable with service worker

## 📝 License

MIT
