"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getWatchlistIds,
  getWatchlistTrends,
  addToWatchlist as addToLocalWatchlist,
  removeFromWatchlist as removeFromLocalWatchlist,
} from "@/services/watchlistService";
import { track } from "@/services/analyticsService";
import type { Trend } from "@/types";

export interface UseWatchlistReturn {
  ids: string[];
  trends: Trend[];
  isFollowing: (trendId: string) => boolean;
  follow: (trendId: string) => void;
  unfollow: (trendId: string) => void;
  toggle: (trendId: string) => void;
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

export function useWatchlist(): UseWatchlistReturn {
  const [ids, setIds] = useState<string[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize
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
              .from("watchlist")
              .select("trend_id")
              .eq("user_id", user.id);

            if (data && mounted) {
              const trendIds = data.map((w) => w.trend_id);
              setIds(trendIds);
              // Get trend details from local mock data for now
              const allTrends = getWatchlistTrends();
              setTrends(allTrends.filter((t) => trendIds.includes(t.id)));
              setIsLoaded(true);
              return;
            }
          }
        }
      } catch {
        console.warn(
          "[v0] Supabase not available, using localStorage fallback",
        );
      }

      // Fallback to localStorage
      if (mounted) {
        setIds(getWatchlistIds());
        setTrends(getWatchlistTrends());
        setIsLoaded(true);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const follow = useCallback(
    async (trendId: string) => {
      // Optimistic update
      setIds((prev) => [...prev, trendId]);

      if (userId) {
        try {
          const supabase = await getSupabaseClient();
          if (supabase) {
            await supabase
              .from("watchlist")
              .insert({ user_id: userId, trend_id: trendId });
          }
        } catch {
          // Fallback already handled by optimistic update
        }
      } else {
        addToLocalWatchlist(trendId);
      }

      setTrends(getWatchlistTrends());
      track("trend_followed", { trendId });
    },
    [userId],
  );

  const unfollow = useCallback(
    async (trendId: string) => {
      // Optimistic update
      setIds((prev) => prev.filter((id) => id !== trendId));
      setTrends((prev) => prev.filter((t) => t.id !== trendId));

      if (userId) {
        try {
          const supabase = await getSupabaseClient();
          if (supabase) {
            await supabase
              .from("watchlist")
              .delete()
              .eq("user_id", userId)
              .eq("trend_id", trendId);
          }
        } catch {
          // Fallback already handled by optimistic update
        }
      } else {
        removeFromLocalWatchlist(trendId);
      }

      track("trend_unfollowed", { trendId });
    },
    [userId],
  );

  const toggle = useCallback(
    (trendId: string) => {
      if (ids.includes(trendId)) {
        unfollow(trendId);
      } else {
        follow(trendId);
      }
    },
    [ids, follow, unfollow],
  );

  const isFollowingFn = useCallback(
    (trendId: string) => ids.includes(trendId),
    [ids],
  );

  return useMemo(
    () => ({
      ids,
      trends,
      isFollowing: isFollowingFn,
      follow,
      unfollow,
      toggle,
      isLoaded,
    }),
    [ids, trends, isFollowingFn, follow, unfollow, toggle, isLoaded],
  );
}
