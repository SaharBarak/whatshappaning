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
const metricsRoutes = require('./routes/metrics');
const { rateLimiter } = require('./utils/rateLimiter');
const { responseTime, compression, metricsCollector } = require('./middleware/performance');
const { startScheduler, runInitialCollection } = require('./scheduler');
const { migrate } = require('../scripts/migrate');

const app = express();

// Trust proxy for accurate IP detection behind load balancers
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(responseTime);
app.use(compression());
app.use(metricsCollector);

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Rate limiting for API routes (100 req/min/IP)
app.use('/api', rateLimiter);

// Routes
app.use('/api', apiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);

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
      analytics: '/api/analytics',
      health: '/health',
      metrics: '/metrics',
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
