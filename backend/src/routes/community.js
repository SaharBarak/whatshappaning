/**
 * Community Routes
 * 
 * Endpoints for comments, reactions, community predictions, and leaderboards.
 * Uses cookie-based anonymous identity.
 */

const express = require('express');
const router = express.Router();
const community = require('../community');

// Valid outcome IDs
const VALID_OUTCOMES = [
  'spx_direction', 'spx_volatile', 'btc_direction', 'btc_volatile',
  'vix_spike', 'gold_direction', 'major_quake', 'quake_above_avg',
  'geomag_storm', 'sentiment_drop', 'fear_spike'
];

/**
 * Middleware to get/create anonymous user from cookie
 */
async function getUserMiddleware(req, res, next) {
  try {
    // Get anonymous ID from cookie or header
    const anonymousId = req.cookies?.wh_anon_id || req.headers['x-anonymous-id'];

    if (!anonymousId) {
      // Generate new ID and set cookie
      const crypto = require('crypto');
      const newId = crypto.randomBytes(16).toString('hex');
      res.cookie('wh_anon_id', newId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
      });
      req.user = await community.getOrCreateUser(newId);
    } else {
      req.user = await community.getOrCreateUser(anonymousId);
    }

    next();
  } catch (err) {
    console.error('User middleware error:', err);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
}

// Apply user middleware to all routes
router.use(getUserMiddleware);

// ============ USER ============

/**
 * GET /api/community/me
 * Get current user info
 */
router.get('/me', (req, res) => {
  res.json({
    id: req.user.id,
    displayName: req.user.display_name,
    avatarSeed: req.user.avatar_seed,
    createdAt: req.user.created_at
  });
});

/**
 * PATCH /api/community/me
 * Update display name
 */
router.patch('/me', async (req, res) => {
  try {
    const { displayName } = req.body;
    const result = await community.updateDisplayName(req.user.id, displayName);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============ COMMENTS ============

/**
 * GET /api/community/comments/:outcomeId
 * Get comments for a prediction
 */
router.get('/comments/:outcomeId', async (req, res) => {
  try {
    const { outcomeId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    if (!VALID_OUTCOMES.includes(outcomeId)) {
      return res.status(400).json({ error: 'Invalid outcome ID' });
    }

    const result = await community.getComments(outcomeId, limit, offset);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/community/comments/:outcomeId
 * Add a comment
 */
router.post('/comments/:outcomeId', async (req, res) => {
  try {
    const { outcomeId } = req.params;
    const { content } = req.body;

    if (!VALID_OUTCOMES.includes(outcomeId)) {
      return res.status(400).json({ error: 'Invalid outcome ID' });
    }

    const comment = await community.addComment(req.user.id, outcomeId, content);
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/community/comments/:commentId
 * Delete a comment
 */
router.delete('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    await community.deleteComment(req.user.id, parseInt(commentId));
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============ REACTIONS ============

/**
 * GET /api/community/reactions/:outcomeId
 * Get reactions for a prediction
 */
router.get('/reactions/:outcomeId', async (req, res) => {
  try {
    const { outcomeId } = req.params;

    if (!VALID_OUTCOMES.includes(outcomeId)) {
      return res.status(400).json({ error: 'Invalid outcome ID' });
    }

    const result = await community.getReactions(outcomeId, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/community/reactions/:outcomeId
 * Toggle a reaction
 */
router.post('/reactions/:outcomeId', async (req, res) => {
  try {
    const { outcomeId } = req.params;
    const { emoji } = req.body;

    if (!VALID_OUTCOMES.includes(outcomeId)) {
      return res.status(400).json({ error: 'Invalid outcome ID' });
    }

    const result = await community.toggleReaction(req.user.id, outcomeId, emoji);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============ COMMUNITY PREDICTIONS ============

/**
 * GET /api/community/predictions
 * Get community predictions
 */
router.get('/predictions', async (req, res) => {
  try {
    const status = ['open', 'closed', 'resolved'].includes(req.query.status) ? req.query.status : 'open';
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = parseInt(req.query.offset) || 0;

    const predictions = await community.getPredictions(status, limit, offset);
    res.json({ predictions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/community/predictions
 * Create a community prediction
 */
router.post('/predictions', async (req, res) => {
  try {
    const prediction = await community.createPrediction(req.user.id, req.body);
    res.status(201).json(prediction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/community/predictions/:id/votes
 * Get votes for a prediction
 */
router.get('/predictions/:id/votes', async (req, res) => {
  try {
    const votes = await community.getVotes(parseInt(req.params.id));
    res.json({ votes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/community/predictions/:id/vote
 * Vote on a prediction
 */
router.post('/predictions/:id/vote', async (req, res) => {
  try {
    const { vote, confidence } = req.body;
    const result = await community.vote(req.user.id, parseInt(req.params.id), vote, confidence);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============ LEADERBOARD ============

/**
 * GET /api/community/leaderboard
 * Get accuracy leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const leaderboard = await community.getLeaderboard(limit);
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/community/emojis
 * Get allowed reaction emojis
 */
router.get('/emojis', (req, res) => {
  res.json({ emojis: community.ALLOWED_EMOJIS });
});

module.exports = router;
