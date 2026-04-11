'use client'

// =============================================================================
// ALGO V1 · useServiceWorker
// Hook pour enregistrer le service worker et gerer les notifications push.
// =============================================================================

import { useEffect, useState, useCallback } from 'react'

export type SWStatus = 'idle' | 'registering' | 'registered' | 'error' | 'unsupported'
export type PushStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'

export interface UseServiceWorkerReturn {
  swStatus: SWStatus
  pushStatus: PushStatus
  isSupported: boolean
  isPushSupported: boolean
  requestPushPermission: () => Promise<boolean>
  registration: ServiceWorkerRegistration | null
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator
  const isPushSupported = isSupported && 'PushManager' in window

  const [swStatus, setSwStatus] = useState<SWStatus>(isSupported ? 'registering' : 'unsupported')
  const [pushStatus, setPushStatus] = useState<PushStatus>('idle')
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // Enregistre le service worker au mount
  useEffect(() => {
    if (!isSupported) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setRegistration(reg)
        setSwStatus('registered')

        // Check push permission status
        if (isPushSupported && Notification.permission === 'granted') {
          setPushStatus('granted')
        } else if (Notification.permission === 'denied') {
          setPushStatus('denied')
        }
      })
      .catch(() => {
        setSwStatus('error')
      })
  }, [isSupported, isPushSupported])

  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported || !registration) {
      setPushStatus('unsupported')
      return false
    }

    setPushStatus('requesting')

    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        setPushStatus('granted')
        return true
      } else {
        setPushStatus('denied')
        return false
      }
    } catch {
      setPushStatus('denied')
      return false
    }
  }, [isPushSupported, registration])

  return {
    swStatus,
    pushStatus,
    isSupported,
    isPushSupported,
    requestPushPermission,
    registration,
  }
}
