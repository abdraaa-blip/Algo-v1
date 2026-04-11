"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { ALGO_UI_ERROR } from "@/lib/copy/ui-strings";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ALGO Error]", error);

    // Send to error tracking service
    if (
      process.env.NODE_ENV === "production" &&
      typeof window !== "undefined"
    ) {
      fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          digest: error.digest,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  }, [error]);

  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="size-14 rounded-2xl bg-rose-500/12 border border-rose-500/18 flex items-center justify-center mx-auto">
          <AlertTriangle
            size={24}
            strokeWidth={1.5}
            className="text-rose-400"
            aria-hidden
          />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-white font-bold text-base">
            {ALGO_UI_ERROR.title}
          </h1>
          <p className="text-white/35 text-sm">{ALGO_UI_ERROR.message}</p>
        </div>

        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-white/6 border border-white/10 text-white/65 text-sm font-bold hover:bg-white/10 hover:text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
