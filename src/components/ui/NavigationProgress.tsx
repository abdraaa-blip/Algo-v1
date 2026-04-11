"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavigationProgressProps {
  color?: string;
  height?: number;
  showSpinner?: boolean;
}

export function NavigationProgress({
  color = "rgb(139, 92, 246)", // violet-500
  height = 3,
  showSpinner = true,
}: NavigationProgressProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const startProgress = useCallback(() => {
    setIsVisible(true);
    setIsComplete(false);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        // Slow down as we approach 90%
        const increment = Math.max(1, (90 - prev) / 10);
        return Math.min(90, prev + increment);
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const completeProgress = useCallback(() => {
    setProgress(100);
    setIsComplete(true);

    setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  // Track navigation
  useEffect(() => {
    // Complete progress when URL changes
    completeProgress();
  }, [pathname, searchParams, completeProgress]);

  // Intercept link clicks to start progress
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && !link.target && !link.download) {
        const url = new URL(link.href);
        if (
          url.origin === window.location.origin &&
          url.pathname !== pathname
        ) {
          startProgress();
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname, startProgress]);

  if (!isVisible) return null;

  return (
    <>
      {/* Progress bar */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-[9999] pointer-events-none",
          "transition-opacity duration-300",
          isComplete ? "opacity-0" : "opacity-100",
        )}
        style={{ height }}
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 10px ${color}80, 0 0 5px ${color}60`,
          }}
        />
      </div>

      {/* Spinner */}
      {showSpinner && !isComplete && (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
          <div
            className="size-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${color}40`, borderTopColor: color }}
          />
        </div>
      )}
    </>
  );
}

// Hook for programmatic control
export function useNavigationProgress() {
  const [isNavigating, setIsNavigating] = useState(false);

  const start = useCallback(() => {
    setIsNavigating(true);
    // Dispatch custom event for the progress bar
    window.dispatchEvent(new CustomEvent("navigation:start"));
  }, []);

  const done = useCallback(() => {
    setIsNavigating(false);
    window.dispatchEvent(new CustomEvent("navigation:done"));
  }, []);

  return { isNavigating, start, done };
}

export default NavigationProgress;
