'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, Layers, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AlgoCoreIntelligenceReport } from '@/lib/algo-core-intelligence'
import { SITE_TRANSPARENCY_AI_CALIBRATION_HREF } from '@/lib/seo/site'
import { ALGO_UI_ERROR, ALGO_UI_LOADING } from '@/lib/copy/ui-strings'
import { mapUserFacingApiError } from '@/lib/copy/api-error-fr'

interface CoreApiOk {
  success: true
  meta: { source: string; region?: string; itemCount: number }
  data: AlgoCoreIntelligenceReport
}

interface CoreApiErr {
  success: false
  error: string
}

export function AlgoCoreIntelligencePanel({ region }: { region: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<AlgoCoreIntelligenceReport | null>(null)
  const [meta, setMeta] = useState<CoreApiOk['meta'] | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/intelligence/core?region=${encodeURIComponent(region)}`, { cache: 'no-store' })
      const json = (await res.json()) as CoreApiOk | CoreApiErr
      if (!res.ok || !json.success) {
        throw new Error('success' in json && !json.success ? json.error : `HTTP ${res.status}`)
      }
      setReport(json.data)
      setMeta(json.meta)
    } catch (e) {
      setReport(null)
      setMeta(null)
      setError(
        mapUserFacingApiError(e instanceof Error ? e.message : ALGO_UI_ERROR.message)
      )
    } finally {
      setLoading(false)
    }
  }, [region])

  useEffect(() => {
    void load()
  }, [load])

  const exportJson = () => {
    if (!report) return
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `algo-core-intelligence-${region}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const topIds = report?.prioritizedIds.slice(0, 6) ?? []
  const topItems = topIds
    .map((id) => report?.items.find((x) => x.id === id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))

  return (
    <div
      id="algo-core"
      className="rounded-2xl border border-[color-mix(in_srgb,var(--color-violet)_25%,var(--color-border))] bg-gradient-to-br from-violet-950/35 to-[var(--color-card)] p-4 scroll-mt-24 shadow-[var(--shadow-algo-sm)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-2">
          <Layers size={18} className="text-violet-300 mt-0.5 shrink-0" />
          <div>
            <h2 className="font-bold text-sm text-white">ALGO Core Intelligence</h2>
            <p className="text-[11px] text-white/50 mt-0.5 max-w-xl">
              Analyse multi-facteurs, simulations (viral / stagnation / rejet), motifs, priorités et fiabilité · à partir
              des tendances et actus live pour la région sélectionnée. Indicateurs seulement.
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
              <Link
                href={SITE_TRANSPARENCY_AI_CALIBRATION_HREF}
                className="text-cyan-400/85 hover:text-cyan-300 underline-offset-2 hover:underline"
              >
                Même cadre éthique que ALGO AI
              </Link>
              <span className="text-[var(--color-text-muted)]"> · transparence.</span>
            </p>
            {report && (
              <p className="text-[10px] text-violet-300/80 mt-1 italic">&ldquo;{report.philosophy.tagline}&rdquo;</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="p-2 rounded-lg bg-[var(--color-card-hover)] border border-[var(--color-border)] hover:bg-[color-mix(in_srgb,var(--color-card-hover)_85%,var(--color-violet-muted))] disabled:opacity-50 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
          </button>
          <button
            type="button"
            onClick={exportJson}
            disabled={!report}
            className="flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-lg bg-[var(--color-card-hover)] border border-[var(--color-border)] hover:bg-[var(--color-card)] disabled:opacity-40 transition-colors"
          >
            <Download size={14} />
            JSON
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs">{error}</div>
      )}

      {loading && !report && (
        <p className="text-xs text-white/45 py-4">{ALGO_UI_LOADING.coreIntelligence}</p>
      )}

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="p-3 rounded-xl algo-surface">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Lot (agrégat)</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-white/45">Score viral moy.</span>
                  <p className="font-bold text-cyan-300">{report.crossBatch.avgViralScore}</p>
                </div>
                <div>
                  <span className="text-white/45">Confiance moy.</span>
                  <p className="font-bold text-emerald-300">{Math.round(report.crossBatch.avgConfidence * 100)}%</p>
                </div>
                <div>
                  <span className="text-white/45">Sources</span>
                  <p className="font-semibold text-white/85">{report.crossBatch.sourceCount}</p>
                </div>
                <div>
                  <span className="text-white/45">Signaux précoces</span>
                  <p className="font-semibold text-amber-300/90">{Math.round(report.crossBatch.weakSignalShare * 100)}%</p>
                </div>
              </div>
              {meta && (
                <p className="text-[10px] text-white/35 mt-2">
                  {meta.itemCount} entrées · {meta.source}
                  {meta.region ? ` · ${meta.region}` : ''}
                </p>
              )}
            </div>

            <div className="p-3 rounded-xl algo-surface">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Simulations (scénarios)</p>
              <ul className="space-y-1.5 text-[11px] text-white/70">
                <li>
                  <span className="text-emerald-300/90">Hausse</span> · {report.scenarioSimulations.viralBurst.simulatedScore} pts (
                  {report.scenarioSimulations.viralBurst.recommendation})
                </li>
                <li>
                  <span className="text-amber-300/90">Stagnation</span> · {report.scenarioSimulations.stagnation.simulatedScore} pts (
                  {report.scenarioSimulations.stagnation.recommendation})
                </li>
                <li>
                  <span className="text-rose-300/90">Rejet</span> · {report.scenarioSimulations.rejection.simulatedScore} pts (
                  {report.scenarioSimulations.rejection.recommendation})
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl algo-surface">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Motifs & vigilance</p>
              <p className="text-[11px] text-white/55 mb-1">
                Tokens répétés :{' '}
                {report.patterns.repeatedTokens.slice(0, 5).map((t) => (
                  <span key={t.token} className="inline-block mr-1.5 text-white/75">
                    {t.token}×{t.count}
                  </span>
                ))}
                {report.patterns.repeatedTokens.length === 0 && <span>–</span>}
              </p>
              {report.vigilance.notes.length > 0 ? (
                <ul className="text-[11px] text-amber-200/80 list-disc pl-4 space-y-0.5">
                  {report.vigilance.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-white/40">Aucune alerte structurelle.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl algo-surface">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Priorités (top)</p>
              <ul className="space-y-2">
                {topItems.map((it) => (
                  <li key={it.id} className="text-xs border-b border-[var(--color-border)] pb-2 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-white/85 line-clamp-2 font-medium">{it.title}</span>
                      <span
                        className={cn(
                          'shrink-0 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded',
                          it.priority.bucket === 'focus' && 'bg-emerald-500/20 text-emerald-300',
                          it.priority.bucket === 'watch' && 'bg-amber-500/20 text-amber-300',
                          it.priority.bucket === 'noise' && 'bg-[var(--color-card-hover)] text-[var(--color-text-tertiary)]'
                        )}
                      >
                        {it.priority.bucket}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/45 mt-1">
                      {it.intelligence.viralScore.label} · {it.type} · rang {it.priority.rankScore.toFixed(1)} · fiab.{' '}
                      {it.reliability.score}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl algo-surface">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Auto-ajustement (suggestions)</p>
              <p className="text-[11px] text-violet-200/70 mb-2">{report.autoOptimization.confidenceHint}</p>
              <ul className="text-[11px] text-white/60 list-disc pl-4 space-y-1">
                {report.autoOptimization.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl algo-surface">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Viralité & actions</p>
              <p className="text-[11px] text-white/65">
                Précoces : {report.virality.earlySignalsCount} · phases fortes : {report.virality.risingOrPeakCount}
              </p>
              <p className="text-[10px] text-white/45 mt-2">
                {report.virality.topActionLabels.slice(0, 4).join(' · ') || '–'}
              </p>
              <p className="text-[10px] text-white/35 mt-2">{report.userLayer.notes.join(' ')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
