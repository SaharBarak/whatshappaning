/**
 * Community Service
 * 
 * Handles anonymous user management, comments, reactions,
 * community predictions, and leaderboards.
 */

const crypto = require('crypto');
const db = require('../db');

// Allowed reaction emojis
const ALLOWED_EMOJIS = ['👍', '👎', '🎯', '🔥', '🤔', '😮', '💎', '🚀'];

/**
 * Get or create anonymous user from cookie/fingerprint
 */
async function getOrCreateUser(anonymousId) {
  if (!anonymousId) {
    throw new Error('Anonymous ID required');
  }

  // Hash the anonymous ID for storage
  const hashedId = crypto.createHash('sha256').update(anonymousId).digest('hex');

  // Try to get existing user
  let result = await db.query(
    'SELECT id, display_name, avatar_seed, created_at FROM community_users WHERE anonymous_id = $1',
    [hashedId]
  );

  if (result.rows.length > 0) {
    // Update last active
    await db.query('UPDATE community_users SET last_active_at = NOW() WHERE id = $1', [result.rows[0].id]);
    return result.rows[0];
  }

  // Create new user with random avatar seed
  const avatarSeed = crypto.randomBytes(8).toString('hex');
  result = await db.query(
    `INSERT INTO community_users (anonymous_id, avatar_seed)
     VALUES ($1, $2)
     RETURNING id, display_name, avatar_seed, created_at`,
    [hashedId, avatarSeed]
  );

  return result.rows[0];
}

/**
 * Update user display name
 */
async function updateDisplayName(userId, displayName) {
  if (!displayName || displayName.length > 30) {
    throw new Error('Display name must be 1-30 characters');
  }

  // Basic sanitization
  const sanitized = displayName.trim().replace(/[<>]/g, '');

  await db.query(
    'UPDATE community_users SET display_name = $1 WHERE id = $2',
    [sanitized, userId]
  );

  return { success: true, displayName: sanitized };
}

// ============ COMMENTS ============

/**
 * Add a comment to a prediction
 */
async function addComment(userId, outcomeId, content) {
  if (!content || content.length > 500) {
    throw new Error('Comment must be 1-500 characters');
  }

  const sanitized = content.trim().replace(/[<>]/g, '');

  const result = await db.query(
    `INSERT INTO prediction_comments (user_id, outcome_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, content, created_at`,
    [userId, outcomeId, sanitized]
  );

  return result.rows[0];
}

/**
 * Get comments for a prediction
 */
