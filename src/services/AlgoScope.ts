/**
 * ALGO Scope - Scope Propagation System
 * 
 * When the user changes scope, every single piece of data in the app
 * updates simultaneously with zero inconsistency.
 */

import { AlgoEventBus } from './AlgoEventBus'
import { AlgoCache } from './AlgoCache'

export interface Scope {
  type: 'global' | 'country' | 'region' | 'city'
  code: string
  name: string
  flag?: string
  timezone?: string
}

// Predefined scopes
export const SCOPES: Record<string, Scope> = {
  global: { type: 'global', code: 'GLOBAL', name: 'Mondial', flag: '🌍' },
  fr: { type: 'country', code: 'FR', name: 'France', flag: '🇫🇷', timezone: 'Europe/Paris' },
  us: { type: 'country', code: 'US', name: 'États-Unis', flag: '🇺🇸', timezone: 'America/New_York' },
  uk: { type: 'country', code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧', timezone: 'Europe/London' },
  de: { type: 'country', code: 'DE', name: 'Allemagne', flag: '🇩🇪', timezone: 'Europe/Berlin' },
  es: { type: 'country', code: 'ES', name: 'Espagne', flag: '🇪🇸', timezone: 'Europe/Madrid' },
  it: { type: 'country', code: 'IT', name: 'Italie', flag: '🇮🇹', timezone: 'Europe/Rome' },
  jp: { type: 'country', code: 'JP', name: 'Japon', flag: '🇯🇵', timezone: 'Asia/Tokyo' },
  br: { type: 'country', code: 'BR', name: 'Brésil', flag: '🇧🇷', timezone: 'America/Sao_Paulo' },
  ca: { type: 'country', code: 'CA', name: 'Canada', flag: '🇨🇦', timezone: 'America/Toronto' },
  au: { type: 'country', code: 'AU', name: 'Australie', flag: '🇦🇺', timezone: 'Australia/Sydney' },
}

// Storage key
const SCOPE_STORAGE_KEY = 'algo_scope'
const LANGUAGE_STORAGE_KEY = 'algo_language'

class AlgoScopeClass {
  private currentScope: Scope = SCOPES.fr
  private currentLanguage: string = 'fr'
  private scopeChangeInProgress = false
  private pendingFetches: AbortController[] = []
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage()
    }
  }

  /**
   * Load scope from localStorage on init
   */
  private loadFromStorage(): void {
    try {
      const savedScope = localStorage.getItem(SCOPE_STORAGE_KEY)
      if (savedScope) {
        const parsed = JSON.parse(savedScope)
        if (SCOPES[parsed.code.toLowerCase()]) {
          this.currentScope = SCOPES[parsed.code.toLowerCase()]
        }
      }
      
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY)
      if (savedLang) {
        this.currentLanguage = savedLang
      }
    } catch {
      // Use defaults
    }
  }

  /**
   * Get current scope
   */
  getScope(): Scope {
    return this.currentScope
  }

  /**
   * Get current scope code for API calls
   */
  getScopeCode(): string {
    return this.currentScope.code
  }

  /**
   * Get current language
   */
  getLanguage(): string {
    return this.currentLanguage
  }

  /**
   * Check if a scope change is in progress
   */
  isChanging(): boolean {
    return this.scopeChangeInProgress
  }

  /**
   * Change scope - triggers full data refresh
   * 
   * This is the critical method that ensures all data updates simultaneously
   */
  async changeScope(newScopeCode: string): Promise<void> {
    const newScope = SCOPES[newScopeCode.toLowerCase()]
    if (!newScope) {
      console.error(`[ALGO Scope] Unknown scope: ${newScopeCode}`)
      return
    }
    
    if (newScope.code === this.currentScope.code) {
      return // No change needed
    }
    
    const oldScope = this.currentScope
    this.scopeChangeInProgress = true
    
    // Step 1: Cancel all pending fetches for old scope
    this.cancelPendingFetches()
    
    // Step 2: Update scope immediately
    this.currentScope = newScope
    
    // Step 3: Save to localStorage
    try {
      localStorage.setItem(SCOPE_STORAGE_KEY, JSON.stringify(newScope))
    } catch {
      // Storage might be full or disabled
    }
    
    // Step 4: Publish scope:changed event
    // This triggers all components to update and orchestrator to refetch
    AlgoEventBus.publish('scope:changed', {
      oldScope: oldScope.code,
      newScope: newScope.code,
      scopeName: newScope.name
    })
    
    // Step 5: Invalidate scope-dependent caches
    await AlgoCache.invalidateScope(oldScope.code)
    
    this.scopeChangeInProgress = false
  }

  /**
   * Change language
   */
  async changeLanguage(newLang: string): Promise<void> {
    if (newLang === this.currentLanguage) return
    
    const oldLang = this.currentLanguage
    this.currentLanguage = newLang
    
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang)
    } catch {
      // Storage might be full
    }
    
    AlgoEventBus.publish('language:changed', {
      oldLang,
      newLang
    })
  }

  /**
   * Register a fetch that can be cancelled on scope change
   */
  registerFetch(): AbortController {
    const controller = new AbortController()
    this.pendingFetches.push(controller)
    return controller
  }

  /**
   * Unregister a completed fetch
   */
  unregisterFetch(controller: AbortController): void {
    const index = this.pendingFetches.indexOf(controller)
    if (index > -1) {
      this.pendingFetches.splice(index, 1)
    }
  }

  /**
   * Cancel all pending fetches (called on scope change)
   */
  private cancelPendingFetches(): void {
    for (const controller of this.pendingFetches) {
      controller.abort()
    }
    this.pendingFetches = []
  }

  /**
   * Get all available scopes for UI
   */
  getAvailableScopes(): Scope[] {
    return Object.values(SCOPES)
  }

  /**
   * Get scope-specific API parameters
   */
  getApiParams(): { country: string; language: string; region: string } {
    return {
      country: this.currentScope.code,
      language: this.currentLanguage,
      region: this.currentScope.code === 'GLOBAL' ? '' : this.currentScope.code
    }
  }
}

// Singleton instance
export const AlgoScope = new AlgoScopeClass()
