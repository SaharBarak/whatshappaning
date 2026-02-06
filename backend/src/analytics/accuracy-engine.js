/**
 * Accuracy Calculation Engine - Advanced prediction accuracy analytics
 * Issue: #119 - Accuracy Calculation Engine
 *
 * Provides:
 * - Rolling accuracy windows (7, 30, 90 days)
 * - Streak analysis (winning/losing runs)
 * - Best/worst performing periods
 * - Calibration metrics with Brier scores
 * - Daily snapshot generation
 * - Category and tag-based analytics
 */

const db = require('../db');

/**
 * Calculate rolling accuracy for multiple windows
 * @param {string} outcomeId - Outcome identifier (null for all)
 * @param {Array<number>} windows - Array of day windows
 * @returns {Promise<Object>} Rolling accuracy for each window
 */
async function getRollingAccuracy(outcomeId = null, windows = [7, 30, 90]) {
  const results = {};

  for (const days of windows) {
    const outcomeFilter = outcomeId ? 'AND outcome_id = $1' : '';
    const params = outcomeId ? [outcomeId] : [];

    const result = await db.query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE
           (predicted_probability >= 0.5 AND actual_result = true) OR
           (predicted_probability < 0.5 AND actual_result = false)
         ) as correct,
         AVG(predicted_probability) as avg_predicted,
         AVG(CASE WHEN actual_result = true THEN 1.0 ELSE 0.0 END) as actual_rate,
         AVG(CASE
           WHEN actual_result = true THEN predicted_probability
           WHEN actual_result = false THEN 1 - predicted_probability
         END) as avg_confidence,
         AVG(POWER(
           predicted_probability - CASE WHEN actual_result = true THEN 1.0 ELSE 0.0 END,
           2
         )) as brier_score
       FROM prediction_archive
       WHERE date > NOW() - INTERVAL '${days} days'
         AND actual_result IS NOT NULL
         ${outcomeFilter}`,
      params
    );

    const row = result.rows[0];
    const total = parseInt(row.total, 10);
    const correct = parseInt(row.correct, 10);

    results[`${days}d`] = {
      days,
      total,
      correct,
      accuracy: total > 0 ? (correct / total * 100).toFixed(1) : null,
      avgPredicted: row.avg_predicted ? parseFloat(row.avg_predicted).toFixed(3) : null,
      actualRate: row.actual_rate ? parseFloat(row.actual_rate).toFixed(3) : null,
      avgConfidence: row.avg_confidence ? parseFloat(row.avg_confidence).toFixed(3) : null,
      brierScore: row.brier_score ? parseFloat(row.brier_score).toFixed(4) : null,
      calibrationError: row.avg_predicted && row.actual_rate
        ? Math.abs(parseFloat(row.avg_predicted) - parseFloat(row.actual_rate)).toFixed(3)
        : null
    };
  }

  return results;
}

/**
 * Analyze prediction streaks
 * @param {string} outcomeId - Outcome identifier
 * @param {number} days - Days to analyze
 * @returns {Promise<Object>} Streak analysis
 */
async function analyzeStreaks(outcomeId = null, days = 90) {
  const outcomeFilter = outcomeId ? 'AND outcome_id = $1' : '';
  const params = outcomeId ? [outcomeId] : [];

  // Get all predictions ordered by date
  const result = await db.query(
    `SELECT
       date,
       outcome_id,
       predicted_probability,
       actual_result,
       (predicted_probability >= 0.5 AND actual_result = true) OR
       (predicted_probability < 0.5 AND actual_result = false) as correct
     FROM prediction_archive
     WHERE date > NOW() - INTERVAL '${days} days'
       AND actual_result IS NOT NULL
       ${outcomeFilter}
     ORDER BY outcome_id, date`,
    params
  );

  const streaks = {
    current: {},
    longest: { win: null, loss: null },
    all: []
  };

  if (result.rows.length === 0) {
    return streaks;
  }

  // Group by outcome for per-outcome streaks
  const byOutcome = {};
  result.rows.forEach(row => {
    if (!byOutcome[row.outcome_id]) {
      byOutcome[row.outcome_id] = [];
    }
    byOutcome[row.outcome_id].push(row);
  });

  // Calculate streaks for each outcome
  Object.entries(byOutcome).forEach(([outcome, predictions]) => {
    let currentStreak = { type: null, length: 0, startDate: null };
    let longestWin = { length: 0, startDate: null, endDate: null };
    let longestLoss = { length: 0, startDate: null, endDate: null };

    predictions.forEach((pred, i) => {
      const isCorrect = pred.correct;
      const streakType = isCorrect ? 'win' : 'loss';

      if (currentStreak.type === streakType) {
        currentStreak.length++;
      } else {
        // End previous streak
        if (currentStreak.length > 0) {
          const endDate = predictions[i - 1]?.date;
          const streak = {
            outcome,
            type: currentStreak.type,
            length: currentStreak.length,
            startDate: currentStreak.startDate,
            endDate
          };
          streaks.all.push(streak);

          // Update longest
          if (currentStreak.type === 'win' && currentStreak.length > longestWin.length) {
            longestWin = { length: currentStreak.length, startDate: currentStreak.startDate, endDate };
          } else if (currentStreak.type === 'loss' && currentStreak.length > longestLoss.length) {
            longestLoss = { length: currentStreak.length, startDate: currentStreak.startDate, endDate };
          }
        }

        // Start new streak
        currentStreak = { type: streakType, length: 1, startDate: pred.date };
      }
    });

    // Record current streak
    streaks.current[outcome] = {
      type: currentStreak.type,
      length: currentStreak.length,
      startDate: currentStreak.startDate
    };

    // Update global longest
    if (!streaks.longest.win || longestWin.length > streaks.longest.win.length) {
      streaks.longest.win = { outcome, ...longestWin };
    }
    if (!streaks.longest.loss || longestLoss.length > streaks.longest.loss.length) {
      streaks.longest.loss = { outcome, ...longestLoss };
    }
  });

  return streaks;
}

/**
 * Find best and worst performing periods
 * @param {number} windowDays - Size of period window
 * @param {number} lookbackDays - Total days to analyze
 * @returns {Promise<Object>} Best and worst periods
 */
async function findBestWorstPeriods(windowDays = 7, lookbackDays = 90) {
  const result = await db.query(
    `WITH daily_accuracy AS (
       SELECT
         date,
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE
           (predicted_probability >= 0.5 AND actual_result = true) OR
           (predicted_probability < 0.5 AND actual_result = false)
         ) as correct
       FROM prediction_archive
       WHERE date > NOW() - INTERVAL '${lookbackDays} days'
         AND actual_result IS NOT NULL
       GROUP BY date
     ),
     rolling AS (
       SELECT
         date,
         SUM(total) OVER (ORDER BY date ROWS BETWEEN ${windowDays - 1} PRECEDING AND CURRENT ROW) as rolling_total,
         SUM(correct) OVER (ORDER BY date ROWS BETWEEN ${windowDays - 1} PRECEDING AND CURRENT ROW) as rolling_correct,
         ROW_NUMBER() OVER (ORDER BY date) as rn
       FROM daily_accuracy
     )
     SELECT
       date as period_end,
       date - INTERVAL '${windowDays - 1} days' as period_start,
       rolling_total,
       rolling_correct,
       CASE WHEN rolling_total > 0 THEN rolling_correct::float / rolling_total ELSE 0 END as accuracy
     FROM rolling
     WHERE rn >= ${windowDays}
     ORDER BY accuracy DESC`
  );

  if (result.rows.length === 0) {
    return { best: null, worst: null, all: [] };
  }

  const periods = result.rows.map(row => ({
    periodStart: row.period_start,
    periodEnd: row.period_end,
    total: parseInt(row.rolling_total, 10),
    correct: parseInt(row.rolling_correct, 10),
    accuracy: (parseFloat(row.accuracy) * 100).toFixed(1)
  }));

  return {
    windowDays,
    lookbackDays,
    best: periods[0],
    worst: periods[periods.length - 1],
    all: periods.slice(0, 10) // Top 10 periods
  };
}

/**
 * Get accuracy by category
 * @param {number} days - Days to analyze
 * @returns {Promise<Array>} Accuracy per category
 */
async function getAccuracyByCategory(days = 90) {
  const result = await db.query(
    `SELECT
       COALESCE(category, 'uncategorized') as category,
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE
         (predicted_probability >= 0.5 AND actual_result = true) OR
         (predicted_probability < 0.5 AND actual_result = false)
       ) as correct,
       AVG(predicted_probability) as avg_predicted,
       AVG(CASE WHEN actual_result = true THEN 1.0 ELSE 0.0 END) as actual_rate
     FROM prediction_archive
     WHERE date > NOW() - INTERVAL '${days} days'
       AND actual_result IS NOT NULL
     GROUP BY category
     ORDER BY total DESC`
  );

  return result.rows.map(row => ({
    category: row.category,
    total: parseInt(row.total, 10),
    correct: parseInt(row.correct, 10),
    accuracy: parseInt(row.total, 10) > 0
      ? (parseInt(row.correct, 10) / parseInt(row.total, 10) * 100).toFixed(1)
      : null,
    avgPredicted: row.avg_predicted ? parseFloat(row.avg_predicted).toFixed(3) : null,
    actualRate: row.actual_rate ? parseFloat(row.actual_rate).toFixed(3) : null
  }));
}

/**
 * Get accuracy by tag
 * @param {number} days - Days to analyze
 * @returns {Promise<Array>} Accuracy per tag
 */
async function getAccuracyByTag(days = 90) {
  const result = await db.query(
    `SELECT
       UNNEST(COALESCE(tags, ARRAY['untagged'])) as tag,
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE
         (predicted_probability >= 0.5 AND actual_result = true) OR
         (predicted_probability < 0.5 AND actual_result = false)
       ) as correct
     FROM prediction_archive
     WHERE date > NOW() - INTERVAL '${days} days'
       AND actual_result IS NOT NULL
     GROUP BY tag
     ORDER BY total DESC`
  );

  return result.rows.map(row => ({
    tag: row.tag,
    total: parseInt(row.total, 10),
    correct: parseInt(row.correct, 10),
    accuracy: parseInt(row.total, 10) > 0
      ? (parseInt(row.correct, 10) / parseInt(row.total, 10) * 100).toFixed(1)
      : null
  }));
}

/**
 * Calculate daily accuracy and save snapshot
 * @param {Date} date - Date to calculate
 * @returns {Promise<Object>} Generated snapshots
 */
async function generateDailySnapshot(date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  const periods = [7, 30, 90];
  const snapshots = [];

  // Get all unique outcomes
  const outcomesResult = await db.query(
    `SELECT DISTINCT outcome_id FROM prediction_archive WHERE actual_result IS NOT NULL`
  );
  const outcomes = [...outcomesResult.rows.map(r => r.outcome_id), null]; // null = overall

  for (const periodDays of periods) {
    for (const outcomeId of outcomes) {
      const outcomeFilter = outcomeId ? 'AND outcome_id = $1' : '';
      const params = outcomeId ? [outcomeId] : [];

      const result = await db.query(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE
             (predicted_probability >= 0.5 AND actual_result = true) OR
             (predicted_probability < 0.5 AND actual_result = false)
           ) as correct,
           AVG(predicted_probability) as avg_confidence,
           AVG(POWER(
             predicted_probability - CASE WHEN actual_result = true THEN 1.0 ELSE 0.0 END,
             2
           )) as brier_score,
           ABS(AVG(predicted_probability) - AVG(CASE WHEN actual_result = true THEN 1.0 ELSE 0.0 END)) as calibration_error
         FROM prediction_archive
         WHERE date > $${params.length + 1}::date - INTERVAL '${periodDays} days'
           AND date <= $${params.length + 1}::date
           AND actual_result IS NOT NULL
           ${outcomeFilter}`,
        [...params, dateStr]
      );

      const row = result.rows[0];
      const total = parseInt(row.total, 10);
      const correct = parseInt(row.correct, 10);

      if (total > 0) {
        // Upsert snapshot
        await db.query(
          `INSERT INTO accuracy_snapshots
             (snapshot_date, period_days, outcome_id, total_predictions, correct_predictions,
              accuracy, avg_confidence, calibration_error, brier_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (snapshot_date, period_days, outcome_id)
           DO UPDATE SET
             total_predictions = EXCLUDED.total_predictions,
             correct_predictions = EXCLUDED.correct_predictions,
             accuracy = EXCLUDED.accuracy,
             avg_confidence = EXCLUDED.avg_confidence,
             calibration_error = EXCLUDED.calibration_error,
             brier_score = EXCLUDED.brier_score`,
          [
            dateStr,
            periodDays,
            outcomeId,
            total,
            correct,
            total > 0 ? correct / total : null,
            row.avg_confidence ? parseFloat(row.avg_confidence) : null,
            row.calibration_error ? parseFloat(row.calibration_error) : null,
            row.brier_score ? parseFloat(row.brier_score) : null
          ]
        );

        snapshots.push({
          date: dateStr,
          periodDays,
          outcomeId,
          total,
          correct,
          accuracy: total > 0 ? (correct / total * 100).toFixed(1) : null
        });
      }
    }
  }

  return { date: dateStr, snapshots };
}

