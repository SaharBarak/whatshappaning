/**
 * Push Notification Service
 *
 * Handles sending web push notifications to subscribed clients.
 * Supports pattern alerts, prediction shifts, and daily summaries.
 */

const webpush = require('web-push');
const db = require('../db');
const config = require('../config');

// Configure VAPID details if keys are available
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:alerts@whatshappening.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('Web push configured with VAPID keys');
} else {
  console.warn('VAPID keys not configured — push notifications disabled');
}

/**
 * Check if push is configured
 */
function isConfigured() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

// --- Subscription Management ---

async function saveSubscription(endpoint, keys, userAgent = null) {
  const result = await db.query(
    `INSERT INTO push_subscriptions (endpoint, keys_p256dh, keys_auth, user_agent)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET
       keys_p256dh = EXCLUDED.keys_p256dh,
       keys_auth = EXCLUDED.keys_auth,
       user_agent = EXCLUDED.user_agent
     RETURNING id, preferences, created_at`,
    [endpoint, keys.p256dh, keys.auth, userAgent]
  );
  return result.rows[0];
}

async function removeSubscription(endpoint) {
  const result = await db.query(
    'DELETE FROM push_subscriptions WHERE endpoint = $1 RETURNING id',
    [endpoint]
  );
  return result.rowCount > 0;
}

async function updatePreferences(endpoint, preferences) {
  const result = await db.query(
    `UPDATE push_subscriptions
     SET preferences = preferences || $2::jsonb
     WHERE endpoint = $1
     RETURNING id, preferences`,
    [endpoint, JSON.stringify(preferences)]
  );
  return result.rows[0] || null;
}

async function getSubscriptionStatus(endpoint) {
  const result = await db.query(
    'SELECT id, preferences, created_at, last_used FROM push_subscriptions WHERE endpoint = $1',
    [endpoint]
  );
  return result.rows[0] || null;
}

async function getActiveSubscriptions(notificationType) {
  const result = await db.query(
    `SELECT id, endpoint, keys_p256dh, keys_auth, preferences
     FROM push_subscriptions
     WHERE preferences->>$1 = 'true'`,
    [notificationType]
  );
  return result.rows;
}

// --- Sending ---

async function sendNotification(subscription, payload, type) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys_p256dh,
      auth: subscription.keys_auth,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));

    // Update last_used
    await db.query(
      'UPDATE push_subscriptions SET last_used = NOW() WHERE endpoint = $1',
      [subscription.endpoint]
    );

    // Log successful send
    await db.query(
      `INSERT INTO notification_log (subscription_id, notification_type, payload, success)
       VALUES ($1, $2, $3, true)`,
      [subscription.id, type, JSON.stringify(payload)]
    );

    return true;
  } catch (error) {
    // 410 Gone = subscription expired, remove it
    if (error.statusCode === 410 || error.statusCode === 404) {
      await removeSubscription(subscription.endpoint);
    }

    // Log failure
    try {
      await db.query(
        `INSERT INTO notification_log (subscription_id, notification_type, payload, success, error_message)
         VALUES ($1, $2, $3, false, $4)`,
        [subscription.id, type, JSON.stringify(payload), error.message]
      );
    } catch (_) { /* logging failure is non-critical */ }

    return false;
  }
}

// --- Rate Limiting & Quiet Hours ---

async function getTodayNotificationCount(subscriptionId) {
  const result = await db.query(
    `SELECT COUNT(*) as count FROM notification_log
     WHERE subscription_id = $1
       AND sent_at > CURRENT_DATE
       AND success = true`,
    [subscriptionId]
  );
  return parseInt(result.rows[0].count, 10);
}

function isQuietHours(preferences) {
  const now = new Date();
  const hour = now.getUTCHours(); // Use UTC; clients can set their preferred quiet hours
  const quiet = preferences.quiet_hours || { start: 23, end: 7 };
  if (quiet.start > quiet.end) {
    // Wraps midnight: e.g. 23-7
    return hour >= quiet.start || hour < quiet.end;
  }
  return hour >= quiet.start && hour < quiet.end;
}

