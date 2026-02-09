-- Migration: 003_prediction_archive
-- Description: Add prediction archive table for accuracy tracking
-- Created: 2026-02-04

-- Prediction Archive table
-- Stores historical predictions with their outcomes for accuracy tracking
CREATE TABLE IF NOT EXISTS prediction_archive (
  id INT8 DEFAULT unique_rowid() PRIMARY KEY,
  date DATE NOT NULL,
  outcome_id TEXT NOT NULL,
  predicted_probability DECIMAL(5,4),
  confidence_level TEXT,
  actual_result BOOLEAN,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, outcome_id)
);

-- Index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_prediction_archive_date ON prediction_archive(date);

-- Index for outcome-based queries
CREATE INDEX IF NOT EXISTS idx_prediction_archive_outcome ON prediction_archive(outcome_id);

-- Index for finding unverified predictions
CREATE INDEX IF NOT EXISTS idx_prediction_archive_unverified ON prediction_archive(date) WHERE actual_result IS NULL;

-- Index for confidence level analysis
CREATE INDEX IF NOT EXISTS idx_prediction_archive_confidence ON prediction_archive(confidence_level) WHERE actual_result IS NOT NULL;

-- Composite index for accuracy calculations
CREATE INDEX IF NOT EXISTS idx_prediction_archive_accuracy ON prediction_archive(outcome_id, date, actual_result) WHERE actual_result IS NOT NULL;
