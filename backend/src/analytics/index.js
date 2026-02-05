/**
 * Analytics Module - Prediction Accuracy Tracking
 *
 * Provides:
 * - Archive predictions with outcomes
 * - Calculate accuracy metrics
 * - Generate accuracy reports by outcome, confidence level, and time
 */

const db = require('../db');

// Confidence level thresholds (matches prediction module)
const CONFIDENCE_THRESHOLDS = {
  VERY_HIGH: { minSample: 200, maxCI: 0.15, maxPValue: 0.001 },
  HIGH: { minSample: 100, maxCI: 0.20, maxPValue: 0.01 },
  MEDIUM: { minSample: 50, maxCI: 0.30, maxPValue: 0.05 },
  LOW: { minSample: 30, maxCI: 0.40, maxPValue: 0.10 }
};

/**
 * Archive a prediction for later accuracy tracking
 * @param {Date} date - Prediction date
 * @param {string} outcomeId - Outcome identifier
 * @param {number} predictedProbability - Predicted probability (0-1)
 * @param {string} confidenceLevel - Confidence level
 * @returns {Promise<Object>} Archived prediction
 */
async function archivePrediction(date, outcomeId, predictedProbability, confidenceLevel) {
  const dateStr = date.toISOString().split('T')[0];

  const result = await db.query(
    `INSERT INTO prediction_archive (date, outcome_id, predicted_probability, confidence_level)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (date, outcome_id) DO UPDATE SET
       predicted_probability = EXCLUDED.predicted_probability,
       confidence_level = EXCLUDED.confidence_level
     RETURNING *`,
    [dateStr, outcomeId, predictedProbability, confidenceLevel]
  );

  return result.rows[0];
}

/**
 * Record actual outcome for a prediction
 * @param {Date} date - Prediction date
 * @param {string} outcomeId - Outcome identifier
 * @param {boolean} actualResult - Whether the outcome occurred
 * @returns {Promise<Object>} Updated prediction
 */
async function recordOutcome(date, outcomeId, actualResult) {
  const dateStr = date.toISOString().split('T')[0];

  const result = await db.query(
    `UPDATE prediction_archive
     SET actual_result = $3, verified_at = NOW()
     WHERE date = $1 AND outcome_id = $2
     RETURNING *`,
    [dateStr, outcomeId, actualResult]
  );

  return result.rows[0];
}

/**
 * Get accuracy metrics for a specific outcome
 * @param {string} outcomeId - Outcome identifier
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Accuracy metrics
 */
