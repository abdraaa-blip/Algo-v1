'use client'

import { useCallback } from 'react'

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error'

interface HapticPattern {
  pattern: number[]
  fallback: number
}

const HAPTIC_PATTERNS: Record<HapticType, HapticPattern> = {
  light: { pattern: [10], fallback: 10 },
  medium: { pattern: [20], fallback: 20 },
  heavy: { pattern: [30], fallback: 30 },
  selection: { pattern: [5], fallback: 5 },
  success: { pattern: [10, 50, 10], fallback: 50 },
  warning: { pattern: [20, 50, 20], fallback: 70 },
  error: { pattern: [30, 30, 30, 30, 30], fallback: 100 },
}

/**
 * Hook for haptic feedback on mobile devices
 * Uses the Vibration API for tactile feedback
 */
export function useHaptic() {
  const trigger = useCallback((type: HapticType = 'light') => {
    if (typeof navigator === 'undefined') return

    // Check if vibration is supported
    if (!navigator.vibrate) return

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const pattern = HAPTIC_PATTERNS[type]
    
    try {
      navigator.vibrate(pattern.pattern)
    } catch {
      // Fallback to simple vibration
      try {
        navigator.vibrate(pattern.fallback)
      } catch {
        // Vibration not available
      }
    }
  }, [])

  const light = useCallback(() => trigger('light'), [trigger])
  const medium = useCallback(() => trigger('medium'), [trigger])
  const heavy = useCallback(() => trigger('heavy'), [trigger])
  const selection = useCallback(() => trigger('selection'), [trigger])
  const success = useCallback(() => trigger('success'), [trigger])
  const warning = useCallback(() => trigger('warning'), [trigger])
  const error = useCallback(() => trigger('error'), [trigger])

  return {
    trigger,
    light,
    medium,
    heavy,
    selection,
    success,
    warning,
    error,
  }
}

/**
 * Higher-order function to add haptic feedback to event handlers
 */
export function withHaptic<T extends (...args: unknown[]) => unknown>(
  fn: T,
  type: HapticType = 'light'
): T {
  return ((...args: unknown[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      const pattern = HAPTIC_PATTERNS[type]
      try {
        navigator.vibrate(pattern.pattern)
      } catch {
        // Ignore
      }
    }
    return fn(...args)
  }) as T
}
