-- Snapshots table for storing generated data snapshots
CREATE TABLE IF NOT EXISTS snapshots (
  id INT8 DEFAULT unique_rowid() PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add created_at if it doesn't exist (for existing tables)
ALTER TABLE snapshots ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Index for querying latest snapshot
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON snapshots (created_at DESC);
