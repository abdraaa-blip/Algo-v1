-- =============================================
-- ALGO: Watchlist Table (trends user is watching)
-- =============================================

CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trend_id TEXT NOT NULL,
  trend_name TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notify_on_spike BOOLEAN DEFAULT TRUE,
  last_score INTEGER,
  UNIQUE(user_id, trend_id)
);

-- Enable RLS
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "watchlist_select_own" ON public.watchlist 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "watchlist_insert_own" ON public.watchlist 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watchlist_update_own" ON public.watchlist 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "watchlist_delete_own" ON public.watchlist 
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON public.watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_trend ON public.watchlist(trend_id);
