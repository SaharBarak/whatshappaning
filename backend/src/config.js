/**
 * Configuration module - loads environment variables and provides defaults
 *
 * Required environment variables:
 * - DATABASE_URL: PostgreSQL connection string
 * - GEMINI_API_KEY: Google Gemini API key for news analysis
 *
 * Optional:
 * - PORT: Server port (default: 3000)
 * - NODE_ENV: Environment (development/production)
 */

require('dotenv').config();

const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // External APIs
  geminiApiKey: process.env.GEMINI_API_KEY,

  // Cache settings (in milliseconds)
  cache: {
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    moduleTtl: 3 * 60 * 60 * 1000, // 3 hours
  },

  // Update frequencies (cron expressions)
  schedules: {
    threeHourly: '0 */3 * * *',     // Every 3 hours
    daily: '0 0 * * *',              // Daily at 00:00 UTC
    thirtyMinutes: '*/30 * * * *',   // Every 30 minutes
    weekly: '0 18 * * 5',            // Friday at 18:00 UTC (sunset approximation)
  },

  // Data retention (in days)
  retention: {
    snapshots: 90,
    indicesHistory: 365,
    newsThemes: 30,
    systemStatus: 7,
  },

  // API rate limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per IP
  },

  // Statistical thresholds
  stats: {
    minSampleSize: 30,
    confidenceLevel: 0.95,
    significanceThreshold: 0.05,
    probabilityBounds: { min: 0.05, max: 0.95 },
  },
};

// Validation
if (!config.databaseUrl && config.nodeEnv === 'production') {
  console.error('DATABASE_URL is required in production');
  process.exit(1);
}

module.exports = config;
