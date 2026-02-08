CREATE TABLE indicator_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id TEXT NOT NULL,
  value DOUBLE PRECISION,
  normalized_risk DOUBLE PRECISION,
  status TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (indicator_id, timestamp)
);

CREATE INDEX idx_indicator_snapshots_indicator_id ON indicator_snapshots(indicator_id);
CREATE INDEX idx_indicator_snapshots_timestamp ON indicator_snapshots(timestamp);

CREATE TABLE composite_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score DOUBLE PRECISION,
  status TEXT,
  breakdown JSONB,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_composite_snapshots_timestamp ON composite_snapshots(timestamp);

CREATE TABLE ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT,
  indicators_updated INT,
  errors JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
