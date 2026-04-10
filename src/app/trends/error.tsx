'use client'

import { useEffect } from 'react'
import { TrendingUp, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { ALGO_UI_ERROR } from '@/lib/copy/ui-strings'

export default function TrendsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ALGO Trends Error]', error)
  }, [error])

  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="size-16 rounded-2xl bg-violet-500/12 border border-violet-500/20 flex items-center justify-center mx-auto">
          <TrendingUp size={28} strokeWidth={1.5} className="text-violet-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-white font-bold text-lg">Tendances indisponibles</h1>
          <p className="text-white/40 text-sm leading-relaxed">{ALGO_UI_ERROR.message}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300 text-sm font-semibold hover:bg-violet-500/25 transition-all duration-150"
          >
            <RefreshCw size={16} />
            Reessayer
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white/80 transition-all duration-150"
          >
            <Home size={16} />
            Retour a l&apos;accueil
          </Link>
        </div>

        {error.digest && (
          <p className="text-white/20 text-xs font-mono">
            Code erreur: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
