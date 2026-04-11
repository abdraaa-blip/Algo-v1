"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SwipeConfig {
  threshold?: number;
  velocityThreshold?: number;
  enabled?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useSwipeNavigation({
  threshold = 100,
  velocityThreshold = 0.5,
  enabled = true,
  onSwipeLeft,
  onSwipeRight,
}: SwipeConfig = {}) {
  const router = useRouter();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isScrolling = useRef<boolean | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      touchStartTime.current = Date.now();
      isScrolling.current = null;
    },
    [enabled],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      // Determine if this is a horizontal or vertical scroll
      if (isScrolling.current === null) {
        isScrolling.current = Math.abs(deltaY) > Math.abs(deltaX);
      }

      // If horizontal swipe and started from edge, prevent default scroll
      if (!isScrolling.current && touchStartX.current < 30) {
        e.preventDefault();
      }
    },
    [enabled],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || isScrolling.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaTime = Date.now() - touchStartTime.current;
      const velocity = Math.abs(deltaX) / deltaTime;

      // Check if swipe meets threshold
      if (Math.abs(deltaX) > threshold || velocity > velocityThreshold) {
        if (deltaX > 0) {
          // Swipe right - go back
          if (onSwipeRight) {
            onSwipeRight();
          } else if (window.history.length > 2) {
            router.back();
          }
        } else {
          // Swipe left - go forward
          if (onSwipeLeft) {
            onSwipeLeft();
          } else if (window.history.length > 1) {
            router.forward();
          }
        }
      }
    },
    [enabled, threshold, velocityThreshold, router, onSwipeLeft, onSwipeRight],
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const options: AddEventListenerOptions = { passive: false };

    document.addEventListener("touchstart", handleTouchStart, options);
    document.addEventListener("touchmove", handleTouchMove, options);
    document.addEventListener("touchend", handleTouchEnd, options);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
}

// Edge swipe indicator component
export function SwipeIndicator() {
  if (typeof document === "undefined") return null;
  return null;
}
