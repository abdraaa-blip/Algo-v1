"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getFavoriteIds,
  getFavoriteContents,
  toggleFavorite as toggleLocalFavorite,
} from "@/services/favoritesService";
import { track } from "@/services/analyticsService";
import type { Content } from "@/types";

export interface UseFavoritesReturn {
  ids: string[];
  contents: Content[];
  isFav: (contentId: string) => boolean;
  toggle: (contentId: string) => void;
  isLoaded: boolean;
}

// Dynamic Supabase import to avoid build errors when package is not installed
async function getSupabaseClient() {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  } catch {
    return null;
  }
}

export function useFavorites(): UseFavoritesReturn {
  const [ids, setIds] = useState<string[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check auth state and load favorites
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const supabase = await getSupabaseClient();

        if (supabase) {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user && mounted) {
            setUserId(user.id);
            // Load from Supabase
            const { data } = await supabase
              .from("favorites")
              .select("content_id")
              .eq("user_id", user.id);

            if (data && mounted) {
              const contentIds = data.map((f) => f.content_id);
              setIds(contentIds);
              // Get content details from local mock data for now
              setContents(
                getFavoriteContents().filter((c) => contentIds.includes(c.id)),
              );
              setIsLoaded(true);
              return;
            }
          }
        }
      } catch {
        console.warn(
          "[v0] Supabase not available for favorites, using localStorage",
        );
      }

      // Fallback to localStorage
      if (mounted) {
        setIds(getFavoriteIds());
        setContents(getFavoriteContents());
        setIsLoaded(true);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const toggle = useCallback(
    async (contentId: string) => {
      const isCurrentlyFav = ids.includes(contentId);

      // Optimistic update
      if (isCurrentlyFav) {
        setIds((prev) => prev.filter((id) => id !== contentId));
      } else {
        setIds((prev) => [...prev, contentId]);
      }

      if (userId) {
        try {
          const supabase = await getSupabaseClient();
          if (supabase) {
            if (isCurrentlyFav) {
              await supabase
                .from("favorites")
                .delete()
                .eq("user_id", userId)
                .eq("content_id", contentId);
            } else {
              await supabase
                .from("favorites")
                .insert({ user_id: userId, content_id: contentId });
            }
          }
        } catch {
          // Optimistic update already done
        }
      } else {
        toggleLocalFavorite(contentId);
      }

      setContents(getFavoriteContents());
      track(isCurrentlyFav ? "content_unsaved" : "content_saved", {
        contentId,
      });
    },
    [ids, userId],
  );

  const isFavFn = useCallback(
    (contentId: string) => ids.includes(contentId),
    [ids],
  );

  return useMemo(
    () => ({
      ids,
      contents,
      isFav: isFavFn,
      toggle,
      isLoaded,
    }),
    [ids, contents, isFavFn, toggle, isLoaded],
  );
}
