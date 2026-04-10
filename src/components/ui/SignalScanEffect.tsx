'use client'

import { useEffect, useState } from 'react'

// Clé sessionStorage — la ligne ne traverse l'écran qu'une seule fois par session.
const SESSION_KEY = 'algo_signal_scan_done'

export function SignalScanEffect() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return
    if (sessionStorage.getItem(SESSION_KEY)) return

    // Légère temporisation pour laisser le DOM se stabiliser
    const showTimer = setTimeout(() => setVisible(true), 80)

    // Marquer comme fait dès que lancé
    sessionStorage.setItem(SESSION_KEY, '1')

    // Retirer après la durée de l'animation (0.9s)
    const hideTimer = setTimeout(() => setVisible(false), 1100)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-[350] overflow-hidden"
    >
      <div
        style={{
          position:   'absolute',
          top:        0,
          bottom:     0,
          width:      '1px',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(123,97,255,0.65) 20%, rgba(123,97,255,0.65) 80%, transparent 100%)',
          animation:  'algo-signal-scan 0.9s cubic-bezier(0.4,0,0.2,1) forwards',
        }}
      />
    </div>
  )
}
