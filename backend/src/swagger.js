/**
 * OpenAPI/Swagger Configuration
 *
 * Provides comprehensive API documentation for the What's Happening API.
 * Accessible at /api/docs
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: "What's Happening API",
      version: '1.0.0',
      description: `
Data-driven prediction dashboard correlating cosmic, esoteric, and geophysical data with real-world market and seismic outcomes.

## Overview

This API provides access to:
- **Current Data**: Real-time module data from 16 different data sources
- **Predictions**: Statistical predictions based on historical correlations
- **Correlations**: Research data on feature-outcome relationships
- **Pattern Matching**: Historical pattern analysis for similar conditions
- **Backtesting**: Custom queries on historical data
- **Analytics**: Prediction accuracy tracking and calibration
- **Export**: Data export in multiple formats (JSON, CSV, PDF, image)
- **Community**: Comments, reactions, community predictions, leaderboard
- **API Keys**: Developer portal for key management

## Philosophy

"Show the math" - Every prediction includes sample sizes, confidence intervals, and statistical backing.

## Authentication

Most endpoints are public. API key authentication is optional and provides higher rate limits.
Pass your key via the \`X-API-Key\` header.

## Rate Limiting

| Tier | Limit |
|------|-------|
| Unauthenticated | 100 req/min/IP |
| Free tier key | Higher limits |
| Pro tier key | Even higher |

Rate limit headers are included in all responses.

## Caching

| Endpoint | Cache Duration |
|----------|---------------|
| /api/current | 1 minute |
| /api/predictions | 3 hours |
| /api/analytics | 1 hour |
| /api/analytics/dashboard | 30 minutes |
      `,
      contact: {
        name: 'WhatsHappening Team',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current server',
      },
    ],
    tags: [
      { name: 'Data', description: 'Current and historical module data' },
      { name: 'Predictions', description: 'Statistical predictions and forecasts' },
      { name: 'Research', description: 'Correlation analysis and pattern matching' },
      { name: 'Analytics', description: 'Prediction accuracy tracking and analysis' },
      { name: 'Export', description: 'Data export and sharing' },
      { name: 'Community', description: 'Comments, reactions, and community predictions' },
      { name: 'API Keys', description: 'Developer portal - API key management' },
      { name: 'Health', description: 'Service health and status checks' },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Optional API key for higher rate limits',
        },
      },
      parameters: {
        DaysParam: {
          name: 'days',
          in: 'query',
          required: false,
          description: 'Number of days to look back (default: 90, max: 365)',
          schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 },
        },
        OutcomeParam: {
          name: 'outcome',
          in: 'query',
          required: false,
          description: 'Filter by outcome ID',
          schema: {
            type: 'string',
            enum: [
              'spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile',
              'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg',
              'geomag_storm', 'sentiment_drop', 'fear_spike',
            ],
          },
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            validModules: { type: 'array', items: { type: 'string' } },
            validOutcomes: { type: 'array', items: { type: 'string' } },
          },
        },
        ModuleSnapshot: {
          type: 'object',
          properties: {
            data: { type: 'object', description: 'Module-specific data' },
            collectedAt: { type: 'string', format: 'date-time' },
          },
        },
        Indices: {
          type: 'object',
          properties: {
            solarGeo: {
              type: 'object',
              properties: {
                value: { type: 'number', nullable: true },
                level: { type: 'string', enum: ['Calm', 'Low', 'Moderate', 'Elevated', 'High', 'Unknown'] },
              },
            },
            astroEvents: {
              type: 'object',
              properties: {
                count: { type: 'integer' },
                level: { type: 'string', enum: ['Quiet', 'Low', 'Active', 'Busy', 'Intense', 'Unknown'] },
              },
            },
            calendarSync: {
              type: 'object',
              properties: {
                score: { type: 'integer' },
                level: { type: 'string', enum: ['None', 'Low', 'Moderate', 'High', 'Rare', 'Unknown'] },
              },
            },
          },
        },
        CurrentDataResponse: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            dataAge: { type: 'string', description: 'Age of oldest data (e.g. "2h 15m")' },
            modules: { type: 'object', additionalProperties: { $ref: '#/components/schemas/ModuleSnapshot' } },
            dailyData: { type: 'object', additionalProperties: { type: 'object' } },
            indices: { $ref: '#/components/schemas/Indices' },
          },
        },
        HistoryResponse: {
          type: 'object',
          properties: {
            module: { type: 'string' },
            days: { type: 'integer' },
            count: { type: 'integer' },
            data: { type: 'array', items: { $ref: '#/components/schemas/ModuleSnapshot' } },
          },
        },
        Factor: {
          type: 'object',
          properties: {
            feature: { type: 'string', description: 'JSON string of feature conditions' },
            contribution: { type: 'number' },
            standalone: { type: 'number' },
            sampleSize: { type: 'integer' },
          },
        },
        Prediction: {
          type: 'object',
          properties: {
            outcome: { type: 'string' },
            outcomeId: { type: 'string' },
            probability: { type: 'number', minimum: 0, maximum: 1 },
            confidenceInterval: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
            sampleSize: { type: 'integer' },
            baseRate: { type: 'number' },
            confidence: { type: 'string', enum: ['Very High', 'High', 'Medium', 'Low', 'Insufficient'] },
            factors: { type: 'array', items: { $ref: '#/components/schemas/Factor' } },
          },
        },
        PatternAlert: {
          type: 'object',
          properties: {
            matchCount: { type: 'integer' },
            avgSimilarity: { type: 'number' },
            matchingDates: { type: 'array', items: { type: 'string', format: 'date' } },
            outcomes: { type: 'object', additionalProperties: { type: 'number' } },
          },
        },
        ActionSuggestion: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            suggestion: { type: 'string' },
            reasoning: { type: 'string' },
            confidence: { type: 'string', enum: ['High', 'Medium', 'Low'] },
          },
        },
        PredictionSummary: {
          type: 'object',
          properties: {
            overallTension: { type: 'string', enum: ['low', 'medium', 'high'] },
            tensionScore: { type: 'number' },
            topRisks: { type: 'array', items: { type: 'string' } },
            stableFactors: { type: 'array', items: { type: 'string' } },
          },
        },
        PredictionsResponse: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            generatedAt: { type: 'string', format: 'date-time' },
            predictions: { type: 'array', items: { $ref: '#/components/schemas/Prediction' } },
            patternAlerts: { type: 'array', items: { $ref: '#/components/schemas/PatternAlert' } },
            actionSuggestions: { type: 'array', items: { $ref: '#/components/schemas/ActionSuggestion' } },
            summary: { $ref: '#/components/schemas/PredictionSummary' },
            disclaimer: { type: 'string' },
            filtered: { type: 'boolean', description: 'Present when filters applied' },
            totalCount: { type: 'integer', description: 'Total predictions before filtering' },
            filteredCount: { type: 'integer', description: 'Predictions after filtering' },
          },
        },
        CorrelationResult: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['single', 'combination'] },
            features: { type: 'object', additionalProperties: true },
            outcome: { type: 'string' },
            probability: { type: 'number' },
            sample_size: { type: 'integer' },
            base_rate: { type: 'number' },
            confidence_low: { type: 'number' },
            confidence_high: { type: 'number' },
            chi_squared: { type: 'number' },
            p_value: { type: 'number' },
            lift: { type: 'number' },
            is_significant: { type: 'boolean' },
          },
        },
        BacktestRequest: {
          type: 'object',
          required: ['features', 'outcome'],
          properties: {
            features: { type: 'object', description: 'Feature conditions to filter by', additionalProperties: true },
            outcome: {
              type: 'string',
              enum: [
                'spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile',
                'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg',
                'geomag_storm', 'sentiment_drop', 'fear_spike',
              ],
            },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
        BacktestResponse: {
          type: 'object',
          properties: {
            features: { type: 'object' },
            outcome: { type: 'string' },
            dateRange: {
              type: 'object',
              properties: { start: { type: 'string', format: 'date' }, end: { type: 'string', format: 'date' } },
            },
            results: {
              type: 'object',
              properties: {
                totalSamples: { type: 'integer' },
                positiveOutcomes: { type: 'integer' },
                probability: { type: 'number' },
                confidenceInterval: { type: 'array', items: { type: 'number' }, nullable: true },
                sufficient: { type: 'boolean' },
              },
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded'] },
            timestamp: { type: 'string', format: 'date-time' },
            database: { type: 'string', enum: ['connected', 'disconnected'] },
          },
        },
        DetailedHealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'warning', 'degraded', 'critical'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'string' },
            uptimeSeconds: { type: 'integer' },
            database: { type: 'object', properties: { connected: { type: 'boolean' } } },
            cache: { type: 'object', properties: { entries: { type: 'integer' }, hitRate: { type: 'number' } } },
            modules: { type: 'object', additionalProperties: { $ref: '#/components/schemas/ModuleHealth' } },
            summary: {
              type: 'object',
              properties: { totalModules: { type: 'integer' }, healthy: { type: 'integer' }, errors: { type: 'integer' } },
            },
          },
        },
        ModuleHealth: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'error'] },
            lastCheck: { type: 'string', format: 'date-time' },
            responseTime: { type: 'integer', description: 'Response time in ms' },
            error: { type: 'string', nullable: true },
          },
        },
        ApiKey: {
          type: 'object',
          properties: {
            keyId: { type: 'string' },
            name: { type: 'string' },
            tier: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
            dailyLimit: { type: 'integer' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        ApiKeyCreated: {
          type: 'object',
          properties: {
            keyId: { type: 'string' },
            secretKey: { type: 'string', description: 'Only shown once at creation' },
            name: { type: 'string' },
            tier: { type: 'string' },
            dailyLimit: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CommunityUser: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            displayName: { type: 'string' },
            avatarSeed: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            outcomeId: { type: 'string' },
            content: { type: 'string' },
            userId: { type: 'integer' },
            displayName: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CommunityPrediction: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['open', 'closed', 'resolved'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      // ==================== DATA ====================
      '/': {
        get: {
          tags: ['Data'],
          summary: 'API root information',
          description: 'Returns basic API information and available endpoints.',
          operationId: 'getRoot',
          responses: {
            200: {
              description: 'API information',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/api/current': {
        get: {
          tags: ['Data'],
          summary: 'Get current module data and indices',
          description: 'Returns current snapshot of all 16 module data sources and computed indices. Cached for 1 minute.',
          operationId: 'getCurrent',
          responses: {
            200: {
              description: 'All module data and indices',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CurrentDataResponse' },
                  example: {
                    timestamp: '2026-02-09T12:00:00Z',
                    dataAge: '15m',
                    modules: {
                      moon: { data: { phase: 'Waxing Gibbous', illumination: 0.72, sign: 'Leo' }, collectedAt: '2026-02-09T11:45:00Z' },
                    },
                    indices: {
                      solarGeo: { value: 3.5, level: 'Low' },
                      astroEvents: { count: 4, level: 'Active' },
                      calendarSync: { score: 2, level: 'Moderate' },
                    },
                  },
                },
              },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/history/{module}': {
        get: {
          tags: ['Data'],
          summary: 'Get historical data for a module',
          description: 'Returns historical snapshots for a specific data module. Up to 90 days.',
          operationId: 'getHistory',
          parameters: [
            {
              name: 'module', in: 'path', required: true,
              schema: {
                type: 'string',
                enum: ['moon', 'tzolkin', 'dreamspell', 'parasha', 'gematria', 'astrology', 'solar', 'schumann', 'tarot', 'news', 'numerology', 'iching', 'cosmic', 'markets', 'geophysical', 'sentiment'],
              },
            },
            { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 90, default: 7 } },
          ],
          responses: {
            200: { description: 'Historical data', content: { 'application/json': { schema: { $ref: '#/components/schemas/HistoryResponse' } } } },
            400: { description: 'Invalid module', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/historical/range': {
        get: {
          tags: ['Data'],
          summary: 'Get available historical date range',
          description: 'Returns the min/max dates with available data and significant dates with notable correlations.',
          operationId: 'getHistoricalRange',
          responses: {
            200: {
              description: 'Date range information',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      range: {
                        type: 'object',
                        properties: {
                          minDate: { type: 'string', format: 'date' },
                          maxDate: { type: 'string', format: 'date' },
                          totalDays: { type: 'integer' },
                        },
                      },
                      significantDates: { type: 'array', items: { type: 'string', format: 'date' } },
                    },
                  },
                },
              },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/historical/{date}': {
        get: {
          tags: ['Data'],
          summary: 'Get all data for a specific date',
          description: 'Returns all module snapshots, daily data, and archived predictions for a specific historical date.',
          operationId: 'getHistoricalDate',
          parameters: [
            { name: 'date', in: 'path', required: true, description: 'Date in YYYY-MM-DD format', schema: { type: 'string', format: 'date' } },
          ],
          responses: {
            200: {
              description: 'Historical data for the date',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      date: { type: 'string', format: 'date' },
                      dailyData: { type: 'object', nullable: true },
                      modules: { type: 'object', additionalProperties: { $ref: '#/components/schemas/ModuleSnapshot' } },
                      predictions: {
                        type: 'array', nullable: true,
                        items: {
                          type: 'object',
                          properties: {
                            outcomeId: { type: 'string' },
                            probability: { type: 'number' },
                            confidence: { type: 'string' },
                            actual: { type: 'boolean', nullable: true },
                          },
                        },
                      },
                      hasData: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            400: { description: 'Invalid date format', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ==================== PREDICTIONS ====================
      '/api/predictions': {
        get: {
          tags: ['Predictions'],
          summary: "Get today's predictions",
          description: 'Returns full prediction payload with all outcomes, pattern alerts, and action suggestions. Supports filtering. Cached for 3 hours.',
          operationId: 'getPredictions',
          parameters: [
            { name: 'category', in: 'query', description: 'Filter by category', schema: { type: 'string', enum: ['market', 'geophysical', 'sentiment'] } },
            { name: 'confidence', in: 'query', description: 'Filter by confidence level', schema: { type: 'string', enum: ['high', 'medium', 'low', 'insufficient'] } },
            { name: 'minProbability', in: 'query', description: 'Minimum probability (0-1)', schema: { type: 'number', minimum: 0, maximum: 1 } },
            { name: 'maxProbability', in: 'query', description: 'Maximum probability (0-1)', schema: { type: 'number', minimum: 0, maximum: 1 } },
            { name: 'search', in: 'query', description: 'Search term for outcome names', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Predictions', content: { 'application/json': { schema: { $ref: '#/components/schemas/PredictionsResponse' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/predictions/{outcome}': {
        get: {
          tags: ['Predictions'],
          summary: 'Get prediction for specific outcome',
          description: 'Returns detailed prediction for a specific outcome with all contributing factors.',
          operationId: 'getPredictionByOutcome',
          parameters: [
            {
              name: 'outcome', in: 'path', required: true,
              schema: {
                type: 'string',
                enum: ['spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile', 'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg', 'geomag_storm', 'sentiment_drop', 'fear_spike'],
              },
            },
          ],
          responses: {
            200: {
              description: 'Outcome prediction',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      outcome: { type: 'string' },
                      outcomeId: { type: 'string' },
                      factors: { type: 'array', items: { $ref: '#/components/schemas/CorrelationResult' } },
                    },
                  },
                },
              },
            },
            400: { description: 'Invalid outcome', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ==================== RESEARCH ====================
      '/api/correlations': {
        get: {
          tags: ['Research'],
          summary: 'Get significant correlations',
          description: 'Returns statistically significant correlations. Filter by feature, outcome, sample size, or lift.',
          operationId: 'getCorrelations',
          parameters: [
            { name: 'feature', in: 'query', description: 'Filter by feature name', schema: { type: 'string' }, example: 'moon_phase' },
            {
              name: 'outcome', in: 'query',
              schema: { type: 'string', enum: ['spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile', 'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg', 'geomag_storm', 'sentiment_drop', 'fear_spike'] },
            },
            { name: 'minSampleSize', in: 'query', schema: { type: 'integer', minimum: 1, default: 30 } },
            { name: 'minLift', in: 'query', schema: { type: 'number', minimum: 0, default: 1.0 } },
          ],
          responses: {
            200: {
              description: 'Correlations',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      count: { type: 'integer' },
                      correlations: { type: 'array', items: { $ref: '#/components/schemas/CorrelationResult' } },
                    },
                  },
                },
              },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/patterns': {
        get: {
          tags: ['Research'],
          summary: 'Get current pattern matches',
          description: "Compares today's features to historical data and identifies similar conditions (>80% similarity).",
          operationId: 'getPatterns',
          responses: {
            200: {
              description: 'Pattern matches',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      patterns: { type: 'array', items: { $ref: '#/components/schemas/PatternAlert' } },
                      todayFeatures: { type: 'object', additionalProperties: true },
                      matchCount: { type: 'integer' },
                      avgSimilarity: { type: 'number' },
                      topMatches: { type: 'array', items: { type: 'object' } },
                      analysis: { type: 'string' },
                      note: { type: 'string' },
                    },
                  },
                },
              },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/backtest': {
        post: {
          tags: ['Research'],
          summary: 'Run custom backtest query',
          description: 'Execute a custom backtest on historical data with specified feature conditions and outcome. Supports comparison operators (>=, <=, >, <) for numeric features.',
          operationId: 'runBacktest',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BacktestRequest' },
                example: { features: { moon_phase: 'Full', mercury_retrograde: true }, outcome: 'spx_volatile', startDate: '2020-01-01', endDate: '2024-12-31' },
              },
            },
          },
          responses: {
            200: { description: 'Backtest results', content: { 'application/json': { schema: { $ref: '#/components/schemas/BacktestResponse' } } } },
            400: { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ==================== ANALYTICS ====================
      '/api/analytics': {
        get: {
          tags: ['Analytics'],
          summary: 'Full analytics report',
          description: 'Returns comprehensive analytics report with all accuracy metrics. Cached for 1 hour.',
          operationId: 'getAnalyticsReport',
          parameters: [
            { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: { description: 'Analytics report', content: { 'application/json': { schema: { type: 'object' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/accuracy': {
        get: {
          tags: ['Analytics'],
          summary: 'Overall accuracy metrics',
          description: 'Returns overall prediction accuracy summary.',
          operationId: 'getAccuracy',
          parameters: [
            { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: { description: 'Accuracy metrics', content: { 'application/json': { schema: { type: 'object' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/accuracy/{outcome}': {
        get: {
          tags: ['Analytics'],
          summary: 'Accuracy for specific outcome',
          description: 'Returns accuracy metrics for a single outcome.',
          operationId: 'getOutcomeAccuracy',
          parameters: [
            {
              name: 'outcome', in: 'path', required: true,
              schema: { type: 'string', enum: ['spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile', 'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg', 'geomag_storm', 'sentiment_drop', 'fear_spike'] },
            },
            { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: { description: 'Outcome accuracy', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Invalid outcome', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/by-confidence': {
        get: {
          tags: ['Analytics'],
          summary: 'Accuracy by confidence level',
          description: 'Returns accuracy grouped by prediction confidence level (High, Medium, Low, etc.).',
          operationId: 'getAccuracyByConfidence',
          parameters: [
            { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: {
              description: 'Accuracy by confidence',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      days: { type: 'integer' },
                      byConfidence: { type: 'object' },
                    },
                  },
                },
              },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/over-time': {
        get: {
          tags: ['Analytics'],
          summary: 'Accuracy trends over time',
          description: 'Returns accuracy trends grouped by day, week, or month.',
          operationId: 'getAccuracyOverTime',
          parameters: [
            { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
            { name: 'interval', in: 'query', schema: { type: 'string', enum: ['day', 'week', 'month'], default: 'week' } },
          ],
          responses: {
            200: {
              description: 'Accuracy over time',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { days: { type: 'integer' }, interval: { type: 'string' }, data: { type: 'array', items: { type: 'object' } } } },
                },
              },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/calibration': {
        get: {
          tags: ['Analytics'],
          summary: 'Calibration data',
          description: 'Returns calibration data for reliability diagrams. Groups predictions into probability bins.',
          operationId: 'getCalibration',
          parameters: [
            { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
            { name: 'bins', in: 'query', description: 'Number of probability bins (5-20)', schema: { type: 'integer', minimum: 5, maximum: 20, default: 10 } },
          ],
          responses: {
            200: {
              description: 'Calibration data',
              content: { 'application/json': { schema: { type: 'object', properties: { days: { type: 'integer' }, bins: { type: 'integer' }, data: { type: 'array', items: { type: 'object' } } } } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/history': {
        get: {
          tags: ['Analytics'],
          summary: 'Historical prediction archive',
          description: 'Returns paginated historical prediction records.',
          operationId: 'getAnalyticsHistory',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 500, default: 100 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } },
          ],
          responses: {
            200: { description: 'Prediction history', content: { 'application/json': { schema: { type: 'object' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/features': {
        get: {
          tags: ['Analytics'],
          summary: 'Top contributing features',
          description: 'Returns features ranked by their contribution to prediction accuracy.',
          operationId: 'getFeatureContributions',
          parameters: [
            { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: {
              description: 'Feature contributions',
              content: { 'application/json': { schema: { type: 'object', properties: { days: { type: 'integer' }, features: { type: 'array', items: { type: 'object' } } } } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/dashboard': {
        get: {
          tags: ['Analytics'],
          summary: 'Enhanced dashboard data (v2)',
          description: 'Returns comprehensive dashboard data with all metrics from accuracy engine v2. Cached for 30 minutes.',
          operationId: 'getAnalyticsDashboard',
          parameters: [
            { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: { description: 'Dashboard data', content: { 'application/json': { schema: { type: 'object' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/rolling': {
        get: {
          tags: ['Analytics'],
          summary: 'Rolling accuracy windows',
          description: 'Returns rolling accuracy for 7, 30, and 90-day windows. Optionally filter by outcome.',
          operationId: 'getRollingAccuracy',
          parameters: [
            { name: 'outcome', in: 'query', schema: { type: 'string' }, description: 'Optional outcome filter' },
          ],
          responses: {
            200: {
              description: 'Rolling accuracy',
              content: { 'application/json': { schema: { type: 'object', properties: { outcome: { type: 'string' }, windows: { type: 'object' } } } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/streaks': {
        get: {
          tags: ['Analytics'],
          summary: 'Prediction streak analysis',
          description: 'Analyzes consecutive correct/incorrect prediction streaks.',
          operationId: 'getStreaks',
          parameters: [
            { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
            { name: 'outcome', in: 'query', schema: { type: 'string' }, description: 'Optional outcome filter' },
          ],
          responses: {
            200: { description: 'Streak analysis', content: { 'application/json': { schema: { type: 'object' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/best-worst': {
        get: {
          tags: ['Analytics'],
          summary: 'Best and worst performing periods',
          description: 'Identifies the best and worst accuracy periods using a sliding window.',
          operationId: 'getBestWorstPeriods',
          parameters: [
            { name: 'window', in: 'query', description: 'Window size in days (3-30)', schema: { type: 'integer', minimum: 3, maximum: 30, default: 7 } },
            { name: 'days', in: 'query', description: 'Lookback days', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: { description: 'Best/worst periods', content: { 'application/json': { schema: { type: 'object' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/by-category': {
        get: {
          tags: ['Analytics'],
          summary: 'Accuracy by category',
          description: 'Returns accuracy grouped by prediction category (market, geophysical, sentiment).',
          operationId: 'getAccuracyByCategory',
          parameters: [
            { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: {
              description: 'Category accuracy',
              content: { 'application/json': { schema: { type: 'object', properties: { days: { type: 'integer' }, categories: { type: 'object' } } } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/by-tag': {
        get: {
          tags: ['Analytics'],
          summary: 'Accuracy by tag',
          description: 'Returns accuracy grouped by prediction tags.',
          operationId: 'getAccuracyByTag',
          parameters: [
            { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: {
              description: 'Tag accuracy',
              content: { 'application/json': { schema: { type: 'object', properties: { days: { type: 'integer' }, tags: { type: 'object' } } } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/trend': {
        get: {
          tags: ['Analytics'],
          summary: 'Accuracy trend from snapshots',
          description: 'Returns accuracy trend over time from daily snapshots.',
          operationId: 'getAccuracyTrend',
          parameters: [
            { name: 'outcome', in: 'query', schema: { type: 'string' }, description: 'Optional outcome filter' },
            { name: 'period', in: 'query', description: 'Period in days', schema: { type: 'integer', enum: [7, 30, 90], default: 30 } },
            { name: 'days', in: 'query', description: 'Lookback days', schema: { type: 'integer', minimum: 1, maximum: 365, default: 180 } },
          ],
          responses: {
            200: {
              description: 'Accuracy trend',
              content: { 'application/json': { schema: { type: 'object', properties: { outcome: { type: 'string' }, periodDays: { type: 'integer' }, lookbackDays: { type: 'integer' }, data: { type: 'array', items: { type: 'object' } } } } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/hit-rate': {
        get: {
          tags: ['Analytics'],
          summary: 'Hit rate by probability bucket',
          description: 'Returns hit rates grouped by probability ranges for calibration curves.',
          operationId: 'getHitRate',
          parameters: [
            { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
            { name: 'buckets', in: 'query', description: 'Number of probability buckets (5-20)', schema: { type: 'integer', minimum: 5, maximum: 20, default: 10 } },
          ],
          responses: {
            200: {
              description: 'Hit rate data',
              content: { 'application/json': { schema: { type: 'object', properties: { days: { type: 'integer' }, buckets: { type: 'integer' }, data: { type: 'array', items: { type: 'object' } } } } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/snapshot': {
        post: {
          tags: ['Analytics'],
          summary: 'Generate daily accuracy snapshot',
          description: 'Generates and stores a daily accuracy snapshot. Typically called by cron jobs.',
          operationId: 'createAnalyticsSnapshot',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { date: { type: 'string', format: 'date', description: 'Date for snapshot (defaults to today)' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Snapshot generated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ==================== EXPORT ====================
      '/api/export/image': {
        get: {
          tags: ['Export'],
          summary: 'Generate shareable image card',
          description: 'Generates a PNG image card with current predictions. Requires canvas dependencies.',
          operationId: 'exportImage',
          parameters: [
            { name: 'format', in: 'query', description: 'Card format', schema: { type: 'string', enum: ['square', 'story', 'wide', 'compact'], default: 'square' } },
          ],
          responses: {
            200: { description: 'PNG image', content: { 'image/png': { schema: { type: 'string', format: 'binary' } } } },
            400: { description: 'Invalid format', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            503: { description: 'Export module unavailable', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/export/pdf': {
        get: {
          tags: ['Export'],
          summary: 'Generate PDF report',
          description: 'Generates a downloadable PDF report with current predictions and analysis.',
          operationId: 'exportPdf',
          responses: {
            200: { description: 'PDF document', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } },
            503: { description: 'Export module unavailable', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/export/json': {
        get: {
          tags: ['Export'],
          summary: 'Export data as JSON',
          description: 'Downloads current prediction data as a JSON file.',
          operationId: 'exportJson',
          responses: {
            200: { description: 'JSON file', content: { 'application/json': { schema: { type: 'object' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/export/csv': {
        get: {
          tags: ['Export'],
          summary: 'Export data as CSV',
          description: 'Downloads current prediction data as a CSV file.',
          operationId: 'exportCsv',
          responses: {
            200: { description: 'CSV file', content: { 'text/csv': { schema: { type: 'string' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/export/og': {
        get: {
          tags: ['Export'],
          summary: 'Open Graph metadata',
          description: 'Returns Open Graph metadata for social media sharing.',
          operationId: 'getOgMeta',
          responses: {
            200: {
              description: 'OG metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      image: { type: 'string' },
                      url: { type: 'string' },
                      type: { type: 'string' },
                    },
                  },
                },
              },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/export/share-text': {
        get: {
          tags: ['Export'],
          summary: 'Social share text',
          description: 'Returns formatted share text for social media platforms.',
          operationId: 'getShareText',
          parameters: [
            { name: 'platform', in: 'query', schema: { type: 'string', enum: ['twitter', 'facebook', 'whatsapp', 'generic'], default: 'twitter' } },
          ],
          responses: {
            200: {
              description: 'Share text',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { platform: { type: 'string' }, text: { type: 'string' }, url: { type: 'string' } },
                  },
                },
              },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ==================== API KEYS ====================
      '/api/keys': {
        post: {
          tags: ['API Keys'],
          summary: 'Create a new API key',
          description: 'Creates a new API key. The secret key is only shown once in the response.',
          operationId: 'createApiKey',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', minLength: 3, description: 'Key name' },
                    tier: { type: 'string', enum: ['free', 'pro', 'enterprise'], default: 'free' },
                    email: { type: 'string', format: 'email', description: 'Owner email (optional)' },
                  },
                },
                example: { name: 'My App', tier: 'free', email: 'dev@example.com' },
              },
            },
          },
          responses: {
            201: {
              description: 'Key created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      key: { $ref: '#/components/schemas/ApiKeyCreated' },
                    },
                  },
                },
              },
            },
            400: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        get: {
          tags: ['API Keys'],
          summary: 'List all API keys',
          description: 'Lists API keys with optional filters.',
          operationId: 'listApiKeys',
          parameters: [
            { name: 'activeOnly', in: 'query', schema: { type: 'boolean', default: true } },
            { name: 'tier', in: 'query', schema: { type: 'string', enum: ['free', 'pro', 'enterprise'] } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          ],
          responses: {
            200: {
              description: 'Key list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      count: { type: 'integer' },
                      keys: { type: 'array', items: { $ref: '#/components/schemas/ApiKey' } },
                    },
                  },
                },
              },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/keys/{keyId}': {
        get: {
          tags: ['API Keys'],
          summary: 'Get API key details',
          operationId: 'getApiKey',
          parameters: [
            { name: 'keyId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Key details',
              content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, key: { $ref: '#/components/schemas/ApiKey' } } } } },
            },
            404: { description: 'Key not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        patch: {
          tags: ['API Keys'],
          summary: 'Update API key tier',
          operationId: 'updateApiKey',
          parameters: [
            { name: 'keyId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { tier: { type: 'string', enum: ['free', 'pro', 'enterprise'] } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Key updated', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            404: { description: 'Key not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['API Keys'],
          summary: 'Revoke an API key',
          operationId: 'revokeApiKey',
          parameters: [
            { name: 'keyId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Key revoked', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } } } } },
            404: { description: 'Key not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/keys/{keyId}/usage': {
        get: {
          tags: ['API Keys'],
          summary: 'Get key usage statistics',
          operationId: 'getApiKeyUsage',
          parameters: [
            { name: 'keyId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'days', in: 'query', schema: { type: 'integer', default: 30 } },
          ],
          responses: {
            200: { description: 'Usage stats', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, usage: { type: 'object' } } } } } },
            404: { description: 'Key not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ==================== COMMUNITY ====================
      '/api/community/me': {
        get: {
          tags: ['Community'],
          summary: 'Get current user info',
          description: 'Returns anonymous user identity (created via cookie).',
          operationId: 'getCommunityMe',
          responses: {
            200: { description: 'User info', content: { 'application/json': { schema: { $ref: '#/components/schemas/CommunityUser' } } } },
          },
        },
        patch: {
          tags: ['Community'],
          summary: 'Update display name',
          operationId: 'updateCommunityMe',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { displayName: { type: 'string' } } },
              },
            },
          },
          responses: {
            200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/comments/{outcomeId}': {
        get: {
          tags: ['Community'],
          summary: 'Get comments for a prediction',
          operationId: 'getComments',
          parameters: [
            {
              name: 'outcomeId', in: 'path', required: true,
              schema: { type: 'string', enum: ['spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile', 'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg', 'geomag_storm', 'sentiment_drop', 'fear_spike'] },
            },
            { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 100, default: 50 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          ],
          responses: {
            200: { description: 'Comments', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Invalid outcome', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          tags: ['Community'],
          summary: 'Add a comment',
          operationId: 'addComment',
          parameters: [
            {
              name: 'outcomeId', in: 'path', required: true,
              schema: { type: 'string', enum: ['spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile', 'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg', 'geomag_storm', 'sentiment_drop', 'fear_spike'] },
            },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' } } } } },
          },
          responses: {
            201: { description: 'Comment created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Comment' } } } },
            400: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/comments/{commentId}': {
        delete: {
          tags: ['Community'],
          summary: 'Delete a comment',
          operationId: 'deleteComment',
          parameters: [
            { name: 'commentId', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            200: { description: 'Deleted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } } } } },
            400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/reactions/{outcomeId}': {
        get: {
          tags: ['Community'],
          summary: 'Get reactions for a prediction',
          operationId: 'getReactions',
          parameters: [
            {
              name: 'outcomeId', in: 'path', required: true,
              schema: { type: 'string', enum: ['spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile', 'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg', 'geomag_storm', 'sentiment_drop', 'fear_spike'] },
            },
          ],
          responses: {
            200: { description: 'Reactions', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Invalid outcome', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          tags: ['Community'],
          summary: 'Toggle a reaction',
          operationId: 'toggleReaction',
          parameters: [
            {
              name: 'outcomeId', in: 'path', required: true,
              schema: { type: 'string', enum: ['spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile', 'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg', 'geomag_storm', 'sentiment_drop', 'fear_spike'] },
            },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['emoji'], properties: { emoji: { type: 'string' } } } } },
          },
          responses: {
            200: { description: 'Reaction toggled', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/predictions': {
        get: {
          tags: ['Community'],
          summary: 'Get community predictions',
          operationId: 'getCommunityPredictions',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['open', 'closed', 'resolved'], default: 'open' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 50, default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          ],
          responses: {
            200: {
              description: 'Community predictions',
              content: { 'application/json': { schema: { type: 'object', properties: { predictions: { type: 'array', items: { $ref: '#/components/schemas/CommunityPrediction' } } } } } },
            },
          },
        },
        post: {
          tags: ['Community'],
          summary: 'Create a community prediction',
          operationId: 'createCommunityPrediction',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: {
            201: { description: 'Prediction created', content: { 'application/json': { schema: { $ref: '#/components/schemas/CommunityPrediction' } } } },
            400: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/predictions/{id}/votes': {
        get: {
          tags: ['Community'],
          summary: 'Get votes for a prediction',
          operationId: 'getPredictionVotes',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            200: { description: 'Votes', content: { 'application/json': { schema: { type: 'object', properties: { votes: { type: 'object' } } } } } },
          },
        },
      },
      '/api/community/predictions/{id}/vote': {
        post: {
          tags: ['Community'],
          summary: 'Vote on a community prediction',
          operationId: 'votePrediction',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['vote'],
                  properties: {
                    vote: { type: 'string', description: 'Vote value' },
                    confidence: { type: 'number', description: 'Confidence level' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Vote recorded', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/leaderboard': {
        get: {
          tags: ['Community'],
          summary: 'Get accuracy leaderboard',
          operationId: 'getLeaderboard',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 100, default: 50 } },
          ],
          responses: {
            200: {
              description: 'Leaderboard',
              content: { 'application/json': { schema: { type: 'object', properties: { leaderboard: { type: 'array', items: { type: 'object' } } } } } },
            },
          },
        },
      },
      '/api/community/emojis': {
        get: {
          tags: ['Community'],
          summary: 'Get allowed reaction emojis',
          operationId: 'getAllowedEmojis',
          responses: {
            200: {
              description: 'Allowed emojis',
              content: { 'application/json': { schema: { type: 'object', properties: { emojis: { type: 'array', items: { type: 'string' } } } } } },
            },
          },
        },
      },

      // ==================== EMAIL ====================
      '/api/email/subscribe': {
        post: {
          tags: ['Health'],
          summary: 'Subscribe to newsletter (stub)',
          description: 'Not yet implemented. Returns 501.',
          operationId: 'emailSubscribe',
          responses: {
            501: { description: 'Not implemented', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/email/unsubscribe': {
        post: {
          tags: ['Health'],
          summary: 'Unsubscribe from newsletter (stub)',
          description: 'Not yet implemented. Returns 501.',
          operationId: 'emailUnsubscribe',
          responses: {
            501: { description: 'Not implemented', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ==================== HEALTH ====================
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Basic health check',
          description: 'Returns 200 if healthy, 503 if database is disconnected.',
          operationId: 'getHealth',
          responses: {
            200: { description: 'Healthy', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } },
            503: { description: 'Degraded', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } },
          },
        },
      },
      '/health/detailed': {
        get: {
          tags: ['Health'],
          summary: 'Detailed health check',
          description: 'Returns detailed health including module status, cache stats, and uptime.',
          operationId: 'getHealthDetailed',
          responses: {
            200: { description: 'Detailed health', content: { 'application/json': { schema: { $ref: '#/components/schemas/DetailedHealthResponse' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