async function getOutcomeAccuracy(outcomeId, days = 90) {
  const result = await db.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE actual_result IS NOT NULL) as verified,
       COUNT(*) FILTER (WHERE
         (predicted_probability >= 0.5 AND actual_result = true) OR
         (predicted_probability < 0.5 AND actual_result = false)
       ) as correct,
       AVG(CASE
         WHEN actual_result = true THEN predicted_probability
         WHEN actual_result = false THEN 1 - predicted_probability
       END) as brier_skill,
       AVG(predicted_probability) as avg_predicted,
       AVG(CASE WHEN actual_result = true THEN 1 ELSE 0 END) as actual_rate
     FROM prediction_archive
     WHERE outcome_id = $1
       AND date > NOW() - INTERVAL '${days} days'
       AND actual_result IS NOT NULL`,
    [outcomeId]
  );

  const row = result.rows[0];
  const verified = parseInt(row.verified, 10);
  const correct = parseInt(row.correct, 10);

  return {
    outcomeId,
    days,
    totalPredictions: parseInt(row.total, 10),
    verifiedPredictions: verified,
    correctPredictions: correct,
    accuracy: verified > 0 ? correct / verified : null,
    brierSkill: row.brier_skill ? parseFloat(row.brier_skill) : null,
    avgPredicted: row.avg_predicted ? parseFloat(row.avg_predicted) : null,
    actualRate: row.actual_rate ? parseFloat(row.actual_rate) : null,
    calibrationError: row.avg_predicted && row.actual_rate
      ? Math.abs(parseFloat(row.avg_predicted) - parseFloat(row.actual_rate))
      : null
  };
}

/**
 * Get accuracy by confidence level
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Accuracy by confidence level
 */
async function getAccuracyByConfidence(days = 90) {
  const result = await db.query(
    `SELECT
       confidence_level,
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE
         (predicted_probability >= 0.5 AND actual_result = true) OR
         (predicted_probability < 0.5 AND actual_result = false)
       ) as correct,
       AVG(CASE
         WHEN actual_result = true THEN predicted_probability
         WHEN actual_result = false THEN 1 - predicted_probability
       END) as avg_confidence
     FROM prediction_archive
     WHERE date > NOW() - INTERVAL '${days} days'
       AND actual_result IS NOT NULL
       AND confidence_level IS NOT NULL
     GROUP BY confidence_level
     ORDER BY
       CASE confidence_level
         WHEN 'Very High' THEN 1
         WHEN 'High' THEN 2
         WHEN 'Medium' THEN 3
         WHEN 'Low' THEN 4
         ELSE 5
       END`
  );

  return result.rows.map(row => ({
    confidenceLevel: row.confidence_level,
    total: parseInt(row.total, 10),
    correct: parseInt(row.correct, 10),
    accuracy: parseInt(row.total, 10) > 0
      ? parseInt(row.correct, 10) / parseInt(row.total, 10)
      : null,
    avgConfidence: row.avg_confidence ? parseFloat(row.avg_confidence) : null
  }));
}

/**
 * Get accuracy over time (for trend analysis)
 * @param {number} days - Number of days to analyze
 * @param {string} interval - Grouping interval ('day', 'week', 'month')
 * @returns {Promise<Array>} Accuracy over time
 */
async function getAccuracyOverTime(days = 90, interval = 'week') {
  let dateFormat;
  let intervalSql;

  switch (interval) {
    case 'day':
      dateFormat = 'YYYY-MM-DD';
      intervalSql = "date_trunc('day', date)";
      break;
    case 'month':
      dateFormat = 'YYYY-MM';
      intervalSql = "date_trunc('month', date)";
      break;
    case 'week':
    default:
      dateFormat = 'YYYY-"W"IW';
      intervalSql = "date_trunc('week', date)";
      break;
  }

  const result = await db.query(
    `SELECT
       ${intervalSql} as period,
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE
         (predicted_probability >= 0.5 AND actual_result = true) OR
         (predicted_probability < 0.5 AND actual_result = false)
       ) as correct
     FROM prediction_archive
     WHERE date > NOW() - INTERVAL '${days} days'
       AND actual_result IS NOT NULL
     GROUP BY ${intervalSql}
     ORDER BY ${intervalSql}`
  );

  return result.rows.map(row => ({
    period: row.period,
    total: parseInt(row.total, 10),
    correct: parseInt(row.correct, 10),
    accuracy: parseInt(row.total, 10) > 0
      ? parseInt(row.correct, 10) / parseInt(row.total, 10)
      : null
  }));
}

/**
 * Get overall accuracy summary
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Overall accuracy summary
 */
async function getOverallAccuracy(days = 90) {
  // Get per-outcome accuracy
  const outcomeResult = await db.query(
    `SELECT
       outcome_id,
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE
         (predicted_probability >= 0.5 AND actual_result = true) OR
         (predicted_probability < 0.5 AND actual_result = false)
       ) as correct
     FROM prediction_archive
     WHERE date > NOW() - INTERVAL '${days} days'
       AND actual_result IS NOT NULL
     GROUP BY outcome_id
     ORDER BY outcome_id`
  );

  // Get overall stats
  const overallResult = await db.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE
         (predicted_probability >= 0.5 AND actual_result = true) OR
         (predicted_probability < 0.5 AND actual_result = false)
       ) as correct,
       COUNT(DISTINCT date) as days_tracked,
       MIN(date) as first_date,
       MAX(date) as last_date
     FROM prediction_archive
     WHERE date > NOW() - INTERVAL '${days} days'
       AND actual_result IS NOT NULL`
  );

  const overall = overallResult.rows[0];
  const totalVerified = parseInt(overall.total, 10);
  const totalCorrect = parseInt(overall.correct, 10);

  return {
    period: {
      days,
      firstDate: overall.first_date,
      lastDate: overall.last_date,
      daysTracked: parseInt(overall.days_tracked, 10)
    },
    overall: {
      totalPredictions: totalVerified,
      correctPredictions: totalCorrect,
      accuracy: totalVerified > 0 ? totalCorrect / totalVerified : null
    },
    byOutcome: outcomeResult.rows.map(row => ({
      outcomeId: row.outcome_id,
      total: parseInt(row.total, 10),
      correct: parseInt(row.correct, 10),
      accuracy: parseInt(row.total, 10) > 0
        ? parseInt(row.correct, 10) / parseInt(row.total, 10)
        : null
    }))
  };
}

