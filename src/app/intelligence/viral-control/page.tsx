'use client'

import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViralControlCockpitPayload } from '@/lib/intelligence/viral-control-cockpit'
import type { ViralControlYoutubeBlock } from '@/lib/intelligence/viral-control-youtube'
import { useScopeContext } from '@/contexts/ScopeContext'
import { getScopeCountryCode } from '@/lib/geo/country-profile'
import { VIRAL_CONTROL_REGION_CODES, isViralControlRegion } from '@/lib/intelligence/viral-control-regions'
import { mapUserFacingApiError } from '@/lib/copy/api-error-fr'

type ApiPayload = ViralControlCockpitPayload & {
  radarSources?: string[]
  cacheTtlMs?: number
  serverBundleCacheTtlMs?: number
  youtube?: ViralControlYoutubeBlock
}

function momentumLabel(m: ViralControlCockpitPayload['global']['momentum']): string {
  if (m === 'up') return 'Momentum · hausse'
  if (m === 'down') return 'Momentum · baisse'
  return 'Momentum · stable'
}

function formatDelta(n: number | null, unit: string): string {
  if (n == null || !Number.isFinite(n)) return 'n/d'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)} ${unit}`
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-[var(--color-text-tertiary)]">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500/80 to-violet-500/80 transition-[width] duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}

function ViralSeriesChart({ series }: { series: ViralControlCockpitPayload['series'] }) {
  const titleId = useId()
  const descId = useId()
  const path = useMemo(() => {
    if (series.length < 2) return ''
    const w = 320
    const h = 96
    const pad = 6
    const xs = series.map((_, i) => pad + (i / (series.length - 1)) * (w - pad * 2))
    const scores = series.map((p) => p.viralityScore)
    const min = Math.min(...scores, 0)
    const max = Math.max(...scores, 100)
    const span = max - min || 1
    const ys = scores.map((s) => h - pad - ((s - min) / span) * (h - pad * 2))
    return series
      .map((_, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`)
      .join(' ')
  }, [series])

  if (series.length < 2) {
    return (
      <p className="text-xs text-[var(--color-text-tertiary)] py-8 text-center">
        Pas assez d’historique radar pour tracer une courbe. Lance un rafraîchissement du radar ou attends le prochain
        snapshot cron.
      </p>
    )
  }

  return (
    <svg
      viewBox="0 0 320 96"
      className="w-full max-w-md mx-auto h-24 text-cyan-400/90"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>Évolution du score viral radar</title>
      <desc id={descId}>
        Courbe des scores agrégés sur la période affichée (pas des vues d’un contenu unique).
      </desc>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function YoutubeViewsChart({ series }: { series: ViralControlYoutubeBlock['observationSeries'] }) {
  const titleId = useId()
  const descId = useId()
  const path = useMemo(() => {
    if (series.length < 2) return ''
    const w = 320
    const h = 96
    const pad = 6
    const xs = series.map((_, i) => pad + (i / (series.length - 1)) * (w - pad * 2))
    const vals = series.map((p) => p.views)
    const min = Math.min(...vals, 0)
    const max = Math.max(...vals, 1)
    const span = max - min || 1
    const ys = vals.map((v) => h - pad - ((v - min) / span) * (h - pad * 2))
    return series
      .map((_, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`)
      .join(' ')
  }, [series])

  if (series.length < 2) {
    return (
      <p className="text-xs text-[var(--color-text-tertiary)] py-6 text-center">
        Pas assez de points encore : la courbe se remplit à chaque rafraîchissement (polling ~30 s) tant que la clé YouTube
        est active.
      </p>
    )
  }

  return (
    <svg
      viewBox="0 0 320 96"
      className="w-full max-w-md mx-auto h-24 text-violet-400/90"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>Évolution des vues YouTube (relevés serveur)</title>
      <desc id={descId}>
        Courbe des vues publiques enregistrées à chaque appel API, pas l&apos;historique complet YouTube.
      </desc>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ViralControlCenterPage() {
  const { scope } = useScopeContext()
  const [region, setRegion] = useState('FR')
  const [youtubeDraft, setYoutubeDraft] = useState('')
  const [appliedYoutubeUrl, setAppliedYoutubeUrl] = useState('')
  const [data, setData] = useState<ApiPayload | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cc = getScopeCountryCode(scope)
    if (cc && isViralControlRegion(cc)) setRegion(cc)
  }, [scope])

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const q = new URLSearchParams({
        region,
        locale: 'fr',
        days: '7',
      })
      const v = appliedYoutubeUrl.trim()
      if (v) q.set('videoUrl', v)
      const res = await fetch(`/api/intelligence/viral-control?${q.toString()}`, { cache: 'no-store' })
      const json = (await res.json()) as ApiPayload & { success?: boolean; error?: string }
      if (!res.ok || !json.success || json.kind !== 'algo.viral_control_cockpit') {
        throw new Error(json.error || 'Réponse cockpit invalide')
      }
      setData(json)
    } catch (e) {
      setErr(
        mapUserFacingApiError(
          e instanceof Error ? e.message : 'Failed to fetch'
        )
      )
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [region, appliedYoutubeUrl])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const id = setInterval(() => void load(), 30_000)
    return () => clearInterval(id)
  }, [load])

  return (
    <div className="min-h-screen text-[var(--color-text-primary)] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Link
              href="/intelligence"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400/90 hover:text-cyan-300 mb-3"
            >
              <ArrowLeft size={14} aria-hidden />
              Intelligence radar
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Viral Control Center</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-xl">
              Cockpit indicatif : chaque bloc relie un signal à une décision possible. Option YouTube : vues / likes /
              commentaires publics par URL si <span className="font-mono text-[11px]">YOUTUBE_API_KEY</span> est défini.
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1 max-w-xl">
              Région préremplie depuis ton scope (navbar) quand c’est un pays couvert par le radar.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              aria-label="Région radar"
            >
              {VIRAL_CONTROL_REGION_CODES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] disabled:opacity-50"
              aria-label="Rafraîchir"
            >
              <RefreshCw size={18} className={cn(loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/60 p-4 space-y-2">
          <label htmlFor="vcc-youtube-url" className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Lien YouTube (optionnel)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="vcc-youtube-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://www.youtube.com/watch?v=…"
              value={youtubeDraft}
              onChange={(e) => setYoutubeDraft(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
            <button
              type="button"
              onClick={() => setAppliedYoutubeUrl(youtubeDraft.trim())}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-500/20 text-violet-200 border border-violet-400/30 hover:bg-violet-500/30 disabled:opacity-50"
            >
              Appliquer
            </button>
          </div>
        </div>

        {err ? (
          <p className="text-sm text-amber-200/90 rounded-xl border border-amber-400/25 bg-amber-950/20 px-4 py-3">
            {err}
          </p>
        ) : null}

        {data ? (
          <>
            <p className="text-[10px] font-mono text-[var(--color-text-tertiary)]">
              Généré {new Date(data.generatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })} ·{' '}
              {data.region} / {data.locale}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)]">{data.disclaimerFr}</p>
            {data.serverBundleCacheTtlMs ? (
              <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
                Cache bundle serveur ~{Math.round(data.serverBundleCacheTtlMs / 1000)} s (même région + même lien).
              </p>
            ) : null}

            {data.youtube ? (
              <div className="rounded-2xl border border-violet-400/20 bg-violet-950/10 p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200/90">YouTube (public)</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">{data.youtube.noteFr}</p>
                {data.youtube.title ? (
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-2">{data.youtube.title}</p>
                ) : null}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] py-2">
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">Vues</p>
                    <p className="text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
                      {data.youtube.views.toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] py-2">
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">Likes</p>
                    <p className="text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
                      {data.youtube.likes.toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] py-2">
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">Commentaires</p>
                    <p className="text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
                      {data.youtube.comments.toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                {data.youtube.fetchedAt ? (
                  <p className="text-[10px] font-mono text-[var(--color-text-tertiary)]">
                    API {new Date(data.youtube.fetchedAt).toLocaleString('fr-FR', { timeStyle: 'medium' })}
                  </p>
                ) : null}
                <a
                  href={data.youtube.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400/90 hover:text-cyan-300 underline underline-offset-2"
                >
                  Ouvrir sur YouTube
                </a>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
                    Courbe vues (relevés ALGO)
                  </p>
                  <YoutubeViewsChart series={data.youtube.observationSeries} />
                </div>
              </div>
            ) : null}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/80 p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  Score global (radar)
                </p>
                <p className="text-4xl font-black tabular-nums text-emerald-300">{data.global.viralScore}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Confiance indicative {Math.round(data.global.confidence * 100)} % · {momentumLabel(data.global.momentum)}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] font-mono">
                  Vitesse {formatDelta(data.global.velocityPerHour, 'pts/h')} · Accélération{' '}
                  {formatDelta(data.global.accelerationPerHour2, 'pts/h²')}
                </p>
                {data.topCategory ? (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Catégorie tête de liste : <span className="text-[var(--color-text-primary)]">{data.topCategory}</span>
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/80 p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  Indices engagement (proxy)
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">{data.engagementProxy.noteFr}</p>
                <ScoreBar label="Vues (index)" value={data.engagementProxy.viewsIndex} />
                <ScoreBar label="Likes (index)" value={data.engagementProxy.likesIndex} />
                <ScoreBar label="Commentaires (index)" value={data.engagementProxy.commentsIndex} />
                <ScoreBar label="Partages (index)" value={data.engagementProxy.sharesIndex} />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/80 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
                Courbe score viral (historique)
              </p>
              <ViralSeriesChart series={data.series} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/80 p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  Tendance vs panier
                </p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{data.trendVsGlobal.headlineFr}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{data.trendVsGlobal.detailFr}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/80 p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  Anomalies détectées
                </p>
                {data.anomalies.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-secondary)]">Aucune anomalie remontée sur ce cycle.</p>
                ) : (
                  <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                    {data.anomalies.map((a, i) => (
                      <li key={`${a.type}-${i}`} className="border-l-2 border-amber-400/40 pl-2">
                        <span className="text-[var(--color-text-tertiary)]">{a.severity}</span> · {a.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/80 p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Recommandations (pistes)
              </p>
              <ul className="space-y-3">
                {data.actions.map((a, i) => (
                  <li
                    key={`${a.title}-${i}`}
                    className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 border-b border-[var(--color-border)]/60 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{a.title}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{a.detailFr}</p>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md shrink-0 self-start',
                        a.priority === 'now' && 'bg-emerald-500/20 text-emerald-200',
                        a.priority === 'soon' && 'bg-cyan-500/15 text-cyan-200',
                        a.priority === 'watch' && 'bg-[var(--color-card-hover)] text-[var(--color-text-tertiary)]'
                      )}
                    >
                      {a.priority === 'now' ? 'Maintenant' : a.priority === 'soon' ? 'Bientôt' : 'Surveiller'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Link
                href="/trends"
                className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]"
              >
                Tendances
              </Link>
              <Link
                href="/viral-analyzer"
                className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]"
              >
                Analyseur viral
              </Link>
              <Link
                href="/ai"
                className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]"
              >
                ALGO AI
              </Link>
            </div>
          </>
        ) : loading ? (
          <p className="text-sm text-[var(--color-text-tertiary)]">Chargement du cockpit…</p>
        ) : null}
      </div>
    </div>
  )
}
