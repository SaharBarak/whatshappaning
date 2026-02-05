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

## Philosophy

"Show the math" - Every prediction includes sample sizes, confidence intervals, and statistical backing.

## Rate Limiting

- 100 requests per minute per IP
- Rate limit headers included in responses

## Caching

| Endpoint | Cache Duration |
|----------|---------------|
| /api/current | 5 minutes |
| /api/predictions | 3 hours |
| Other endpoints | No cache |
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
      {
        name: 'Data',
        description: 'Current and historical module data',
      },
      {
        name: 'Predictions',
        description: 'Statistical predictions and forecasts',
      },
      {
        name: 'Research',
        description: 'Correlation analysis and pattern matching',
      },
      {
        name: 'Health',
        description: 'Service health and status checks',
      },
    ],
    paths: {
      '/api/current': {
        get: {
          tags: ['Data'],
          summary: 'Get current module data and indices',
          description: 'Returns current snapshot of all module data (16 modules) and computed indices. Cached for 5 minutes.',
          operationId: 'getCurrent',
          responses: {
            200: {
              description: 'Successful response with all module data',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CurrentDataResponse',
                  },
                  example: {
                    timestamp: '2025-01-31T12:00:00Z',
                    dataAge: '2h 15m',
                    modules: {
                      moon: {
                        data: {
                          phase: 'Waxing Gibbous',
                          illumination: 0.72,
                          sign: 'Leo',
                        },
                        collectedAt: '2025-01-31T10:00:00Z',
                      },
                      astrology: {
                        data: {
                          mercury_retrograde: false,
                          planets: {},
                        },
                        collectedAt: '2025-01-31T10:00:00Z',
                      },
                    },
                    dailyData: {
                      tzolkin: { kin: 1, tone: 1, seal: 'Dragon' },
                      tarot: { card: 'The Fool', number: 0 },
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
            500: {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/history/{module}': {
        get: {
          tags: ['Data'],
          summary: 'Get historical data for a module',
          description: 'Returns historical snapshots for a specific data module. Supports up to 90 days of history.',
          operationId: 'getHistory',
          parameters: [
            {
              name: 'module',
              in: 'path',
              required: true,
              description: 'Module name',
              schema: {
                type: 'string',
                enum: [
                  'moon', 'tzolkin', 'dreamspell', 'parasha', 'gematria',
                  'astrology', 'solar', 'schumann', 'tarot', 'news',
                  'numerology', 'iching', 'cosmic', 'markets', 'geophysical', 'sentiment',
                ],
              },
            },
            {
              name: 'days',
              in: 'query',
              required: false,
              description: 'Number of days of history (default: 7, max: 90)',
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 90,
                default: 7,
              },
            },
          ],
          responses: {
            200: {
              description: 'Successful response with historical data',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HistoryResponse',
                  },
                  example: {
                    module: 'moon',
                    days: 7,
                    count: 56,
                    data: [
                      {
                        data: { phase: 'Full', illumination: 1.0, sign: 'Cancer' },
                        collectedAt: '2025-01-31T12:00:00Z',
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: 'Invalid module name',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ValidationError',
                  },
                  example: {
                    error: 'Invalid module',
                    validModules: ['moon', 'tzolkin', 'dreamspell', '...'],
                  },
                },
              },
            },
            500: {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/predictions': {
        get: {
          tags: ['Predictions'],
          summary: "Get today's predictions",
          description: 'Returns full prediction payload with all outcomes, pattern alerts, action suggestions, and statistical backing. Cached for 3 hours.',
          operationId: 'getPredictions',
          responses: {
            200: {
              description: 'Successful response with predictions',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PredictionsResponse',
                  },
                  example: {
                    date: '2025-01-31',
                    generatedAt: '2025-01-31T12:00:00Z',
                    predictions: [
                      {
                        outcome: 'S&P 500 Direction',
                        outcomeId: 'spx_direction',
                        probability: 0.55,
                        confidenceInterval: [0.48, 0.62],
                        sampleSize: 150,
                        baseRate: 0.52,
                        confidence: 'High',
                        factors: [
                          {
                            feature: '{"moon_phase":"Full"}',
                            contribution: 0.08,
                            standalone: 0.6,
                            sampleSize: 120,
                          },
                        ],
                      },
                    ],
                    patternAlerts: [
                      {
                        matchCount: 5,
                        avgSimilarity: 0.85,
                        matchingDates: ['2024-03-15', '2023-11-22'],
                        outcomes: { spx_direction: 0.8 },
                      },
                    ],
                    actionSuggestions: [
                      {
                        category: 'Markets',
                        suggestion: 'Elevated caution',
                        reasoning: '65% volatility probability',
                        confidence: 'Medium',
                      },
                    ],
                    summary: {
                      overallTension: 'medium',
                      tensionScore: 4.5,
                      topRisks: ['Market Volatility', 'VIX Spike'],
                      stableFactors: ['Low Major Earthquake probability'],
                    },
                    disclaimer: 'These predictions are based on historical statistical correlations...',
                  },
                },
              },
            },
            500: {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/predictions/{outcome}': {
        get: {
          tags: ['Predictions'],
          summary: 'Get prediction for specific outcome',
          description: 'Returns detailed prediction for a specific outcome with all contributing factors and statistical analysis.',
          operationId: 'getPredictionByOutcome',
          parameters: [
            {
              name: 'outcome',
              in: 'path',
              required: true,
              description: 'Outcome ID to get prediction for',
              schema: {
                type: 'string',
                enum: [
                  'spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile',
                  'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg',
                  'geomag_storm', 'sentiment_drop', 'fear_spike',
                ],
              },
            },
          ],
          responses: {
            200: {
              description: 'Successful response with outcome prediction',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/OutcomePredictionResponse',
                  },
                  example: {
                    outcome: 'S&P 500 Direction',
                    outcomeId: 'spx_direction',
                    factors: [
                      {
                        features: { moon_phase: 'Full' },
                        outcome: 'spx_direction',
                        probability: 0.58,
                        sample_size: 120,
                        confidence_low: 0.49,
                        confidence_high: 0.67,
                        lift: 1.12,
                        is_significant: true,
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: 'Invalid outcome',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ValidationError',
                  },
                  example: {
                    error: 'Invalid outcome',
                    validOutcomes: ['spx_direction', 'spx_volatile', '...'],
                  },
                },
              },
            },
            500: {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/correlations': {
        get: {
          tags: ['Research'],
          summary: 'Get significant correlations',
          description: 'Returns all statistically significant correlations for research purposes. Filter by feature, outcome, sample size, or lift value.',
          operationId: 'getCorrelations',
          parameters: [
            {
              name: 'feature',
              in: 'query',
              required: false,
              description: 'Filter by feature name',
              schema: {
                type: 'string',
              },
              example: 'moon_phase',
            },
            {
              name: 'outcome',
              in: 'query',
              required: false,
              description: 'Filter by outcome',
              schema: {
                type: 'string',
                enum: [
                  'spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile',
                  'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg',
                  'geomag_storm', 'sentiment_drop', 'fear_spike',
                ],
              },
            },
            {
              name: 'minSampleSize',
              in: 'query',
              required: false,
              description: 'Minimum sample size (default: 30)',
              schema: {
                type: 'integer',
                minimum: 1,
                default: 30,
              },
            },
            {
              name: 'minLift',
              in: 'query',
              required: false,
              description: 'Minimum lift value (default: 1.0)',
              schema: {
                type: 'number',
                minimum: 0,
                default: 1.0,
              },
            },
          ],
          responses: {
            200: {
              description: 'Successful response with correlations',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CorrelationsResponse',
                  },
                  example: {
                    count: 25,
                    correlations: [
                      {
                        type: 'single',
                        features: { mercury_retrograde: true },
                        outcome: 'spx_volatile',
                        probability: 0.62,
                        sample_size: 85,
                        base_rate: 0.45,
                        confidence_low: 0.51,
                        confidence_high: 0.72,
                        chi_squared: 8.5,
                        p_value: 0.003,
                        lift: 1.38,
                        is_significant: true,
                      },
                    ],
                  },
                },
              },
            },
            500: {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/patterns': {
        get: {
          tags: ['Research'],
          summary: 'Get current pattern matches',
          description: "Returns pattern matches based on today's features compared to historical data. Identifies similar historical conditions and their outcomes.",
          operationId: 'getPatterns',
          responses: {
            200: {
              description: 'Successful response with pattern matches',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PatternsResponse',
                  },
                  example: {
                    patterns: [
                      {
                        matchCount: 5,
                        avgSimilarity: 0.85,
                        matchingDates: ['2024-03-15', '2023-11-22'],
                        outcomes: { spx_direction: 0.8, spx_volatile: 0.6 },
                      },
                    ],
                    todayFeatures: {
                      moon_phase: 'Full',
                      moon_sign: 'Leo',
                      mercury_retrograde: false,
                    },
                    matchCount: 5,
                    avgSimilarity: 0.85,
                  },
                },
              },
            },
            500: {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/backtest': {
        post: {
          tags: ['Research'],
          summary: 'Run custom backtest query',
          description: 'Execute a custom backtest query on historical data with specified features and outcome.',
          operationId: 'runBacktest',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/BacktestRequest',
                },
                example: {
                  features: { moon_phase: 'Full', mercury_retrograde: true },
                  outcome: 'spx_volatile',
                  startDate: '2020-01-01',
                  endDate: '2024-12-31',
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Successful backtest response',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/BacktestResponse',
                  },
                  example: {
                    features: { moon_phase: 'Full', mercury_retrograde: true },
                    outcome: 'spx_volatile',
                    dateRange: { start: '2020-01-01', end: '2024-12-31' },
                    results: {
                      totalSamples: 150,
                      positiveOutcomes: 85,
                      probability: 0.567,
                      confidenceInterval: [0.48, 0.65],
                      sufficient: true,
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ValidationError',
                  },
                },
              },
            },
            500: {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Basic health check',
          description: 'Returns basic health status of the service. Returns 200 if healthy, 503 if database is disconnected.',
          operationId: 'getHealth',
          responses: {
            200: {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HealthResponse',
                  },
                  example: {
                    status: 'healthy',
                    timestamp: '2025-01-31T12:00:00Z',
                    database: 'connected',
                  },
                },
              },
            },
            503: {
              description: 'Service is degraded',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HealthResponse',
                  },
                  example: {
                    status: 'degraded',
                    timestamp: '2025-01-31T12:00:00Z',
                    database: 'disconnected',
                  },
                },
              },
            },
          },
        },
      },
      '/health/detailed': {
        get: {
          tags: ['Health'],
          summary: 'Detailed health check',
          description: 'Returns detailed health information including module status, cache stats, and uptime.',
          operationId: 'getHealthDetailed',
          responses: {
            200: {
              description: 'Detailed health information',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/DetailedHealthResponse',
                  },
                  example: {
                    status: 'healthy',
                    timestamp: '2025-01-31T12:00:00Z',
                    uptime: '5d 12h 30m',
                    uptimeSeconds: 477000,
                    database: { connected: true },
                    cache: { entries: 15, hitRate: 0.85 },
                    modules: {
                      moon: {
                        status: 'success',
                        lastCheck: '2025-01-31T12:00:00Z',
                        responseTime: 150,
                        error: null,
                      },
                    },
                    summary: {
                      totalModules: 16,
                      healthy: 15,
                      errors: 1,
                    },
                  },
                },
              },
            },
            500: {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/': {
        get: {
          tags: ['Data'],
          summary: 'API root information',
          description: 'Returns basic API information and available endpoints.',
          operationId: 'getRoot',
          responses: {
            200: {
              description: 'API information',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      version: { type: 'string' },
                      description: { type: 'string' },
                      endpoints: {
                        type: 'object',
                        additionalProperties: { type: 'string' },
                      },
                    },
                  },
                  example: {
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
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        CurrentDataResponse: {
          type: 'object',
          properties: {
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Current timestamp',
            },
            dataAge: {
              type: 'string',
              description: 'Age of oldest data in human-readable format',
            },
            modules: {
              type: 'object',
              description: 'Module data keyed by module name',
              additionalProperties: {
                $ref: '#/components/schemas/ModuleSnapshot',
              },
            },
            dailyData: {
              type: 'object',
              description: 'Daily calculated values (tzolkin, tarot, etc.)',
              additionalProperties: { type: 'object' },
            },
            indices: {
              $ref: '#/components/schemas/Indices',
            },
          },
        },
        ModuleSnapshot: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              description: 'Module-specific data',
            },
            collectedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When this data was collected',
            },
          },
        },
        Indices: {
          type: 'object',
          properties: {
            solarGeo: {
              type: 'object',
              properties: {
                value: { type: 'number', nullable: true },
                level: {
                  type: 'string',
                  enum: ['Calm', 'Low', 'Moderate', 'Elevated', 'High', 'Unknown'],
                },
              },
            },
            astroEvents: {
              type: 'object',
              properties: {
                count: { type: 'integer' },
                level: {
                  type: 'string',
                  enum: ['Quiet', 'Low', 'Active', 'Busy', 'Intense', 'Unknown'],
                },
              },
            },
            calendarSync: {
              type: 'object',
              properties: {
                score: { type: 'integer' },
                level: {
                  type: 'string',
                  enum: ['None', 'Low', 'Moderate', 'High', 'Rare', 'Unknown'],
                },
              },
            },
          },
        },
        HistoryResponse: {
          type: 'object',
          properties: {
            module: { type: 'string' },
            days: { type: 'integer' },
            count: { type: 'integer' },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ModuleSnapshot',
              },
            },
          },
        },
        PredictionsResponse: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            generatedAt: { type: 'string', format: 'date-time' },
            predictions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Prediction',
              },
            },
            patternAlerts: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/PatternAlert',
              },
            },
            actionSuggestions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ActionSuggestion',
              },
            },
            summary: {
              $ref: '#/components/schemas/PredictionSummary',
            },
            disclaimer: { type: 'string' },
          },
        },
        Prediction: {
          type: 'object',
          properties: {
            outcome: { type: 'string', description: 'Human-readable outcome name' },
            outcomeId: { type: 'string', description: 'Outcome identifier' },
            probability: { type: 'number', minimum: 0, maximum: 1 },
            confidenceInterval: {
              type: 'array',
              items: { type: 'number' },
              minItems: 2,
              maxItems: 2,
            },
            sampleSize: { type: 'integer' },
            baseRate: { type: 'number' },
            confidence: {
              type: 'string',
              enum: ['Very High', 'High', 'Medium', 'Low', 'Insufficient'],
            },
            factors: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Factor',
              },
            },
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
        PatternAlert: {
          type: 'object',
          properties: {
            matchCount: { type: 'integer' },
            avgSimilarity: { type: 'number' },
            matchingDates: {
              type: 'array',
              items: { type: 'string', format: 'date' },
            },
            outcomes: {
              type: 'object',
              additionalProperties: { type: 'number' },
            },
          },
        },
        ActionSuggestion: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            suggestion: { type: 'string' },
            reasoning: { type: 'string' },
            confidence: {
              type: 'string',
              enum: ['High', 'Medium', 'Low'],
            },
          },
        },
        PredictionSummary: {
          type: 'object',
          properties: {
            overallTension: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
            },
            tensionScore: { type: 'number' },
            topRisks: {
              type: 'array',
              items: { type: 'string' },
            },
            stableFactors: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        OutcomePredictionResponse: {
          type: 'object',
          properties: {
            outcome: { type: 'string' },
            outcomeId: { type: 'string' },
            factors: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CorrelationResult',
              },
            },
          },
        },
        CorrelationsResponse: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
            correlations: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CorrelationResult',
              },
            },
          },
        },
        CorrelationResult: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['single', 'combination'],
            },
            features: {
              type: 'object',
              additionalProperties: true,
            },
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
        PatternsResponse: {
          type: 'object',
          properties: {
            patterns: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/PatternAlert',
              },
            },
            todayFeatures: {
              type: 'object',
              additionalProperties: true,
            },
            matchCount: { type: 'integer' },
            avgSimilarity: { type: 'number' },
            topMatches: {
              type: 'array',
              items: { type: 'object' },
            },
            analysis: { type: 'string' },
            note: { type: 'string' },
          },
        },
        BacktestRequest: {
          type: 'object',
          required: ['features', 'outcome'],
          properties: {
            features: {
              type: 'object',
              description: 'Feature conditions to filter by',
              additionalProperties: true,
              example: { moon_phase: 'Full', mercury_retrograde: true },
            },
            outcome: {
              type: 'string',
              description: 'Outcome to measure',
              enum: [
                'spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile',
                'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg',
                'geomag_storm', 'sentiment_drop', 'fear_spike',
              ],
            },
            startDate: {
              type: 'string',
              format: 'date',
              description: 'Start date for backtest (default: 2000-01-01)',
            },
            endDate: {
              type: 'string',
              format: 'date',
              description: 'End date for backtest (default: today)',
            },
          },
        },
        BacktestResponse: {
          type: 'object',
          properties: {
            features: { type: 'object' },
            outcome: { type: 'string' },
            dateRange: {
              type: 'object',
              properties: {
                start: { type: 'string', format: 'date' },
                end: { type: 'string', format: 'date' },
              },
            },
            results: {
              type: 'object',
              properties: {
                totalSamples: { type: 'integer' },
                positiveOutcomes: { type: 'integer' },
                probability: { type: 'number' },
                confidenceInterval: {
                  type: 'array',
                  items: { type: 'number' },
                  nullable: true,
                },
                sufficient: { type: 'boolean' },
              },
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded'],
            },
            timestamp: { type: 'string', format: 'date-time' },
            database: {
              type: 'string',
              enum: ['connected', 'disconnected'],
            },
          },
        },
        DetailedHealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'warning', 'degraded', 'critical'],
            },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'string' },
            uptimeSeconds: { type: 'integer' },
            database: {
              type: 'object',
              properties: {
                connected: { type: 'boolean' },
              },
            },
            cache: {
              type: 'object',
              properties: {
                entries: { type: 'integer' },
                hitRate: { type: 'number' },
              },
            },
            modules: {
              type: 'object',
              additionalProperties: {
                $ref: '#/components/schemas/ModuleHealth',
              },
            },
            summary: {
              type: 'object',
              properties: {
                totalModules: { type: 'integer' },
                healthy: { type: 'integer' },
                errors: { type: 'integer' },
              },
            },
          },
        },
        ModuleHealth: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['success', 'error'],
            },
            lastCheck: { type: 'string', format: 'date-time' },
            responseTime: { type: 'integer', description: 'Response time in ms' },
            error: { type: 'string', nullable: true },
          },
        },
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
            validModules: {
              type: 'array',
              items: { type: 'string' },
            },
            validOutcomes: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
  },
  apis: [], // We define everything inline in the definition
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
