-- ═══════════════════════════════════════════════════════
-- A/B Testing Infrastructure for Zoon Club
-- ═══════════════════════════════════════════════════════

-- 1. Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Assignments Table: Who is in which group?
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  experiment_name TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Snapshot of user state at time of assignment
  user_days_since_registration INTEGER,
  
  -- Ensure one assignment per user per experiment
  UNIQUE(user_id, experiment_name)
);

CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment_variant ON ab_test_assignments (experiment_name, variant);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_date ON ab_test_assignments (assigned_at);

-- 3. Events Table: Tracking interactions for analysis
CREATE TABLE IF NOT EXISTS ab_test_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  experiment_name TEXT NOT NULL,
  variant TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- e.g., 'profile_enriched', 'circle_joined', 'circle_left'
  event_data JSONB,          -- Flexible context data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_events_user ON ab_test_events (user_id, experiment_name);
CREATE INDEX IF NOT EXISTS idx_ab_events_type_date ON ab_test_events (event_type, created_at);

-- 4. Daily Metrics Table: Aggregated data for dashboard
CREATE TABLE IF NOT EXISTS ab_test_daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_name TEXT NOT NULL,
  variant TEXT NOT NULL,
  metric_date DATE NOT NULL,
  
  -- Core Metrics
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  
  -- Quality Metrics
  avg_harmony_score DECIMAL(5,2),
  day_7_retention DECIMAL(5,2),
  
  -- Timestamp
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(experiment_name, variant, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_ab_metrics_exp_date ON ab_test_daily_metrics (experiment_name, metric_date);

-- 5. Enable RLS (Row Level Security) - Optional based on your security model
-- Allowing logic to read/write. For now, assuming service role usage or public for dev.
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for development)
CREATE POLICY "Enable all access for authenticated users" ON ab_test_assignments FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON ab_test_events FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON ab_test_daily_metrics FOR ALL USING (true);
