'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type AudienceHints = {
  country: string | null
  languageHint: string
  /** Mode UX : prioriser signaux locaux vs globe */
  scope: 'local' | 'global'
}

const defaultHints: AudienceHints = {
  country: null,
  languageHint: 'fr',
  scope: 'local',
}

const Ctx = createContext<AudienceHints>(defaultHints)

export function useAudienceHints() {
  return useContext(Ctx)
}

/**
 * Indications grossières (pays edge + langue navigateur) pour adapter l’UI sans PII.
 * `scope` est stocké en localStorage (`algo_content_scope`).
 */
export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const [hints, setHints] = useState<AudienceHints>(defaultHints)

  useEffect(() => {
    let cancelled = false
    const scope =
      typeof window !== 'undefined' && window.localStorage.getItem('algo_content_scope') === 'global'
        ? 'global'
        : 'local'

    void (async () => {
      try {
        const res = await fetch('/api/context', { cache: 'no-store' })
        if (!res.ok) throw new Error('ctx')
        const data = (await res.json()) as { country?: string | null; languageHint?: string }
        if (cancelled) return
        setHints({
          country: data.country ?? null,
          languageHint: data.languageHint || defaultHints.languageHint,
          scope,
        })
      } catch {
        if (cancelled) return
        setHints({
          country: null,
          languageHint: typeof navigator !== 'undefined' ? navigator.language.slice(0, 5) : 'fr',
          scope,
        })
      }
    })()

    const onStorage = () => {
      const s =
        typeof window !== 'undefined' && window.localStorage.getItem('algo_content_scope') === 'global'
          ? 'global'
          : 'local'
      setHints((h) => ({ ...h, scope: s }))
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('algo:scope-change', onStorage)
    return () => {
      cancelled = true
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('algo:scope-change', onStorage)
    }
  }, [])

  const value = useMemo(() => hints, [hints])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Toggle local / global (déclenche `algo:scope-change` sur la même origine). */
export function setContentScope(scope: 'local' | 'global') {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('algo_content_scope', scope)
  window.dispatchEvent(new Event('algo:scope-change'))
}
