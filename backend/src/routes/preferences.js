/**
 * Preferences Routes - User Preferences & Feed Personalization (EPIC-019)
 *
 * Uses the same cookie-based anonymous identity as community features.
 * Preferences are stored per community_user and influence feed ranking.
 *
 * Endpoints:
 *   GET    /api/preferences          — Get current user's preferences
 *   PUT    /api/preferences          — Create or update preferences
 *   DELETE /api/preferences          — Reset preferences to defaults
 *   POST   /api/preferences/feed     — Get personalized feed ranking
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// Valid interest categories (maps to dashboard modules)
const VALID_INTERESTS = [
  'astrology', 'moon', 'numerology', 'tarot', 'iching',
  'markets', 'geophysical', 'solar', 'schumann', 'sentiment',
  'cosmic', 'gematria', 'parasha', 'tzolkin', 'dreamspell', 'news'
];

const VALID_TIME_PREFS = ['morning', 'afternoon', 'evening', 'night', 'all'];

/**
 * Middleware: get or create anonymous user (same pattern as community routes)
 */
async function getUserMiddleware(req, res, next) {
  try {
    const anonymousId = req.cookies?.wh_anon_id || req.headers['x-anonymous-id'];

    if (!anonymousId) {
      const crypto = require('crypto');
      const newId = crypto.randomBytes(16).toString('hex');
      res.cookie('wh_anon_id', newId, {
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        sameSite: 'lax',
      });

      const result = await db.query(
        `INSERT INTO community_users (anonymous_id) VALUES ($1) RETURNING id`,
        [newId]
      );
      req.userId = result.rows[0].id;
    } else {
      const result = await db.query(
        `INSERT INTO community_users (anonymous_id) VALUES ($1)
         ON CONFLICT (anonymous_id) DO UPDATE SET last_active_at = NOW()
         RETURNING id`,
        [anonymousId]
      );
      req.userId = result.rows[0].id;
    }
    next();
  } catch (err) {
    console.error('Preferences auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

router.use(getUserMiddleware);

/**
 * Validate preferences payload
 */
function validatePreferences(body) {
  const errors = [];

  if (body.interests !== undefined) {
    if (!Array.isArray(body.interests)) {
      errors.push('interests must be an array');
    } else {
      const invalid = body.interests.filter(i => !VALID_INTERESTS.includes(i));
      if (invalid.length) errors.push(`Invalid interests: ${invalid.join(', ')}`);
    }
  }

  if (body.locationRadius !== undefined) {
    const r = Number(body.locationRadius);
    if (isNaN(r) || r < 1 || r > 500) errors.push('locationRadius must be 1-500 km');
  }

  if (body.location !== undefined && body.location !== null) {
    if (typeof body.location !== 'object') {
      errors.push('location must be an object with lat, lng');
    } else {
      const { lat, lng } = body.location;
      if (typeof lat !== 'number' || lat < -90 || lat > 90) errors.push('Invalid latitude');
      if (typeof lng !== 'number' || lng < -180 || lng > 180) errors.push('Invalid longitude');
    }
  }

  if (body.preferredTimes !== undefined) {
    if (!Array.isArray(body.preferredTimes)) {
      errors.push('preferredTimes must be an array');
    } else {
      const invalid = body.preferredTimes.filter(t => !VALID_TIME_PREFS.includes(t));
      if (invalid.length) errors.push(`Invalid time preferences: ${invalid.join(', ')}`);
    }
  }

  if (body.notifications !== undefined) {
    if (typeof body.notifications !== 'object') {
      errors.push('notifications must be an object');
    }
  }

  return errors;
}

/**
 * GET /api/preferences — Get current user's preferences
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT interests, location_lat, location_lng, location_label,
              location_radius_km, preferred_times, notifications, updated_at
       FROM user_preferences WHERE user_id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ preferences: null, message: 'No preferences set' });
    }

    const row = result.rows[0];
    res.json({
      preferences: {
        interests: row.interests,
        location: row.location_lat != null ? {
          lat: parseFloat(row.location_lat),
          lng: parseFloat(row.location_lng),
          label: row.location_label,
        } : null,
        locationRadius: row.location_radius_km,
        preferredTimes: row.preferred_times,
        notifications: row.notifications,
      },
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error('Error fetching preferences:', err);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * PUT /api/preferences — Create or update preferences
 */
router.put('/', async (req, res) => {
  try {
    const errors = validatePreferences(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const {
      interests = [],
      location = null,
      locationLabel = null,
      locationRadius = 25,
      preferredTimes = ['all'],
      notifications = { patternAlerts: true, predictionShifts: false, dailySummary: false, rareEvents: true },
    } = req.body;

    const result = await db.query(
      `INSERT INTO user_preferences (user_id, interests, location_lat, location_lng, location_label,
         location_radius_km, preferred_times, notifications, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         interests = EXCLUDED.interests,
         location_lat = EXCLUDED.location_lat,
         location_lng = EXCLUDED.location_lng,
         location_label = EXCLUDED.location_label,
         location_radius_km = EXCLUDED.location_radius_km,
         preferred_times = EXCLUDED.preferred_times,
         notifications = EXCLUDED.notifications,
         updated_at = NOW()
       RETURNING *`,
      [
        req.userId,
        JSON.stringify(interests),
        location?.lat ?? null,
        location?.lng ?? null,
        locationLabel || location?.label || null,
        locationRadius,
        JSON.stringify(preferredTimes),
        JSON.stringify(notifications),
      ]
    );

    res.json({
      message: 'Preferences saved',
      preferences: {
        interests: result.rows[0].interests,
        location: result.rows[0].location_lat != null ? {
          lat: parseFloat(result.rows[0].location_lat),
          lng: parseFloat(result.rows[0].location_lng),
          label: result.rows[0].location_label,
        } : null,
        locationRadius: result.rows[0].location_radius_km,
        preferredTimes: result.rows[0].preferred_times,
        notifications: result.rows[0].notifications,
      },
      updatedAt: result.rows[0].updated_at,
    });
  } catch (err) {
    console.error('Error saving preferences:', err);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

/**
 * DELETE /api/preferences — Reset preferences
 */
router.delete('/', async (req, res) => {
  try {
    await db.query('DELETE FROM user_preferences WHERE user_id = $1', [req.userId]);
    res.json({ message: 'Preferences reset' });
  } catch (err) {
    console.error('Error resetting preferences:', err);
    res.status(500).json({ error: 'Failed to reset preferences' });
  }
});

/**
 * POST /api/preferences/feed — Get personalized module ranking
 *
 * Returns modules sorted by relevance based on user interests.
 * If no preferences set, returns default ordering.
 */
router.post('/feed', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT interests, preferred_times FROM user_preferences WHERE user_id = $1',
      [req.userId]
    );

    const allModules = [...VALID_INTERESTS];

    if (result.rows.length === 0 || !result.rows[0].interests?.length) {
      return res.json({ modules: allModules, personalized: false });
    }

    const interests = result.rows[0].interests;

    // Preferred interests first, then the rest in default order
    const preferred = interests.filter(i => allModules.includes(i));
    const rest = allModules.filter(i => !preferred.includes(i));

    res.json({
      modules: [...preferred, ...rest],
      personalized: true,
      preferredTimes: result.rows[0].preferred_times,
    });
  } catch (err) {
    console.error('Error generating personalized feed:', err);
    res.status(500).json({ error: 'Failed to generate feed' });
  }
});

module.exports = router;
