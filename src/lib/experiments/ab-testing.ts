"use client";

// A/B Testing Infrastructure for ALGO
// Allows testing different layouts, features, and algorithms

export interface Experiment {
  id: string;
  name: string;
  variants: string[];
  weights?: number[]; // Optional weights for each variant
  active: boolean;
}

export interface ExperimentAssignment {
  experimentId: string;
  variant: string;
  assignedAt: number;
}

const STORAGE_KEY = "algo_experiments";

// Active experiments
const EXPERIMENTS: Experiment[] = [
  {
    id: "home_layout",
    name: "Home Page Layout",
    variants: ["control", "cards_large", "cards_compact", "list"],
    active: true,
  },
  {
    id: "score_display",
    name: "Viral Score Display",
    variants: ["ring", "badge", "bar"],
    active: true,
  },
  {
    id: "trend_sorting",
    name: "Trend Sorting Algorithm",
    variants: ["viral_score", "velocity", "recency", "hybrid"],
    active: true,
  },
  {
    id: "notification_timing",
    name: "Notification Timing",
    variants: ["immediate", "batched_hourly", "smart"],
    active: true,
  },
];

// Get or create user ID for experiment tracking
function getUserId(): string {
  if (typeof window === "undefined") return "server";

  let userId = localStorage.getItem("algo_user_id");
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("algo_user_id", userId);
  }
  return userId;
}

// Deterministic hash for consistent assignment
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Get variant assignment for an experiment
export function getVariant(experimentId: string): string | null {
  if (typeof window === "undefined") return null;

  const experiment = EXPERIMENTS.find((e) => e.id === experimentId && e.active);
  if (!experiment) return null;

  // Check for stored assignment
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const assignments: Record<string, ExperimentAssignment> = stored
      ? JSON.parse(stored)
      : {};

    if (assignments[experimentId]) {
      return assignments[experimentId].variant;
    }

    // Assign new variant based on user ID hash
    const userId = getUserId();
    const hash = hashCode(`${userId}_${experimentId}`);
    const variantIndex = hash % experiment.variants.length;
    const variant = experiment.variants[variantIndex];

    // Store assignment
    assignments[experimentId] = {
      experimentId,
      variant,
      assignedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));

    // Track assignment
    trackExperimentAssignment(experimentId, variant);

    return variant;
  } catch (error) {
    console.error("Failed to get experiment variant:", error);
    return experiment.variants[0];
  }
}

// Track experiment assignment
function trackExperimentAssignment(experimentId: string, variant: string) {
  // In production: send to analytics service
  if (process.env.NODE_ENV === "development") {
    console.log("[ALGO Experiment]", {
      experimentId,
      variant,
      userId: getUserId(),
    });
  }
}

// Track conversion for an experiment
export function trackConversion(
  experimentId: string,
  metric: string,
  value?: number,
) {
  const variant = getVariant(experimentId);
  if (!variant) return;

  // In production: send to analytics service
  if (process.env.NODE_ENV === "development") {
    console.log("[ALGO Conversion]", {
      experimentId,
      variant,
      metric,
      value,
      userId: getUserId(),
      timestamp: Date.now(),
    });
  }
}

// React hook for experiments
import { useMemo } from "react";

export function useExperiment(experimentId: string): {
  variant: string | null;
  isLoading: boolean;
  trackConversion: (metric: string, value?: number) => void;
} {
  const variant = useMemo(() => getVariant(experimentId), [experimentId]);

  return {
    variant,
    isLoading: false,
    trackConversion: (metric: string, value?: number) => {
      trackConversion(experimentId, metric, value);
    },
  };
}

// Get all active experiments for debugging
export function getActiveExperiments(): Array<{
  experiment: Experiment;
  variant: string | null;
}> {
  return EXPERIMENTS.filter((e) => e.active).map((experiment) => ({
    experiment,
    variant: getVariant(experiment.id),
  }));
}

// Override experiment variant (for testing/debugging)
export function overrideVariant(experimentId: string, variant: string) {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const assignments: Record<string, ExperimentAssignment> = stored
      ? JSON.parse(stored)
      : {};

    assignments[experimentId] = {
      experimentId,
      variant,
      assignedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch (error) {
    console.error("Failed to override variant:", error);
  }
}

// Reset all experiment assignments
export function resetExperiments() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