/**
 * Get accuracy trend from snapshots
 * @param {string} outcomeId - Outcome identifier (null for overall)
 * @param {number} periodDays - Period window (7, 30, 90)
 * @param {number} lookbackDays - Days to look back
 * @returns {Promise<Array>} Accuracy trend
 */
async function getAccuracyTrend(outcomeId = null, periodDays = 30, lookbackDays = 180) {
  const outcomeFilter = outcomeId ? 'AND outcome_id = $1' : 'AND outcome_id IS NULL';
  const params = outcomeId ? [outcomeId, periodDays, lookbackDays] : [periodDays, lookbackDays];

  const result = await db.query(
    `SELECT
       snapshot_date,
       total_predictions,
       correct_predictions,
       accuracy,
       avg_confidence,
       calibration_error,
       brier_score
     FROM accuracy_snapshots
     WHERE period_days = $${outcomeId ? 2 : 1}
       AND snapshot_date > NOW() - INTERVAL '${lookbackDays} days'
       ${outcomeFilter}
     ORDER BY snapshot_date`,
    params
  );

  return result.rows.map(row => ({
    date: row.snapshot_date,
    total: parseInt(row.total_predictions, 10),
    correct: parseInt(row.correct_predictions, 10),
    accuracy: row.accuracy ? (parseFloat(row.accuracy) * 100).toFixed(1) : null,
    avgConfidence: row.avg_confidence ? parseFloat(row.avg_confidence).toFixed(3) : null,
    calibrationError: row.calibration_error ? parseFloat(row.calibration_error).toFixed(3) : null,
    brierScore: row.brier_score ? parseFloat(row.brier_score).toFixed(4) : null
  }));
}

