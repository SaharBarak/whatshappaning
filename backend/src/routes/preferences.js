/**
 * Preferences Routes - User preferences for feed personalization
 *
 * No authentication — preferences are keyed by a client-generated ID
 * stored in localStorage. This matches the app's public-dashboard model.
 *
 * Endpoints:
 * - GET    /api/preferences/:clientId       — Get preferences
 * - PUT    /api/preferences/:clientId       — Create or update preferences
 * - DELETE /api/preferences/:clientId       — Delete preferences
 * - POST   /api/preferences/:clientId/feed  — Get personalized feed ranking
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// Valid interest categories
const VALID_CATEGORIES = [
  'astrology', 'moon', 'numerology', 'tarot', 'iching',
  'markets', 'geophysical', 'solar', 'schumann', 'sentiment',
  'cosmic', 'gematria', 'parasha', 'tzolkin', 'dreamspell', 'news'
];

// Valid time preferences
const VALID_TIME_PREFS = ['morning', 'afternoon', 'evening', 'night', 'all'];

// Client ID validation (alphanumeric + hyphens, 8-64 chars)
function isValidClientId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{8,64}$/.test(id);
}

/**
 * Validate preference payload
 */
function validatePreferences(body) {
  const errors = [];
  const prefs = {};

  // Interest categories
  if (body.categories !== undefined) {
    if (!Array.isArray(body.categories)) {
      errors.push('categories must be an array');
    } else {
      const invalid = body.categories.filter(c => !VALID_CATEGORIES.includes(c));
      if (invalid.length) errors.push(`Invalid categories: ${invalid.join(', ')}`);
      else prefs.categories = body.categories;
    }
  }

  // Location radius (km)
  if (body.locationRadius !== undefined) {
    const r = Number(body.locationRadius);
    if (isNaN(r) || r < 1 || r > 500) {
      errors.push('locationRadius must be between 1 and 500 km');
    } else {
      prefs.locationRadius = r;
    }
  }

  // Location coordinates
  if (body.location !== undefined) {
    if (!body.location || typeof body.location !== 'object') {
      errors.push('location must be an object with lat and lng');
    } else {
      const { lat, lng } = body.location;
      if (typeof lat !== 'number' || lat < -90 || lat > 90) errors.push('Invalid latitude');
      if (typeof lng !== 'number' || lng < -180 || lng > 180) errors.push('Invalid longitude');
      if (!errors.length) prefs.location = { lat, lng };
    }
  }

  // Preferred times
  if (body.preferredTimes !== undefined) {
    if (!Array.isArray(body.preferredTimes)) {
      errors.push('preferredTimes must be an array');
    } else {
      const invalid = body.preferredTimes.filter(t => !VALID_TIME_PREFS.includes(t));
      if (invalid.length) errors.push(`Invalid time preferences: ${invalid.join(', ')}`);
      else prefs.preferredTimes = body.preferredTimes;
    }
  }

  // Notification preferences (for future use with EPIC-005)
  if (body.notifications !== undefined) {
    if (typeof body.notifications !== 'object') {
      errors.push('notifications must be an object');
    } else {
      prefs.notifications = {
        patternAlerts: Boolean(body.notifications.patternAlerts),
        predictionShifts: Boolean(body.notifications.predictionShifts),
        dailySummary: Boolean(body.notifications.dailySummary),
        rareEvents: Boolean(body.notifications.rareEvents),
        quietHoursStart: body.notifications.quietHoursStart || null,
        quietHoursEnd: body.notifications.quietHoursEnd || null,
      };
    }
  }

  return { prefs, errors };
}

/**
 * GET /api/preferences/:clientId
 */
router.get('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!isValidClientId(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID format' });
    }

    const result = await db.query(
      'SELECT preferences, updated_at FROM user_preferences WHERE client_id = $1',
      [clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preferences not found' });
    }

    res.json({
      clientId,
      preferences: result.rows[0].preferences,
      updatedAt: result.rows[0].updated_at,
    });
  } catch (err) {
    console.error('Error fetching preferences:', err);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * PUT /api/preferences/:clientId
 */
router.put('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!isValidClientId(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID format' });
    }

    const { prefs, errors } = validatePreferences(req.body);
    if (errors.length) {
      return res.status(400).json({ errors });
    }

    const result = await db.query(
      `INSERT INTO user_preferences (client_id, preferences, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (client_id)
       DO UPDATE SET preferences = $2, updated_at = NOW()
       RETURNING preferences, updated_at`,
      [clientId, JSON.stringify(prefs)]
    );

    res.json({
      clientId,
      preferences: result.rows[0].preferences,
      updatedAt: result.rows[0].updated_at,
    });
  } catch (err) {
    console.error('Error saving preferences:', err);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

/**
 * DELETE /api/preferences/:clientId
 */
router.delete('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!isValidClientId(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID format' });
    }

    const result = await db.query(
      'DELETE FROM user_preferences WHERE client_id = $1',
      [clientId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Preferences not found' });
    }

    res.json({ message: 'Preferences deleted' });
  } catch (err) {
    console.error('Error deleting preferences:', err);
    res.status(500).json({ error: 'Failed to delete preferences' });
  }
});

/**
 * POST /api/preferences/:clientId/feed
 * Returns personalized feed ranking based on user preferences
 *
 * Takes the current module data and re-ranks it according to
 * the user's interest categories and other preferences.
 */
router.post('/:clientId/feed', async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!isValidClientId(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID format' });
    }

    // Get user preferences
    const prefResult = await db.query(
      'SELECT preferences FROM user_preferences WHERE client_id = $1',
      [clientId]
    );

    if (prefResult.rows.length === 0) {
      return res.status(404).json({ error: 'Preferences not found. Set preferences first.' });
    }

    const prefs = prefResult.rows[0].preferences;
    const categories = prefs.categories || VALID_CATEGORIES;

    // Get current module data
    const modules = {};
    for (const cat of VALID_CATEGORIES) {
      const snapshot = await db.getLatestSnapshot(cat);
      if (snapshot) {
        modules[cat] = {
          data: snapshot.data,
          collectedAt: snapshot.collected_at,
          // Boost score: preferred categories get higher ranking
          relevance: categories.includes(cat) ? 1.0 : 0.3,
          preferred: categories.includes(cat),
        };
      }
    }

    // Sort by relevance (preferred first), then by freshness
    const ranked = Object.entries(modules)
      .sort(([, a], [, b]) => {
        if (a.relevance !== b.relevance) return b.relevance - a.relevance;
        return new Date(b.collectedAt) - new Date(a.collectedAt);
      })
      .map(([name, mod]) => ({
        module: name,
        data: mod.data,
        collectedAt: mod.collectedAt,
        relevance: mod.relevance,
        preferred: mod.preferred,
      }));

    res.json({
      clientId,
      totalModules: ranked.length,
      preferredCount: ranked.filter(m => m.preferred).length,
      feed: ranked,
    });
  } catch (err) {
    console.error('Error generating personalized feed:', err);
    res.status(500).json({ error: 'Failed to generate feed' });
  }
});

module.exports = router;
