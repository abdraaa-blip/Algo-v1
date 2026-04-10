'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { AppScope } from '@/types'
import { getRegionByCode } from '@/data/countries'
import { getLocaleForCountry, getScopeCountryCode } from '@/lib/geo/country-profile'

export interface ScopeContextType {
  scope: AppScope
  setScope: (scope: AppScope) => void
  isGlobal: boolean
  isRegion: boolean
  getApiParams: () => { type: string; code?: string; countries?: string[] }
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined)

const STORAGE_KEY = 'algo_scope'
const DEFAULT_SCOPE: AppScope = { type: 'global' }

function readStoredScope(): AppScope {
  if (typeof window === 'undefined') return DEFAULT_SCOPE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SCOPE
    const parsed = JSON.parse(raw) as AppScope
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
    // Storage unavailable
  }
}

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setInternalScope] = useState<AppScope>(DEFAULT_SCOPE)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = readStoredScope()
    setInternalScope(stored)
    setIsLoaded(true)
  }, [])

  const setScope = useCallback((newScope: AppScope) => {
    setInternalScope(newScope)
    writeStoredScope(newScope)
    const countryCode = getScopeCountryCode(newScope)
    if (countryCode) {
      try {
        if (!localStorage.getItem('algo_locale')) {
          localStorage.setItem('algo_locale', getLocaleForCountry(countryCode))
        }
      } catch {
        // Storage unavailable
      }
    }
    // Trigger a custom event so all components can react
    window.dispatchEvent(new CustomEvent('scope-change', { detail: { scope: newScope } }))
  }, [])

  // Get API parameters based on current scope
  const getApiParams = useCallback(() => {
    if (scope.type === 'global') {
      return { type: 'global' }
    }
    if (scope.type === 'region') {
      const region = getRegionByCode(scope.code)
      return { 
        type: 'region', 
        code: scope.code,
        countries: region?.countries || []
      }
    }
    if (scope.type === 'country') {
      return { 
        type: 'country', 
        code: scope.code 
      }
    }
    return { type: 'global' }
  }, [scope])

  // Don't render children until we've loaded the scope from localStorage
  if (!isLoaded) {
    return null
  }

  return (
    <ScopeContext.Provider value={{ 
      scope, 
      setScope, 
      isGlobal: scope.type === 'global',
      isRegion: scope.type === 'region',
      getApiParams
    }}>
      {children}
    </ScopeContext.Provider>
  )
}

export function useScopeContext() {
  const context = useContext(ScopeContext)
  if (context === undefined) {
    throw new Error('useScopeContext must be used within a ScopeProvider')
  }
  return context
}

// Hook for listening to scope changes
export function useScopeChange(callback: (scope: AppScope) => void) {
  useEffect(() => {
    const handler = (e: CustomEvent<{ scope: AppScope }>) => {
      callback(e.detail.scope)
    }
    window.addEventListener('scope-change', handler as EventListener)
    return () => window.removeEventListener('scope-change', handler as EventListener)
  }, [callback])
}
