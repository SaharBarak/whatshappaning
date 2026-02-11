-- User Preferences Schema v2
-- Adds columns to existing user_preferences table if needed
-- Safe to run multiple times (idempotent)

-- Add user_id column if it doesn't exist (v2 schema addition)
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 7);
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS location_lng DECIMAL(10, 7);
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS location_label TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS location_radius_km INTEGER DEFAULT 25;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS time_preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS preferred_sort TEXT DEFAULT 'relevance';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS hide_categories JSONB DEFAULT '[]'::jsonb;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create index on user_id if column exists now
CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON user_preferences (user_id);

-- Preference history table
CREATE TABLE IF NOT EXISTS preference_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  field_changed TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pref_history_user ON preference_history (user_id, changed_at DESC);
