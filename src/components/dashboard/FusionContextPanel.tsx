'use client'

import type { ViralFusionPayload } from '@/lib/intelligence/viral-fusion'

type Props = {
  data: ViralFusionPayload | null
  error: string | null
  loading: boolean
}

export function FusionContextPanel({ data, error, loading }: Props) {
  if (loading && !data) {
    return (
      <section
        className="algo-surface rounded-xl p-4 border border-[var(--color-border)] space-y-2"
        aria-busy="true"
      >
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">Tendance + YouTube</h2>
        <p className="text-[13px] text-[var(--color-text-tertiary)]">Chargement de la fusion…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="algo-surface rounded-xl p-4 border border-[var(--color-border)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">Tendance + YouTube</h2>
        <p className="text-[13px] text-amber-200/90 mt-1">{error}</p>
      </section>
    )
  }

  if (!data) return null

  const top = data.videos[0]

  return (
    <section className="algo-surface rounded-xl p-4 border border-[var(--color-border)] space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">Tendance + YouTube</h2>
        <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
          Tendances · {data.trendsMeta.source}
        </span>
      </div>

      {data.topTrend ? (
        <div className="space-y-1">
          <p className="text-[11px] text-[var(--color-text-muted)]">Tendance utilisée pour la recherche</p>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{data.topTrend.title}</p>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            Volume indicatif : {data.topTrend.trafficVolume} · {data.topTrend.source}
          </p>
        </div>
      ) : (
        <p className="text-[13px] text-[var(--color-text-tertiary)]">Pas de tendance tête de liste pour cette zone.</p>
      )}

      {!data.youtubeConfigured ? (
        <p className="text-[12px] text-[var(--color-text-tertiary)]">
          YouTube non configuré (YOUTUBE_API_KEY) : pas de vidéos liées ici — le score radar reste disponible au-dessus.
        </p>
      ) : data.youtubeSearchSkipped === 'require_pro' ? (
        <p className="text-[12px] text-[var(--color-text-tertiary)]">
          Recherche YouTube réservée au plan Pro sur ce déploiement. Les tendances ci-dessus restent disponibles.
        </p>
      ) : top ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/40 p-3 space-y-2">
          <p className="text-[11px] text-[var(--color-text-muted)]">Top vidéo (score fusion ALGO)</p>
          <p className="text-sm text-[var(--color-text-secondary)] leading-snug">{top.title}</p>
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-[var(--color-text-tertiary)]">
            <span className="font-mono tabular-nums text-[var(--color-violet)] font-semibold">{top.fusionScore}/100</span>
            <span>{top.views.toLocaleString('fr-FR')} vues</span>
          </div>
          <a
            href={top.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[12px] text-[var(--color-violet)] hover:underline"
          >
            Ouvrir sur YouTube →
          </a>
        </div>
      ) : (
        <p className="text-[12px] text-[var(--color-text-tertiary)]">Aucune vidéo renvoyée pour cette tendance.</p>
      )}

      {data.videos.length > 1 ? (
        <ul className="text-[11px] text-[var(--color-text-muted)] space-y-1 list-disc pl-4">
          {data.videos.slice(1, 5).map((v) => (
            <li key={v.videoId}>
              <span className="font-mono text-[var(--color-text-tertiary)]">{v.fusionScore}</span> · {v.title.slice(0, 72)}
              {v.title.length > 72 ? '…' : ''}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">{data.disclaimerFr}</p>
    </section>
  )
}
