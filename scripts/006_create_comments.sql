-- =====================================================
-- ALGO — Système de commentaires avec anti-spam
-- =====================================================

-- Table des commentaires
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contenu ciblé (peut être un content, trend, ou rising_star)
  target_type TEXT NOT NULL CHECK (target_type IN ('content', 'trend', 'rising_star')),
  target_id TEXT NOT NULL,
  
  -- Contenu du commentaire
  body TEXT NOT NULL CHECK (char_length(body) >= 2 AND char_length(body) <= 500),
  
  -- Réponse à un autre commentaire (thread)
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  
  -- Modération
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'flagged', 'deleted')),
  flags_count INTEGER NOT NULL DEFAULT 0,
  
  -- Engagement
  likes_count INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Index pour éviter le spam (un user ne peut pas commenter le même contenu plus de 5 fois)
  CONSTRAINT unique_user_comment_limit CHECK (true)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_comments_target ON public.comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON public.comments(created_at DESC);

-- Table des likes sur commentaires
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, comment_id)
);

-- Table des signalements
CREATE TABLE IF NOT EXISTS public.comment_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'hate', 'harassment', 'misinformation', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, comment_id)
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_flags ENABLE ROW LEVEL SECURITY;

-- Policies pour comments
CREATE POLICY "comments_select_all" ON public.comments 
  FOR SELECT USING (status = 'visible');

CREATE POLICY "comments_insert_own" ON public.comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_update_own" ON public.comments 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comments_delete_own" ON public.comments 
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour comment_likes
CREATE POLICY "likes_select_all" ON public.comment_likes 
  FOR SELECT USING (true);

CREATE POLICY "likes_insert_own" ON public.comment_likes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_own" ON public.comment_likes 
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour comment_flags
CREATE POLICY "flags_insert_own" ON public.comment_flags 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger pour mettre à jour likes_count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;
CREATE TRIGGER on_comment_like_change
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Trigger pour mettre à jour replies_count
CREATE OR REPLACE FUNCTION update_comment_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.comments SET replies_count = replies_count + 1 WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.comments SET replies_count = replies_count - 1 WHERE id = OLD.parent_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_reply_change ON public.comments;
CREATE TRIGGER on_comment_reply_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_replies_count();

-- Trigger pour auto-hide si trop de flags
CREATE OR REPLACE FUNCTION auto_hide_flagged_comment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.comments 
  SET flags_count = flags_count + 1,
      status = CASE WHEN flags_count >= 4 THEN 'flagged' ELSE status END
  WHERE id = NEW.comment_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_flag ON public.comment_flags;
CREATE TRIGGER on_comment_flag
  AFTER INSERT ON public.comment_flags
  FOR EACH ROW EXECUTE FUNCTION auto_hide_flagged_comment();
