-- =============================================
-- ALGO: View History Table (user browsing history)
-- =============================================

CREATE TABLE IF NOT EXISTS public.view_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('trend', 'video', 'news', 'content')),
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "history_select_own" ON public.view_history 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "history_insert_own" ON public.view_history 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "history_delete_own" ON public.view_history 
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_history_user ON public.view_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_viewed_at ON public.view_history(viewed_at DESC);

-- Clean old history (keep last 100 per user) - optional function
CREATE OR REPLACE FUNCTION public.cleanup_old_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.view_history
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM public.view_history
    WHERE user_id = NEW.user_id
    ORDER BY viewed_at DESC
    LIMIT 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
