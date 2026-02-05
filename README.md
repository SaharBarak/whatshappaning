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

## 🔐 Secrets Management

### Environment Variables

The backend uses environment variables for all sensitive configuration. **Never commit `.env` files with real credentials!**

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `GEMINI_API_KEY` | Google Gemini API key for news analysis | `AIza...` |

#### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment (`development` or `production`) |

### Setup Instructions

1. **Copy the example file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Fill in your credentials:**
   ```bash
   # Edit .env with your actual values
   nano .env
   ```

3. **Verify `.env` is in `.gitignore`** (it already is by default)

### Production Deployment

For production deployments, use your platform's secrets management:

- **Render**: Add environment variables in the dashboard under "Environment"
- **Railway**: Use the Variables tab in your service settings
- **Vercel**: Add environment variables in Project Settings > Environment Variables
- **AWS**: Use AWS Secrets Manager or Parameter Store
- **Docker**: Use `docker-compose` secrets or environment files

### Security Best Practices

- ✅ Use `.env.example` as a template (no real values)
- ✅ Keep `.env` in `.gitignore`
- ✅ Rotate credentials regularly
- ✅ Use different credentials for development and production
- ✅ Use least-privilege database accounts
- ❌ Never commit secrets to version control
- ❌ Never log sensitive values

## 🛠️ Development

### Backend

```bash
cd backend
npm install --ignore-optional  # swisseph requires Python
cp .env.example .env           # Create local config (edit with your values)
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
