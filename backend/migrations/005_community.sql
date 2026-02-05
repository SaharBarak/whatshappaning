-- Community Features Schema
-- Supports comments, reactions, community predictions, and leaderboards
-- Uses cookie-based anonymous identity (no accounts required)

-- Table: community_users
-- Anonymous users identified by cookie/device fingerprint
CREATE TABLE IF NOT EXISTS community_users (
  id SERIAL PRIMARY KEY,
  anonymous_id TEXT UNIQUE NOT NULL,  -- Cookie/fingerprint hash
  display_name TEXT,                   -- Optional nickname
  avatar_seed TEXT,                    -- For generating avatar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_users_anon ON community_users (anonymous_id);

-- Table: prediction_comments
-- Comments on predictions
CREATE TABLE IF NOT EXISTS prediction_comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES community_users(id) ON DELETE SET NULL,
  outcome_id TEXT NOT NULL,           -- Prediction outcome being commented on
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_comments_outcome ON prediction_comments (outcome_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON prediction_comments (user_id);

-- Table: prediction_reactions
-- Emoji reactions on predictions
CREATE TABLE IF NOT EXISTS prediction_reactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES community_users(id) ON DELETE CASCADE,
  outcome_id TEXT NOT NULL,
  emoji TEXT NOT NULL,                -- Emoji code (e.g., '👍', '🎯', '🔥')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, outcome_id, emoji)  -- One reaction type per user per prediction
);

CREATE INDEX IF NOT EXISTS idx_reactions_outcome ON prediction_reactions (outcome_id);

-- Table: community_predictions
-- User-submitted predictions with voting
CREATE TABLE IF NOT EXISTS community_predictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES community_users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  prediction_type TEXT NOT NULL,      -- 'binary', 'numeric', 'category'
  target_date DATE NOT NULL,
  options JSONB,                       -- For category predictions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  actual_outcome TEXT,
  status TEXT DEFAULT 'open'          -- 'open', 'closed', 'resolved'
);

CREATE INDEX IF NOT EXISTS idx_community_pred_status ON community_predictions (status, target_date);
CREATE INDEX IF NOT EXISTS idx_community_pred_user ON community_predictions (user_id);

-- Table: community_votes
-- Votes on community predictions
CREATE TABLE IF NOT EXISTS community_votes (
  id SERIAL PRIMARY KEY,
  prediction_id INTEGER REFERENCES community_predictions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES community_users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL,                  -- 'yes', 'no', or option value
  confidence INTEGER DEFAULT 50,       -- 0-100 confidence level
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prediction_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_prediction ON community_votes (prediction_id);

-- Table: user_accuracy
-- Tracks prediction accuracy for leaderboard
CREATE TABLE IF NOT EXISTS user_accuracy (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES community_users(id) ON DELETE CASCADE UNIQUE,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy_score DECIMAL(5,4) DEFAULT 0,
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accuracy_score ON user_accuracy (accuracy_score DESC);

-- Comments
COMMENT ON TABLE community_users IS 'Anonymous users for community features';
COMMENT ON TABLE prediction_comments IS 'Comments on system predictions';
COMMENT ON TABLE prediction_reactions IS 'Emoji reactions on predictions';
COMMENT ON TABLE community_predictions IS 'User-submitted predictions';
COMMENT ON TABLE community_votes IS 'Votes on community predictions';
COMMENT ON TABLE user_accuracy IS 'Leaderboard accuracy tracking';
