// CACHE_BUST: 2026-04-05T08:48
/**
 * ALGO Orchestrator - Central nervous system for real-time data
 */

import { AlgoEventBus, type AlgoEventType } from "./AlgoEventBus";
import { AlgoCache, type CacheSource } from "./AlgoCache";
import { AlgoScope } from "./AlgoScope";

// Refresh intervals in milliseconds
const REFRESH_INTERVALS = {
  news: 5 * 60 * 1000, // 5 minutes
  youtube: 30 * 60 * 1000, // 30 minutes
  trends: 15 * 60 * 1000, // 15 minutes
  tmdb: 6 * 60 * 60 * 1000, // 6 hours
  lastfm: 2 * 60 * 60 * 1000, // 2 hours
  scores: 10 * 60 * 1000, // 10 minutes
} as const;

// API endpoints - use only routes that exist
const API_ENDPOINTS = {
  news: "/api/live-news",
  youtube: "/api/live-videos",
  trends: "/api/live-trends",
  tmdb: "/api/live-movies",
  lastfm: "/api/live-music",
  scores: "/api/live-trends", // fallback to trends
  live: "/api/live",
} as const;

type DataSource = keyof typeof REFRESH_INTERVALS;

interface FetchState {
  lastFetch: number;
  nextFetch: number;
  inProgress: boolean;
  errorCount: number;
  lastError: string | null;
}

interface OrchestratorMetrics {
  totalFetches: number;
  successfulFetches: number;
  failedFetches: number;
  cacheHits: number;
  uptime: number;
}

class AlgoOrchestratorClass {
  private timers: Map<DataSource, NodeJS.Timeout> = new Map();
  private fetchStates: Map<DataSource, FetchState> = new Map();
  private isRunning = false;
  private startTime = 0;
  private abortControllers: Map<DataSource, AbortController> = new Map();

  private metrics: OrchestratorMetrics = {
    totalFetches: 0,
    successfulFetches: 0,
    failedFetches: 0,
    cacheHits: 0,
    uptime: 0,
  };

  constructor() {
    // Initialize fetch states
    for (const source of Object.keys(REFRESH_INTERVALS) as DataSource[]) {
      this.fetchStates.set(source, {
        lastFetch: 0,
        nextFetch: 0,
        inProgress: false,
        errorCount: 0,
        lastError: null,
      });
    }

    // Subscribe to scope changes
    AlgoEventBus.subscribe("scope:changed", () => {
      this.handleScopeChange();
    });

    // Auto-start in browser environment
    if (typeof window !== "undefined") {
      this.start();
    }
  }

  /**
   * Start the orchestrator - begins all refresh cycles
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();

    console.log("[ALGO Orchestrator] Starting autonomous nervous system...");

    // Initial fetch for all sources
    this.fetchAllSources();

    // Set up recurring timers for each source
    for (const [source, interval] of Object.entries(REFRESH_INTERVALS)) {
      this.scheduleRefresh(source as DataSource, interval);
    }

    // Set up orchestrator tick every minute
    setInterval(() => {
      this.tick();
    }, 60 * 1000);
  }

  /**
   * Stop the orchestrator
   */
  stop(): void {
    this.isRunning = false;

    // Cancel all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Cancel all in-flight requests
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();

    console.log("[ALGO Orchestrator] Stopped.");
  }

  /**
   * Schedule a refresh for a specific source
   */
  private scheduleRefresh(source: DataSource, delay: number): void {
    // Clear existing timer
    const existing = this.timers.get(source);
    if (existing) clearTimeout(existing);

    const state = this.fetchStates.get(source)!;
    state.nextFetch = Date.now() + delay;

    const timer = setTimeout(() => {
      this.fetchSource(source);
      // Reschedule after completion
      this.scheduleRefresh(source, REFRESH_INTERVALS[source]);
    }, delay);

    this.timers.set(source, timer);
  }

  /**
   * Fetch all sources immediately
   */
  async fetchAllSources(): Promise<void> {
    const sources = Object.keys(REFRESH_INTERVALS) as DataSource[];

    // Fetch in parallel, but with staggered starts to avoid overwhelming APIs
    for (let i = 0; i < sources.length; i++) {
      setTimeout(() => {
        this.fetchSource(sources[i]);
      }, i * 500); // 500ms stagger
    }
  }

