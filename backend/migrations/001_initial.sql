-- What's Happening Initial Schema
-- Creates all 12 required tables with indexes

-- =====================================================
-- CORE TABLES (spec 14)
-- =====================================================

-- Table: snapshots
-- Stores time-series module data with 90 days retention
CREATE TABLE IF NOT EXISTS snapshots (
  id INT8 DEFAULT unique_rowid() PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_module_time ON snapshots (module, collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_time ON snapshots (collected_at DESC);

-- Table: daily_data
-- Aggregated daily values calculated once per day
-- Added numerology, iching columns (identified as missing in spec 14)
CREATE TABLE IF NOT EXISTS daily_data (
  date DATE PRIMARY KEY,
  tzolkin JSONB NOT NULL,
  dreamspell JSONB NOT NULL,
  gematria JSONB NOT NULL,
  tarot JSONB NOT NULL,
  numerology JSONB,
  iching JSONB,
  parasha JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: indices_history
-- Historical index values for trend analysis (1 year retention)
CREATE TABLE IF NOT EXISTS indices_history (
  id INT8 DEFAULT unique_rowid() PRIMARY KEY,
  solar_geo DECIMAL(4,2),
  astro_events INTEGER,
  calendar_sync INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_indices_time ON indices_history (calculated_at DESC);

-- Table: news_themes
-- Archived news analysis results (30 days retention)
CREATE TABLE IF NOT EXISTS news_themes (
  id INT8 DEFAULT unique_rowid() PRIMARY KEY,
  themes JSONB NOT NULL,
  sources TEXT[] NOT NULL,
  article_count INTEGER NOT NULL,
  dominant_theme VARCHAR(100),
  overall_sentiment VARCHAR(20),
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_time ON news_themes (analyzed_at DESC);

-- Table: system_status
-- Track data collection health (7 days retention)
CREATE TABLE IF NOT EXISTS system_status (
  id INT8 DEFAULT unique_rowid() PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'success', 'error', 'timeout'
  error_message TEXT,
  response_time_ms INTEGER,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_module_time ON system_status (module, checked_at DESC);

-- =====================================================
-- MARKET TABLES (spec 20)
-- =====================================================

-- Table: market_daily
-- OHLCV data for SPX, BTC, VIX, Gold, DXY
CREATE TABLE IF NOT EXISTS market_daily (
  date DATE NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  open DECIMAL(20,8),
  high DECIMAL(20,8),
  low DECIMAL(20,8),
  close DECIMAL(20,8),
  volume BIGINT,
  PRIMARY KEY (date, symbol)
);

CREATE INDEX IF NOT EXISTS idx_market_symbol_date ON market_daily (symbol, date DESC);

-- Table: market_sentiment
-- Fear/greed metrics, put/call ratio
CREATE TABLE IF NOT EXISTS market_sentiment (
  date DATE PRIMARY KEY,
  cnn_fear_greed INTEGER,
  crypto_fear_greed INTEGER,
  vix_close DECIMAL(10,2),
  put_call_ratio DECIMAL(5,3)
);

-- =====================================================
-- GEOPHYSICAL TABLES (spec 21)
-- =====================================================

-- Table: quakes_daily
-- Daily earthquake statistics
CREATE TABLE IF NOT EXISTS quakes_daily (
  date DATE PRIMARY KEY,
  count_total INTEGER,
  count_m3 INTEGER,
  count_m4 INTEGER,
  count_m5 INTEGER,
  count_m6plus INTEGER,
  max_magnitude DECIMAL(3,1),
  total_energy_joules DECIMAL(20,2)
);

-- Table: geophysical_daily
-- AP index, pressure, UV, AQI, tides
CREATE TABLE IF NOT EXISTS geophysical_daily (
  date DATE PRIMARY KEY,
  ap_index INTEGER,
  avg_pressure DECIMAL(6,2),
  max_uv_index DECIMAL(3,1),
  avg_aqi INTEGER,
  tidal_range_cm INTEGER
);

-- =====================================================
-- SENTIMENT TABLES (spec 22)
-- =====================================================

-- Table: sentiment_daily
-- Sentiment component scores
CREATE TABLE IF NOT EXISTS sentiment_daily (
  date DATE PRIMARY KEY,
  aggregate_score INTEGER,
  cnn_fear_greed INTEGER,
  crypto_fear_greed INTEGER,
  google_fear_score INTEGER,
  google_optimism_score INTEGER,
  news_sentiment INTEGER,
  social_sentiment INTEGER
);

-- =====================================================
-- CORRELATION TABLES (spec 23)
-- =====================================================

-- Table: correlation_results
-- Pre-computed correlations with Wilson CI
CREATE TABLE IF NOT EXISTS correlation_results (
  id INT8 DEFAULT unique_rowid() PRIMARY KEY,
  correlation_type VARCHAR(20) NOT NULL, -- 'single' or 'combination'
  features JSONB NOT NULL,
  outcome VARCHAR(50) NOT NULL,
  probability DECIMAL(5,4),
  sample_size INTEGER,
  confidence_low DECIMAL(5,4),
  confidence_high DECIMAL(5,4),
  chi_square DECIMAL(10,4),
  p_value DECIMAL(10,8),
  is_significant BOOLEAN DEFAULT FALSE,
  base_rate DECIMAL(5,4),
  lift DECIMAL(6,3),
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corr_outcome ON correlation_results (outcome);
CREATE INDEX IF NOT EXISTS idx_corr_significant ON correlation_results (is_significant, outcome);

-- Table: historical_features
-- 35+ feature columns + 12 outcome columns for backtesting
CREATE TABLE IF NOT EXISTS historical_features (
  date DATE PRIMARY KEY,

  -- Cosmic/Esoteric Features (23)
  moon_phase INTEGER,                  -- 0-7 (8 phases)
  moon_sign INTEGER,                   -- 0-11 (zodiac)
  moon_illumination DECIMAL(5,2),      -- 0-100
  moon_void_of_course BOOLEAN,
  tzolkin_tone INTEGER,                -- 1-13
  tzolkin_sign INTEGER,                -- 0-19
  dreamspell_kin INTEGER,              -- 1-260
  dreamspell_wavespell INTEGER,        -- 1-20
  mercury_retrograde BOOLEAN,
  venus_retrograde BOOLEAN,
  mars_retrograde BOOLEAN,
  planets_retrograde_count INTEGER,    -- 0-7
  sun_sign INTEGER,                    -- 0-11
  major_aspects_count INTEGER,         -- 0-20
  eclipse_proximity INTEGER,           -- days to nearest eclipse
  hebrew_day INTEGER,                  -- 1-30
  hebrew_month INTEGER,                -- 1-13
  parasha_index INTEGER,               -- 1-54
  numerology_day INTEGER,              -- 1-9, 11, 22
  tarot_card INTEGER,                  -- 0-77
  iching_hexagram INTEGER,             -- 1-64
  planetary_hour INTEGER,              -- 0-6
  day_of_week INTEGER,                 -- 0-6

  -- Geophysical Features (9)
  kp_index DECIMAL(3,1),               -- 0-9
  ap_index INTEGER,                    -- 0-400
  solar_flare_class DECIMAL(3,1),      -- 0-10 (A=0 to X10=10)
  sunspot_number INTEGER,              -- 0-300+
  solar_wind_speed INTEGER,            -- 300-800 km/s
  schumann_amplitude INTEGER,          -- 0-100
  quake_count_24h INTEGER,             -- 0-500
  quake_max_magnitude DECIMAL(3,1),    -- 0-9
  quake_energy_log DECIMAL(6,2),       -- log10(joules)

  -- Sentiment Features (4)
  fear_greed_cnn INTEGER,              -- 0-100
  fear_greed_crypto INTEGER,           -- 0-100
  vix DECIMAL(5,2),                    -- 10-80
  sentiment_aggregate INTEGER,         -- 0-100

  -- Market Outcomes (7)
  spx_direction BOOLEAN,               -- 1 if SPX up
  spx_volatile BOOLEAN,                -- 1 if |return| > 1%
  spx_return DECIMAL(6,4),             -- Daily % return
  btc_direction BOOLEAN,               -- 1 if BTC up
  btc_volatile BOOLEAN,                -- 1 if |return| > 3%
  vix_spike BOOLEAN,                   -- 1 if VIX up > 10%
  gold_direction BOOLEAN,              -- 1 if gold up

  -- Geophysical Outcomes (3)
  major_quake BOOLEAN,                 -- 1 if M6+ within 24h
  quake_above_avg BOOLEAN,             -- 1 if count > 30d avg
  geomag_storm BOOLEAN,                -- 1 if Kp >= 5

  -- Sentiment Outcomes (2)
  sentiment_drop BOOLEAN,              -- 1 if aggregate drops > 10
  fear_spike BOOLEAN                   -- 1 if Fear/Greed < 25
);

CREATE INDEX IF NOT EXISTS idx_historical_features_date ON historical_features (date);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE snapshots IS 'Time-series module data, 90 days retention';
COMMENT ON TABLE daily_data IS 'Daily calculated values (tarot, tzolkin, etc.)';
COMMENT ON TABLE indices_history IS 'Composite index values over time';
COMMENT ON TABLE news_themes IS 'AI-analyzed news themes, 30 days retention';
COMMENT ON TABLE system_status IS 'Module health tracking, 7 days retention';
COMMENT ON TABLE market_daily IS 'Historical OHLCV for tracked symbols';
COMMENT ON TABLE market_sentiment IS 'Daily fear/greed metrics';
COMMENT ON TABLE quakes_daily IS 'Daily seismic statistics';
COMMENT ON TABLE geophysical_daily IS 'Daily geophysical metrics';
COMMENT ON TABLE sentiment_daily IS 'Daily sentiment component scores';
COMMENT ON TABLE correlation_results IS 'Pre-computed statistical correlations';
COMMENT ON TABLE historical_features IS 'Full feature matrix for backtesting';
