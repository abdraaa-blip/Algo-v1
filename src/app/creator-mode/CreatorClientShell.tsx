'use client'
// CreatorClientShell - Alternative creator mode shell
import { useState, useEffect, useCallback } from 'react'
import Link          from 'next/link'
import { ExternalLink, ChevronDown, Clapperboard } from 'lucide-react'

import { LiveCurve }     from '@/components/ui/LiveCurve'
import { Badge }         from '@/components/ui/Badge'
import { BackButton }    from '@/components/ui/BackButton'
import { InsightPanel }  from '@/components/ui/InsightPanel'
import { MomentumPill }  from '@/components/ui/MomentumPill'
import { DataQualityChip } from '@/components/ui/DataQualityChip'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { track }         from '@/services/analyticsService'
import { cn }            from '@/lib/utils'
import type { Content, Platform } from '@/types'
import { fillLocaleStrings } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreatorLabels {
  title:         string
  subtitle:      string
  tips:          string
  reproduce:     string
  why:           string
  bestFormat:    string
  bestPlatform:  string
  soundLabel:    string
  templateLabel: string
  selectHint:    string
  insightLabels: Parameters<typeof InsightPanel>[0]['labels']
}

interface CreatorClientShellProps {
  locale:          string
  labels:          CreatorLabels
}

// ─── Composant ────────────────────────────────────────────────────────────────

function normalizeCreatorPlatform(raw: string): Platform {
  const r = raw.toLowerCase()
  if (r.includes('tiktok')) return 'TikTok'
  if (r.includes('instagram')) return 'Instagram'
  if (r.includes('youtube')) return 'YouTube'
  if (r.includes('twitter') || r === 'x') return 'Twitter'
  if (r.includes('reddit')) return 'Reddit'
  if (r.includes('news')) return 'Other'
  return 'YouTube'
}

// Transform live API data to Content format for the creator mode
function transformToContent(item: Record<string, unknown>, index: number): Content {
  // Generate proper content ID based on source
  const source = String(item.source || 'unknown')
  const sourceUrl = String(item.url || item.link || '#')
  let contentId = `${source}_${index}`
  
  if (source === 'youtube') {
    const videoId = item.videoId || item.id
    if (videoId) {
      contentId = `youtube-${videoId}`
    } else {
      const ytMatch = sourceUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
      if (ytMatch) contentId = `youtube-${ytMatch[1]}`
    }
  } else if (source === 'reddit') {
    const redditId = item.id || item.name
    if (redditId) contentId = `reddit_${String(redditId).replace('t3_', '')}`
  } else if (source === 'github') {
    // GitHub API returns name as full_name (owner/repo) in our datasources.ts
    const repoName = item.name || item.full_name
    if (repoName) contentId = `gh_${String(repoName).replace('/', '_')}`
  } else if (source === 'hackernews') {
    const hnId = item.id || item.objectID
    if (hnId) contentId = `hn_${hnId}`
  }
  
  const platform = normalizeCreatorPlatform(String(item.source || item.platform || 'youtube'))
  const explanation = String(item.description || item.overview || '')

  return {
    id: contentId,
    title: String(item.title || item.name || 'Sans titre'),
    category: 'Viral',
    platform,
    country: 'FR',
    language: 'fr',
    viralScore: Number(item.viral_score || item.viralScore || 70),
    badge: 'Early',
    growthRate: Number(item.growth_rate || 15),
    growthTrend: 'up',
    detectedAt: new Date().toISOString(),
    thumbnail: String(item.thumbnail || item.thumbnailUrl || item.poster || ''),
    sourceUrl: sourceUrl,
    explanation: explanation || 'Signal tendance agrégé.',
    creatorTips: 'Crée du contenu authentique et engageant.',
    insight: {
      postNowProbability: 'high',
      timing: 'now',
      bestPlatform: [platform],
      bestFormat: 'face_cam',
      timingLabel: fillLocaleStrings({ fr: 'Maintenant', en: 'Now' }),
      postWindow: { status: 'optimal' },
    },
    sourceDistribution: [{ platform, percentage: 60, momentum: 'high' }],
    watchersCount: Number(item.views || item.listeners || 1000),
    isExploding: Boolean(item.is_exploding || item.momentum === 'exploding'),
  }
}

