-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  preferences JSONB DEFAULT '{"patternAlerts": true, "predictionShifts": false, "dailySummary": false, "rareEvents": true}',
  quiet_hours_start INTEGER DEFAULT NULL,  -- Hour 0-23, null = no quiet hours
  quiet_hours_end INTEGER DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
