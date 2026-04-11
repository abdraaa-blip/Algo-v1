"use client";

import { useEffect } from "react";

/**
 * Global error handler component that catches:
 * - Uncaught exceptions (window.onerror)
 * - Unhandled promise rejections
 * - Resource loading errors
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle uncaught exceptions
    const handleError = (event: ErrorEvent) => {
      const message = event.message || "";

      // Ignore known non-critical errors (performance.measure errors are benign Next.js internal issues)
      const ignoredErrors = [
        "negative time stamp", // Next.js Performance.measure internal error
        "cannot have a negative", // Performance.measure timestamp errors
        "Failed to execute 'measure'", // Performance API errors
        "ResizeObserver loop", // Browser resize observer benign error
        "Script error", // Cross-origin script errors we can't access
        "Loading chunk", // Dynamic import retry handled separately
        "ChunkLoadError", // Webpack chunk loading
      ];

      if (
        ignoredErrors.some((ignored) =>
          message.toLowerCase().includes(ignored.toLowerCase()),
        )
      ) {
        event.preventDefault();
        return;
      }

      console.error("[ALGO Global] Uncaught error:", event.error || message);

      // Report to error tracking service
      reportError({
        type: "uncaught_exception",
        message: message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });

      // Prevent default browser error handling in production
      if (process.env.NODE_ENV === "production") {
        event.preventDefault();
      }
    };

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("[ALGO Global] Unhandled rejection:", event.reason);

      reportError({
        type: "unhandled_rejection",
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
      });

      // Prevent default browser handling in production
      if (process.env.NODE_ENV === "production") {
        event.preventDefault();
      }
    };

    // Handle resource loading errors
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "IMG" ||
        target.tagName === "SCRIPT" ||
        target.tagName === "LINK"
      ) {
        const src =
          (target as HTMLImageElement).src || (target as HTMLLinkElement).href;
        console.warn("[ALGO Global] Resource failed to load:", src);

        reportError({
          type: "resource_error",
          message: `Failed to load ${target.tagName}: ${src}`,
          resource: src,
        });
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleResourceError, true); // Capture phase for resource errors

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleResourceError, true);
    };
  }, []);

  return null; // This component doesn't render anything
}

interface ErrorReport {
  type: string;
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  resource?: string;
}

async function reportError(error: ErrorReport): Promise<void> {
  // Only report in production
  if (process.env.NODE_ENV !== "production") return;

  try {
    await fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...error,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Silently fail - we don't want error reporting to cause more errors
  }
}
