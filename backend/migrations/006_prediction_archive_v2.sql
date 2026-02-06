-- Migration: 006_prediction_archive_v2
-- Description: Enhanced prediction archive schema for comprehensive accuracy tracking
-- Issues: #118 - Prediction Archive Schema Enhancement
-- Created: 2026-02-06

-- Add category column for grouping predictions
ALTER TABLE prediction_archive
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Add tags for flexible filtering (e.g., 'market', 'cosmic', 'geophysical')
ALTER TABLE prediction_archive
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add feature snapshot for debugging and analysis
ALTER TABLE prediction_archive
ADD COLUMN IF NOT EXISTS feature_snapshot JSONB;

-- Add correlation IDs that contributed to this prediction
ALTER TABLE prediction_archive
ADD COLUMN IF NOT EXISTS correlation_ids INTEGER[];

-- Add lift value at time of prediction
ALTER TABLE prediction_archive
ADD COLUMN IF NOT EXISTS predicted_lift DECIMAL(6,3);

-- Add base rate at time of prediction for calibration
ALTER TABLE prediction_archive
ADD COLUMN IF NOT EXISTS base_rate DECIMAL(5,4);

-- Add sample size used for prediction
ALTER TABLE prediction_archive
ADD COLUMN IF NOT EXISTS sample_size INTEGER;

-- Track how prediction was made (single correlation vs combination)
ALTER TABLE prediction_archive
ADD COLUMN IF NOT EXISTS prediction_type VARCHAR(20) DEFAULT 'single';

-- Add metadata for any additional context
ALTER TABLE prediction_archive
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create accuracy_snapshots table for periodic accuracy tracking
CREATE TABLE IF NOT EXISTS accuracy_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  period_days INTEGER NOT NULL, -- 7, 30, 90 days lookback
  outcome_id VARCHAR(50),       -- NULL for overall stats
  total_predictions INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  accuracy DECIMAL(5,4),
  avg_confidence DECIMAL(5,4),
  calibration_error DECIMAL(5,4),
  brier_score DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(snapshot_date, period_days, outcome_id)
);

CREATE INDEX IF NOT EXISTS idx_accuracy_snapshots_date ON accuracy_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_accuracy_snapshots_outcome ON accuracy_snapshots(outcome_id);

-- Create prediction_streaks table for tracking winning/losing streaks
CREATE TABLE IF NOT EXISTS prediction_streaks (
  id SERIAL PRIMARY KEY,
  outcome_id VARCHAR(50) NOT NULL,
  streak_type VARCHAR(10) NOT NULL, -- 'win' or 'loss'
  streak_length INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  avg_confidence DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prediction_streaks_outcome ON prediction_streaks(outcome_id);
CREATE INDEX IF NOT EXISTS idx_prediction_streaks_type ON prediction_streaks(streak_type, streak_length DESC);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_prediction_archive_category ON prediction_archive(category);
CREATE INDEX IF NOT EXISTS idx_prediction_archive_tags ON prediction_archive USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prediction_archive_type ON prediction_archive(prediction_type);

-- Add comment for schema version tracking
COMMENT ON TABLE prediction_archive IS 'Prediction archive v2 - Enhanced with category, tags, features, and metadata';
COMMENT ON TABLE accuracy_snapshots IS 'Daily accuracy snapshots for trend analysis';
COMMENT ON TABLE prediction_streaks IS 'Historical prediction streaks (winning/losing runs)';
