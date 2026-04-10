-- Content cache table for storing API responses
CREATE TABLE IF NOT EXISTS public.content_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL, -- 'news', 'videos', 'trends', 'movies', 'music'
  data JSONB NOT NULL,
  country TEXT DEFAULT 'global',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_cache_key ON public.content_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_content_cache_type_country ON public.content_cache(content_type, country);
CREATE INDEX IF NOT EXISTS idx_content_cache_expires ON public.content_cache(expires_at);

-- Enable RLS
ALTER TABLE public.content_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cache
CREATE POLICY "cache_select_all" ON public.content_cache FOR SELECT USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "cache_insert_service" ON public.content_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "cache_update_service" ON public.content_cache FOR UPDATE USING (true);
CREATE POLICY "cache_delete_service" ON public.content_cache FOR DELETE USING (true);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.content_cache WHERE expires_at < NOW();
END;
$$;