/**
 * Get calibration data for reliability diagram
 * @param {number} days - Number of days to analyze
 * @param {number} bins - Number of probability bins
 * @returns {Promise<Array>} Calibration data
 */
async function getCalibrationData(days = 90, bins = 10) {
  const binSize = 1 / bins;
  const calibrationData = [];

  for (let i = 0; i < bins; i++) {
    const lowerBound = i * binSize;
    const upperBound = (i + 1) * binSize;

    const result = await db.query(
      `SELECT
         COUNT(*) as total,
         AVG(predicted_probability) as avg_predicted,
         AVG(CASE WHEN actual_result = true THEN 1.0 ELSE 0.0 END) as actual_rate
       FROM prediction_archive
       WHERE date > NOW() - INTERVAL '${days} days'
         AND actual_result IS NOT NULL
         AND predicted_probability >= $1
         AND predicted_probability < $2`,
      [lowerBound, upperBound]
    );

    const row = result.rows[0];
    calibrationData.push({
      binRange: `${(lowerBound * 100).toFixed(0)}-${(upperBound * 100).toFixed(0)}%`,
      binCenter: (lowerBound + upperBound) / 2,
      count: parseInt(row.total, 10),
      avgPredicted: row.avg_predicted ? parseFloat(row.avg_predicted) : null,
      actualRate: row.actual_rate ? parseFloat(row.actual_rate) : null
    });
  }

  return calibrationData;
}

/**
 * Get feature contribution analysis
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Array>} Feature contribution rankings
 */
async function getFeatureContributions(days = 90) {
  // Get correlations with their accuracy when present vs absent
  const result = await db.query(
    `SELECT
       cr.features,
       cr.outcome,
       cr.lift,
       cr.sample_size,
       cr.p_value
     FROM correlation_results cr
     WHERE cr.is_significant = true
       AND cr.sample_size >= 50
       AND cr.lift >= 1.1
     ORDER BY cr.lift DESC
     LIMIT 50`
  );

  return result.rows.map(row => ({
    features: row.features,
    outcome: row.outcome,
    lift: parseFloat(row.lift),
    sampleSize: parseInt(row.sample_size, 10),
    pValue: parseFloat(row.p_value)
  }));
}

/**
 * Get prediction history (archived predictions with outcomes)
 * @param {number} limit - Maximum records to return
 * @param {number} offset - Records to skip
 * @returns {Promise<Object>} Prediction history
 */
async function getPredictionHistory(limit = 100, offset = 0) {
  const countResult = await db.query(
    `SELECT COUNT(*) FROM prediction_archive WHERE actual_result IS NOT NULL`
  );

  const result = await db.query(
    `SELECT *
     FROM prediction_archive
     WHERE actual_result IS NOT NULL
     ORDER BY date DESC, outcome_id
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    total: parseInt(countResult.rows[0].count, 10),
    limit,
    offset,
    predictions: result.rows.map(row => ({
      date: row.date,
      outcomeId: row.outcome_id,
      predictedProbability: parseFloat(row.predicted_probability),
      confidenceLevel: row.confidence_level,
      actualResult: row.actual_result,
      verifiedAt: row.verified_at,
      correct: (row.predicted_probability >= 0.5 && row.actual_result) ||
               (row.predicted_probability < 0.5 && !row.actual_result)
    }))
  };
}

/**
 * Generate comprehensive analytics report
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Complete analytics report
 */
async function generateAnalyticsReport(days = 90) {
  const [
    overall,
    byConfidence,
    overTime,
    calibration,
    features
  ] = await Promise.all([
    getOverallAccuracy(days),
    getAccuracyByConfidence(days),
    getAccuracyOverTime(days, 'week'),
    getCalibrationData(days, 10),
    getFeatureContributions(days)
  ]);

  return {
    generatedAt: new Date().toISOString(),
    period: overall.period,
    summary: overall.overall,
    byOutcome: overall.byOutcome,
    byConfidence,
    overTime,
    calibration,
    topFeatures: features.slice(0, 20)
  };
}

module.exports = {
  archivePrediction,
  recordOutcome,
  getOutcomeAccuracy,
  getAccuracyByConfidence,
  getAccuracyOverTime,
  getOverallAccuracy,
  getCalibrationData,
  getFeatureContributions,
  getPredictionHistory,
  generateAnalyticsReport
};
