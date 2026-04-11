'use client'

// =============================================================================
// ALGO V1 · NotificationPrompt
// Composant de demande de permission pour les notifications push.
// S'affiche une seule fois, disparait apres interaction.
// =============================================================================

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { cn } from '@/lib/utils'

const PROMPT_DISMISSED_KEY = 'algo_notif_prompt_dismissed'

interface NotificationPromptProps {
  labels: {
    title: string
    description: string
    enable: string
    later: string
  }
}

export function NotificationPrompt({ labels }: NotificationPromptProps) {
  const { isPushSupported, pushStatus, requestPushPermission } = useServiceWorker()
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Ne montre pas si deja dismiss, deja granted, ou pas supporte
    if (!isPushSupported) return
    if (pushStatus === 'granted' || pushStatus === 'denied') return
    
    try {
      const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY)
      if (dismissed) return
    } catch {
      // Ignore
    }

    // Affiche apres un delai pour ne pas interrompre immediatement
    const timer = setTimeout(() => setIsVisible(true), 5000)
    return () => clearTimeout(timer)
  }, [isPushSupported, pushStatus])

  const handleEnable = async () => {
    setIsLoading(true)
    await requestPushPermission()
    setIsLoading(false)
    dismiss()
  }

  const dismiss = () => {
    setIsVisible(false)
    try {
      localStorage.setItem(PROMPT_DISMISSED_KEY, '1')
    } catch {
      // Ignore
    }
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'fixed bottom-20 md:bottom-6 inset-x-4 md:start-auto md:end-6 md:max-w-sm z-50',
        'bg-[#0d0d1a] border border-white/10 rounded-2xl p-4',
        'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        'animate-[algo-fade-up_350ms_ease-out]',
      )}
      role="dialog"
      aria-labelledby="notif-prompt-title"
    >
      <button
        onClick={dismiss}
        className="absolute top-2 end-2 p-2.5 rounded-lg hover:bg-white/5 text-white/35 hover:text-white/60 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Fermer"
      >
        <X size={18} aria-hidden="true" />
      </button>

      <div className="flex gap-3">
        <div
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(123,97,255,0.15)', border: '1px solid rgba(123,97,255,0.25)' }}
        >
          <Bell size={18} className="text-violet-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            id="notif-prompt-title"
            className="text-sm font-bold text-white mb-1"
          >
            {labels.title}
          </h3>
          <p className="text-xs text-white/45 mb-3">
            {labels.description}
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg text-xs font-bold min-h-[44px]',
                'bg-violet-500 text-white hover:bg-violet-400',
                'transition-all duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isLoading ? '...' : labels.enable}
            </button>
            <button
              onClick={dismiss}
              className="py-3 px-4 rounded-lg text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/5 transition-all min-h-[44px]"
            >
              {labels.later}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
