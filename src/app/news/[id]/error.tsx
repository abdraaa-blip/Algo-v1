'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { ALGO_UI_ERROR } from '@/lib/copy/ui-strings'

export default function NewsDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ALGO News Detail Error]', error)
  }, [error])

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-[var(--color-bg-primary)]">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Article indisponible</h1>
          <p className="text-white/50 text-sm">{ALGO_UI_ERROR.message}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors">
            <RefreshCw size={16} />
            Réessayer
          </button>
          <Link href="/news" className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors">
            <Home size={16} />
            Actualites
          </Link>
        </div>
      </div>
    </div>
  )
}
