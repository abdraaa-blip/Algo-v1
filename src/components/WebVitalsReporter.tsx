"use client";

import { useEffect } from "react";
import {
  initWebVitals,
  onWebVital,
  observeLongTasks,
} from "@/lib/performance/web-vitals";
import { trackPerformanceAnomaly } from "@/lib/monitoring";

/**
 * Component that initializes web vitals monitoring
 * This should be included in the root layout
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Initialize web vitals tracking
    initWebVitals();

    // Subscribe to metrics - disabled verbose logging
    const unsubscribe = onWebVital((metric) => {
      // Capture only degraded metrics to keep signal high.
      if (metric.rating === "poor" || metric.rating === "needs-improvement") {
        const thresholds: Record<typeof metric.name, number> = {
          LCP: 2500,
          FID: 100,
          CLS: 0.1,
          INP: 200,
          TTFB: 800,
          FCP: 1800,
        };
        trackPerformanceAnomaly(
          metric.name,
          metric.value,
          thresholds[metric.name],
        );
      }
    });

    // Observe long tasks - disabled verbose logging
    const unobserveLongTasks = observeLongTasks((duration) => {
      trackPerformanceAnomaly("LONG_TASK", duration, 50);
    });

    return () => {
      unsubscribe();
      unobserveLongTasks();
    };
  }, []);

  return null;
}
