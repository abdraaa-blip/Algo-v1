'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { Globe, ChevronDown, Search, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { availableCountries, getCountryName } from '@/data/countries'
import type { AppScope, Country } from '@/types'

interface ScopeSelectorLabels {
  global:    string   // "Global"
  search:    string   // "Rechercher un pays…"
  suggested: string   // "Suggéré pour toi"
  countries: string   // "Pays"
  globalView:string   // "Vue mondiale"
}

interface ScopeSelectorProps {
  currentScope:     AppScope
  suggestedCountry?: string | null
  onScopeChange:    (scope: AppScope) => void
  locale?:          string
  labels:           ScopeSelectorLabels
  className?:       string
}

export function ScopeSelector({
  currentScope,
  suggestedCountry,
  onScopeChange,
  locale = 'fr',
  labels,
  className,
}: ScopeSelectorProps) {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const containerRef          = useRef<HTMLDivElement>(null)
  const searchRef             = useRef<HTMLInputElement>(null)
  const listboxId             = useId()

  // Fermer au clic extérieur
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Focus sur le champ de recherche à l'ouverture
  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  // Label affiché dans le bouton trigger
  const triggerLabel =
    currentScope.type === 'global'
      ? labels.global
      : currentScope.name

  const triggerFlag =
    currentScope.type === 'country'
      ? availableCountries.find((c) => c.code === currentScope.code)?.flag ?? '🌍'
      : null

  // Filtrage des pays selon la recherche
  const filteredCountries = availableCountries.filter((c) => {
    const name = getCountryName(c, locale).toLowerCase()
    const q    = query.toLowerCase()
    return name.includes(q) || c.code.toLowerCase().includes(q)
  })

  const suggested =
    suggestedCountry
      ? availableCountries.find((c) => c.code === suggestedCountry)
      : null

  function selectGlobal() {
    onScopeChange({ type: 'global' })
    setOpen(false)
    setQuery('')
  }

  function selectCountry(c: Country) {
    onScopeChange({ type: 'country', code: c.code, name: getCountryName(c, locale) })
    setOpen(false)
    setQuery('')
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onKeyDown={handleKeyDown}
    >
      {/* ── Trigger ── */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={`Zone d'observation : ${triggerLabel}`}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
          'transition-all duration-150 outline-none',
          'focus-visible:ring-2 focus-visible:ring-violet-400/60',
          open
            ? 'bg-white/9 text-white border border-white/18'
            : 'bg-white/5 text-white/60 border border-white/9 hover:bg-white/8 hover:text-white/80 hover:border-white/15',
        )}
      >
        {triggerFlag
          ? <span aria-hidden>{triggerFlag}</span>
          : <Globe size={12} strokeWidth={1.8} aria-hidden />
        }
        <span>{triggerLabel}</span>
        <ChevronDown
          size={10}
          strokeWidth={2}
          className={cn('transition-transform duration-150 shrink-0', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Choisir une zone d'observation"
          className={cn(
            // Positionnement — start-0 pour RTL-safe
            'absolute top-full mt-2 start-0 z-[300]',
            'w-60 rounded-2xl overflow-hidden',
            'border border-white/9',
            'bg-[#0d0d1a]/96 backdrop-blur-2xl',
            'shadow-[0_8px_40px_rgba(0,0,0,0.65)]',
          )}
        >
          {/* Champ recherche */}
          <div className="p-2 border-b border-white/7">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5">
              <Search size={11} strokeWidth={2} className="text-white/25 shrink-0" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={labels.search}
                aria-label={labels.search}
                className="flex-1 bg-transparent text-xs text-white/70 placeholder:text-white/22 outline-none"
              />
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-px">

            {/* Option Global */}
            {!query && (
              <ScopeOption
                icon={<Globe size={13} strokeWidth={1.5} />}
                label={labels.globalView}
                sublabel={labels.global}
                isActive={currentScope.type === 'global'}
                onClick={selectGlobal}
              />
            )}

            {/* Pays suggéré */}
            {!query && suggested && (
              <>
                <GroupLabel>{labels.suggested}</GroupLabel>
                <ScopeOption
                  icon={<span className="text-sm">{suggested.flag}</span>}
                  label={getCountryName(suggested, locale)}
                  isActive={
                    currentScope.type === 'country' &&
                    currentScope.code === suggested.code
                  }
                  onClick={() => selectCountry(suggested)}
                />
              </>
            )}

            {/* Liste pays */}
            {!query && (
              <GroupLabel>{labels.countries}</GroupLabel>
            )}
            {filteredCountries.map((c) => {
              const name     = getCountryName(c, locale)
              const isActive =
                currentScope.type === 'country' && currentScope.code === c.code
              return (
                <ScopeOption
                  key={c.code}
                  icon={<span className="text-sm">{c.flag}</span>}
                  label={name}
                  isActive={isActive}
                  onClick={() => selectCountry(c)}
                />
              )
            })}

            {filteredCountries.length === 0 && (
              <p className="text-center py-4 text-xs text-white/25">—</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sous-composants internes ─────────────────────────────────────────────────

function ScopeOption({
  icon, label, sublabel, isActive, onClick,
}: {
  icon:      React.ReactNode
  label:     string
  sublabel?: string
  isActive:  boolean
  onClick:   () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-start',
        'transition-all duration-100 outline-none',
        'focus-visible:ring-1 focus-visible:ring-violet-400/50',
        isActive
          ? 'bg-[rgba(123,97,255,0.16)] text-violet-300'
          : 'text-white/55 hover:bg-white/5 hover:text-white/80',
      )}
    >
      <span className="shrink-0 flex items-center justify-center size-5 text-sm leading-none">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{label}</p>
        {sublabel && (
          <p className="text-[10px] text-white/28 truncate">{sublabel}</p>
        )}
      </div>
      {isActive && (
        <Check size={11} strokeWidth={2.5} className="shrink-0 text-violet-400" aria-hidden />
      )}
    </button>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2.5 pt-2 pb-1 text-[9px] font-bold text-white/22 uppercase tracking-[0.12em]">
      {children}
    </p>
  )
}
