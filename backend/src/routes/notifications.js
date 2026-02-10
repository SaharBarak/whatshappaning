/**
 * Notification Routes - Push notification subscription management
 *
 * Endpoints:
 * - GET    /api/notifications/vapid-key    - Get public VAPID key
 * - POST   /api/notifications/subscribe    - Subscribe to push notifications
 * - DELETE /api/notifications/unsubscribe  - Unsubscribe
 * - PATCH  /api/notifications/preferences  - Update notification preferences
 * - GET    /api/notifications/status        - Check subscription status
 */

const express = require('express');
const router = express.Router();
const push = require('../notifications/push');

/**
 * GET /api/notifications/vapid-key
 * Returns the public VAPID key for client-side subscription
 */
router.get('/vapid-key', (req, res) => {
  const publicKey = push.getPublicKey();
  if (!publicKey) {
    return res.status(503).json({
      error: 'Push notifications not configured',
      message: 'VAPID keys not set on server',
    });
  }
  res.json({ publicKey });
});

/**
 * POST /api/notifications/subscribe
 * Subscribe to push notifications
 *
 * Body: { subscription: PushSubscription, preferences?: object }
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, preferences } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'subscription object with endpoint is required',
      });
    }

    const result = await push.subscribe(subscription, preferences);

    res.status(201).json({
      success: true,
      message: 'Subscribed to push notifications',
      ...result,
    });
  } catch (err) {
    console.error('Error subscribing to push:', err);
    res.status(500).json({
      error: 'Failed to subscribe',
      message: err.message,
    });
  }
});

/**
 * DELETE /api/notifications/unsubscribe
 * Unsubscribe from push notifications
 *
 * Body: { endpoint: string }
 */
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'endpoint is required',
      });
    }

    const removed = await push.unsubscribe(endpoint);

    if (!removed) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Subscription not found',
      });
    }

    res.json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (err) {
    console.error('Error unsubscribing:', err);
    res.status(500).json({
      error: 'Failed to unsubscribe',
      message: err.message,
    });
  }
});

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences
 *
 * Body: {
 *   endpoint: string,
 *   preferences?: { patternAlerts?, predictionShifts?, dailySummary?, rareEvents? },
 *   quietHours?: { start: number, end: number } | null
 * }
 */
router.patch('/preferences', async (req, res) => {
  try {
    const { endpoint, preferences, quietHours } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'endpoint is required',
      });
    }

    let updatedPrefs = null;

    if (preferences) {
      updatedPrefs = await push.updatePreferences(endpoint, preferences);
    }

    if (quietHours !== undefined) {
      if (quietHours === null) {
        await push.updateQuietHours(endpoint, null, null);
      } else {
        await push.updateQuietHours(endpoint, quietHours.start, quietHours.end);
      }
    }

    res.json({
      success: true,
      preferences: updatedPrefs,
    });
  } catch (err) {
    if (err.message === 'Subscription not found') {
      return res.status(404).json({ error: 'Not found', message: err.message });
    }
    console.error('Error updating preferences:', err);
    res.status(500).json({
      error: 'Failed to update preferences',
      message: err.message,
    });
  }
});

/**
 * GET /api/notifications/status
 * Check if an endpoint is subscribed and get its preferences
 *
 * Query: endpoint=<subscription endpoint>
 */
router.get('/status', async (req, res) => {
  try {
    const { endpoint } = req.query;

    if (!endpoint) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'endpoint query parameter is required',
      });
    }

    const sub = await push.isSubscribed(endpoint);

    res.json({
      subscribed: !!sub,
      preferences: sub?.preferences || null,
    });
  } catch (err) {
    console.error('Error checking status:', err);
    res.status(500).json({
      error: 'Failed to check status',
      message: err.message,
    });
  }
});

module.exports = router;
