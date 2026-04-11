"use client";

import { useState, useCallback } from "react";
import { RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  className?: string;
  onRefresh?: () => Promise<void> | void;
  floating?: boolean;
}

/**
 * RefreshButton - Bouton de rafraichissement manuel
 * Permet à l'utilisateur de forcer un rafraîchissement des données et de vider le cache
 */
export function RefreshButton({
  className,
  onRefresh,
  floating = false,
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      // Clear browser caches
      if (typeof window !== "undefined") {
        // Clear service worker caches
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        }

        // Clear localStorage cache keys (only ALGO-related)
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("algo-") || key?.startsWith("cache-")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));

        // Clear sessionStorage
        sessionStorage.clear();
      }

      // Call custom refresh handler if provided
      if (onRefresh) {
        await onRefresh();
      }

      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Hard refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("[RefreshButton] Error:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  if (floating) {
    return (
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={cn(
          // Position higher above BottomNav to avoid overlap with cached badge
          "fixed bottom-28 right-4 z-50",
          "flex items-center justify-center",
          "size-14 rounded-full",
          "bg-violet-600 hover:bg-violet-500",
          "text-white shadow-xl shadow-violet-500/40",
          "transition-all duration-200",
          "active:scale-95",
          "pointer-events-auto",
          "border-2 border-violet-400/30",
          isRefreshing && "opacity-75 cursor-not-allowed",
          showSuccess && "bg-green-500 hover:bg-green-500 border-green-400/30",
          className,
        )}
        title="Rafraichir et vider le cache"
        aria-label="Rafraichir la page"
        suppressHydrationWarning
      >
        {showSuccess ? (
          <Check size={22} />
        ) : (
          <RefreshCw size={22} className={isRefreshing ? "animate-spin" : ""} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "bg-white/5 hover:bg-white/10",
        "text-white/60 hover:text-white",
        "border border-white/10 hover:border-white/20",
        "text-sm font-medium",
        "transition-all duration-200",
        isRefreshing && "opacity-75 cursor-not-allowed",
        showSuccess && "bg-green-500/20 border-green-500/30 text-green-400",
        className,
      )}
      title="Rafraichir et vider le cache"
    >
      {showSuccess ? (
        <>
          <Check size={14} />
          <span>Actualise!</span>
        </>
      ) : (
        <>
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          <span>{isRefreshing ? "Actualisation..." : "Rafraichir"}</span>
        </>
      )}
    </button>
  );
}

export default RefreshButton;
