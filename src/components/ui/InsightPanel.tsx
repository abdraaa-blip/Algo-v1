import { Zap, Clock, Monitor, Clapperboard, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Insight } from '@/types'

// ─── Config locale embarquée · les textes sont passés par le parent via props ─
// Le composant n'appelle pas useTranslations() directement pour rester
// utilisable en mode SSR et en dehors d'un contexte next-intl.

export interface InsightLabels {
  title:       string
  postNow:     Record<'high' | 'medium' | 'low', string>
  timing:      Record<'now' | 'too_late' | 'too_early', string>
  bestPlatform:string
  bestFormat:  string
  watchers:    string // "{count} personnes…"
  postWindow:  Record<'optimal' | 'saturated' | 'fading', string>
  formatLabels?: Record<string, string>
}

import { tokens } from '@/design-system/tokens'

const probCfg = {
  high:   { color: tokens.colors.accent.greenSignal, bg: 'rgba(0,255,178,0.08)',   border: 'rgba(0,255,178,0.18)'  },
  medium: { color: tokens.colors.accent.amber,       bg: 'rgba(255,209,102,0.08)', border: 'rgba(255,209,102,0.18)'},
  low:    { color: tokens.colors.accent.redAlert,    bg: 'rgba(255,77,109,0.08)',  border: 'rgba(255,77,109,0.18)' },
}

const windowIcon = { optimal: '🟢', saturated: '🟡', fading: '🔴' }

interface InsightPanelProps {
  insight:       Insight
  watchersCount?: number
  labels:        InsightLabels
  condensed?:    boolean
  className?:    string
}

export function InsightPanel({
  insight,
  watchersCount,
  labels,
  condensed = false,
  className,
}: InsightPanelProps) {
  const prob = probCfg[insight.postNowProbability]
  const winLabel  = labels.postWindow[insight.postWindow.status]
  const probLabel = labels.postNow[insight.postNowProbability]
  const timeLabel = labels.timing[insight.timing]

  // ─── Mode condensé · affiché sur les cartes au hover ─────────────────────
  if (condensed) {
    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold"
          style={{ background: prob.bg, borderColor: prob.border, color: prob.color }}
        >
          <span className="size-1.5 rounded-full shrink-0" style={{ background: prob.color }} />
          {probLabel}
        </span>
        <span className="text-[10px] text-white/30">
          {windowIcon[insight.postWindow.status]} {winLabel}
        </span>
      </div>
    )
  }

  // ─── Mode complet ─────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/7 bg-white/[0.03] p-4 space-y-4',
        className,
      )}
      aria-label={labels.title}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap size={13} strokeWidth={2} className="text-violet-400 shrink-0" aria-hidden />
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
          {labels.title}
        </span>
      </div>

      {/* Probabilité */}
      <div
        className="rounded-xl p-3 flex items-center gap-3 border"
        style={{ background: prob.bg, borderColor: prob.border }}
      >
        <span className="size-3 rounded-full shrink-0" style={{ background: prob.color }} />
        <div className="space-y-0.5">
          <p className="text-sm font-bold leading-none" style={{ color: prob.color }}>
            {probLabel}
          </p>
          <p className="text-[11px] text-white/40">{timeLabel}</p>
        </div>
      </div>

      {/* PostWindow */}
      <div className="flex items-center gap-2 text-xs text-white/45">
        <Clock size={11} strokeWidth={1.8} className="text-white/25 shrink-0" aria-hidden />
        {windowIcon[insight.postWindow.status]} {winLabel}
      </div>

      {/* Meilleure plateforme */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-white/30 font-medium flex items-center gap-1.5">
          <Monitor size={11} strokeWidth={2} aria-hidden />
          {labels.bestPlatform}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {insight.bestPlatform.map((p) => (
            <span
              key={p}
              className="px-2 py-0.5 rounded-full bg-[rgba(123,97,255,0.12)] border border-[rgba(123,97,255,0.22)] text-violet-300 text-[10px] font-semibold"
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Meilleur format */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-white/30 font-medium flex items-center gap-1.5">
          <Clapperboard size={11} strokeWidth={2} aria-hidden />
          {labels.bestFormat}
        </p>
        <span className="inline-block px-2 py-0.5 rounded-full bg-[rgba(0,209,255,0.10)] border border-[rgba(0,209,255,0.20)] text-sky-300 text-[10px] font-semibold">
          {labels.formatLabels?.[insight.bestFormat] ?? insight.bestFormat.replace('_', ' ')}
        </span>
      </div>

      {/* Watchers */}
      {watchersCount != null && watchersCount > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-white/25">
          <Users size={11} strokeWidth={1.8} aria-hidden />
          {labels.watchers.replace('{count}', watchersCount.toLocaleString('fr-FR'))}
        </div>
      )}
    </div>
  )
}
