-- =====================================================
-- ALGO — Rising Stars (Influenceurs/Artistes du moment)
-- =====================================================

-- Table des rising stars (cache des données agrégées)
CREATE TABLE IF NOT EXISTS public.rising_stars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identité
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('rapper', 'singer', 'comedian', 'influencer', 'athlete', 'creator', 'actor', 'other')),
  
  -- Images
  avatar_url TEXT,
  cover_url TEXT,
  
  -- Bio
  bio TEXT,
  country TEXT,
  
  -- Liens sociaux (JSON)
  social_links JSONB DEFAULT '{}',
  -- Structure: { tiktok: "@handle", instagram: "@handle", youtube: "channelId", twitter: "@handle", spotify: "artistId" }
  
  -- Stats agrégées (mis à jour par le système)
  followers_total BIGINT NOT NULL DEFAULT 0,
  followers_growth_24h INTEGER NOT NULL DEFAULT 0,
  followers_growth_7d INTEGER NOT NULL DEFAULT 0,
  
  mentions_24h INTEGER NOT NULL DEFAULT 0,
  mentions_7d INTEGER NOT NULL DEFAULT 0,
  
  engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  viral_score INTEGER NOT NULL DEFAULT 0 CHECK (viral_score >= 0 AND viral_score <= 100),
  
  -- Momentum
  momentum TEXT NOT NULL DEFAULT 'stable' CHECK (momentum IN ('exploding', 'rising', 'stable', 'cooling', 'fading')),
  momentum_change INTEGER NOT NULL DEFAULT 0, -- points gagnés/perdus sur 24h
  
  -- Contenu viral récent (JSON array)
  viral_content JSONB DEFAULT '[]',
  -- Structure: [{ platform, url, views, likes, title, thumbnail, posted_at }]
  
  -- Tags/genres
  tags TEXT[] DEFAULT '{}',
  
  -- Ranking
  rank_global INTEGER,
  rank_category INTEGER,
  rank_country INTEGER,
  previous_rank_global INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMPTZ
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_stars_category ON public.rising_stars(category);
CREATE INDEX IF NOT EXISTS idx_stars_country ON public.rising_stars(country);
CREATE INDEX IF NOT EXISTS idx_stars_viral_score ON public.rising_stars(viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_stars_momentum ON public.rising_stars(momentum);
CREATE INDEX IF NOT EXISTS idx_stars_rank ON public.rising_stars(rank_global);
CREATE INDEX IF NOT EXISTS idx_stars_slug ON public.rising_stars(slug);

-- Table de suivi des stars par les utilisateurs
CREATE TABLE IF NOT EXISTS public.star_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  star_id UUID NOT NULL REFERENCES public.rising_stars(id) ON DELETE CASCADE,
  notify_on_viral BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, star_id)
);

-- Enable RLS
ALTER TABLE public.rising_stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.star_follows ENABLE ROW LEVEL SECURITY;

-- Policies pour rising_stars (lecture publique)
CREATE POLICY "stars_select_all" ON public.rising_stars 
  FOR SELECT USING (true);

-- Policies pour star_follows
CREATE POLICY "follows_select_own" ON public.star_follows 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "follows_insert_own" ON public.star_follows 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "follows_delete_own" ON public.star_follows 
  FOR DELETE USING (auth.uid() = user_id);

-- Insérer des données de démo
INSERT INTO public.rising_stars (name, slug, category, country, bio, viral_score, momentum, followers_total, followers_growth_24h, mentions_24h, engagement_rate, tags, rank_global, social_links, viral_content) VALUES
('Aya Nakamura', 'aya-nakamura', 'singer', 'FR', 'Reine de la pop urbaine française', 94, 'exploding', 45000000, 125000, 8500, 4.2, ARRAY['pop', 'urbain', 'afropop'], 1, '{"instagram": "@aabordelouis", "tiktok": "@ayanakamura", "spotify": "2qqUfxarb8Ni1"}', '[{"platform": "tiktok", "title": "Pookie Challenge", "views": 45000000, "likes": 8200000}]'),
('Tiakola', 'tiakola', 'rapper', 'FR', 'Le prodige du rap français nouvelle génération', 91, 'exploding', 3200000, 85000, 12000, 6.8, ARRAY['rap', 'drill', 'melodic'], 2, '{"instagram": "@tiakola", "tiktok": "@tiakola"}', '[{"platform": "youtube", "title": "Melo Drill Session", "views": 12000000}]'),
('Squeezie', 'squeezie', 'creator', 'FR', 'Premier youtubeur français, gaming et entertainment', 88, 'rising', 18500000, 45000, 5200, 3.1, ARRAY['gaming', 'entertainment', 'music'], 3, '{"youtube": "squeezie", "twitter": "@squlouis", "tiktok": "@squeezie"}', '[]'),
('Khaby Lame', 'khaby-lame', 'influencer', 'IT', 'Le TikTokeur le plus suivi au monde', 96, 'stable', 162000000, 320000, 25000, 8.5, ARRAY['comedy', 'reaction', 'viral'], 4, '{"tiktok": "@khaby.lame", "instagram": "@khaby00"}', '[]'),
('Ninho', 'ninho', 'rapper', 'FR', 'N.I, le rappeur le plus certifié de France', 87, 'rising', 8900000, 52000, 7800, 4.9, ARRAY['rap', 'melodic', 'street'], 5, '{"instagram": "@naborfresco", "spotify": "4yPwxs"}', '[]'),
('Inoxtag', 'inoxtag', 'creator', 'FR', 'Ascension de l Everest, 26M de vues en 24h', 99, 'exploding', 12000000, 450000, 85000, 12.4, ARRAY['adventure', 'documentary', 'youtube'], 6, '{"youtube": "inoxtag", "tiktok": "@inoxtag"}', '[{"platform": "youtube", "title": "KAIZEN", "views": 42000000}]'),
('Bilal Hassani', 'bilal-hassani', 'singer', 'FR', 'Artiste pop engagé et icône LGBTQ+', 72, 'stable', 2100000, 8500, 1200, 5.2, ARRAY['pop', 'lgbtq', 'dance'], 7, '{"instagram": "@iambilalhassani", "tiktok": "@bilalhassani"}', '[]'),
('Mister V', 'mister-v', 'comedian', 'FR', 'Du YouTube au rap, le parcours unique', 78, 'cooling', 7200000, 12000, 3400, 2.8, ARRAY['comedy', 'rap', 'youtube'], 8, '{"youtube": "misterv", "instagram": "@mabordelouis"}', '[]'),
('Léna Situations', 'lena-situations', 'influencer', 'FR', 'Influenceuse mode et lifestyle', 81, 'rising', 4800000, 28000, 4100, 5.6, ARRAY['fashion', 'lifestyle', 'vlog'], 9, '{"instagram": "@lenamahfouf", "youtube": "lenasituations", "tiktok": "@lenamahfouf"}', '[]'),
('SDM', 'sdm', 'rapper', 'FR', 'Bolide allemand, le son de 2024', 85, 'exploding', 2400000, 95000, 9200, 7.8, ARRAY['rap', 'drill', 'afrotrap'], 10, '{"instagram": "@sdmdemain", "tiktok": "@sdm_"}', '[{"platform": "tiktok", "title": "Bolide Allemand", "views": 89000000}]')
ON CONFLICT (slug) DO NOTHING;
