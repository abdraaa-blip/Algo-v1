/**
 * ALGO System Hooks - React Integration
 *
 * Hooks that connect React components to the ALGO nervous system.
 * Every component uses these hooks to subscribe to events and receive data.
 */

"use client";

import { useEffect, useState, useCallback, useRef, useId } from "react";
import {
  AlgoEventBus,
  type AlgoEventType,
  type AlgoEventPayload,
} from "@/services/AlgoEventBus";
import { AlgoCache, type CacheSource } from "@/services/AlgoCache";
import { AlgoScope, type Scope } from "@/services/AlgoScope";
import { AlgoOrchestrator } from "@/services/AlgoOrchestrator";
import { AlgoCoherenceGuard } from "@/services/AlgoCoherenceGuard";
import { AlgoPerformanceOptimizer } from "@/services/AlgoPerformanceOptimizer";
import { mapUserFacingApiError } from "@/lib/copy/api-error-fr";

/**
 * Subscribe to ALGO events with automatic cleanup
 */
export function useAlgoEvent<T extends AlgoEventType>(
  eventType: T,
  callback: (payload: AlgoEventPayload[T]) => void,
  deps: React.DependencyList = [],
) {
  useEffect(() => {
    const unsubscribe = AlgoEventBus.subscribe(eventType, callback, {
      receiveLastState: true,
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, ...deps]);
}

/**
 * Get data from the ALGO system with automatic updates
 */
export function useAlgoData<T>(
  source: CacheSource,
  options: { autoRefresh?: boolean } = {},
) {
  void options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freshness, setFreshness] = useState<
    "fresh" | "stale" | "old" | "unknown"
  >("unknown");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const generatedId = useId();
  const componentId = useRef(`algo-${source}-${generatedId}`);

  // Register component for coherence monitoring
  useEffect(() => {
    const componentKey = componentId.current;
    AlgoCoherenceGuard.registerComponent(
      componentKey,
      AlgoScope.getScopeCode(),
      source,
    );

    return () => {
      AlgoCoherenceGuard.unregisterComponent(componentKey);
    };
  }, [source]);

  // Load initial data from cache
  useEffect(() => {
    const loadInitial = async () => {
      const scope = AlgoScope.getScopeCode();
      const cached = await AlgoCache.get<T>(source, scope);

      if (cached.data) {
        setData(cached.data);
        setFreshness(cached.isStale ? "stale" : "fresh");
        setLastUpdate(new Date(Date.now() - cached.age));
      }

      setLoading(false);
    };

    loadInitial();
  }, [source]);

  // Subscribe to data updates
  useEffect(() => {
    const eventMap: Record<CacheSource, AlgoEventType> = {
      news: "data:news:updated",
      youtube: "data:youtube:updated",
      tmdb: "data:tmdb:updated",
      lastfm: "data:lastfm:updated",
      trends: "data:trends:updated",
      scores: "data:scores:updated",
    };

    const eventType = eventMap[source];
    if (!eventType) return;

    const unsubscribe = AlgoEventBus.subscribe(eventType, (payload) => {
      if ("data" in payload) {
        setData(payload.data as T);
        setFreshness("fresh");
        setLastUpdate(new Date());
        setLoading(false);
        setError(null);

        // Update coherence guard
        AlgoCoherenceGuard.updateComponentState(componentId.current, {
          scope: AlgoScope.getScopeCode(),
        });
      }
    });

    return () => unsubscribe();
  }, [source]);

  // Subscribe to scope changes
  useEffect(() => {
    const unsubscribe = AlgoEventBus.subscribe("scope:changed", () => {
      setLoading(true);
      setFreshness("unknown");
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to errors
  useEffect(() => {
    const unsubscribe = AlgoEventBus.subscribe("system:error", (payload) => {
      if (payload.source === source) {
        setError(mapUserFacingApiError(payload.error));
      }
    });

    return () => unsubscribe();
  }, [source]);

  // Update freshness indicator over time
  useEffect(() => {
    const interval = setInterval(() => {
      const scope = AlgoScope.getScopeCode();
      const newFreshness = AlgoCache.getDataFreshness(source, scope);
      setFreshness(newFreshness);
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [source]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    await AlgoOrchestrator.forceRefresh(source as never);
  }, [source]);

  return {
    data,
    loading,
    error,
    freshness,
    lastUpdate,
    refresh,
  };
}

/**
 * Get current scope with reactive updates
 */
export function useAlgoScope() {
  const [scope, setScope] = useState<Scope>(AlgoScope.getScope());
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const unsubscribe = AlgoEventBus.subscribe("scope:changed", () => {
      setScope(AlgoScope.getScope());
      setIsChanging(false);
    });

    return () => unsubscribe();
  }, []);

  const changeScope = useCallback(async (newScopeCode: string) => {
    setIsChanging(true);
    await AlgoScope.changeScope(newScopeCode);
  }, []);

  return {
    scope,
    isChanging,
    changeScope,
    availableScopes: AlgoScope.getAvailableScopes(),
  };
}

/**
 * Subscribe to breaking signals
 */
export function useAlgoSignals() {
  const [breakingSignal, setBreakingSignal] = useState<unknown | null>(null);
  const [explodingSignal, setExplodingSignal] = useState<unknown | null>(null);
  const [earlySignal, setEarlySignal] = useState<unknown | null>(null);

  useEffect(() => {
    const unsub1 = AlgoEventBus.subscribe("signal:breaking", (payload) => {
      setBreakingSignal(payload.item);
      // Auto-clear after 30 seconds
      setTimeout(() => setBreakingSignal(null), 30000);
    });

    const unsub2 = AlgoEventBus.subscribe("signal:exploding", (payload) => {
      setExplodingSignal(payload.item);
      setTimeout(() => setExplodingSignal(null), 30000);
    });

    const unsub3 = AlgoEventBus.subscribe("signal:early", (payload) => {
      setEarlySignal(payload.item);
      setTimeout(() => setEarlySignal(null), 30000);
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  return { breakingSignal, explodingSignal, earlySignal };
}

/**
 * Data freshness indicator component helper
 */
export function useDataFreshness(source: CacheSource) {
  const [freshness, setFreshness] = useState<
    "fresh" | "stale" | "old" | "unknown"
  >("unknown");
  const [age, setAge] = useState(0);

  useEffect(() => {
    const updateFreshness = async () => {
      const scope = AlgoScope.getScopeCode();
      const cached = await AlgoCache.get(source, scope);

      if (cached.isCached) {
        setAge(cached.age);
        if (cached.age < 15 * 60 * 1000) {
          setFreshness("fresh");
        } else if (cached.age < 60 * 60 * 1000) {
          setFreshness("stale");
        } else {
          setFreshness("old");
        }
      } else {
        setFreshness("unknown");
      }
    };

    updateFreshness();
    const interval = setInterval(updateFreshness, 30 * 1000);

    return () => clearInterval(interval);
  }, [source]);

  // Color for indicator
  const indicatorColor =
    freshness === "fresh"
      ? "bg-green-500"
      : freshness === "stale"
        ? "bg-yellow-500"
        : freshness === "old"
          ? "bg-red-500"
          : "bg-gray-500";

  return { freshness, age, indicatorColor };
}

/**
 * Track page navigation for performance optimizer
 */
export function useAlgoPageTracking(pagePath: string) {
  useEffect(() => {
    AlgoPerformanceOptimizer.trackNavigation(pagePath);
  }, [pagePath]);
}

/**
 * Initialize the ALGO system (call once in root layout)
 */
export function useAlgoSystemInit() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Start all systems
    AlgoOrchestrator.start();
    AlgoCoherenceGuard.start();

    // Connect to Supabase Realtime
    import("@/services/AlgoRealtime").then(({ AlgoRealtime }) => {
      AlgoRealtime.connect();
    });

    setIsInitialized(true);

    console.log("[ALGO] Nervous system initialized");

    return () => {
      AlgoOrchestrator.stop();
      AlgoCoherenceGuard.stop();
    };
  }, []);

  return isInitialized;
}

/**
 * Get system metrics for monitoring dashboard
 */
export function useAlgoMetrics() {
  const [metrics, setMetrics] = useState<{
    orchestrator: ReturnType<typeof AlgoOrchestrator.getMetrics>;
    cache: ReturnType<typeof AlgoCache.getMetrics>;
    eventBus: ReturnType<typeof AlgoEventBus.getMetrics>;
    coherence: ReturnType<typeof AlgoCoherenceGuard.getMetrics>;
    performance: ReturnType<typeof AlgoPerformanceOptimizer.getMetrics>;
  } | null>(null);

  useEffect(() => {
    const update = () => {
      setMetrics({
        orchestrator: AlgoOrchestrator.getMetrics(),
        cache: AlgoCache.getMetrics(),
        eventBus: AlgoEventBus.getMetrics(),
        coherence: AlgoCoherenceGuard.getMetrics(),
        performance: AlgoPerformanceOptimizer.getMetrics(),
      });
    };

    update();
    const interval = setInterval(update, 5000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}

export function useAutonomyMetrics() {
  const [autonomy, setAutonomy] = useState<{
    mode: "advisory" | "guarded_auto" | "manual_only";
    killSwitch: boolean;
    counters: {
      autoExecuted: number;
      approvalRequired: number;
      approvalDenied: number;
      simRuns: number;
      rollbacks: number;
      feedbackHelpful: number;
      feedbackWrong: number;
      feedbackNeutral: number;
    };
  } | null>(null);

  useEffect(() => {
    const update = async () => {
      try {
        const res = await fetch("/api/intelligence/autonomy", {
          cache: "no-store",
        });
        const json = (await res.json()) as {
          success: boolean;
          policy?: {
            mode: "advisory" | "guarded_auto" | "manual_only";
            killSwitch: boolean;
          };
          counters?: {
            autoExecuted: number;
            approvalRequired: number;
            approvalDenied: number;
            simRuns: number;
            rollbacks: number;
            feedbackHelpful: number;
            feedbackWrong: number;
            feedbackNeutral: number;
          };
        };
        if (json.success && json.policy && json.counters) {
          setAutonomy({
            mode: json.policy.mode,
            killSwitch: json.policy.killSwitch,
            counters: json.counters,
          });
        }
      } catch {
        // silent
      }
    };
    void update();
    const interval = setInterval(() => void update(), 10000);
    return () => clearInterval(interval);
  }, []);

  return autonomy;
}
