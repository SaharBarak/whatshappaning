-- Push notification subscriptions for EPIC-005

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  preferences JSONB DEFAULT '{
    "pattern_alerts": true,
    "prediction_shifts": true,
    "daily_summary": false,
    "quiet_hours": {"start": 23, "end": 7}
  }',
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Track notification sends for rate limiting
CREATE TABLE IF NOT EXISTS notification_log (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  payload JSONB,
  sent_at TIMESTAMP DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_notification_log_sub_date ON notification_log(subscription_id, sent_at);
