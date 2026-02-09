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

      // ==================== Historical Routes ====================

      '/api/historical/range': {
        get: {
          tags: ['Data'],
          summary: 'Get available historical date range',
          description: 'Returns the min/max dates with available data and a list of significant dates.',
          operationId: 'getHistoricalRange',
          responses: {
            200: {
              description: 'Date range information',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HistoricalRangeResponse' },
                  example: {
                    range: { minDate: '2020-01-01', maxDate: '2025-01-31', totalDays: 1857 },
                    significantDates: ['2024-11-05', '2024-03-15'],
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
          summary: 'Get all module data for a specific date',
          description: 'Returns snapshots, daily data, and archived predictions for a given historical date.',
          operationId: 'getHistoricalDate',
          parameters: [
            { name: 'date', in: 'path', required: true, description: 'Date in YYYY-MM-DD format', schema: { type: 'string', format: 'date' }, example: '2024-11-05' },
          ],
          responses: {
            200: {
              description: 'Historical data for the date',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HistoricalDateResponse' },
                  example: {
                    date: '2024-11-05',
                    dailyData: { tzolkin: { kin: 100 }, tarot: { card: 'The Tower' } },
                    modules: { moon: { data: { phase: 'Waxing Crescent' }, collectedAt: '2024-11-05T10:00:00Z' } },
                    predictions: [{ outcomeId: 'spx_direction', probability: 0.55, confidence: 'High', actual: true }],
                    hasData: true,
                  },
                },
              },
            },
            400: { description: 'Invalid date format', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ==================== Analytics Routes ====================

      '/api/analytics': {
        get: {
          tags: ['Analytics'],
          summary: 'Get full analytics report',
          description: 'Returns a complete analytics report with all accuracy metrics. Cached for 1 hour.',
          operationId: 'getAnalyticsReport',
          parameters: [
            { name: 'days', in: 'query', description: 'Number of days to analyze (default: 90, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: { description: 'Full analytics report', content: { 'application/json': { schema: { type: 'object', description: 'Complete analytics report with accuracy, calibration, and feature data' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/accuracy': {
        get: {
          tags: ['Analytics'],
          summary: 'Get overall accuracy metrics',
          description: 'Returns overall accuracy summary across all outcomes.',
          operationId: 'getAccuracy',
          parameters: [
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 90, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: { description: 'Overall accuracy metrics', content: { 'application/json': { schema: { type: 'object' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/accuracy/{outcome}': {
        get: {
          tags: ['Analytics'],
          summary: 'Get accuracy for a specific outcome',
          description: 'Returns accuracy metrics for a single outcome.',
          operationId: 'getOutcomeAccuracy',
          parameters: [
            {
              name: 'outcome', in: 'path', required: true, description: 'Outcome ID',
              schema: {
                type: 'string',
                enum: ['spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile', 'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg', 'geomag_storm', 'sentiment_drop', 'fear_spike'],
              },
            },
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 90, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: { description: 'Outcome accuracy metrics', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Invalid outcome', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/by-confidence': {
        get: {
          tags: ['Analytics'],
          summary: 'Get accuracy by confidence level',
          description: 'Returns accuracy grouped by prediction confidence level.',
          operationId: 'getAccuracyByConfidence',
          parameters: [
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 90, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: {
              description: 'Accuracy by confidence level',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { days: { type: 'integer' }, byConfidence: { type: 'object', additionalProperties: { type: 'object' } } } },
                  example: { days: 90, byConfidence: { High: { total: 50, correct: 35, accuracy: 0.7 } } },
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
          summary: 'Get accuracy trends over time',
          description: 'Returns accuracy data points over time at day/week/month intervals.',
          operationId: 'getAccuracyOverTime',
          parameters: [
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 90, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
            { name: 'interval', in: 'query', description: 'Aggregation interval', schema: { type: 'string', enum: ['day', 'week', 'month'], default: 'week' } },
          ],
          responses: {
            200: {
              description: 'Accuracy over time',
              content: { 'application/json': { schema: { type: 'object', properties: { days: { type: 'integer' }, interval: { type: 'string' }, data: { type: 'array', items: { type: 'object' } } } } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/calibration': {
        get: {
          tags: ['Analytics'],
          summary: 'Get calibration data',
          description: 'Returns calibration data for reliability diagrams — predicted vs actual probability by bin.',
          operationId: 'getCalibration',
          parameters: [
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 90, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
            { name: 'bins', in: 'query', description: 'Number of probability bins (default: 10, min: 5, max: 20)', schema: { type: 'integer', minimum: 5, maximum: 20, default: 10 } },
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
          summary: 'Get historical prediction archive',
          description: 'Returns paginated historical predictions with outcomes.',
          operationId: 'getAnalyticsHistory',
          parameters: [
            { name: 'limit', in: 'query', description: 'Max results (default: 100, max: 500)', schema: { type: 'integer', minimum: 1, maximum: 500, default: 100 } },
            { name: 'offset', in: 'query', description: 'Offset for pagination (default: 0)', schema: { type: 'integer', minimum: 0, default: 0 } },
          ],
          responses: {
            200: { description: 'Historical predictions', content: { 'application/json': { schema: { type: 'object' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/features': {
        get: {
          tags: ['Analytics'],
          summary: 'Get top contributing features',
          description: 'Returns the most predictive features ranked by contribution.',
          operationId: 'getFeatureContributions',
          parameters: [
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 90, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
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
          summary: 'Get comprehensive dashboard data',
          description: 'Returns all dashboard metrics in one call (v2 accuracy engine). Cached for 30 minutes.',
          operationId: 'getDashboard',
          parameters: [
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 90, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: { description: 'Dashboard data with all metrics', content: { 'application/json': { schema: { type: 'object', description: 'Comprehensive dashboard payload' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/rolling': {
        get: {
          tags: ['Analytics'],
          summary: 'Get rolling accuracy windows',
          description: 'Returns rolling accuracy for 7, 30, and 90 day windows. Optionally filter by outcome.',
          operationId: 'getRollingAccuracy',
          parameters: [
            { name: 'outcome', in: 'query', description: 'Filter by outcome ID (optional)', schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Rolling accuracy data',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { outcome: { type: 'string' }, windows: { type: 'object', additionalProperties: { type: 'object' } } } },
                  example: { outcome: 'all', windows: { '7': { accuracy: 0.65, total: 77 }, '30': { accuracy: 0.62, total: 330 } } },
                },
              },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/streaks': {
        get: {
          tags: ['Analytics'],
          summary: 'Get prediction streak analysis',
          description: 'Returns current and longest winning/losing streaks.',
          operationId: 'getStreaks',
          parameters: [
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 90, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
            { name: 'outcome', in: 'query', description: 'Filter by outcome ID (optional)', schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Streak analysis',
              content: { 'application/json': { schema: { type: 'object', properties: { days: { type: 'integer' }, outcome: { type: 'string' }, currentStreak: { type: 'object' }, longestWin: { type: 'object' }, longestLoss: { type: 'object' } } } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/best-worst': {
        get: {
          tags: ['Analytics'],
          summary: 'Get best and worst performing periods',
          description: 'Finds the best and worst accuracy windows within the lookback period.',
          operationId: 'getBestWorst',
          parameters: [
            { name: 'window', in: 'query', description: 'Window size in days (default: 7, min: 3, max: 30)', schema: { type: 'integer', minimum: 3, maximum: 30, default: 7 } },
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 90, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: { description: 'Best and worst periods', content: { 'application/json': { schema: { type: 'object' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/by-category': {
        get: {
          tags: ['Analytics'],
          summary: 'Get accuracy by prediction category',
          description: 'Returns accuracy grouped by category (market, geophysical, sentiment).',
          operationId: 'getAccuracyByCategory',
          parameters: [
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 90, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: {
              description: 'Accuracy by category',
              content: { 'application/json': { schema: { type: 'object', properties: { days: { type: 'integer' }, categories: { type: 'object', additionalProperties: { type: 'object' } } } } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/by-tag': {
        get: {
          tags: ['Analytics'],
          summary: 'Get accuracy by tag',
          description: 'Returns accuracy grouped by prediction tags.',
          operationId: 'getAccuracyByTag',
          parameters: [
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 90, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
          ],
          responses: {
            200: {
              description: 'Accuracy by tag',
              content: { 'application/json': { schema: { type: 'object', properties: { days: { type: 'integer' }, tags: { type: 'object', additionalProperties: { type: 'object' } } } } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/trend': {
        get: {
          tags: ['Analytics'],
          summary: 'Get accuracy trend from snapshots',
          description: 'Returns accuracy trend data from daily snapshots.',
          operationId: 'getAccuracyTrend',
          parameters: [
            { name: 'outcome', in: 'query', description: 'Outcome ID (optional)', schema: { type: 'string' } },
            { name: 'period', in: 'query', description: 'Rolling period in days (7, 30, or 90)', schema: { type: 'integer', enum: [7, 30, 90], default: 30 } },
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 180, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 180 } },
          ],
          responses: {
            200: {
              description: 'Accuracy trend data',
              content: { 'application/json': { schema: { type: 'object', properties: { outcome: { type: 'string' }, periodDays: { type: 'integer' }, lookbackDays: { type: 'integer' }, data: { type: 'array', items: { type: 'object' } } } } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/analytics/hit-rate': {
        get: {
          tags: ['Analytics'],
          summary: 'Get hit rate by probability buckets',
          description: 'Returns hit rate grouped by predicted probability buckets for calibration curves.',
          operationId: 'getHitRate',
          parameters: [
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 90, max: 365)', schema: { type: 'integer', minimum: 1, maximum: 365, default: 90 } },
            { name: 'buckets', in: 'query', description: 'Number of probability buckets (default: 10, min: 5, max: 20)', schema: { type: 'integer', minimum: 5, maximum: 20, default: 10 } },
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
          description: 'Triggers generation of a daily accuracy snapshot. Intended for cron jobs.',
          operationId: 'createSnapshot',
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { date: { type: 'string', format: 'date-time', description: 'Date for the snapshot (defaults to now)' } } },
                example: { date: '2025-01-31T00:00:00Z' },
              },
            },
          },
          responses: {
            200: {
              description: 'Snapshot generated',
              content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } }, example: { success: true } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ==================== API Keys Routes ====================

      '/api/keys': {
        get: {
          tags: ['API Keys'],
          summary: 'List all API keys',
          description: 'Returns a list of API keys. Supports filtering by active status and tier.',
          operationId: 'listApiKeys',
          parameters: [
            { name: 'activeOnly', in: 'query', description: 'Only return active keys (default: true)', schema: { type: 'string', enum: ['true', 'false'], default: 'true' } },
            { name: 'tier', in: 'query', description: 'Filter by tier', schema: { type: 'string', enum: ['free', 'pro', 'enterprise'] } },
            { name: 'limit', in: 'query', description: 'Max results (default: 50)', schema: { type: 'integer', default: 50 } },
          ],
          responses: {
            200: {
              description: 'List of API keys',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiKeyListResponse' },
                  example: { success: true, count: 1, keys: [{ keyId: 'wh_abc123', name: 'My App', tier: 'free', dailyLimit: 100, isActive: true, createdAt: '2025-01-15T10:00:00Z', lastUsedAt: '2025-01-31T08:00:00Z' }] },
                },
              },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          tags: ['API Keys'],
          summary: 'Create a new API key',
          description: 'Creates a new API key. The secret key is returned only once.',
          operationId: 'createApiKey',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateApiKeyRequest' },
                example: { name: 'My App', tier: 'free', email: 'dev@example.com' },
              },
            },
          },
          responses: {
            201: {
              description: 'API key created',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateApiKeyResponse' } } },
            },
            400: { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/keys/{keyId}': {
        get: {
          tags: ['API Keys'],
          summary: 'Get API key details',
          description: 'Returns details for a specific API key.',
          operationId: 'getApiKey',
          parameters: [{ name: 'keyId', in: 'path', required: true, description: 'API key ID', schema: { type: 'string' } }],
          responses: {
            200: { description: 'API key details', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiKeyDetailResponse' } } } },
            404: { description: 'Key not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        patch: {
          tags: ['API Keys'],
          summary: 'Update an API key',
          description: 'Update the tier of an API key.',
          operationId: 'updateApiKey',
          parameters: [{ name: 'keyId', in: 'path', required: true, description: 'API key ID', schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { tier: { type: 'string', enum: ['free', 'pro', 'enterprise'] } }, required: ['tier'] },
                example: { tier: 'pro' },
              },
            },
          },
          responses: {
            200: { description: 'Key updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, key: { $ref: '#/components/schemas/ApiKeySummary' } } } } } },
            400: { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            404: { description: 'Key not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['API Keys'],
          summary: 'Revoke an API key',
          description: 'Permanently revokes an API key.',
          operationId: 'revokeApiKey',
          parameters: [{ name: 'keyId', in: 'path', required: true, description: 'API key ID', schema: { type: 'string' } }],
          responses: {
            200: { description: 'Key revoked', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }, example: { success: true, message: 'API key revoked successfully.' } } } },
            404: { description: 'Key not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/keys/{keyId}/usage': {
        get: {
          tags: ['API Keys'],
          summary: 'Get usage statistics for an API key',
          description: 'Returns usage stats including request counts over the specified period.',
          operationId: 'getApiKeyUsage',
          parameters: [
            { name: 'keyId', in: 'path', required: true, description: 'API key ID', schema: { type: 'string' } },
            { name: 'days', in: 'query', description: 'Lookback period in days (default: 30)', schema: { type: 'integer', default: 30 } },
          ],
          responses: {
            200: { description: 'Usage statistics', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, usage: { type: 'object' } } } } } },
            404: { description: 'Key not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ==================== Community Routes ====================

      '/api/community/me': {
        get: {
          tags: ['Community'],
          summary: 'Get current user info',
          description: 'Returns the anonymous user profile based on cookie identity.',
          operationId: 'getCommunityMe',
          responses: {
            200: {
              description: 'User info',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/CommunityUser' }, example: { id: 42, displayName: 'CosmicObserver', avatarSeed: 'a1b2c3d4', createdAt: '2025-01-15T10:00:00Z' } } },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        patch: {
          tags: ['Community'],
          summary: 'Update display name',
          description: "Updates the current user's display name.",
          operationId: 'updateCommunityMe',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { displayName: { type: 'string' } }, required: ['displayName'] },
                example: { displayName: 'MoonWatcher' },
              },
            },
          },
          responses: {
            200: { description: 'Updated user', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Invalid name', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/comments/{outcomeId}': {
        get: {
          tags: ['Community'],
          summary: 'Get comments for a prediction',
          description: 'Returns paginated comments for a specific outcome prediction.',
          operationId: 'getComments',
          parameters: [
            {
              name: 'outcomeId', in: 'path', required: true, description: 'Outcome ID',
              schema: { type: 'string', enum: ['spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile', 'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg', 'geomag_storm', 'sentiment_drop', 'fear_spike'] },
            },
            { name: 'limit', in: 'query', description: 'Max comments (default: 50, max: 100)', schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 } },
            { name: 'offset', in: 'query', description: 'Pagination offset', schema: { type: 'integer', minimum: 0, default: 0 } },
          ],
          responses: {
            200: { description: 'Comments list', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Invalid outcome ID', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          tags: ['Community'],
          summary: 'Add a comment',
          description: 'Adds a comment to a prediction outcome.',
          operationId: 'addComment',
          parameters: [{ name: 'outcomeId', in: 'path', required: true, description: 'Outcome ID', schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { content: { type: 'string', description: 'Comment text' } }, required: ['content'] },
                example: { content: 'Mercury retrograde always shakes the markets!' },
              },
            },
          },
          responses: {
            201: { description: 'Comment created', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/comments/{commentId}': {
        delete: {
          tags: ['Community'],
          summary: 'Delete a comment',
          description: 'Deletes a comment owned by the current user.',
          operationId: 'deleteComment',
          parameters: [{ name: 'commentId', in: 'path', required: true, description: 'Comment ID', schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Comment deleted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } }, example: { success: true } } } },
            400: { description: 'Not allowed or not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/reactions/{outcomeId}': {
        get: {
          tags: ['Community'],
          summary: 'Get reactions for a prediction',
          description: "Returns reaction counts and the current user's reactions for an outcome.",
          operationId: 'getReactions',
          parameters: [{ name: 'outcomeId', in: 'path', required: true, description: 'Outcome ID', schema: { type: 'string' } }],
          responses: {
            200: { description: 'Reactions data', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Invalid outcome ID', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          tags: ['Community'],
          summary: 'Toggle a reaction',
          description: 'Toggles an emoji reaction on an outcome prediction.',
          operationId: 'toggleReaction',
          parameters: [{ name: 'outcomeId', in: 'path', required: true, description: 'Outcome ID', schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { emoji: { type: 'string', description: 'Emoji to toggle' } }, required: ['emoji'] },
                example: { emoji: '🔥' },
              },
            },
          },
          responses: {
            200: { description: 'Reaction toggled', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/predictions': {
        get: {
          tags: ['Community'],
          summary: 'Get community predictions',
          description: 'Returns user-created community predictions, filtered by status.',
          operationId: 'getCommunityPredictions',
          parameters: [
            { name: 'status', in: 'query', description: 'Filter by status (default: open)', schema: { type: 'string', enum: ['open', 'closed', 'resolved'], default: 'open' } },
            { name: 'limit', in: 'query', description: 'Max results (default: 20, max: 50)', schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 } },
            { name: 'offset', in: 'query', description: 'Pagination offset', schema: { type: 'integer', minimum: 0, default: 0 } },
          ],
          responses: {
            200: { description: 'Community predictions', content: { 'application/json': { schema: { type: 'object', properties: { predictions: { type: 'array', items: { type: 'object' } } } } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          tags: ['Community'],
          summary: 'Create a community prediction',
          description: 'Creates a new user-submitted prediction.',
          operationId: 'createCommunityPrediction',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', description: 'Prediction details (title, description, category, deadline, etc.)' } } },
          },
          responses: {
            201: { description: 'Prediction created', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/predictions/{id}/votes': {
        get: {
          tags: ['Community'],
          summary: 'Get votes for a prediction',
          description: 'Returns all votes cast on a community prediction.',
          operationId: 'getVotes',
          parameters: [{ name: 'id', in: 'path', required: true, description: 'Prediction ID', schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Votes list', content: { 'application/json': { schema: { type: 'object', properties: { votes: { type: 'array', items: { type: 'object' } } } } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/predictions/{id}/vote': {
        post: {
          tags: ['Community'],
          summary: 'Vote on a prediction',
          description: 'Casts a vote on a community prediction with a confidence level.',
          operationId: 'castVote',
          parameters: [{ name: 'id', in: 'path', required: true, description: 'Prediction ID', schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { vote: { type: 'boolean', description: 'true = agree, false = disagree' }, confidence: { type: 'number', minimum: 0, maximum: 1, description: 'Confidence level (0-1)' } }, required: ['vote'] },
                example: { vote: true, confidence: 0.8 },
              },
            },
          },
          responses: {
            200: { description: 'Vote recorded', content: { 'application/json': { schema: { type: 'object' } } } },
            400: { description: 'Invalid vote', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/leaderboard': {
        get: {
          tags: ['Community'],
          summary: 'Get accuracy leaderboard',
          description: 'Returns the community leaderboard ranked by prediction accuracy.',
          operationId: 'getLeaderboard',
          parameters: [{ name: 'limit', in: 'query', description: 'Max entries (default: 50, max: 100)', schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 } }],
          responses: {
            200: { description: 'Leaderboard', content: { 'application/json': { schema: { type: 'object', properties: { leaderboard: { type: 'array', items: { type: 'object' } } } } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/community/emojis': {
        get: {
          tags: ['Community'],
          summary: 'Get allowed reaction emojis',
          description: 'Returns the list of emojis allowed for reactions.',
          operationId: 'getAllowedEmojis',
          responses: {
            200: {
              description: 'Allowed emojis',
              content: { 'application/json': { schema: { type: 'object', properties: { emojis: { type: 'array', items: { type: 'string' } } } }, example: { emojis: ['🔥', '🎯', '🌙', '📈', '📉', '🤔', '💎', '🚀'] } } },
            },
          },
        },
      },

      // ==================== Email Routes ====================

      '/api/email/subscribe': {
        post: {
          tags: ['Email'],
          summary: 'Subscribe to newsletter',
          description: 'Subscribe an email address to the newsletter. Currently returns 501 (coming soon).',
          operationId: 'emailSubscribe',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } }, required: ['email'] },
                example: { email: 'user@example.com' },
              },
            },
          },
          responses: {
            501: { description: 'Not implemented yet', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Not Implemented', message: 'Email subscriptions are coming soon.' } } } },
          },
        },
      },
      '/api/email/unsubscribe': {
        post: {
          tags: ['Email'],
          summary: 'Unsubscribe from newsletter',
          description: 'Unsubscribe from the newsletter. Currently returns 501 (coming soon).',
          operationId: 'emailUnsubscribe',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } }, required: ['email'] },
                example: { email: 'user@example.com' },
              },
            },
          },
          responses: {
            501: { description: 'Not implemented yet', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Not Implemented', message: 'Email subscriptions are coming soon.' } } } },
          },
        },
      },

      // ==================== Export Routes ====================

      '/api/export/csv': {
        get: {
          tags: ['Export'],
          summary: 'Export predictions as CSV',
          description: 'Downloads current predictions data as a CSV file.',
          operationId: 'exportCsv',
          responses: {
            200: { description: 'CSV file', content: { 'text/csv': { schema: { type: 'string' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/export/json': {
        get: {
          tags: ['Export'],
          summary: 'Export predictions as JSON',
          description: 'Downloads current predictions data as a JSON file.',
          operationId: 'exportJson',
          responses: {
            200: { description: 'JSON export', content: { 'application/json': { schema: { type: 'object' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/export/pdf': {
        get: {
          tags: ['Export'],
          summary: 'Export predictions as PDF',
          description: 'Generates and downloads a PDF report of current predictions.',
          operationId: 'exportPdf',
          responses: {
            200: { description: 'PDF report', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } },
            503: { description: 'PDF generation not available', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/export/image': {
        get: {
          tags: ['Export'],
          summary: 'Generate shareable image card',
          description: 'Generates a PNG image card of current predictions in the specified format.',
          operationId: 'exportImage',
          parameters: [
            { name: 'format', in: 'query', description: 'Image format/layout (default: square)', schema: { type: 'string', enum: ['square', 'story', 'wide', 'compact'], default: 'square' } },
          ],
          responses: {
            200: { description: 'PNG image', content: { 'image/png': { schema: { type: 'string', format: 'binary' } } } },
            400: { description: 'Invalid format', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            503: { description: 'Image generation not available', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/export/share-text': {
        get: {
          tags: ['Export'],
          summary: 'Get formatted share text',
          description: 'Returns formatted text for sharing on social platforms.',
          operationId: 'exportShareText',
          parameters: [
            { name: 'platform', in: 'query', description: 'Target platform (default: twitter)', schema: { type: 'string', enum: ['twitter', 'facebook', 'whatsapp', 'generic'], default: 'twitter' } },
          ],
          responses: {
            200: {
              description: 'Share text',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { platform: { type: 'string' }, text: { type: 'string' }, url: { type: 'string' } } },
                  example: { platform: 'twitter', text: "What's Happening: S&P 500 Direction at 55% 📊", url: 'https://whatshappening.app' },
                },
              },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/export/og': {
        get: {
          tags: ['Export'],
          summary: 'Get Open Graph metadata',
          description: 'Returns Open Graph metadata for link previews when sharing.',
          operationId: 'exportOg',
          responses: {
            200: {
              description: 'OG metadata',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, image: { type: 'string' }, url: { type: 'string' }, type: { type: 'string' } } },
                  example: { title: "What's Happening - 2025-01-31", description: 'Data-driven predictions', image: 'https://whatshappening.app/api/export/image?format=wide', url: 'https://whatshappening.app', type: 'website' },
                },
              },
            },
            500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
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
