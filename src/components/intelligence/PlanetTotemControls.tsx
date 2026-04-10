'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_PLANET_PREFS,
  loadPlanetPrefs,
  PLANET_PREFS_EVENT,
  PLANET_PREFS_STORAGE_KEY,
  resetPlanetPrefs,
  savePlanetPrefs,
  type PlanetVisualPrefs,
} from '@/lib/ui/planet-prefs'

function dispatchPlanetToggle() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('algo:planet-toggle'))
}

export function PlanetTotemControls() {
  const [prefs, setPrefs] = useState<PlanetVisualPrefs>(DEFAULT_PLANET_PREFS)
  const [planetOn, setPlanetOn] = useState(true)

  const syncFromStorage = useCallback(() => {
    setPrefs(loadPlanetPrefs())
    if (typeof window !== 'undefined') {
      setPlanetOn(window.localStorage.getItem('algo_planet_enabled') !== '0')
    }
  }, [])

  useEffect(() => {
    syncFromStorage()
    if (typeof window === 'undefined') return
    const onPrefs = () => syncFromStorage()
    const onStorage = (e: StorageEvent) => {
      if (e.key === PLANET_PREFS_STORAGE_KEY || e.key === 'algo_planet_enabled') syncFromStorage()
    }
    window.addEventListener(PLANET_PREFS_EVENT, onPrefs)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(PLANET_PREFS_EVENT, onPrefs)
      window.removeEventListener('storage', onStorage)
    }
  }, [syncFromStorage])

  const updatePrefs = (next: PlanetVisualPrefs) => {
    setPrefs(next)
    savePlanetPrefs(next)
  }

  const setPlanetEnabled = (on: boolean) => {
    if (typeof window === 'undefined') return
    if (on) window.localStorage.removeItem('algo_planet_enabled')
    else window.localStorage.setItem('algo_planet_enabled', '0')
    setPlanetOn(on)
    dispatchPlanetToggle()
  }

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-[var(--color-card)] p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-cyan-100">Data planet totem</h2>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
            Live visual tuning · saved in this browser
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={planetOn}
            onChange={(e) => setPlanetEnabled(e.target.checked)}
            className="rounded border-[var(--color-border-strong)] bg-[var(--color-card)]"
          />
          Animation on
        </label>
      </div>

      <div className="space-y-3">
        <SliderRow
          label="Opacity"
          min={0.25}
          max={1}
          step={0.05}
          value={prefs.opacity}
          onChange={(opacity) => updatePrefs({ ...prefs, opacity })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <SliderRow
          label="Size"
          min={0.6}
          max={1.4}
          step={0.05}
          value={prefs.size}
          onChange={(size) => updatePrefs({ ...prefs, size })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <SliderRow
          label="Intensity"
          min={0.5}
          max={1.5}
          step={0.05}
          value={prefs.intensity}
          onChange={(intensity) => updatePrefs({ ...prefs, intensity })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            resetPlanetPrefs()
            syncFromStorage()
          }}
          className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text-primary)] transition-colors"
        >
          Reset visuals
        </button>
      </div>
    </div>
  )
}

function SliderRow(props: {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  const { label, min, max, step, value, onChange, format } = props
  return (
    <div>
      <div className="flex justify-between text-[11px] text-[var(--color-text-secondary)] mb-1">
        <span>{label}</span>
        <span className="text-cyan-200/80 tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-[var(--color-card-hover)] accent-cyan-400"
      />
    </div>
  )
}
