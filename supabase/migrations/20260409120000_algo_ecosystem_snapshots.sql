-- ALGO écosystème : tables pour export incrémental (GET /api/v1/snapshot)
-- Appliquer via Supabase SQL editor ou CLI : supabase db push
-- Lecture / écriture côté serveur avec SUPABASE_SERVICE_ROLE_KEY (bypass RLS).

-- ─── trend_signal : lots de tendances (ex. réponse équivalente live-trends) ───
CREATE TABLE IF NOT EXISTS public.trend_signal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT,
  data_source TEXT NOT NULL DEFAULT 'google_trends_rss',
  ecosystem_version TEXT NOT NULL DEFAULT '1.0.0',
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trend_signal_created_at ON public.trend_signal (created_at ASC);

-- ─── viral_score_snapshot : scores dérivés persistés (Viral Analyzer, prédit, etc.) ───
CREATE TABLE IF NOT EXISTS public.viral_score_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  confidence NUMERIC,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_viral_score_snapshot_created_at ON public.viral_score_snapshot (created_at ASC);
CREATE INDEX IF NOT EXISTS idx_viral_score_snapshot_subject ON public.viral_score_snapshot (subject_type, subject_key);

-- ─── model_weight_version : traçabilité des poids / versions de modèle ───
CREATE TABLE IF NOT EXISTS public.model_weight_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_model_weight_version_created_at ON public.model_weight_version (created_at ASC);

ALTER TABLE public.trend_signal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_score_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_weight_version ENABLE ROW LEVEL SECURITY;

-- Pas de politique pour anon/authenticated : accès refusé par défaut.
-- La clé service_role contourne RLS (comportement Supabase).

COMMENT ON TABLE public.trend_signal IS 'ALGO ecosystem: batch trend payloads for incremental export';
COMMENT ON TABLE public.viral_score_snapshot IS 'ALGO ecosystem: persisted viral score estimates';
COMMENT ON TABLE public.model_weight_version IS 'ALGO ecosystem: model weight version audit trail';
