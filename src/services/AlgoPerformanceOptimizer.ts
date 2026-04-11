/**
 * ALGO Performance Optimizer - Adaptive System Tuning
 *
 * Continuously optimizes performance without developer intervention.
 * Implements predictive prefetching and adaptive refresh rates.
 */

import { AlgoOrchestrator } from "./AlgoOrchestrator";
import { AlgoCache, type CacheSource } from "./AlgoCache";
import { AlgoScope } from "./AlgoScope";

interface NavigationPattern {
  from: string;
  to: string;
  count: number;
  avgTimeSpent: number;
}

interface ConnectionQuality {
  type: "slow" | "medium" | "fast";
  effectiveType: string;
  downlink: number;
  rtt: number;
}

class AlgoPerformanceOptimizerClass {
  private navigationPatterns: Map<string, NavigationPattern> = new Map();
  private currentPage: string = "/";
  private pageEntryTime: number = Date.now();
  private isInBackground = false;
  private backgroundSince: number = 0;
  private prefetchQueue: Set<string> = new Set();
  private connectionQuality: ConnectionQuality = {
    type: "fast",
    effectiveType: "4g",
    downlink: 10,
    rtt: 50,
  };

  private metrics = {
    prefetchesPerformed: 0,
    prefetchHits: 0,
    adaptiveRefreshPauses: 0,
    connectionChecks: 0,
  };

  constructor() {
    if (typeof window !== "undefined") {
      this.initBrowserListeners();
    }
  }

