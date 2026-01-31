# Database Schema Specification

## Overview
PostgreSQL database for storing all collected data points. Enables historical analysis and trend visualization.

## Tables

### 1. snapshots
Main table for all time-series data.

```sql
CREATE TABLE snapshots (
  id SERIAL PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_snapshots_module_time ON snapshots (module, collected_at DESC);
CREATE INDEX idx_snapshots_time ON snapshots (collected_at DESC);
```

### 2. daily_data
Aggregated daily values (calculated once per day).

```sql
CREATE TABLE daily_data (
  date DATE PRIMARY KEY,
  tzolkin JSONB NOT NULL,
  dreamspell JSONB NOT NULL,
  gematria JSONB NOT NULL,
  tarot JSONB NOT NULL,
  parasha JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. indices_history
Historical index values for trend analysis.

```sql
CREATE TABLE indices_history (
  id SERIAL PRIMARY KEY,
  solar_geo DECIMAL(4,2),
  astro_events INTEGER,
  calendar_sync INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_indices_time ON indices_history (calculated_at DESC);
```

### 4. news_themes
Archived news analysis results.

```sql
CREATE TABLE news_themes (
  id SERIAL PRIMARY KEY,
  themes JSONB NOT NULL,
  sources TEXT[] NOT NULL,
  article_count INTEGER NOT NULL,
  dominant_theme VARCHAR(100),
  overall_sentiment VARCHAR(20),
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_news_time ON news_themes (analyzed_at DESC);
```

### 5. system_status
Track data collection health.

```sql
CREATE TABLE system_status (
  id SERIAL PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'success', 'error', 'timeout'
  error_message TEXT,
  response_time_ms INTEGER,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_status_module_time ON system_status (module, checked_at DESC);
```

## Data Retention

| Table | Retention | Cleanup |
|-------|-----------|---------|
| snapshots | 90 days | Daily cron |
| daily_data | Forever | No cleanup |
| indices_history | 1 year | Monthly cron |
| news_themes | 30 days | Weekly cron |
| system_status | 7 days | Daily cron |

### Cleanup Query
```sql
-- Run daily
DELETE FROM snapshots WHERE collected_at < NOW() - INTERVAL '90 days';
DELETE FROM system_status WHERE checked_at < NOW() - INTERVAL '7 days';

-- Run weekly
DELETE FROM news_themes WHERE analyzed_at < NOW() - INTERVAL '30 days';

-- Run monthly
DELETE FROM indices_history WHERE calculated_at < NOW() - INTERVAL '1 year';
```

## Queries

### Get Latest Snapshot for Module
```sql
SELECT data, collected_at
FROM snapshots
WHERE module = $1
ORDER BY collected_at DESC
LIMIT 1;
```

### Get Module History (last 7 days)
```sql
SELECT data, collected_at
FROM snapshots
WHERE module = $1
  AND collected_at > NOW() - INTERVAL '7 days'
ORDER BY collected_at ASC;
```

### Get Today's Daily Data
```sql
SELECT * FROM daily_data WHERE date = CURRENT_DATE;
```

### Get Index Trends (last 24 hours)
```sql
SELECT solar_geo, astro_events, calendar_sync, calculated_at
FROM indices_history
WHERE calculated_at > NOW() - INTERVAL '24 hours'
ORDER BY calculated_at ASC;
```

### Check Module Health
```sql
SELECT module, status, error_message, checked_at
FROM system_status
WHERE checked_at > NOW() - INTERVAL '1 hour'
ORDER BY checked_at DESC;
```

## Sample Data Insertion

### Snapshot
```sql
INSERT INTO snapshots (module, data)
VALUES ('solar', '{
  "kpIndex": 3,
  "kpCategory": "Unsettled",
  "latestFlare": {"class": "C2.1", "time": "2025-01-31T08:23:00Z"},
  "sunspotNumber": 142
}'::jsonb);
```

### Daily Data
```sql
INSERT INTO daily_data (date, tzolkin, dreamspell, gematria, tarot)
VALUES (
  '2025-01-31',
  '{"tone": 4, "toneName": "Self-Existing", "daySign": "Ahau"}'::jsonb,
  '{"kin": 138, "seal": "White Mirror", "wavespell": 11}'::jsonb,
  '{"dateStandard": 787, "parashaStandard": 3}'::jsonb,
  '{"card": "The Tower", "number": "XVI", "arcana": "Major"}'::jsonb
);
```

## Migrations

### Initial Setup
```sql
-- migrations/001_initial.sql
CREATE TABLE snapshots (...);
CREATE TABLE daily_data (...);
CREATE TABLE indices_history (...);
CREATE TABLE news_themes (...);
CREATE TABLE system_status (...);

-- Create indexes
...
```

### Add New Column Example
```sql
-- migrations/002_add_field.sql
ALTER TABLE daily_data ADD COLUMN hebrew_date VARCHAR(100);
```

## Connection Pool

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
```

## Backup Strategy

1. **Railway/Render**: Use built-in daily backups
2. **Self-hosted**: pg_dump daily to S3/B2
3. **Critical data**: `daily_data` table should be backed up separately (small, permanent)

```bash
# Daily backup script
pg_dump $DATABASE_URL --table=daily_data > daily_data_$(date +%Y%m%d).sql
```
