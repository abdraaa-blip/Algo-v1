"use client";

import { useEffect } from "react";
import { Film, RefreshCw, Home, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { ALGO_UI_ERROR } from "@/lib/copy/ui-strings";

export default function MoviesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ALGO Movies Error]", error);
  }, [error]);

  return (
    <div className="algo-min-h-viewport-content flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm">
        {/* Icon */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-2xl bg-rose-500/10 border border-rose-500/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Film size={28} className="text-rose-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center">
            <AlertTriangle size={12} className="text-rose-400" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">
            Films temporairement indisponibles
          </h1>
          <p className="text-white/50 text-sm">{ALGO_UI_ERROR.message}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-500 text-white font-bold text-sm hover:bg-violet-400 transition-colors"
          >
            <RefreshCw size={16} />
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white/70 font-medium text-sm hover:bg-white/20 transition-colors"
          >
            <Home size={16} />
            Retour a l&apos;accueil
          </Link>
        </div>

        {/* Fallback suggestion */}
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-white/40">
            En attendant, vous pouvez explorer les autres tendances sur la page
            d&apos;accueil ou consulter le mode createur pour des idees de
            contenu.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Link
              href="/creator-mode"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Mode Createur
            </Link>
            <span className="text-white/20">•</span>
            <Link
              href="/trends"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Tendances
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
