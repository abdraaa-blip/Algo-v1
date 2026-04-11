'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check } from 'lucide-react'

import { SectionHeader } from '@/components/ui/SectionHeader'
import { ALGO_BILLING } from '@/lib/copy/ui-strings'
import { availableCountries, availableRegions, getCountryName, getRegionName } from '@/data/countries'
import { useScope } from '@/hooks/useScope'
import { cn } from '@/lib/utils'
import type { Locale } from '@/types'

const LANGS: { code: Locale; label: string; flag: string }[] = [
  { code: 'fr', label: 'Francais', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Espanol', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
]

export default function SettingsPage() {
  const { scope, setScope } = useScope()
  const [lang, setLang] = useState<Locale>('fr')
  const [saved, setSaved] = useState(false)
  const [checkoutAvailable, setCheckoutAvailable] = useState(false)
  const [portalAvailable, setPortalAvailable] = useState(false)
  const [billingPlan, setBillingPlan] = useState<'free' | 'pro'>('free')
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [billingFlash, setBillingFlash] = useState<'success' | 'cancel' | null>(null)

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('billing')
      if (q === 'success' || q === 'cancel') setBillingFlash(q)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/billing/status', { cache: 'no-store' })
        const j = (await res.json()) as { checkoutAvailable?: boolean; plan?: string; portalAvailable?: boolean }
        if (cancelled || !res.ok) return
        if (j.checkoutAvailable) setCheckoutAvailable(true)
        if (j.portalAvailable) setPortalAvailable(true)
        else setPortalAvailable(false)
        if (j.plan === 'pro') setBillingPlan('pro')
        else setBillingPlan('free')
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const [portalBusy, setPortalBusy] = useState(false)

  const startBillingPortal = useCallback(async () => {
    setPortalBusy(true)
    setCheckoutMessage(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const j = (await res.json()) as { url?: string; ok?: boolean }
      if (res.ok && j.url) {
        window.location.href = j.url
        return
      }
      setCheckoutMessage(ALGO_BILLING.portalError)
    } catch {
      setCheckoutMessage(ALGO_BILLING.portalError)
    } finally {
      setPortalBusy(false)
    }
  }, [])

  const startCheckout = useCallback(async () => {
    setCheckoutMessage(null)
    setCheckoutBusy(true)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const j = (await res.json()) as { url?: string; ok?: boolean; error?: string }
      if (res.status === 401 && j.error === 'auth_required') {
        setCheckoutMessage(ALGO_BILLING.checkoutRequiresLogin)
        return
      }
      if (res.ok && j.url) {
        window.location.href = j.url
        return
      }
      setCheckoutMessage(ALGO_BILLING.checkoutError)
    } catch {
      setCheckoutMessage(ALGO_BILLING.checkoutError)
    } finally {
      setCheckoutBusy(false)
    }
  }, [])

  function save() {
    try {
      localStorage.setItem('algo_lang', lang)
    } catch { /* ignore */ }
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-8">
      <SectionHeader title="Parametres" />

      <section aria-labelledby="lang-heading">
        <h2 id="lang-heading" className="text-[10px] font-bold text-white/28 uppercase tracking-[0.12em] mb-3">
          Langue
        </h2>
        <div className="space-y-1.5">
          {LANGS.map((l) => {
            const isActive = lang === l.code
            return (
              <button
                key={l.code}
                type="button"
                aria-pressed={isActive}
                onClick={() => setLang(l.code)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold text-start',
                  'transition-all duration-150',
                  isActive
                    ? 'border-[rgba(123,97,255,0.35)] bg-[rgba(123,97,255,0.10)] text-white'
                    : 'border-white/6 bg-white/[0.025] text-white/52 hover:bg-white/[0.05] hover:border-white/12',
                )}
              >
                <span aria-hidden>{l.flag}</span>
                <span className="flex-1">{l.label}</span>
                {isActive && <Check size={13} strokeWidth={2.5} className="text-violet-400 shrink-0" aria-hidden />}
              </button>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="billing-heading" className="rounded-xl border border-white/8 bg-white/[0.03] p-4 space-y-3">
        <h2 id="billing-heading" className="text-[10px] font-bold text-white/28 uppercase tracking-[0.12em]">
          {ALGO_BILLING.sectionTitle}
        </h2>
        {billingFlash === 'success' ? (
          <p className="text-xs text-emerald-400/95 leading-relaxed" role="status">
            {ALGO_BILLING.successNote}
          </p>
        ) : null}
        {billingFlash === 'cancel' ? (
          <p className="text-xs text-white/45 leading-relaxed" role="status">
            {ALGO_BILLING.cancelNote}
          </p>
        ) : null}
        <p className="text-xs text-white/55 leading-relaxed">{ALGO_BILLING.valuePitch}</p>
        <p className="text-[11px] font-medium text-violet-200/90">
          {billingPlan === 'pro' ? ALGO_BILLING.planLabelPro : ALGO_BILLING.planLabelFree}
        </p>
        <p className="text-[11px] text-white/40 leading-relaxed">{ALGO_BILLING.freeLabel}</p>
        <p className="text-[11px] text-white/40 leading-relaxed">{ALGO_BILLING.proPitch}</p>
        {portalAvailable ? (
          <button
            type="button"
            onClick={() => void startBillingPortal()}
            disabled={portalBusy}
            className={cn(
              'w-full py-2.5 rounded-xl text-sm font-semibold border transition-all',
              portalBusy
                ? 'border-white/10 text-white/35 cursor-wait'
                : 'border-white/14 text-white/70 hover:bg-white/[0.06]',
            )}
          >
            {portalBusy ? 'Ouverture…' : ALGO_BILLING.portalCta}
          </button>
        ) : null}

        {checkoutAvailable && billingPlan === 'pro' ? (
          <p className="text-[11px] text-white/45 leading-relaxed">{ALGO_BILLING.proCheckoutDone}</p>
        ) : checkoutAvailable ? (
          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={checkoutBusy}
            className={cn(
              'w-full py-2.5 rounded-xl text-sm font-semibold border transition-all',
              checkoutBusy
                ? 'border-white/10 text-white/35 cursor-wait'
                : 'border-[rgba(123,97,255,0.35)] text-violet-200 hover:bg-[rgba(123,97,255,0.12)]',
            )}
          >
            {checkoutBusy ? 'Redirection…' : ALGO_BILLING.checkoutCta}
          </button>
        ) : (
          <p className="text-[11px] text-white/35 leading-relaxed">{ALGO_BILLING.checkoutUnavailable}</p>
        )}
        {checkoutMessage ? (
          <p className="text-[11px] text-amber-300/90" role="alert">
            {checkoutMessage}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="zone-heading">
        <h2 id="zone-heading" className="text-[10px] font-bold text-white/28 uppercase tracking-[0.12em] mb-3">
          Zone d&apos;observation
        </h2>
        <div className="space-y-1.5 max-h-72 overflow-y-auto pe-1">
          {/* Global option */}
          <button
            type="button"
            aria-pressed={scope.type === 'global'}
            onClick={() => setScope({ type: 'global' })}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold text-start',
              'transition-all duration-150',
              scope.type === 'global'
                ? 'border-[rgba(123,97,255,0.35)] bg-[rgba(123,97,255,0.10)] text-white'
                : 'border-white/6 bg-white/[0.025] text-white/52 hover:bg-white/[0.05]',
            )}
          >
            <span aria-hidden>🌐</span>
            <span className="flex-1">Global</span>
            {scope.type === 'global' && <Check size={13} strokeWidth={2.5} className="text-violet-400 shrink-0" aria-hidden />}
          </button>

          {/* Regions */}
          <div className="pt-2">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-wider mb-1.5 px-1">Regions</p>
            {availableRegions.map((r) => {
              const name = getRegionName(r, lang)
              const isActive = scope.type === 'region' && scope.code === r.code

              return (
                <button
                  key={r.code}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setScope({ type: 'region', code: r.code, name })}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold text-start mb-1.5',
                    'transition-all duration-150',
                    isActive
                      ? 'border-[rgba(123,97,255,0.35)] bg-[rgba(123,97,255,0.10)] text-white'
                      : 'border-white/6 bg-white/[0.025] text-white/52 hover:bg-white/[0.05]',
                  )}
                >
                  <span aria-hidden>{r.flag}</span>
                  <span className="flex-1">{name}</span>
                  {isActive && <Check size={13} strokeWidth={2.5} className="text-violet-400 shrink-0" aria-hidden />}
                </button>
              )
            })}
          </div>

          {/* Countries */}
          <div className="pt-2">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-wider mb-1.5 px-1">Pays</p>
            {availableCountries.map((c) => {
              const name = getCountryName(c, lang)
              const isActive = scope.type === 'country' && scope.code === c.code

              return (
                <button
                  key={c.code}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setScope({ type: 'country', code: c.code, name })}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold text-start mb-1.5',
                    'transition-all duration-150',
                    isActive
                      ? 'border-[rgba(123,97,255,0.35)] bg-[rgba(123,97,255,0.10)] text-white'
                      : 'border-white/6 bg-white/[0.025] text-white/52 hover:bg-white/[0.05]',
                  )}
                >
                  <span aria-hidden>{c.flag}</span>
                  <span className="flex-1">{name}</span>
                  {isActive && <Check size={13} strokeWidth={2.5} className="text-violet-400 shrink-0" aria-hidden />}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={save}
        className={cn(
          'w-full py-3 rounded-xl font-bold text-sm',
          'transition-all duration-150',
          saved
            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
            : 'bg-violet-500 text-white hover:bg-violet-400 shadow-[0_0_20px_rgba(123,97,255,0.25)]',
        )}
        aria-live="polite"
      >
        {saved ? 'Enregistre !' : 'Enregistrer'}
      </button>
    </div>
  )
}
