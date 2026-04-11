/**
 * ALGO Monitoring & Alerting System
 *
 * Central logging, error tracking, and performance monitoring
 * Compatible with Sentry, LogRocket, and custom analytics
 */

import { logger } from "@/lib/logger";

// Types
export type AlertSeverity = "info" | "warning" | "error" | "critical";
export type AlertChannel = "console" | "api" | "storage";

export interface MonitoringEvent {
  type: "error" | "warning" | "performance" | "auth" | "rls" | "api";
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  context: {
    component?: string;
    service?: string;
    userId?: string;
    scope?: string;
    url?: string;
    userAgent?: string;
    [key: string]: unknown;
  };
  stack?: string;
  metadata?: Record<string, unknown>;
}

interface PerformanceAnomaly {
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
}

// In-memory event buffer for batching
const eventBuffer: MonitoringEvent[] = [];
const BUFFER_FLUSH_INTERVAL = 10000; // 10 seconds
const MAX_BUFFER_SIZE = 100;

// Performance anomalies tracking
const performanceAnomalies: PerformanceAnomaly[] = [];

/**
 * Initialize monitoring system
 */
export function initMonitoring(): void {
  if (typeof window === "undefined") return;

  // Set up periodic buffer flush
  setInterval(flushEventBuffer, BUFFER_FLUSH_INTERVAL);

  // Capture unhandled errors
  window.addEventListener("error", (event) => {
    captureError(event.error || new Error(event.message), {
      component: "window",
      url: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    captureError(event.reason, {
      component: "promise",
      type: "unhandledrejection",
    });
  });

  logger.info("[Monitoring] Initialized");
}

/**
 * Capture and log an error
 */
export function captureError(
  error: Error | unknown,
  context: MonitoringEvent["context"] = {},
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  const event: MonitoringEvent = {
    type: "error",
    message: errorObj.message,
    severity: "error",
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    },
    stack: errorObj.stack,
  };

  addToBuffer(event);
  logger.error(
    `[Monitoring] Error captured: ${errorObj.message}`,
    errorObj,
    context,
  );
}

/**
 * Capture auth failures
 */
export function captureAuthFailure(
  reason: string,
  context: MonitoringEvent["context"] = {},
): void {
  const event: MonitoringEvent = {
    type: "auth",
    message: `Auth failure: ${reason}`,
    severity: "warning",
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    },
  };

  addToBuffer(event);
  logger.warn(`[Monitoring] Auth failure: ${reason}`, context);
}

/**
 * Capture RLS (Row Level Security) violations
 */
export function captureRLSViolation(
  table: string,
  operation: string,
  context: MonitoringEvent["context"] = {},
): void {
  const event: MonitoringEvent = {
    type: "rls",
    message: `RLS violation: ${operation} on ${table}`,
    severity: "critical",
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      table,
      operation,
    },
  };

  addToBuffer(event);
  logger.error(
    `[Monitoring] RLS violation: ${operation} on ${table}`,
    new Error(`RLS: ${operation} on ${table}`),
    context,
  );

  // Trigger immediate alert for RLS violations
  triggerAlert(event);
}

/**
 * Capture unexpected API responses
 */
export function captureAPIError(
  endpoint: string,
  status: number,
  response: unknown,
  context: MonitoringEvent["context"] = {},
): void {
  const severity: AlertSeverity = status >= 500 ? "error" : "warning";

  const event: MonitoringEvent = {
    type: "api",
    message: `API error: ${status} from ${endpoint}`,
    severity,
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      endpoint,
      status,
    },
    metadata: { response },
  };

  addToBuffer(event);
  logger.warn(`[Monitoring] API error: ${status} from ${endpoint}`);
}

/**
 * Track performance anomalies
 */
