"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

/**
 * Offline Banner - Shows when user loses connection
 * Supports slow connection warnings too
 */
export function OfflineBanner() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Track if we were offline to show reconnection message
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setDismissed(false);
    } else if (wasOffline) {
      setShowReconnected(true);
      setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
    }
  }, [isOnline, wasOffline]);

  // Reset dismissed state when going offline
  useEffect(() => {
    if (!isOnline) {
      setDismissed(false);
    }
  }, [isOnline]);

  // Show reconnected message
  if (showReconnected) {
    return (
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-[100]",
          "bg-emerald-500/95 backdrop-blur-sm",
          "px-4 py-2.5",
          "animate-in slide-in-from-top duration-300",
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <Wifi size={16} className="text-white" />
          <span className="text-sm font-medium text-white">
            Connexion retablie
          </span>
        </div>
      </div>
    );
  }

  // Don't show if online and not slow
  if (isOnline && !isSlowConnection) {
    return null;
  }

  // Don't show if dismissed (only for slow connection warning)
  if (dismissed && isOnline && isSlowConnection) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100]",
        "backdrop-blur-sm",
        "px-4 py-2.5",
        "animate-in slide-in-from-top duration-300",
        !isOnline ? "bg-red-500/95" : "bg-amber-500/95",
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff size={16} className="text-white shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-white shrink-0" />
          )}
          <span className="text-sm font-medium text-white">
            {!isOnline
              ? "Vous etes hors ligne. Le contenu cache est affiche."
              : "Connexion lente détectée. Certaines fonctionnalités peuvent être limitées."}
          </span>
        </div>

        {isOnline && isSlowConnection && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Fermer"
          >
            <X size={14} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Simple offline indicator for compact UIs
 */
export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/15 border border-red-500/25">
      <WifiOff size={12} className="text-red-400" />
      <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">
        Hors ligne
      </span>
    </div>
  );
}
