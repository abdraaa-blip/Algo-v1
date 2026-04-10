-- =============================================================================
-- ALGO Real-Time Infrastructure Tables
-- Run this migration to enable real-time features
-- =============================================================================

-- Enable Realtime for specified tables
-- Note: Run in Supabase Dashboard or via SQL Editor

-- =============================================================================
-- VIRAL CONTENT TABLE (tracks content going viral)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.viral_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'reddit', 'twitter', 'twitch', 'spotify', 'github', 'news')),
  content_url TEXT NOT NULL,
  thumbnail_url TEXT,
  viral_score INTEGER NOT NULL DEFAULT 0 CHECK (viral_score >= 0 AND viral_score <= 100),
  view_count BIGINT DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  growth_rate DECIMAL(10,2) DEFAULT 0,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(external_id, platform)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_viral_content_platform ON public.viral_content(platform);
CREATE INDEX IF NOT EXISTS idx_viral_content_viral_score ON public.viral_content(viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_viral_content_detected_at ON public.viral_content(detected_at DESC);

-- Enable RLS
ALTER TABLE public.viral_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to viral_content" 
  ON public.viral_content FOR SELECT 
  USING (true);

-- =============================================================================
-- ALERTS TABLE (real-time notifications)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('viral_spike', 'new_trend', 'breaking_news', 'price_change', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  content_id UUID REFERENCES public.viral_content(id) ON DELETE SET NULL,
  trend_id UUID REFERENCES public.detected_trends(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON public.alerts(read);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(type);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to alerts" 
  ON public.alerts FOR SELECT 
  USING (true);

-- =============================================================================
-- ANALYTICS EVENTS TABLE (for tracking user interactions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  session_id TEXT,
  user_id UUID,
  content_id UUID REFERENCES public.viral_content(id) ON DELETE SET NULL,
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT, -- Hashed for privacy
  country_code TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_content ON public.analytics_events(content_id);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow insert from anyone (anonymous tracking)
CREATE POLICY "Allow public insert to analytics_events" 
  ON public.analytics_events FOR INSERT 
  WITH CHECK (true);

-- =============================================================================
-- DAILY METRICS TABLE (aggregated daily stats)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(20,4) NOT NULL,
  dimension TEXT, -- e.g., 'platform', 'country', 'content_type'
  dimension_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(metric_date, metric_name, dimension, dimension_value)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON public.daily_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_name ON public.daily_metrics(metric_name);

-- Enable RLS
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to daily_metrics" 
  ON public.daily_metrics FOR SELECT 
  USING (true);

-- =============================================================================
-- WATCHLIST TABLE (user saved trends/content)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Optional: for authenticated users
  session_id TEXT, -- For anonymous users
  content_type TEXT NOT NULL CHECK (content_type IN ('trend', 'content', 'creator')),
  content_id TEXT NOT NULL,
  platform TEXT,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(COALESCE(user_id::text, session_id), content_type, content_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON public.watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_session ON public.watchlist(session_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_content_type ON public.watchlist(content_type);

-- Enable RLS
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Allow public access for session-based watchlist
CREATE POLICY "Allow session-based watchlist access" 
  ON public.watchlist FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to viral_content
DROP TRIGGER IF EXISTS update_viral_content_updated_at ON public.viral_content;
CREATE TRIGGER update_viral_content_updated_at
  BEFORE UPDATE ON public.viral_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- ENABLE REALTIME PUBLICATION
-- =============================================================================

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.viral_content;
ALTER PUBLICATION supabase_realtime ADD TABLE public.detected_trends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to create a viral alert
CREATE OR REPLACE FUNCTION public.create_viral_alert(
  p_content_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_severity TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO public.alerts (type, title, message, severity, content_id)
  VALUES ('viral_spike', p_title, p_message, p_severity, p_content_id)
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending content by time window
CREATE OR REPLACE FUNCTION public.get_trending_content(
  p_platform TEXT DEFAULT NULL,
  p_hours INTEGER DEFAULT 24,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  platform TEXT,
  viral_score INTEGER,
  view_count BIGINT,
  growth_rate DECIMAL,
  detected_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vc.id,
    vc.title,
    vc.platform,
    vc.viral_score,
    vc.view_count,
    vc.growth_rate,
    vc.detected_at
  FROM public.viral_content vc
  WHERE 
    vc.detected_at >= NOW() - (p_hours || ' hours')::INTERVAL
    AND (p_platform IS NULL OR vc.platform = p_platform)
  ORDER BY vc.viral_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