  /**
   * Fetch a specific data source
   */
  async fetchSource(source: DataSource): Promise<void> {
    const state = this.fetchStates.get(source)!;

    if (state.inProgress) {
      console.log(
        `[ALGO Orchestrator] ${source} fetch already in progress, skipping`,
      );
      return;
    }

    const scope = AlgoScope.getScopeCode();
    const language = AlgoScope.getLanguage();

    // Check cache first (stale-while-revalidate)
    const cached = await AlgoCache.get(source as CacheSource, scope);

    if (cached.isCached && !cached.isStale) {
      this.metrics.cacheHits++;
      // Fresh cache hit - no fetch needed
      this.publishDataEvent(source, cached.data, "cache");
      return;
    }

    // Serve stale data immediately while fetching
    if (cached.isCached && cached.isStale) {
      this.publishDataEvent(source, cached.data, "stale");
    }

    // Fetch fresh data
    state.inProgress = true;
    this.metrics.totalFetches++;

    const controller = new AbortController();
    this.abortControllers.set(source, controller);

    try {
      const endpoint = this.getEndpoint(source, scope, language);

      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        // Handle 404 gracefully - route doesn't exist yet
        if (response.status === 404) {
          console.warn(
            `[ALGO Orchestrator] ${source} endpoint not found (404) - skipping`,
          );
          if (cached.isCached) {
            this.publishDataEvent(source, cached.data, "cache");
          }
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Success - update cache and broadcast
      await AlgoCache.set(source as CacheSource, scope, data);
      this.publishDataEvent(source, data, "live");

      state.lastFetch = Date.now();
      state.errorCount = 0;
      state.lastError = null;
      this.metrics.successfulFetches++;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // Request was cancelled (scope change), not an error
        return;
      }

      state.errorCount++;
      state.lastError = (error as Error).message;
      this.metrics.failedFetches++;

      console.error(`[ALGO Orchestrator] ${source} fetch failed:`, error);

      // Exponential backoff for retries
      const backoffDelay = Math.min(
        REFRESH_INTERVALS[source],
        1000 * Math.pow(2, state.errorCount),
      );

      // If we have stale data, keep using it
      if (!cached.isCached) {
        // No cached data - publish error event
        AlgoEventBus.publish("system:error", {
          error: (error as Error).message,
          source,
          recoverable: state.errorCount < 5,
        });
      }

      // Retry with backoff
      if (state.errorCount < 5) {
        setTimeout(() => this.fetchSource(source), backoffDelay);
      }
    } finally {
      state.inProgress = false;
      this.abortControllers.delete(source);
    }
  }

  /**
   * Get the API endpoint for a source
   */
  private getEndpoint(
    source: DataSource,
    scope: string,
    language: string,
  ): string {
    const base =
      API_ENDPOINTS[source as keyof typeof API_ENDPOINTS] || `/api/${source}`;
    const params = new URLSearchParams({
      country: scope,
      lang: language,
      t: Date.now().toString(), // Cache buster
    });
    return `${base}?${params}`;
  }

  /**
   * Publish data update event
   */
  private publishDataEvent(
    source: DataSource,
    data: unknown,
    dataSource: "live" | "cache" | "stale",
  ): void {
    const eventMap: Record<DataSource, AlgoEventType> = {
      news: "data:news:updated",
      youtube: "data:youtube:updated",
      tmdb: "data:tmdb:updated",
      lastfm: "data:lastfm:updated",
      trends: "data:trends:updated",
      scores: "data:scores:updated",
    };

    const eventType = eventMap[source];
    if (eventType && eventType !== "data:scores:updated") {
      AlgoEventBus.publish(
        eventType as Exclude<typeof eventType, "data:scores:updated">,
        {
          data: Array.isArray(data)
            ? data
            : (data as { data?: unknown[] })?.data || [],
          source: dataSource,
          fetchedAt: new Date().toISOString(),
        },
      );
    }
  }

  /**
   * Handle scope change - cancel pending and refetch all
   */
  private handleScopeChange(): void {
    console.log("[ALGO Orchestrator] Scope changed, refreshing all sources...");

    // Cancel all in-flight requests
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();

    // Reset all fetch states
    for (const state of this.fetchStates.values()) {
      state.inProgress = false;
    }

    // Fetch all sources with new scope
    this.fetchAllSources();
  }

  /**
   * Orchestrator tick - runs every minute
   */
  private tick(): void {
    this.metrics.uptime = Date.now() - this.startTime;

    AlgoEventBus.publish("orchestrator:tick", {
      timestamp: new Date().toISOString(),
      nextTicks: this.getNextTicks(),
    });
  }

  /**
   * Get time until next fetch for each source
   */
  private getNextTicks(): Record<string, number> {
    const result: Record<string, number> = {};
    const now = Date.now();

    for (const [source, state] of this.fetchStates) {
      result[source] = Math.max(0, state.nextFetch - now);
    }

    return result;
  }

  /**
   * Force refresh a specific source
   */
  async forceRefresh(source: DataSource): Promise<void> {
    // Invalidate cache
    await AlgoCache.invalidate(source as CacheSource, AlgoScope.getScopeCode());
    // Fetch fresh
    await this.fetchSource(source);
  }

  /**
   * Force refresh all sources
   */
  async forceRefreshAll(): Promise<void> {
    const sources = Object.keys(REFRESH_INTERVALS) as DataSource[];
    await Promise.all(sources.map((s) => this.forceRefresh(s)));
  }

  /**
   * Get orchestrator metrics for monitoring
   */
  getMetrics() {
    const fetchStatesObj: Record<string, FetchState> = {};
    for (const [source, state] of this.fetchStates) {
      fetchStatesObj[source] = state;
    }

    return {
      ...this.metrics,
      isRunning: this.isRunning,
      fetchStates: fetchStatesObj,
      nextTicks: this.getNextTicks(),
    };
  }

  /**
   * Get status for a specific source
   */
  getSourceStatus(source: DataSource) {
    return this.fetchStates.get(source);
  }
}

// Singleton instance
export const AlgoOrchestrator = new AlgoOrchestratorClass();
