'use client'

import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UnavailableContentProps {
  title?: string
  message?: string
  showRefresh?: boolean
  showBackButton?: boolean
  showHomeButton?: boolean
  variant?: 'default' | 'compact' | 'inline'
}

export function UnavailableContent({
  title = 'Contenu indisponible',
  message = 'Ce contenu est temporairement indisponible. Réessaie plus tard.',
  showRefresh = true,
  showBackButton = true,
  showHomeButton = true,
  variant = 'default'
}: UnavailableContentProps) {
  const router = useRouter()

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
        <AlertCircle size={16} className="text-white/40 flex-shrink-0" />
        <span className="text-sm text-white/60">{message}</span>
        {showRefresh && (
          <button
            onClick={() => window.location.reload()}
            className="ml-auto p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            aria-label="Rafraîchir"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={24} className="text-white/40" />
        </div>
        <p className="text-sm text-white/60 mb-4">{message}</p>
        <div className="flex items-center justify-center gap-2">
          {showRefresh && (
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-white/60 text-sm hover:bg-white/20 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
              Réessayer
            </button>
          )}
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white/50 text-sm hover:bg-white/10 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              Retour
            </button>
          )}
        </div>
      </div>
    )
  }

  // Default full-page variant
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-white/5 flex items-center justify-center mb-6">
        <AlertCircle size={36} className="text-white/30" />
      </div>
      
      <h1 className="text-xl font-bold text-white mb-2">{title}</h1>
      <p className="text-white/50 text-center max-w-sm mb-8">{message}</p>
      
      <div className="flex flex-wrap items-center justify-center gap-3">
        {showRefresh && (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-500/20 text-violet-300 font-medium hover:bg-violet-500/30 transition-colors"
          >
            <RefreshCw size={18} />
            Réessayer
          </button>
        )}
        {showBackButton && (
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white/70 font-medium hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={18} />
            Retour
          </button>
        )}
        {showHomeButton && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 text-white/50 font-medium hover:bg-white/10 hover:text-white/80 transition-colors"
          >
            <Home size={18} />
            Accueil
          </Link>
        )}
      </div>
    </div>
  )
}

// Export a simple fallback for video/trailer errors
export function VideoUnavailable({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="aspect-video rounded-xl bg-black/50 flex flex-col items-center justify-center">
      <AlertCircle size={32} className="text-white/30 mb-3" />
      <p className="text-sm text-white/50 mb-3">Vidéo non disponible</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/20 transition-colors"
        >
          <RefreshCw size={12} />
          Réessayer
        </button>
      )}
    </div>
  )
}
