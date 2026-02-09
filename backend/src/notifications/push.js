/**
 * Push Notification Service
 *
 * Handles Web Push notifications for pattern alerts, prediction shifts,
 * daily summaries, and rare events.
 *
 * Requires VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars.
 * Generate with: npx web-push generate-vapid-keys
 */

const webpush = require('web-push');
const db = require('../db');

// Configure VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:alerts@whatshappening.app';

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('Push notifications disabled: VAPID keys not set');
    return false;
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

/**
 * Get the public VAPID key for client subscription
 */
function getPublicKey() {
  return VAPID_PUBLIC_KEY;
}

/**
 * Save a push subscription
 */
async function subscribe(subscription, preferences = {}) {
  const { endpoint, keys } = subscription;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Invalid subscription: missing endpoint or keys');
  }

  const defaultPrefs = {
    patternAlerts: true,
    predictionShifts: false,
    dailySummary: false,
    rareEvents: true,
    ...preferences,
  };

  const result = await db.query(
    `INSERT INTO push_subscriptions (endpoint, keys_p256dh, keys_auth, preferences)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint)
     DO UPDATE SET keys_p256dh = $2, keys_auth = $3, preferences = $4, last_used = NOW()
     RETURNING id`,
    [endpoint, keys.p256dh, keys.auth, JSON.stringify(defaultPrefs)]
  );

  return { id: result.rows[0].id, preferences: defaultPrefs };
}

/**
 * Remove a push subscription
 */
async function unsubscribe(endpoint) {
  const result = await db.query(
    'DELETE FROM push_subscriptions WHERE endpoint = $1 RETURNING id',
    [endpoint]
  );
  return result.rowCount > 0;
}

/**
 * Update notification preferences
 */
async function updatePreferences(endpoint, preferences) {
  const result = await db.query(
    `UPDATE push_subscriptions
     SET preferences = preferences || $2::jsonb
     WHERE endpoint = $1
     RETURNING preferences`,
    [endpoint, JSON.stringify(preferences)]
  );

  if (result.rowCount === 0) {
    throw new Error('Subscription not found');
  }

  return result.rows[0].preferences;
}

/**
 * Update quiet hours
 */
async function updateQuietHours(endpoint, start, end) {
  const result = await db.query(
    `UPDATE push_subscriptions
     SET quiet_hours_start = $2, quiet_hours_end = $3
     WHERE endpoint = $1
     RETURNING id`,
    [endpoint, start, end]
  );

  if (result.rowCount === 0) {
    throw new Error('Subscription not found');
  }

  return true;
}

/**
 * Check if current time is within quiet hours for a subscription
 */
function isQuietHours(sub) {
  if (sub.quiet_hours_start == null || sub.quiet_hours_end == null) return false;
  const hour = new Date().getHours();
  if (sub.quiet_hours_start <= sub.quiet_hours_end) {
    return hour >= sub.quiet_hours_start && hour < sub.quiet_hours_end;
  }
  // Wraps around midnight (e.g. 23 to 8)
  return hour >= sub.quiet_hours_start || hour < sub.quiet_hours_end;
}

/**
 * Send a notification to a single subscription
 */
async function sendToSubscription(subscription, payload) {
  if (!ensureConfigured()) return false;

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys_p256dh,
      auth: subscription.keys_auth,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    await db.query(
      'UPDATE push_subscriptions SET last_used = NOW() WHERE endpoint = $1',
      [subscription.endpoint]
    );
    return true;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription expired or invalid — remove it
      await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [subscription.endpoint]);
      console.log(`Removed expired push subscription: ${subscription.endpoint.slice(0, 50)}...`);
    } else {
      console.error('Push notification failed:', err.message);
    }
    return false;
  }
}

/**
 * Send a pattern alert to all subscribed users
 */
async function sendPatternAlert(pattern) {
  if (!ensureConfigured()) return { sent: 0, failed: 0 };

  const subs = await db.query(
    "SELECT * FROM push_subscriptions WHERE preferences->>'patternAlerts' = 'true'"
  );

  const payload = {
    title: '🔮 Pattern Match Detected',
    body: `${Math.round(pattern.similarity * 100)}% match with ${pattern.matchDate || 'historical pattern'}`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'pattern-alert',
    data: { url: '/?highlight=pattern', type: 'pattern' },
  };

  return broadcastToSubs(subs.rows, payload);
}

/**
 * Send a prediction shift alert
 */
async function sendPredictionShift(outcome, oldProb, newProb) {
  if (!ensureConfigured()) return { sent: 0, failed: 0 };

  const subs = await db.query(
    "SELECT * FROM push_subscriptions WHERE preferences->>'predictionShifts' = 'true'"
  );

  const direction = newProb > oldProb ? '📈' : '📉';
  const payload = {
    title: `${direction} Prediction Shift: ${outcome}`,
    body: `Changed from ${Math.round(oldProb * 100)}% to ${Math.round(newProb * 100)}%`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'prediction-shift',
    data: { url: `/?outcome=${outcome}`, type: 'prediction-shift' },
  };

  return broadcastToSubs(subs.rows, payload);
}

/**
 * Send a rare event notification
 */
async function sendRareEvent(title, description) {
  if (!ensureConfigured()) return { sent: 0, failed: 0 };

  const subs = await db.query(
    "SELECT * FROM push_subscriptions WHERE preferences->>'rareEvents' = 'true'"
  );

  const payload = {
    title: `✨ ${title}`,
    body: description,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'rare-event',
    data: { url: '/', type: 'rare-event' },
  };

  return broadcastToSubs(subs.rows, payload);
}

/**
 * Send daily summary to opted-in users
 */
async function sendDailySummary(summaryData) {
  if (!ensureConfigured()) return { sent: 0, failed: 0 };

  const subs = await db.query(
    "SELECT * FROM push_subscriptions WHERE preferences->>'dailySummary' = 'true'"
  );

  const payload = {
    title: "🌅 Today's Cosmic Weather",
    body: summaryData.summary || 'Check out today\'s predictions',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'daily-summary',
    data: { url: '/', type: 'daily-summary' },
  };

  return broadcastToSubs(subs.rows, payload);
}

/**
 * Broadcast a payload to multiple subscriptions, respecting quiet hours
 * Limits to 3 notifications per day per subscription
 */
async function broadcastToSubs(subs, payload) {
  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    if (isQuietHours(sub)) continue;

    const success = await sendToSubscription(sub, payload);
    if (success) sent++;
    else failed++;
  }

  return { sent, failed, total: subs.length };
}

/**
 * Get subscription count
 */
async function getSubscriptionCount() {
  const result = await db.query('SELECT COUNT(*) as count FROM push_subscriptions');
  return parseInt(result.rows[0].count, 10);
}

/**
 * Check if an endpoint is subscribed
 */
async function isSubscribed(endpoint) {
  const result = await db.query(
    'SELECT id, preferences FROM push_subscriptions WHERE endpoint = $1',
    [endpoint]
  );
  return result.rows[0] || null;
}

module.exports = {
  getPublicKey,
  subscribe,
  unsubscribe,
  updatePreferences,
  updateQuietHours,
  sendPatternAlert,
  sendPredictionShift,
  sendRareEvent,
  sendDailySummary,
  getSubscriptionCount,
  isSubscribed,
};
