'use client'

// =============================================================================
// ALGO V1 · useScope
// State global du Country Scope System.
// Règles :
//   - Scope persisté en localStorage entre sessions.
//   - Changement instantané, sans rechargement (state global, pas de navigation).
//   - Pas de routes par pays · ce hook est le seul point de vérité du scope.
// =============================================================================

import { useState, useCallback } from 'react'
import type { AppScope } from '@/types'

const STORAGE_KEY = 'algo_scope'

const DEFAULT_SCOPE: AppScope = { type: 'global' }

function readStoredScope(): AppScope {
  if (typeof window === 'undefined') return DEFAULT_SCOPE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SCOPE
    const parsed = JSON.parse(raw) as AppScope
    // Validation minimale pour eviter les donnees corrompues
    if (parsed.type === 'global') return { type: 'global' }
    if (parsed.type === 'region' && typeof parsed.code === 'string' && typeof parsed.name === 'string') {
      return { type: 'region', code: parsed.code, name: parsed.name }
    }
    if (parsed.type === 'country' && typeof parsed.code === 'string' && typeof parsed.name === 'string') {
      return { type: 'country', code: parsed.code, name: parsed.name }
    }
    return DEFAULT_SCOPE
  } catch {
    return DEFAULT_SCOPE
  }
}

function writeStoredScope(scope: AppScope): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scope))
  } catch {
    // ignore · storage peut être indisponible (mode privé, quota)
  }
}

export interface UseScopeReturn {
  scope: AppScope
  setScope: (scope: AppScope) => void
  isGlobal: boolean
  isLoaded: boolean
}

export function useScope(): UseScopeReturn {
  const [scope, setInternalScope] = useState<AppScope>(() => readStoredScope())
  const [isLoaded] = useState(true)

  const setScope = useCallback((newScope: AppScope) => {
    setInternalScope(newScope)
    writeStoredScope(newScope)
  }, [])

  return {
    scope,
    setScope,
    isGlobal: scope.type === 'global',
    isLoaded,
  }
}
