'use client'
// Error boundary for news page - 2026-04-06T22:10

import { useEffect } from 'react'
import { Newspaper, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { ALGO_UI_ERROR } from '@/lib/copy/ui-strings'

export default function NewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ALGO News Error]', error)
  }, [error])

  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="size-16 rounded-2xl bg-amber-500/12 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Newspaper size={28} strokeWidth={1.5} className="text-amber-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-[var(--color-text-primary)] font-bold text-lg">Actualites indisponibles</h1>
          <p className="text-[var(--color-text-tertiary)] text-sm leading-relaxed">
            {ALGO_UI_ERROR.message}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-300 text-sm font-semibold hover:bg-amber-500/25 transition-all duration-150"
          >
            <RefreshCw size={16} />
            Reessayer
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-medium hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text-primary)] transition-all duration-150"
          >
            <Home size={16} />
            Retour a l&apos;accueil
          </Link>
        </div>

        {error.digest && (
          <p className="text-[var(--color-text-muted)] text-xs font-mono">
            Code erreur: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
