'use client'

import { useEffect, useState } from 'react'

/**
 * SignalSweep - A thin violet line that sweeps across the screen once per session
 * Creates a "scanning" effect when the app first loads
 */
export function SignalSweep() {
  const [hasPlayed, setHasPlayed] = useState(true) // Start hidden
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // Check if we've already played this session
    const sessionKey = 'algo_signal_sweep_played'
    const alreadyPlayed = sessionStorage.getItem(sessionKey)

    if (!alreadyPlayed) {
      // Show the sweep
      setHasPlayed(false)
      setShouldShow(true)
      
      // Mark as played for this session
      sessionStorage.setItem(sessionKey, 'true')
      
      // Hide after animation completes
      const timer = setTimeout(() => {
        setHasPlayed(true)
        setShouldShow(false)
      }, 2500)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [])

  if (hasPlayed || !shouldShow) return null

  return (
    <div 
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* The sweep line */}
      <div 
        className="absolute top-0 bottom-0 w-1 animate-signal-sweep"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #7B61FF 50%, transparent 100%)',
          boxShadow: '0 0 30px 10px rgba(123, 97, 255, 0.5), 0 0 60px 20px rgba(123, 97, 255, 0.3)',
        }}
      />
      
      {/* Trailing glow effect */}
      <div 
        className="absolute top-0 bottom-0 w-32 animate-signal-sweep"
        style={{
          background: 'linear-gradient(90deg, rgba(123, 97, 255, 0.2) 0%, transparent 100%)',
          animationDelay: '0.1s',
        }}
      />
    </div>
  )
}