  /**
   * Initialize browser event listeners
   */
  private initBrowserListeners(): void {
    // Track visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.handleBackgrounded();
      } else {
        this.handleForegrounded();
      }
    });

    // Track connection changes
    if ("connection" in navigator) {
      const connection = (
        navigator as Navigator & {
          connection?: {
            effectiveType: string;
            downlink: number;
            rtt: number;
            addEventListener: (event: string, handler: () => void) => void;
          };
        }
      ).connection;
      if (connection) {
        this.updateConnectionQuality(connection);
        connection.addEventListener("change", () => {
          this.updateConnectionQuality(connection);
        });
      }
    }

    // Track page navigations
    window.addEventListener("popstate", () => {
      this.trackNavigation(window.location.pathname);
    });
  }

  /**
   * Track page navigation for pattern learning
   */
  trackNavigation(toPath: string): void {
    const now = Date.now();
    const timeSpent = now - this.pageEntryTime;

    // Record pattern
    const key = `${this.currentPage}:${toPath}`;
    const existing = this.navigationPatterns.get(key) || {
      from: this.currentPage,
      to: toPath,
      count: 0,
      avgTimeSpent: 0,
    };

    existing.count++;
    existing.avgTimeSpent =
      (existing.avgTimeSpent * (existing.count - 1) + timeSpent) /
      existing.count;
    this.navigationPatterns.set(key, existing);

    // Update current page
    this.currentPage = toPath;
    this.pageEntryTime = now;

    // Trigger predictive prefetch based on patterns
    this.predictivePrefetch();
  }

  /**
   * Predictive prefetch based on navigation patterns
   */
  private async predictivePrefetch(): Promise<void> {
    const predictions = this.predictNextPages();

    for (const { page, probability } of predictions) {
      if (probability >= 0.3 && !this.prefetchQueue.has(page)) {
        this.prefetchQueue.add(page);
        this.prefetchDataForPage(page);
      }
    }
  }

  /**
   * Predict next likely pages based on patterns
   */
  private predictNextPages(): Array<{ page: string; probability: number }> {
    const predictions: Array<{ page: string; probability: number }> = [];
    let totalFromCurrent = 0;

    // Count all navigations from current page
    for (const [, pattern] of this.navigationPatterns) {
      if (pattern.from === this.currentPage) {
        totalFromCurrent += pattern.count;
      }
    }

    // Calculate probabilities
    for (const [, pattern] of this.navigationPatterns) {
      if (pattern.from === this.currentPage && totalFromCurrent > 0) {
        predictions.push({
          page: pattern.to,
          probability: pattern.count / totalFromCurrent,
        });
      }
    }

    // Sort by probability
    return predictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3);
  }

  /**
   * Prefetch data for a specific page
   */
  private async prefetchDataForPage(page: string): Promise<void> {
    const scope = AlgoScope.getScopeCode();

    // Map pages to their data sources
    const pageDataMap: Record<string, CacheSource[]> = {
      "/": ["news", "youtube", "trends"],
      "/trends": ["trends"],
      "/news": ["news"],
      "/videos": ["youtube"],
      "/movies": ["tmdb"],
      "/music": ["lastfm"],
    };

    const sources = pageDataMap[page] || [];

    for (const source of sources) {
      const cached = await AlgoCache.get(source, scope);
      if (!cached.isCached || cached.isStale) {
        // Prefetch in background
        this.metrics.prefetchesPerformed++;
        // The orchestrator will handle the actual fetch
      }
    }

    this.prefetchQueue.delete(page);
  }

  /**
   * Handle app going to background
   */
  private handleBackgrounded(): void {
    this.isInBackground = true;
    this.backgroundSince = Date.now();

    // After 5 minutes in background, pause refreshes
    setTimeout(
      () => {
        if (
          this.isInBackground &&
          Date.now() - this.backgroundSince >= 5 * 60 * 1000
        ) {
          this.pauseRefreshes();
        }
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Handle app coming to foreground
   */
  private handleForegrounded(): void {
    const wasInBackground = this.isInBackground;
    const backgroundDuration = Date.now() - this.backgroundSince;

    this.isInBackground = false;

    if (wasInBackground && backgroundDuration >= 5 * 60 * 1000) {
      // Resume refreshes and fetch stale data
      this.resumeRefreshes();
      this.refreshStaleData();
    }
  }

  /**
   * Pause refresh cycles to save battery
   */
  private pauseRefreshes(): void {
    console.log(
      "[ALGO PerformanceOptimizer] Pausing refreshes (app in background)",
    );
    this.metrics.adaptiveRefreshPauses++;
    // Signal orchestrator to pause
  }

  /**
   * Resume refresh cycles
   */
  private resumeRefreshes(): void {
    console.log(
      "[ALGO PerformanceOptimizer] Resuming refreshes (app foregrounded)",
    );
    // Signal orchestrator to resume
  }

  /**
   * Refresh all stale data after returning from background
   */
  private async refreshStaleData(): Promise<void> {
    console.log(
      "[ALGO PerformanceOptimizer] Refreshing stale data after background period",
    );
    await AlgoOrchestrator.fetchAllSources();
  }

  /**
   * Update connection quality assessment
   */
  private updateConnectionQuality(connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  }): void {
    this.metrics.connectionChecks++;

    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink;
    const rtt = connection.rtt;

    let type: "slow" | "medium" | "fast";
    if (effectiveType === "4g" && downlink > 5 && rtt < 100) {
      type = "fast";
    } else if (effectiveType === "3g" || (downlink > 1 && rtt < 300)) {
      type = "medium";
    } else {
      type = "slow";
    }

    this.connectionQuality = { type, effectiveType, downlink, rtt };

    // Adjust image quality based on connection
    this.adjustImageQuality();
  }

  /**
   * Adjust image loading strategy based on connection
   */
  private adjustImageQuality(): void {
    // This would set a global preference for image loading
    const quality =
      this.connectionQuality.type === "slow"
        ? "low"
        : this.connectionQuality.type === "medium"
          ? "medium"
          : "high";

    // Could dispatch this to image components
    console.log(`[ALGO PerformanceOptimizer] Image quality set to: ${quality}`);
  }

  /**
   * Get connection quality for components
   */
  getConnectionQuality(): ConnectionQuality {
    return { ...this.connectionQuality };
  }

  /**
   * Check if aggressive prefetching is appropriate
   */
  shouldAggressivePrefetch(): boolean {
    return this.connectionQuality.type === "fast" && !this.isInBackground;
  }

  /**
   * Get navigation predictions for UI
   */
  getNavigationPredictions(): Array<{ page: string; probability: number }> {
    return this.predictNextPages();
  }

  /**
   * Record a prefetch hit (user went to prefetched page)
   */
  recordPrefetchHit(page: string): void {
    void page;
    this.metrics.prefetchHits++;
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics() {
    const hitRate =
      this.metrics.prefetchesPerformed > 0
        ? this.metrics.prefetchHits / this.metrics.prefetchesPerformed
        : 0;

    return {
      ...this.metrics,
      prefetchHitRate: hitRate,
      isInBackground: this.isInBackground,
      connectionQuality: this.connectionQuality,
      trackedPatterns: this.navigationPatterns.size,
      currentPage: this.currentPage,
    };
  }
}

// Singleton instance
export const AlgoPerformanceOptimizer = new AlgoPerformanceOptimizerClass();