async function shouldSendNotification(subscription, type) {
  const prefs = subscription.preferences || {};

  // Check if type is enabled
  if (prefs[type] === false) return false;

  // Check quiet hours (skip for urgent alerts)
  if (type !== 'urgent' && isQuietHours(prefs)) return false;

  // Check daily rate limit (max 5/day per subscription)
  const todayCount = await getTodayNotificationCount(subscription.id);
  if (todayCount >= 5) return false;

  return true;
}

// --- Notification Types ---

async function sendPatternAlert(pattern) {
  if (!isConfigured()) return { sent: 0, skipped: 0 };

  const subscriptions = await getActiveSubscriptions('pattern_alerts');
  const payload = {
    title: '🔮 Pattern Match Detected',
    body: `${pattern.avgSimilarity ? Math.round(pattern.avgSimilarity * 100) : pattern.similarity}% match with historical patterns`,
    icon: '/images/icon-192.png',
    badge: '/images/badge-72.png',
    tag: 'pattern-alert',
    data: {
      url: '/?highlight=pattern',
      type: 'pattern_alert',
      matchCount: pattern.matchCount,
    },
  };

  let sent = 0;
  let skipped = 0;
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      if (await shouldSendNotification(sub, 'pattern_alerts')) {
        const ok = await sendNotification(sub, payload, 'pattern_alert');
        if (ok) sent++; else skipped++;
      } else {
        skipped++;
      }
    })
  );

  return { sent, skipped };
}

async function sendPredictionShiftAlert(outcome, oldProbability, newProbability) {
  if (!isConfigured()) return { sent: 0, skipped: 0 };

  const shift = Math.round((newProbability - oldProbability) * 100);
  const direction = shift > 0 ? '📈' : '📉';

  const subscriptions = await getActiveSubscriptions('prediction_shifts');
  const payload = {
    title: `${direction} Prediction Shift: ${outcome}`,
    body: `Changed by ${Math.abs(shift)}% (now ${Math.round(newProbability * 100)}%)`,
    icon: '/images/icon-192.png',
    badge: '/images/badge-72.png',
    tag: `prediction-shift-${outcome}`,
    data: {
      url: '/?tab=predictions',
      type: 'prediction_shift',
      outcome,
      oldProbability,
      newProbability,
    },
  };

  let sent = 0;
  let skipped = 0;
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      if (await shouldSendNotification(sub, 'prediction_shifts')) {
        const ok = await sendNotification(sub, payload, 'prediction_shift');
        if (ok) sent++; else skipped++;
      } else {
        skipped++;
      }
    })
  );

  return { sent, skipped };
}

async function sendDailySummary(summary) {
  if (!isConfigured()) return { sent: 0, skipped: 0 };

  const subscriptions = await getActiveSubscriptions('daily_summary');
  const payload = {
    title: "📊 Today's Forecast",
    body: `Tension: ${summary.overallTension} | Top risk: ${(summary.topRisks || [])[0] || 'None'}`,
    icon: '/images/icon-192.png',
    badge: '/images/badge-72.png',
    tag: 'daily-summary',
    data: {
      url: '/',
      type: 'daily_summary',
    },
  };

  let sent = 0;
  let skipped = 0;
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      if (await shouldSendNotification(sub, 'daily_summary')) {
        const ok = await sendNotification(sub, payload, 'daily_summary');
        if (ok) sent++; else skipped++;
      } else {
        skipped++;
      }
    })
  );

  return { sent, skipped };
}

module.exports = {
  isConfigured,
  saveSubscription,
  removeSubscription,
  updatePreferences,
  getSubscriptionStatus,
  sendPatternAlert,
  sendPredictionShiftAlert,
  sendDailySummary,
  getActiveSubscriptions,
};
