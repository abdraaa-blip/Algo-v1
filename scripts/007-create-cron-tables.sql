-- ALGO Cron Tables
-- Tables for automated pipeline logs, detected trends, and daily briefings

-- Pipeline execution logs
CREATE TABLE IF NOT EXISTS pipeline_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  sources JSONB DEFAULT '{}',
  total_fetched INTEGER DEFAULT 0,
  total_new INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  execution_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for querying recent logs
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_started_at ON pipeline_logs(started_at DESC);

-- Detected trends from AI clustering
CREATE TABLE IF NOT EXISTS detected_trends (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'emerging' CHECK (status IN ('emerging', 'growing', 'mainstream', 'declining', 'retired')),
  content_count INTEGER DEFAULT 0,
  avg_viral_score INTEGER DEFAULT 0,
  first_detected TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  related_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for trends
CREATE INDEX IF NOT EXISTS idx_detected_trends_status ON detected_trends(status);
CREATE INDEX IF NOT EXISTS idx_detected_trends_viral_score ON detected_trends(avg_viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_detected_trends_last_updated ON detected_trends(last_updated DESC);

-- Daily AI briefings for users
CREATE TABLE IF NOT EXISTS daily_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  briefing_date DATE NOT NULL,
  briefing JSONB NOT NULL,
  is_global BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, briefing_date)
);

-- Create indexes for briefings
CREATE INDEX IF NOT EXISTS idx_daily_briefings_user_date ON daily_briefings(user_id, briefing_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_briefings_date ON daily_briefings(briefing_date DESC);

-- Enable RLS
ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;

-- Pipeline logs: only service role can write, all can read
CREATE POLICY "pipeline_logs_select_all" ON pipeline_logs FOR SELECT USING (true);

-- Detected trends: public read
CREATE POLICY "detected_trends_select_all" ON detected_trends FOR SELECT USING (true);

-- Daily briefings: users can only see their own + global briefings
CREATE POLICY "briefings_select_own_or_global" ON daily_briefings 
  FOR SELECT USING (
    is_global = TRUE OR 
    user_id = auth.uid()
  );
