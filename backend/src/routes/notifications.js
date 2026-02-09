/**
 * Push Notification Routes
 *
 * Subscription management and VAPID public key endpoint.
 */

const express = require('express');
const router = express.Router();
const push = require('../notifications/push');

// GET /api/notifications/vapid-public-key
// Returns the VAPID public key for client-side subscription
router.get('/vapid-public-key', (req, res) => {
  if (!push.isConfigured()) {
    return res.status(503).json({ error: 'Push notifications not configured' });
  }
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/notifications/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    if (!push.isConfigured()) {
      return res.status(503).json({ error: 'Push notifications not configured' });
    }

    const { endpoint, keys } = req.body;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        error: 'Invalid subscription',
        required: ['endpoint', 'keys.p256dh', 'keys.auth'],
      });
    }

    const userAgent = req.headers['user-agent'] || null;
    const subscription = await push.saveSubscription(endpoint, keys, userAgent);

    res.status(201).json({
      message: 'Subscribed successfully',
      id: subscription.id,
      preferences: subscription.preferences,
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// DELETE /api/notifications/unsubscribe
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint is required' });
    }

    const removed = await push.removeSubscription(endpoint);
    if (!removed) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// PATCH /api/notifications/preferences
router.patch('/preferences', async (req, res) => {
  try {
    const { endpoint, preferences } = req.body;
    if (!endpoint || !preferences) {
      return res.status(400).json({ error: 'endpoint and preferences are required' });
    }

    // Validate preference keys
    const validKeys = ['pattern_alerts', 'prediction_shifts', 'daily_summary', 'quiet_hours'];
    const invalidKeys = Object.keys(preferences).filter(k => !validKeys.includes(k));
    if (invalidKeys.length > 0) {
      return res.status(400).json({
        error: 'Invalid preference keys',
        invalidKeys,
        validKeys,
      });
    }

    const result = await push.updatePreferences(endpoint, preferences);
    if (!result) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({
      message: 'Preferences updated',
      preferences: result.preferences,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// GET /api/notifications/status
router.get('/status', async (req, res) => {
  try {
    const { endpoint } = req.query;
    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint query parameter is required' });
    }

    const subscription = await push.getSubscriptionStatus(endpoint);
    if (!subscription) {
      return res.json({ subscribed: false });
    }

    res.json({
      subscribed: true,
      preferences: subscription.preferences,
      createdAt: subscription.created_at,
      lastUsed: subscription.last_used,
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

module.exports = router;
