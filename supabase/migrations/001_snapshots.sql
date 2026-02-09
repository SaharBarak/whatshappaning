-- Snapshots table for historical storage
CREATE TABLE IF NOT EXISTS snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_snapshots_created_at ON snapshots (created_at DESC);

-- Storage bucket setup (run via Supabase dashboard or CLI):
-- 1. Create a public bucket named "snapshots"
-- 2. No RLS needed for public read access
-- 
-- INSERT INTO storage.buckets (id, name, public) VALUES ('snapshots', 'snapshots', true);
