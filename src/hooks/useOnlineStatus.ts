"use client";

import { useState, useEffect, useCallback } from "react";

interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnline: Date | null;
}

/**
 * Hook to detect online/offline status with automatic reconnection handling
 */
export function useOnlineStatus(): OnlineStatus & {
  checkConnection: () => Promise<boolean>;
} {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    wasOffline: false,
    lastOnline: null,
  });

  // Actively check connection by pinging an endpoint
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-store",
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      // Verify we're actually online
      const actuallyOnline = await checkConnection();

      setStatus((prev) => ({
        isOnline: actuallyOnline,
        wasOffline: !prev.isOnline,
        lastOnline: actuallyOnline ? new Date() : prev.lastOnline,
      }));

      if (actuallyOnline) {
        // Trigger data refresh event
        window.dispatchEvent(new CustomEvent("algo:reconnected"));
      }
    };

    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic connection check every 30 seconds when offline
    let intervalId: NodeJS.Timeout | undefined;

    if (!status.isOnline) {
      intervalId = setInterval(async () => {
        const online = await checkConnection();
        if (online) {
          handleOnline();
        }
      }, 30000);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (intervalId) clearInterval(intervalId);
    };
  }, [status.isOnline, checkConnection]);

  return { ...status, checkConnection };
}

/**
 * Hook to refresh data when connection is restored
 */
export function useReconnectionRefresh(refreshFn: () => void) {
  useEffect(() => {
    const handleReconnect = () => {
      refreshFn();
    };

    window.addEventListener("algo:reconnected", handleReconnect);
    return () =>
      window.removeEventListener("algo:reconnected", handleReconnect);
  }, [refreshFn]);
}