export function CreatorClientShell({
  locale,
  labels,
}: CreatorClientShellProps) {
  void locale
  const [contents, setContents] = useState<Content[]>([])
  const [selected, setSelected] = useState<Content | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)
  const [sourceLabel, setSourceLabel] = useState('live aggregator')

  const fetchContents = useCallback(async () => {
    try {
      const res = await fetch('/api/live?limit=15')
      const data = await res.json()
      
      if (data.success && data.data) {
        const allItems: Record<string, unknown>[] = []
        const dataKeys = Object.keys(data.data)
        
        for (const sourceKey of dataKeys) {
          const sourceData = data.data[sourceKey]
          if (Array.isArray(sourceData)) {
            allItems.push(...sourceData.map(item => ({ ...item, source: sourceKey })))
          }
        }
        
        const transformed = allItems.slice(0, 15).map(transformToContent)
        setContents(transformed)
        setLastFetchedAt(new Date().toISOString())
        setSourceLabel(`live:${dataKeys.join('+')}`)
        if (transformed.length > 0 && !selected) {
          setSelected(transformed[0])
        }
      }
    } catch (error) {
      console.error('[ALGO Creator] Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }, [selected])

  // Fetch live data on mount + refresh loop
  useEffect(() => {
    void fetchContents()
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      void fetchContents()
    }, 60_000)
    return () => clearInterval(interval)
  }, [fetchContents])

  function handleSelect(content: Content) {
    setSelected(content)
    setExpanded(false)
    track('creator_mode_opened', { contentId: content.id })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <BackButton fallbackHref="/" />
        <SkeletonLoader variant="card" count={6} />
      </div>
    )
  }

  if (!selected || contents.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <BackButton fallbackHref="/" />
        <SectionHeader title={labels.title} subtitle={labels.subtitle} />
        <p className="text-white/50">Aucun contenu disponible pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <BackButton fallbackHref="/" />
      <SectionHeader
        title={labels.title}
        subtitle={labels.subtitle}
        className="mb-6 mt-4"
      />
      <div className="mb-4">
        <DataQualityChip
          source={sourceLabel}
          freshness={lastFetchedAt ? formatRelativeTime(lastFetchedAt) : 'pending'}
          confidence={contents.length >= 12 ? 'high' : contents.length >= 5 ? 'medium' : 'low'}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">

        {/* ── Colonne gauche · sélecteur de contenus ── */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-white/28 uppercase tracking-widest">
            {labels.selectHint}
          </p>

          <div
            className="space-y-2 max-h-[65vh] overflow-y-auto pe-1"
            role="listbox"
            aria-label={labels.selectHint}
          >
            {contents.map((content) => {
              const isSelected = selected.id === content.id

              return (
                <button
                  key={content.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(content)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-xl border text-start',
                    'transition-all duration-150 outline-none',
                    'focus-visible:ring-2 focus-visible:ring-violet-400/60',
                    isSelected
                      ? 'border-[rgba(123,97,255,0.35)] bg-[rgba(123,97,255,0.10)] text-white'
                      : [
                          'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)]',
                          'hover:bg-[var(--color-card-hover)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]',
                        ].join(' '),
                  )}
                >
                  <Clapperboard
                    size={14}
                    strokeWidth={1.6}
                    className={cn('shrink-0 mt-0.5', isSelected ? 'text-violet-400' : 'text-[var(--color-text-muted)]')}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug line-clamp-2">
                      {content.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <MomentumPill value={content.growthRate} trend={content.growthTrend} />
                      <span className="text-[10px] text-[var(--color-text-muted)]">{content.platform}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Colonne droite · analyse ── */}
        <div
          className="relative rounded-2xl border border-[var(--color-border)] overflow-hidden"
          aria-live="polite"
          aria-label={`Analyse : ${selected.title}`}
        >
          {/* Background courbe */}
          <LiveCurve
            growthRate={selected.growthRate}
            color="violet"
            opacity={0.06}
            position="background"
          />

          <div className="relative p-5 space-y-5">

            {/* En-tête du contenu sélectionné */}
            <div>
              <Badge type={selected.badge} label={selected.badge} />
              <h2
                className="text-base font-bold text-[var(--color-text-primary)] mt-2 leading-snug"
              >
                {selected.title}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <MomentumPill value={selected.growthRate} trend={selected.growthTrend} />
                <span className="text-[10px] text-[var(--color-text-muted)]">{selected.platform} · {selected.category}</span>
              </div>
            </div>

            {/* Insight Engine */}
            <InsightPanel
              insight={selected.insight}
              watchersCount={selected.watchersCount}
              labels={labels.insightLabels}
            />

            {/* Tips créateur */}
            <div className="rounded-xl border border-[rgba(0,255,178,0.15)] bg-[rgba(0,255,178,0.05)] p-4">
              <p className="text-[10px] font-bold text-emerald-400/75 uppercase tracking-widest mb-2.5">
                {labels.tips}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {selected.creatorTips}
              </p>
            </div>

            {/* Bouton Reproduire · expand avec explication */}
            <button
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className={cn(
                'w-full flex items-center justify-between',
                'px-4 py-2.5 rounded-xl border font-bold text-xs',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60',
                expanded
                  ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                  : 'border-violet-500/22 bg-violet-500/8 text-violet-400/80 hover:bg-violet-500/18 hover:text-violet-300',
              )}
            >
              <span>{labels.reproduce}</span>
              <ChevronDown
                size={13}
                strokeWidth={2}
                className={cn('transition-transform duration-150', expanded && 'rotate-180')}
                aria-hidden
              />
            </button>

            {/* Expansion · analyse complète */}
            {expanded && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3 algo-s1">
                <div>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5">
                    {labels.why}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {selected.explanation}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <InfoLine label={labels.bestPlatform} value={selected.insight.bestPlatform.join(', ')} />
                  <InfoLine label={labels.bestFormat}   value={labels.insightLabels.formatLabels?.[selected.insight.bestFormat] ?? selected.insight.bestFormat} />
                </div>
              </div>
            )}

            {/* Asset Quick-Pack */}
            {selected.assetPack && (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                  Asset Quick-Pack
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.assetPack.soundUrl && (
                    <AssetLink
                      href={selected.assetPack.soundUrl}
                      label={labels.soundLabel}
                    />
                  )}
                  {selected.assetPack.templateUrl && (
                    <AssetLink
                      href={selected.assetPack.templateUrl}
                      label={labels.templateLabel}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Lien vers fiche contenu */}
            <Link
              href={`/content/${selected.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Voir la fiche complète
              <ExternalLink size={10} strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-[var(--color-text-muted)] shrink-0">{label}</span>
      <span className="text-[var(--color-text-secondary)] font-semibold text-end">{value}</span>
    </div>
  )
}

function AssetLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl',
        'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-semibold',
        'hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60',
      )}
    >
      <ExternalLink size={10} strokeWidth={2} aria-hidden />
      {label}
    </a>
  )
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  return `${diffHours}h`
}

