-- Points radar intelligence (score prédit, confiance, anomalies) — table métier dédiée.
-- Appliquer via Supabase SQL editor ou `npm run db:apply-ecosystem` si ton script couvre les migrations.
-- Lecture / écriture côté serveur avec SUPABASE_SERVICE_ROLE_KEY (contourne RLS).

CREATE TABLE IF NOT EXISTS public.intelligence_radar_point (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL CHECK (region ~ '^[A-Z]{2}$'),
  locale TEXT NOT NULL DEFAULT 'fr',
  virality_score INTEGER NOT NULL CHECK (virality_score >= 0 AND virality_score <= 100),
  confidence NUMERIC NOT NULL,
  anomaly_count INTEGER NOT NULL DEFAULT 0 CHECK (anomaly_count >= 0),
  captured_at TIMESTAMPTZ NOT NULL,
  source_hint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_radar_point_region_captured
  ON public.intelligence_radar_point (region, captured_at DESC);

ALTER TABLE public.intelligence_radar_point ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.intelligence_radar_point IS 'ALGO: time series radar intelligence (predictive bundle) per region';
COMMENT ON COLUMN public.intelligence_radar_point.source_hint IS 'api | cron | legacy — informatif';
