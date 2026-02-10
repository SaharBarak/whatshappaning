-- Push notification log for rate limiting (max 3 per day per subscription)
CREATE TABLE IF NOT EXISTS push_notification_log (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_log_sub_date ON push_notification_log (subscription_id, sent_at);

-- Auto-cleanup: remove log entries older than 7 days (only need current day for rate limiting)
-- Can be run periodically via scheduler
