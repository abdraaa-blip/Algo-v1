'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { ALGO_UI_ERROR } from '@/lib/copy/ui-strings'

export default function AuthSignUpError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ALGO Auth] Sign up error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a12]">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        
        <div>
          <h1 className="text-xl font-bold text-white mb-2">Erreur d&apos;inscription</h1>
          <p className="text-white/60 text-sm">{ALGO_UI_ERROR.message}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors"
          >
            <RefreshCw size={16} />
            Reessayer
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Home size={16} />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
