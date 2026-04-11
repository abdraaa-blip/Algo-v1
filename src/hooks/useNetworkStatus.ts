"use client";

import { useState, useEffect, useCallback } from "react";

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
}

/**
 * Hook to track network status and connection quality
 * Shows offline banner and adjusts behavior for slow connections
 */
export function useNetworkStatus(): NetworkStatus {
  const getCurrentStatus = useCallback((): NetworkStatus | undefined => {
    if (typeof navigator === "undefined") return;

    const connection = (
      navigator as Navigator & {
        connection?: {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
          saveData?: boolean;
        };
      }
    ).connection;

    const isSlowConnection =
      connection?.effectiveType === "2g" ||
      connection?.effectiveType === "slow-2g" ||
      (connection?.rtt && connection.rtt > 500);

    return {
      isOnline: navigator.onLine,
      isSlowConnection: isSlowConnection || false,
      connectionType: connection?.effectiveType || null,
      downlink: connection?.downlink || null,
      rtt: connection?.rtt || null,
      saveData: connection?.saveData || false,
    };
  }, []);

  const [status, setStatus] = useState<NetworkStatus>(
    () =>
      getCurrentStatus() ?? {
        isOnline: true,
        isSlowConnection: false,
        connectionType: null,
        downlink: null,
        rtt: null,
        saveData: false,
      },
  );

  const updateNetworkInfo = useCallback(() => {
    const current = getCurrentStatus();
    if (current) {
      setStatus(current);
    }
  }, [getCurrentStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      updateNetworkInfo();
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for connection changes
    const connection = (
      navigator as Navigator & {
        connection?: EventTarget;
      }
    ).connection;

    if (connection) {
      connection.addEventListener("change", updateNetworkInfo);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (connection) {
        connection.removeEventListener("change", updateNetworkInfo);
      }
    };
  }, [updateNetworkInfo]);

  return status;
}

/**
 * Check if we should use cached content
 */
export function shouldUseCachedContent(status: NetworkStatus): boolean {
  return !status.isOnline || status.isSlowConnection || status.saveData;
}

/**
 * Get recommended image quality based on connection
 */
export function getImageQuality(
  status: NetworkStatus,
): "low" | "medium" | "high" {
  if (!status.isOnline || status.saveData) return "low";
  if (status.isSlowConnection || (status.downlink && status.downlink < 1.5))
    return "low";
  if (status.downlink && status.downlink < 5) return "medium";
  return "high";
}
