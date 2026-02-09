-- User Preferences Schema
-- Stores personalization settings for feed ranking and event discovery
-- Links to existing community_users table for anonymous identity

-- Table: user_preferences
-- Core preferences for feed personalization
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES community_users(id) ON DELETE CASCADE UNIQUE,
  
  -- Interest categories (stored as JSONB array)
  -- e.g. ["sports", "music", "tech", "food", "arts", "outdoors", "nightlife", "family"]
  interests JSONB DEFAULT '[]'::jsonb,
  
  -- Location preferences
  location_lat DECIMAL(10, 7),           -- User's preferred latitude
  location_lng DECIMAL(10, 7),           -- User's preferred longitude
  location_label TEXT,                    -- Human-readable location name
  location_radius_km INTEGER DEFAULT 25, -- Discovery radius in km
  
  -- Time preferences (JSONB for flexibility)
  -- e.g. {"weekdayMornings": false, "weekdayEvenings": true, "weekends": true, "lateNight": false}
  time_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Feed settings
  preferred_sort TEXT DEFAULT 'relevance', -- 'relevance', 'date', 'distance', 'popularity'
  hide_categories JSONB DEFAULT '[]'::jsonb, -- Categories to exclude
  language TEXT DEFAULT 'en',
  
  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON user_preferences (user_id);

-- Table: preference_history
-- Tracks preference changes for analytics and rollback
CREATE TABLE IF NOT EXISTS preference_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES community_users(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pref_history_user ON preference_history (user_id, changed_at DESC);

COMMENT ON TABLE user_preferences IS 'User personalization preferences for feed ranking';
COMMENT ON TABLE preference_history IS 'Audit trail of preference changes';