async function getComments(outcomeId, limit = 50, offset = 0) {
  const result = await db.query(
    `SELECT c.id, c.content, c.created_at,
            u.id as user_id, u.display_name, u.avatar_seed
     FROM prediction_comments c
     LEFT JOIN community_users u ON c.user_id = u.id
     WHERE c.outcome_id = $1 AND c.is_deleted = false
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [outcomeId, limit, offset]
  );

  const countResult = await db.query(
    'SELECT COUNT(*) FROM prediction_comments WHERE outcome_id = $1 AND is_deleted = false',
    [outcomeId]
  );

  return {
    comments: result.rows,
    total: parseInt(countResult.rows[0].count)
  };
}

/**
 * Delete a comment (soft delete)
 */
async function deleteComment(userId, commentId) {
  const result = await db.query(
    `UPDATE prediction_comments
     SET is_deleted = true, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [commentId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Comment not found or unauthorized');
  }

  return { success: true };
}

// ============ REACTIONS ============

/**
 * Add or remove a reaction
 */
async function toggleReaction(userId, outcomeId, emoji) {
  if (!ALLOWED_EMOJIS.includes(emoji)) {
    throw new Error(`Invalid emoji. Allowed: ${ALLOWED_EMOJIS.join(' ')}`);
  }

  // Check if reaction exists
  const existing = await db.query(
    'SELECT id FROM prediction_reactions WHERE user_id = $1 AND outcome_id = $2 AND emoji = $3',
    [userId, outcomeId, emoji]
  );

  if (existing.rows.length > 0) {
    // Remove reaction
    await db.query('DELETE FROM prediction_reactions WHERE id = $1', [existing.rows[0].id]);
    return { action: 'removed', emoji };
  } else {
    // Add reaction
    await db.query(
      'INSERT INTO prediction_reactions (user_id, outcome_id, emoji) VALUES ($1, $2, $3)',
      [userId, outcomeId, emoji]
    );
    return { action: 'added', emoji };
  }
}

/**
 * Get reaction counts for a prediction
 */
async function getReactions(outcomeId, userId = null) {
  const result = await db.query(
    `SELECT emoji, COUNT(*) as count
     FROM prediction_reactions
     WHERE outcome_id = $1
     GROUP BY emoji`,
    [outcomeId]
  );

  const counts = {};
  for (const row of result.rows) {
    counts[row.emoji] = parseInt(row.count);
  }

  // Get user's reactions if userId provided
  let userReactions = [];
  if (userId) {
    const userResult = await db.query(
      'SELECT emoji FROM prediction_reactions WHERE outcome_id = $1 AND user_id = $2',
      [outcomeId, userId]
    );
    userReactions = userResult.rows.map(r => r.emoji);
  }

  return { counts, userReactions, allowedEmojis: ALLOWED_EMOJIS };
}

// ============ COMMUNITY PREDICTIONS ============

/**
 * Create a community prediction
 */
async function createPrediction(userId, data) {
  const { title, description, predictionType, targetDate, options } = data;

  if (!title || title.length > 200) {
    throw new Error('Title must be 1-200 characters');
  }

  if (!['binary', 'numeric', 'category'].includes(predictionType)) {
    throw new Error('Invalid prediction type');
  }

  const result = await db.query(
    `INSERT INTO community_predictions (user_id, title, description, prediction_type, target_date, options)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, prediction_type, target_date, created_at`,
    [userId, title.trim(), description?.trim(), predictionType, targetDate, JSON.stringify(options || null)]
  );

  return result.rows[0];
}

/**
 * Get community predictions
 */
async function getPredictions(status = 'open', limit = 20, offset = 0) {
  const result = await db.query(
    `SELECT cp.*, u.display_name, u.avatar_seed,
            COUNT(cv.id) as vote_count
     FROM community_predictions cp
     LEFT JOIN community_users u ON cp.user_id = u.id
     LEFT JOIN community_votes cv ON cp.id = cv.prediction_id
     WHERE cp.status = $1
     GROUP BY cp.id, u.display_name, u.avatar_seed
     ORDER BY cp.created_at DESC
     LIMIT $2 OFFSET $3`,
    [status, limit, offset]
  );

  return result.rows;
}

/**
 * Vote on a community prediction
 */
async function vote(userId, predictionId, voteValue, confidence = 50) {
  // Check prediction exists and is open
  const pred = await db.query(
    'SELECT status FROM community_predictions WHERE id = $1',
    [predictionId]
  );

  if (pred.rows.length === 0) {
    throw new Error('Prediction not found');
  }

  if (pred.rows[0].status !== 'open') {
    throw new Error('Prediction is closed for voting');
  }

  // Upsert vote
  const result = await db.query(
    `INSERT INTO community_votes (prediction_id, user_id, vote, confidence)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (prediction_id, user_id)
     DO UPDATE SET vote = $3, confidence = $4
     RETURNING id, vote, confidence`,
    [predictionId, userId, voteValue, Math.max(0, Math.min(100, confidence))]
  );

  return result.rows[0];
}

/**
 * Get vote distribution for a prediction
 */
async function getVotes(predictionId) {
  const result = await db.query(
    `SELECT vote, COUNT(*) as count, AVG(confidence) as avg_confidence
     FROM community_votes
     WHERE prediction_id = $1
     GROUP BY vote`,
    [predictionId]
  );

  return result.rows;
}

// ============ LEADERBOARD ============

/**
 * Get leaderboard
 */
async function getLeaderboard(limit = 50) {
  const result = await db.query(
    `SELECT ua.*, cu.display_name, cu.avatar_seed
     FROM user_accuracy ua
     JOIN community_users cu ON ua.user_id = cu.id
     WHERE ua.total_predictions >= 5
     ORDER BY ua.accuracy_score DESC, ua.total_predictions DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row, index) => ({
    rank: index + 1,
    ...row
  }));
}

/**
 * Update user accuracy after a prediction resolves
 */
async function updateAccuracy(userId, wasCorrect) {
  await db.query(
    `INSERT INTO user_accuracy (user_id, total_predictions, correct_predictions, accuracy_score, streak_current)
     VALUES ($1, 1, $2, $2, $3)
     ON CONFLICT (user_id)
     DO UPDATE SET
       total_predictions = user_accuracy.total_predictions + 1,
       correct_predictions = user_accuracy.correct_predictions + $2,
       accuracy_score = (user_accuracy.correct_predictions + $2)::decimal / (user_accuracy.total_predictions + 1),
       streak_current = CASE WHEN $4 THEN user_accuracy.streak_current + 1 ELSE 0 END,
       streak_best = GREATEST(user_accuracy.streak_best, CASE WHEN $4 THEN user_accuracy.streak_current + 1 ELSE 0 END),
       last_updated = NOW()`,
    [userId, wasCorrect ? 1 : 0, wasCorrect ? 1 : 0, wasCorrect]
  );
}

module.exports = {
  ALLOWED_EMOJIS,
  getOrCreateUser,
  updateDisplayName,
  addComment,
  getComments,
  deleteComment,
  toggleReaction,
  getReactions,
  createPrediction,
  getPredictions,
  vote,
  getVotes,
  getLeaderboard,
  updateAccuracy
};
