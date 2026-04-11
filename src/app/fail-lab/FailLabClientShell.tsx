'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FlaskConical, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { MomentumPill } from '@/components/ui/MomentumPill'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { BackButton } from '@/components/ui/BackButton'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { cn } from '@/lib/utils'

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

export function FailLabClientShell({ labels }: FailLabClientShellProps) {
  const [fails, setFails] = useState<FailItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch live trending data and transform into "fail lab" educational content
        // We take real trending items and create hypothetical "what could go wrong" scenarios
        const res = await fetch('/api/live?limit=12')
        const data = await res.json()
        
        if (data.success && Array.isArray(data.data)) {
          // Transform real trending content into educational "fail" scenarios
          const transformed: FailItem[] = data.data.slice(0, 8).map((item: Record<string, unknown>, i: number) => ({
            id: String(item.id || `fail-${i}`),
            title: String(item.title || item.name || 'Untitled'),
            platform: String(item.source || item.platform || 'youtube'),
            category: String(item.category || 'viral'),
            growthRate: -Math.floor(Math.random() * 30 + 10), // Negative growth for fails
            growthTrend: 'down' as const,
            failReason: FAIL_REASONS[i % FAIL_REASONS.length],
            lesson: LESSONS[i % LESSONS.length],
            sourceUrl: String(item.url || '#'),
          }))
          setFails(transformed)
        }
      } catch (error) {
        console.error('[ALGO Fail Lab] Failed to fetch:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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

      {/* Intro - analytical tone */}
      <p className="text-sm text-white/38 leading-relaxed rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3.5">
        {labels.intro}
      </p>

      {/* List */}
      {fails.length === 0 ? (
        <EmptyState icon={FlaskConical} title={labels.emptyTitle} />
      ) : (
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
      )}
    </div>
  )
}
