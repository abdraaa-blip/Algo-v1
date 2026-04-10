'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

import { SectionHeader } from '@/components/ui/SectionHeader'
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
