'use client'

// =============================================================================
// ALGO V1 — ServiceWorkerRegister
// Composant silencieux qui enregistre le SW au montage de l'app.
// =============================================================================

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // First, unregister ALL existing service workers to clear stale caches
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister()
      }
    }).then(() => {
      // Clear all caches
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name)
          }
        })
      }
    }).then(() => {
      // Register fresh service worker after clearing
      return navigator.serviceWorker.register('/sw.js')
    }).catch(() => {
      // Silently fail — SW is optional enhancement
    })
  }, [])

  return null
}
