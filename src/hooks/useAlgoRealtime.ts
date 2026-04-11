"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { mapUserFacingApiError } from "@/lib/copy/api-error-fr";

interface RefreshConfig {
  news: number; // 5 minutes
  youtube: number; // 30 minutes
  trends: number; // 15 minutes
  music: number; // 2 hours
  movies: number; // 6 hours
  celebrities: number; // 1 hour
}

const DEFAULT_REFRESH_INTERVALS: RefreshConfig = {
  news: 5 * 60 * 1000, // 5 minutes
  youtube: 30 * 60 * 1000, // 30 minutes
  trends: 15 * 60 * 1000, // 15 minutes
  music: 2 * 60 * 60 * 1000, // 2 hours
  movies: 6 * 60 * 60 * 1000, // 6 hours
  celebrities: 60 * 60 * 1000, // 1 hour
};

interface RealtimeState<T> {
  data: T[];
  fetchedAt: string | null;
  isStale: boolean;
  isRefreshing: boolean;
  error: string | null;
}

interface UseAlgoRealtimeOptions<T> {
  endpoint: string;
  type: keyof RefreshConfig;
  transform?: (data: unknown) => T[];
  fallback?: T[];
}

export function useAlgoRealtime<T>({
  endpoint,
  type,
  transform,
  fallback = [],
}: UseAlgoRealtimeOptions<T>) {
  const [state, setState] = useState<RealtimeState<T>>({
    data: fallback,
    fetchedAt: null,
    isStale: true,
    isRefreshing: false,
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;

    setState((prev) => ({ ...prev, isRefreshing: true }));

    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const rawData = json.data || json;
      const transformedData = transform ? transform(rawData) : (rawData as T[]);

      if (mountedRef.current) {
        setState({
          data: transformedData,
          fetchedAt: new Date().toISOString(),
          isStale: false,
          isRefreshing: false,
          error: null,
        });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          isRefreshing: false,
          isStale: true,
          error: mapUserFacingApiError(
            error instanceof Error ? error.message : "Fetch failed",
          ),
        }));
      }
    }
  }, [endpoint, transform]);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    fetchData();

    // Set up interval based on content type
    const interval = DEFAULT_REFRESH_INTERVALS[type];
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, type]);

  // Check staleness
  useEffect(() => {
    if (!state.fetchedAt) return;

    const checkStale = () => {
      const fetchedTime = new Date(state.fetchedAt!).getTime();
      const now = Date.now();
      const interval = DEFAULT_REFRESH_INTERVALS[type];
      const isStale = now - fetchedTime > interval;

      if (isStale !== state.isStale) {
        setState((prev) => ({ ...prev, isStale }));
      }
    };

    checkStale();
    const staleChecker = setInterval(checkStale, 30000);
    return () => clearInterval(staleChecker);
  }, [state.fetchedAt, state.isStale, type]);

  return {
    ...state,
    refresh: fetchData,
  };
}

// Convenience hooks for specific content types
export function useRealtimeNews() {
  return useAlgoRealtime({
    endpoint: "/api/live-news",
    type: "news",
    transform: (data: unknown) => {
      if (!Array.isArray(data)) return [];
      return data.slice(0, 10);
    },
  });
}

export function useRealtimeYouTube() {
  return useAlgoRealtime({
    endpoint: "/api/youtube?country=FR",
    type: "youtube",
    transform: (data: unknown) => {
      if (!Array.isArray(data)) return [];
      return data.slice(0, 12);
    },
  });
}

export function useRealtimeTrends() {
  return useAlgoRealtime({
    endpoint: "/api/live-trends",
    type: "trends",
    transform: (data: unknown) => {
      if (!Array.isArray(data)) return [];
      return data.slice(0, 20);
    },
  });
}
