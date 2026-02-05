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
- API key authentication with tiered rate limits
- Developer portal for API key management

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
