'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FlaskConical, ArrowRight, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { MomentumPill } from '@/components/ui/MomentumPill'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { BackButton } from '@/components/ui/BackButton'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { cn } from '@/lib/utils'
import { mapUserFacingApiError } from '@/lib/copy/api-error-fr'

interface FailLabLabels {
  title: string
  subtitle: string
  intro: string
  whyFailed: string
  lesson: string
  emptyTitle: string
  viewOriginal: string
  badgeLabel: string
}

interface FailItem {
  id: string
  title: string
  platform: string
  category: string
  growthRate: number
  growthTrend: 'up' | 'down' | 'stable'
  failReason: string
  lesson: string
  sourceUrl?: string
}

interface FailLabClientShellProps {
  labels: FailLabLabels
}

const STAGGER = ['algo-s1', 'algo-s2', 'algo-s3', 'algo-s4', 'algo-s5', 'algo-s6'] as const

// Reasons why content might fail - used for educational content
const FAIL_REASONS = [
  "Timing décalé — publié trop tard après le pic de la tendance",
  "Format inadapté à la plateforme ciblée",
  "Hook faible — les 3 premières secondes ne captent pas l'attention",
  "Contenu trop générique — manque d'angle unique",
  "Absence de call-to-action clair",
  "Audio / visuel de qualité insuffisante",
  "Tendance déjà saturée au moment de la publication",
  "Mauvais hashtags ou description incomplète",
]

const LESSONS = [
  "Publie dans les 2–4 h suivant la détection d'une tendance",
  "Adapte ton format à chaque plateforme (vertical pour TikTok, carré pour Instagram)",
  "Capte l'attention dans les 3 premières secondes avec un hook percutant",
  "Trouve un angle unique qui te différencie des autres créateurs",
  "Termine toujours par une question ou un CTA engageant",
  "Investis dans un bon éclairage et un audio clair",
  "Surveille la saturation des tendances avant de créer du contenu",
  "Utilise des hashtags pertinents et une description complète avec mots-clés",
]

function buildFailItems(rows: Record<string, unknown>[]): FailItem[] {
  return rows.slice(0, 8).map((item, i) => ({
    id: String(item.id || `fail-${i}`),
    title: String(item.title || item.name || 'Sans titre'),
    platform: String(item.source || item.platform || 'youtube'),
    category: String(item.category || 'viral'),
    growthRate: -Math.floor(Math.random() * 30 + 10),
    growthTrend: 'down' as const,
    failReason: FAIL_REASONS[i % FAIL_REASONS.length],
    lesson: LESSONS[i % LESSONS.length],
    sourceUrl: String(item.url || item.link || '#'),
  }))
}

export function FailLabClientShell({ labels }: FailLabClientShellProps) {
  const [fails, setFails] = useState<FailItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const loadFails = useCallback(async () => {
    try {
      setFetchError(null)
      const res = await fetch('/api/live?limit=12')
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()

      if (data.success && data.data) {
        const rows: Record<string, unknown>[] = []
        if (Array.isArray(data.data)) {
          rows.push(...data.data)
        } else if (typeof data.data === 'object') {
          for (const key of Object.keys(data.data)) {
            const sourceData = data.data[key]
            if (Array.isArray(sourceData)) {
              rows.push(...sourceData.map((item) => ({ ...item, source: key })))
            }
          }
        }

        setFails(buildFailItems(rows))
      } else {
        setFails([])
        setFetchError(
          mapUserFacingApiError(
            typeof data.error === 'string' && data.error.trim() !== '' ? data.error : 'Failed to fetch'
          )
        )
      }
    } catch (error) {
      console.error('[ALGO Fail Lab] Failed to fetch:', error)
      setFails([])
      setFetchError(
        mapUserFacingApiError(error instanceof Error ? error.message : 'Failed to fetch')
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFails()
  }, [loadFails])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <BackButton fallbackHref="/" />
        <SectionHeader title={labels.title} subtitle={labels.subtitle} />
        <SkeletonLoader variant="card" count={4} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <BackButton fallbackHref="/" />
      
      <SectionHeader title={labels.title} subtitle={labels.subtitle} />

      {fetchError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2 text-sm text-rose-100/90">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-rose-300" aria-hidden />
            <span>{fetchError}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              void loadFails()
            }}
            className="shrink-0 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-500/25"
          >
            Réessayer
          </button>
        </div>
      ) : null}

      {/* Intro - analytical tone */}
      <p className="text-sm text-white/38 leading-relaxed rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3.5">
        {labels.intro}
      </p>

      {/* List */}
      {!fetchError && fails.length === 0 ? (
        <EmptyState icon={FlaskConical} title={labels.emptyTitle} />
      ) : fails.length > 0 ? (
        <div className="space-y-4" role="list" aria-label={labels.title}>
          {fails.map((fail, i) => (
            <article
              key={fail.id}
              role="listitem"
              className={cn(
                'rounded-2xl border border-white/6 bg-white/[0.025] overflow-hidden',
                'transition-all duration-[250ms] hover:border-white/10 hover:bg-white/[0.04]',
                STAGGER[i % 6],
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 p-4 pb-3">
                <h2 className="text-sm font-bold text-white/78 leading-snug flex-1">
                  {fail.title}
                </h2>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge type="AlmostViral" label={labels.badgeLabel} animated={false} />
                  <MomentumPill value={fail.growthRate} trend={fail.growthTrend} />
                </div>
              </div>

              {/* Analysis blocks */}
              <div className="px-4 pb-4 space-y-2.5">
                {/* Why it failed */}
                <div className="rounded-xl border border-[rgba(255,77,109,0.14)] bg-[rgba(255,77,109,0.05)] p-3">
                  <p className="text-[10px] font-bold text-rose-400/70 uppercase tracking-widest mb-1.5">
                    {labels.whyFailed}
                  </p>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {fail.failReason}
                  </p>
                </div>

                {/* Lesson for creators */}
                <div className="rounded-xl border border-white/6 bg-white/[0.025] p-3">
                  <p className="text-[10px] font-bold text-violet-400/65 uppercase tracking-widest mb-1.5">
                    {labels.lesson}
                  </p>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {fail.lesson}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5">
                <div className="flex items-center gap-3 text-[10px] text-white/25">
                  <span>{fail.platform}</span>
                  <span aria-hidden>·</span>
                  <span>{fail.category}</span>
                </div>
                {fail.sourceUrl && fail.sourceUrl !== '#' && (
                  <Link
                    href={fail.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-violet-400/60 hover:text-violet-400 transition-colors"
                  >
                    {labels.viewOriginal}
                    <ArrowRight size={10} />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}
