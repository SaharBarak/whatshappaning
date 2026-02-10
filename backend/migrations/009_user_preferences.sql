-- User Preferences for Feed Personalization (EPIC-019)
-- Stores per-user preferences keyed by community_users identity

CREATE TABLE IF NOT EXISTS user_preferences (
  id INT8 DEFAULT unique_rowid() PRIMARY KEY,
  user_id INTEGER REFERENCES community_users(id) ON DELETE CASCADE UNIQUE,
  interests JSONB DEFAULT '[]'::jsonb,
  location_lat DECIMAL(10, 7),
  location_lng DECIMAL(10, 7),
  location_label TEXT,
  location_radius_km INTEGER DEFAULT 25,
  preferred_times JSONB DEFAULT '["all"]'::jsonb,
  notifications JSONB DEFAULT '{"patternAlerts": true, "predictionShifts": false, "dailySummary": false, "rareEvents": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences (user_id);

COMMENT ON TABLE user_preferences IS 'User preferences for feed personalization';
