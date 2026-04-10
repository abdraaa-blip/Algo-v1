'use client'

import { useEffect } from 'react'
import { FileQuestion, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ALGO_UI_ERROR } from '@/lib/copy/ui-strings'

export default function ContentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  
  useEffect(() => {
    console.error('[ALGO Content Error]', error)
  }, [error])

  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="size-16 rounded-2xl bg-sky-500/12 border border-sky-500/20 flex items-center justify-center mx-auto">
          <FileQuestion size={28} strokeWidth={1.5} className="text-sky-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-white font-bold text-lg">Contenu indisponible</h1>
          <p className="text-white/40 text-sm leading-relaxed">{ALGO_UI_ERROR.message}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-300 text-sm font-semibold hover:bg-sky-500/25 transition-all duration-150"
          >
            <RefreshCw size={16} />
            Reessayer
          </button>
          
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white/80 transition-all duration-150"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white/80 transition-all duration-150"
          >
            <Home size={16} />
            Accueil
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
