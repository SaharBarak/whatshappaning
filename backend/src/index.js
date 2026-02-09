/**
 * Express application entry point
 *
 * Serves the API endpoints and initializes the data collection scheduler.
 */

const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./db');
const apiRoutes = require('./routes/api');
const healthRoutes = require('./routes/health');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');
const apiKeysRoutes = require('./routes/apiKeys');
const emailRoutes = require('./routes/email');
const communityRoutes = require('./routes/community');
const notificationRoutes = require('./routes/notifications');
const swaggerSpec = require('./swagger');
const swaggerUi = require('swagger-ui-express');
const cookieParser = require('cookie-parser');
const { rateLimiter } = require('./utils/rateLimiter');
const { responseTime, compression, cacheHeaders, metricsCollector, performanceMetrics } = require('./middleware/performance');
const { optionalApiKeyAuth } = require('./middleware/apiKeyAuth');
const { startScheduler, runInitialCollection } = require('./scheduler');
const { migrate } = require('../scripts/migrate');

const app = express();

// Trust proxy for accurate IP detection behind load balancers
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow localhost
    if (config.nodeEnv === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    // Check against whitelist
    if (config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Origin not allowed
    console.warn(`CORS blocked request from origin: ${origin}`);
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  optionsSuccessStatus: 200, // For legacy browser support
  maxAge: 86400, // Preflight cache for 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(responseTime);
app.use(compression());
app.use(cacheHeaders());
app.use(metricsCollector);

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Rate limiting for API routes (100 req/min/IP for unauthenticated, tier-based for authenticated)
app.use('/api', rateLimiter);

// API key authentication (optional - enhances rate limits if provided)
app.use('/api', optionalApiKeyAuth);

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "What's Happening API Docs"
}));
app.get('/api/openapi.json', (req, res) => {
  res.json(swaggerSpec);
});

// Routes
app.use('/api', apiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/keys', apiKeysRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/health', healthRoutes);

// Metrics endpoint for monitoring
app.get('/metrics', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    endpoints: performanceMetrics.getAllStats(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: "What's Happening API",
    version: '1.0.0',
    description: 'Data-driven prediction dashboard',
    endpoints: {
      current: '/api/current',
      history: '/api/history/:module',
      predictions: '/api/predictions',
      correlations: '/api/correlations',
      patterns: '/api/patterns',
      health: '/health',
    },
    developerPortal: {
      createKey: 'POST /api/keys',
      listKeys: 'GET /api/keys',
      getKey: 'GET /api/keys/:keyId',
      getUsage: 'GET /api/keys/:keyId/usage',
      updateKey: 'PATCH /api/keys/:keyId',
      revokeKey: 'DELETE /api/keys/:keyId',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// Start server
async function start() {
  // Run migrations on startup
  try {
    console.log('Running database migrations...');
    await migrate();
  } catch (err) {
    console.error('Migration failed:', err.message);
  }

  // Test database connection
  const dbConnected = await db.testConnection();
  if (!dbConnected) {
    console.warn('Database connection failed - some features will be unavailable');
  } else {
    console.log('Database connected');
  }

  // Start server
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);

    // Start scheduler
    startScheduler();

    // Run initial data collection
    if (dbConnected) {
      runInitialCollection().catch(err => {
        console.error('Initial collection failed:', err);
      });
    }
  });
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

// Start the application
start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