/**
 * Get hit rate by probability buckets (for calibration curve)
 * @param {number} days - Days to analyze
 * @param {number} buckets - Number of probability buckets
 * @returns {Promise<Array>} Hit rate per bucket
 */
async function getHitRateByProbability(days = 90, buckets = 10) {
  const bucketSize = 100 / buckets;
  const results = [];

  for (let i = 0; i < buckets; i++) {
    const lowerPct = i * bucketSize;
    const upperPct = (i + 1) * bucketSize;
    const lowerProb = lowerPct / 100;
    const upperProb = upperPct / 100;

    const result = await db.query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE actual_result = true) as hits,
         AVG(predicted_probability) as avg_predicted
       FROM prediction_archive
       WHERE date > NOW() - INTERVAL '${days} days'
         AND actual_result IS NOT NULL
         AND predicted_probability >= $1
         AND predicted_probability < $2`,
      [lowerProb, upperProb]
    );

    const row = result.rows[0];
    const total = parseInt(row.total, 10);
    const hits = parseInt(row.hits, 10);

    results.push({
      bucket: `${lowerPct.toFixed(0)}-${upperPct.toFixed(0)}%`,
      bucketMid: (lowerPct + upperPct) / 2,
      total,
      hits,
      hitRate: total > 0 ? (hits / total * 100).toFixed(1) : null,
      avgPredicted: row.avg_predicted ? (parseFloat(row.avg_predicted) * 100).toFixed(1) : null,
      // Perfect calibration would have hitRate = avgPredicted
      calibrationGap: row.avg_predicted && total > 0
        ? Math.abs((hits / total * 100) - (parseFloat(row.avg_predicted) * 100)).toFixed(1)
        : null
    });
  }

  return results;
}

/**
 * Get comprehensive accuracy dashboard data
 * @param {number} days - Primary lookback period
 * @returns {Promise<Object>} Complete dashboard data
 */
async function getDashboardData(days = 90) {
  const [
    rolling,
    streaks,
    bestWorst,
    byCategory,
    calibration,
    trend
  ] = await Promise.all([
    getRollingAccuracy(null, [7, 30, 90]),
    analyzeStreaks(null, days),
    findBestWorstPeriods(7, days),
    getAccuracyByCategory(days),
    getHitRateByProbability(days, 10),
    getAccuracyTrend(null, 30, 180)
  ]);

  return {
    generatedAt: new Date().toISOString(),
    period: { days },
    rolling,
    streaks: {
      current: streaks.current,
      longest: streaks.longest
    },
    bestWorstPeriods: bestWorst,
    byCategory,
    calibration,
    trend
  };
}

module.exports = {
  getRollingAccuracy,
  analyzeStreaks,
  findBestWorstPeriods,
  getAccuracyByCategory,
  getAccuracyByTag,
  generateDailySnapshot,
  getAccuracyTrend,
  getHitRateByProbability,
  getDashboardData
};
