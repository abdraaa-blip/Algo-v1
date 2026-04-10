'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CONSENT_STORAGE_KEY,
  parseConsent,
  serializeConsent,
  type ConsentState,
} from '@/lib/consent/storage'

function readStored(): ConsentState | null {
  if (typeof window === 'undefined') return null
  return parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY))
}

function writeStored(c: ConsentState) {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(c))
  window.dispatchEvent(new Event('algo:consent-updated'))
}

/**
 * Bandeau RGPD minimal : nécessaire + analytics optionnel.
 * Aucun script tiers d’analytics tant que l’utilisateur n’a pas accepté.
 */
export function ConsentBanner() {
  const [hydrated, setHydrated] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const existing = readStored()
    setOpen(existing === null)
    setHydrated(true)
  }, [])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('algo:open-consent', onOpen)
    return () => window.removeEventListener('algo:open-consent', onOpen)
  }, [])

  const acceptAll = useCallback(() => {
    writeStored(serializeConsent({ analytics: true, marketing: false, decidedAt: new Date().toISOString() }))
    setOpen(false)
  }, [])

  const acceptNecessary = useCallback(() => {
    writeStored(serializeConsent({ analytics: false, marketing: false, decidedAt: new Date().toISOString() }))
    setOpen(false)
  }, [])

  if (!hydrated || !open) return null

  return (
    <div
      role="dialog"
      aria-label="Cookies et données"
      className="fixed bottom-0 inset-x-0 z-[200] p-3 sm:p-4 pointer-events-auto"
    >
      <div className="max-w-3xl mx-auto rounded-2xl border border-[var(--color-border-strong)] bg-[color-mix(in_srgb,var(--color-bg-secondary)_96%,transparent)] backdrop-blur-md shadow-2xl shadow-black/40 p-4 sm:p-5 text-sm text-[var(--color-text-primary)]">
        <p className="font-semibold text-[var(--color-text-primary)] mb-1">Confidentialité</p>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
          ALGO utilise des cookies strictement nécessaires au fonctionnement du site. Avec votre accord, nous pouvons
          activer une mesure d’audience <span className="text-[var(--color-text-primary)]">anonymisée</span> pour améliorer l’expérience.{' '}
          <Link href="/legal" className="text-cyan-300 hover:underline">
            Mentions légales
          </Link>
          {' · '}
          <Link href="/privacy" className="text-cyan-300 hover:underline">
            Confidentialité
          </Link>
          {' · '}
          <Link href="/transparency" className="text-cyan-300 hover:underline">
            Transparence données
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={acceptNecessary}
            className="text-xs px-3 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] transition-colors"
          >
            Nécessaire uniquement
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="text-xs px-3 py-2 rounded-lg bg-cyan-500/25 border border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/35"
          >
            Accepter l’anonymisé
          </button>
        </div>
      </div>
    </div>
  )
}

/** Lien pour rouvrir le bandeau (footer, paramètres). */
export function ConsentManageLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('algo:open-consent'))
      }}
      className={className}
    >
      Préférences cookies
    </button>
  )
}
