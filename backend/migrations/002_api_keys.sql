-- API Developer Portal Schema
-- Adds API key management and usage tracking

-- =====================================================
-- API KEYS TABLE
-- =====================================================

-- Table: api_keys
-- Stores API keys with tier information
CREATE TABLE IF NOT EXISTS api_keys (
  id INT8 DEFAULT unique_rowid() PRIMARY KEY,
  key_id VARCHAR(32) NOT NULL UNIQUE,     -- Public identifier (wh_pk_xxx)
  key_hash VARCHAR(128) NOT NULL,          -- SHA-256 hash of secret key
  name VARCHAR(100) NOT NULL,              -- User-friendly name
  tier VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  owner_email VARCHAR(255),                -- Contact email
  daily_limit INTEGER NOT NULL DEFAULT 100, -- Requests per day
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_id ON api_keys (key_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys (key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_tier ON api_keys (tier);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys (is_active) WHERE is_active = TRUE;

-- =====================================================
-- API USAGE TABLE
-- =====================================================

-- Table: api_usage
-- Tracks API usage per key per day
CREATE TABLE IF NOT EXISTS api_usage (
  id INT8 DEFAULT unique_rowid() PRIMARY KEY,
  key_id VARCHAR(32) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER DEFAULT 0,
  endpoints_used JSONB DEFAULT '{}',       -- Count per endpoint
  last_request_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (key_id, date)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_key_date ON api_usage (key_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage (date DESC);

-- =====================================================
-- API REQUEST LOG TABLE
-- =====================================================

-- Table: api_request_log
-- Detailed request logs (7 days retention)
CREATE TABLE IF NOT EXISTS api_request_log (
  id INT8 DEFAULT unique_rowid() PRIMARY KEY,
  key_id VARCHAR(32),
  endpoint VARCHAR(100) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_log_key_time ON api_request_log (key_id, request_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_log_time ON api_request_log (request_at DESC);

-- =====================================================
-- TIER LIMITS REFERENCE
-- =====================================================

-- Table: api_tiers
-- Reference table for tier limits
CREATE TABLE IF NOT EXISTS api_tiers (
  tier VARCHAR(20) PRIMARY KEY,
  daily_limit INTEGER NOT NULL,
  rate_limit_per_minute INTEGER NOT NULL,
  description TEXT
);

-- Insert default tiers
INSERT INTO api_tiers (tier, daily_limit, rate_limit_per_minute, description)
VALUES
  ('free', 100, 10, 'Free tier - 100 requests/day, 10/minute'),
  ('pro', 10000, 100, 'Pro tier - 10,000 requests/day, 100/minute'),
  ('enterprise', -1, -1, 'Enterprise tier - Unlimited requests')
ON CONFLICT (tier) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE api_keys IS 'API key management for developer portal';
COMMENT ON TABLE api_usage IS 'Daily API usage statistics per key';
COMMENT ON TABLE api_request_log IS 'Detailed request logs, 7 days retention';
COMMENT ON TABLE api_tiers IS 'Reference table for API tier limits';
