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
- API key authentication with tiered rate limits
- Developer portal for API key management

## 🔮 Prediction Types

WhatsHappaning correlates diverse data sources with measurable outcomes. Our prediction engine analyzes patterns across seven categories:

### 🌌 Cosmic & Space
| Prediction | Data Source | Outcome |
|------------|-------------|---------|
| Solar Wind Energy | NOAA DSCOVR | Collective activity levels |
| Sunspot Volatility | SWPC sunspot data | Market volatility |
| Cosmic Ray Creativity | Neutron monitors | Creative breakthrough patterns |
| Asteroid Proximity | NASA NEO | Collective anxiety patterns |

### 🌍 Earth & Environmental
| Prediction | Data Source | Outcome |
|------------|-------------|---------|
| Geomagnetic Sleep | Kp/Ap indices | Sleep quality |
| Barometric Mood | Pressure gradients | Mood swings |
| Schumann Meditation | Schumann resonance | Meditation effectiveness |
| Tectonic Unease | USGS micro-seismic | Collective restlessness |

### 🧬 Biological & Cyclical
| Prediction | Data Source | Outcome |
|------------|-------------|---------|
| Circadian Optimization | Solar + user data | Peak work hours |
| Biorhythm Intersections | Birth date cycles | Peak performance days |
| Seasonal Energy | Daylight + weather | Energy forecasts |

### 📊 Social & Collective
| Prediction | Data Source | Outcome |
|------------|-------------|---------|
| Sentiment Waves | Social media APIs | Trend reversals |
| Search Emergence | Google Trends | Emerging interests |
| Mercury Rx Effects | Ephemeris | Communication failures |

### 💰 Financial Markets
| Prediction | Data Source | Outcome |
|------------|-------------|---------|
| Fear/Greed Extremes | CNN/Crypto F&G | Reversal signals |
| Lunar Trading | Moon phases | Phase performance |
| Eclipse Windows | Astronomical data | Market inflections |

### 🔮 Esoteric Systems
| Prediction | Data Source | Outcome |
|------------|-------------|---------|
| Tzolkin Energy | Mayan calendar | Daily themes |
| I Ching Guidance | Daily hexagram | Situation patterns |
| Tarot Manifestation | Daily card | Archetypal themes |
| Void of Course Moon | Lunar VOC | Initiative success |

### 🏥 Health & Wellness
| Prediction | Data Source | Outcome |
|------------|-------------|---------|
| Migraine Weather | Multi-factor model | Migraine risk |
| Joint Pain Forecast | Pressure + humidity | Pain levels |
| Allergy Alert | Pollen + weather | Allergy severity |

> 📚 See [docs/PREDICTION-TYPES.md](docs/PREDICTION-TYPES.md) for the complete catalog with implementation details.

## 🔐 API Authentication

The API supports optional authentication via API keys. Authenticated requests receive higher rate limits based on their tier.

### Rate Limits

| Tier | Daily Limit | Per Minute | Use Case |
|------|-------------|------------|----------|
| **Unauthenticated** | N/A | 100/IP | Quick testing |
| **Free** | 100 | 10 | Personal projects |
| **Pro** | 10,000 | 100 | Production apps |
| **Enterprise** | Unlimited | Unlimited | High-volume |

### Getting an API Key

```bash
# Create a new API key
curl -X POST https://api.whatshappaning.com/api/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "My App", "tier": "free", "email": "dev@example.com"}'

# Response includes your secret key (save it - shown only once!)
{
  "success": true,
  "key": {
    "keyId": "wh_pk_abc123",
    "secretKey": "wh_sk_xxxxxxxxxxxxxxxx",
    "tier": "free",
    "dailyLimit": 100
  }
}
```

### Using Your API Key

Include your API key in requests using one of these methods:

```bash
# Authorization header (recommended)
curl -H "Authorization: Bearer wh_sk_your_secret_key" \
  https://api.whatshappaning.com/api/current

# X-API-Key header
curl -H "X-API-Key: wh_sk_your_secret_key" \
  https://api.whatshappaning.com/api/current

# Query parameter (less secure, for testing only)
curl "https://api.whatshappaning.com/api/current?api_key=wh_sk_your_secret_key"
```

### Rate Limit Headers

All API responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706140800
```

### API Key Management Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/keys` | POST | Create new API key |
| `/api/keys` | GET | List all keys |
| `/api/keys/:keyId` | GET | Get key details |
| `/api/keys/:keyId/usage` | GET | Get usage statistics |
| `/api/keys/:keyId` | PATCH | Update key tier |
| `/api/keys/:keyId` | DELETE | Revoke key |

### Error Responses

```json
// 401 - Invalid or missing API key (when required)
{"error": "Unauthorized", "message": "Invalid or revoked API key."}

// 429 - Rate limit exceeded
{"error": "Rate Limit Exceeded", "message": "Try again in 45 seconds.", "retryAfter": 45}

// 429 - Daily limit exceeded  
{"error": "Daily Limit Exceeded", "message": "You have exceeded your daily limit of 100 requests."}
```

## 📝 License

MIT