export function trackPerformanceAnomaly(
  metric: string,
  value: number,
  threshold: number,
): void {
  if (value > threshold) {
    const anomaly: PerformanceAnomaly = {
      metric,
      value,
      threshold,
      timestamp: new Date().toISOString(),
    };

    performanceAnomalies.push(anomaly);

    // Keep only last 100 anomalies
    if (performanceAnomalies.length > 100) {
      performanceAnomalies.shift();
    }

    const event: MonitoringEvent = {
      type: "performance",
      message: `Performance anomaly: ${metric} = ${value.toFixed(2)} (threshold: ${threshold})`,
      severity: value > threshold * 2 ? "error" : "warning",
      timestamp: anomaly.timestamp,
      context: { metric },
      metadata: { value, threshold },
    };

    addToBuffer(event);
    logger.warn(`[Monitoring] Performance anomaly: ${metric}`, {
      value,
      threshold,
    });
  }
}

/**
 * Generate daily monitoring report
 */
export function generateDailyReport(): {
  totalErrors: number;
  totalWarnings: number;
  authFailures: number;
  rlsViolations: number;
  apiErrors: number;
  performanceAnomalies: number;
  topErrors: { message: string; count: number }[];
} {
  const today = new Date().toISOString().split("T")[0];
  const todayEvents = eventBuffer.filter((e) =>
    e.timestamp.startsWith(today || ""),
  );

  const errorCounts = new Map<string, number>();
  let totalErrors = 0;
  let totalWarnings = 0;
  let authFailures = 0;
  let rlsViolations = 0;
  let apiErrors = 0;

  todayEvents.forEach((event) => {
    if (event.severity === "error" || event.severity === "critical") {
      totalErrors++;
      const count = errorCounts.get(event.message) || 0;
      errorCounts.set(event.message, count + 1);
    }
    if (event.severity === "warning") totalWarnings++;
    if (event.type === "auth") authFailures++;
    if (event.type === "rls") rlsViolations++;
    if (event.type === "api") apiErrors++;
  });

  const topErrors = Array.from(errorCounts.entries())
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalErrors,
    totalWarnings,
    authFailures,
    rlsViolations,
    apiErrors,
    performanceAnomalies: performanceAnomalies.filter((a) =>
      a.timestamp.startsWith(today || ""),
    ).length,
    topErrors,
  };
}

/**
 * Add event to buffer
 */
function addToBuffer(event: MonitoringEvent): void {
  eventBuffer.push(event);

  // Prevent buffer overflow
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    flushEventBuffer();
  }
}

/**
 * Flush event buffer to storage/API
 */
async function flushEventBuffer(): Promise<void> {
  if (eventBuffer.length === 0) return;

  const events = [...eventBuffer];
  eventBuffer.length = 0;

  // In development, just log
  if (process.env.NODE_ENV === "development") {
    return;
  }

  // In production, send to monitoring endpoint
  try {
    await fetch("/api/monitoring/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });
  } catch {
    // Re-add events to buffer on failure
    eventBuffer.push(...events);
    logger.error("[Monitoring] Failed to flush event buffer");
  }
}

/**
 * Trigger immediate alert for critical events
 */
function triggerAlert(event: MonitoringEvent): void {
  // In production, this would send to PagerDuty, Slack, etc.
  logger.error(`[ALERT] ${event.message}`, new Error(event.message), {
    alertType: event.type,
    severity: event.severity,
    timestamp: event.timestamp,
    ...event.context,
  });
}

/**
 * Get monitoring health status
 */
export function getMonitoringHealth(): {
  status: "healthy" | "degraded" | "unhealthy";
  bufferSize: number;
  recentErrors: number;
  recentAnomalies: number;
} {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const recentEvents = eventBuffer.filter((e) => e.timestamp > fiveMinutesAgo);
  const recentErrors = recentEvents.filter(
    (e) => e.severity === "error" || e.severity === "critical",
  ).length;
  const recentAnomalies = performanceAnomalies.filter(
    (a) => a.timestamp > fiveMinutesAgo,
  ).length;

  let status: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (recentErrors > 10 || recentAnomalies > 20) {
    status = "unhealthy";
  } else if (recentErrors > 5 || recentAnomalies > 10) {
    status = "degraded";
  }

  return {
    status,
    bufferSize: eventBuffer.length,
    recentErrors,
    recentAnomalies,
  };
}

// Export singleton functions
export const monitoring = {
  init: initMonitoring,
  captureError,
  captureAuthFailure,
  captureRLSViolation,
  captureAPIError,
  trackPerformanceAnomaly,
  generateDailyReport,
  getHealth: getMonitoringHealth,
};
