import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ViralScoreRing } from '@/components/ui/ViralScoreRing'
import { MomentumPill } from '@/components/ui/MomentumPill'
import { AlgoLoader } from '@/components/ui/AlgoLoader'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar } from '@/components/ui/FilterBar'
import { LiveCurve } from '@/components/ui/LiveCurve'
import { InsightPanel } from '@/components/ui/InsightPanel'
import { WatchlistToggle } from '@/components/ui/WatchlistToggle'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Radar, Zap } from 'lucide-react'
import type { Insight } from '@/types'

export default function DesignSystemPage() {
  // Non exposée en production
  if (process.env.NODE_ENV !== 'development') notFound()

  const mockInsight: Insight = {
    postNowProbability: 'high',
    timing:             'now',
    bestPlatform:       ['TikTok', 'Instagram'],
    bestFormat:         'face_cam',
    timingLabel:        { fr: 'Poste maintenant', en: 'Post now', es: '', de: '', ar: '' },
    postWindow:         { status: 'optimal' },
  }

  const insightLabels = {
    title:        'Insight Engine',
    postNow:      { high: 'Fort potentiel', medium: 'Risqué', low: 'Trop tard' },
    timing:       { now: 'Poste maintenant ✅', too_late: 'Trop tard ❌', too_early: 'Trop tôt ⏳' },
    bestPlatform: 'Plateforme idéale',
    bestFormat:   'Format recommandé',
    watchers:     '{count} personnes surveillent ce signal',
    postWindow:   { optimal: 'Fenêtre ouverte — moment idéal', saturated: 'Trend saturée', fading: 'Signal s\'éteint' },
    formatLabels: { face_cam: 'Face cam', text: 'Texte animé', montage: 'Montage', narration: 'Narration', duet: 'Duet', reaction: 'Réaction' },
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-14 min-h-dvh bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div>
        <h1 className="text-[28px] font-black tracking-tight text-[var(--color-text-primary)]">
          Design System
        </h1>
        <p className="text-[13px] mt-1 text-[var(--color-text-muted)]">
          Dev only · Banc de test visuel ALGO · Non indexable · <code>notFound()</code> en production
        </p>
      </div>

      {/* ── Badge ──────────────────────────────────────────────────────── */}
      <Section title="Badge">
        <div className="flex flex-wrap gap-3">
          <Badge type="Viral"       label="Viral"          />
          <Badge type="Early"       label="Signal précoce" />
          <Badge type="Breaking"    label="Breaking"       />
          <Badge type="Trend"       label="Trend"          />
          <Badge type="AlmostViral" label="Presque viral"  animated={false} />
          <Badge type="coolOff"     label="En déclin"      animated={false} />
          <Badge type="exploding"   label="En explosion"   />
          <Badge type="Viral"       label="Viral — md"     size="md" />
        </div>
      </Section>

      {/* ── Button ─────────────────────────────────────────────────────── */}
      <Section title="Button">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" icon={Zap}>Avec icône</Button>
          <Button variant="primary" icon={Zap} iconPosition="end">Icône fin</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </Section>

      {/* ── ViralScoreRing ──────────────────────────────────────────────── */}
      <Section title="ViralScoreRing">
        <div className="flex items-center flex-wrap gap-6">
          <ViralScoreRing value={94}  trend="up"     size="sm" />
          <ViralScoreRing value={76}  trend="stable" size="md" />
          <ViralScoreRing value={45}  trend="down"   size="lg" />
          <ViralScoreRing value={100} trend="up"     size="lg" />
          <ViralScoreRing value={0}   trend="down"   size="md" />
        </div>
      </Section>

      {/* ── MomentumPill ───────────────────────────────────────────────── */}
      <Section title="MomentumPill">
        <div className="flex flex-wrap gap-3">
          <MomentumPill value={182} trend="up"     unit="en 2h" />
          <MomentumPill value={34}  trend="stable" />
          <MomentumPill value={-18} trend="down"   />
          <MomentumPill value={450} trend="up"     />
        </div>
      </Section>

      {/* ── AlgoLoader ─────────────────────────────────────────────────── */}
      <Section title="AlgoLoader">
        <div className="flex flex-wrap items-end gap-12">
          <AlgoLoader size="sm" message="Lecture des signaux…" />
          <AlgoLoader size="md" />
          <AlgoLoader size="lg" message="Reading signals…" />
        </div>
      </Section>

      {/* ── SkeletonLoader ──────────────────────────────────────────────── */}
      <Section title="SkeletonLoader">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonLoader shape="card" />
          <SkeletonLoader shape="card" />
          <div className="space-y-4">
            <SkeletonLoader shape="text" lines={4} />
            <SkeletonLoader shape="circle" />
            <SkeletonLoader shape="row" />
          </div>
        </div>
      </Section>

      {/* ── EmptyState ─────────────────────────────────────────────────── */}
      <Section title="EmptyState">
        <EmptyState
          icon={Radar}
          title="Le radar est silencieux pour l'instant."
          subtitle="Essaie de changer la zone d'observation."
          cta={{ label: 'Explorer', onClick: () => {} }}
        />
      </Section>

      {/* ── FilterBar ──────────────────────────────────────────────────── */}
      <Section title="FilterBar">
        <FilterBar
          filters={[
            { id: '1', label: "Aujourd'hui",  value: 'today'    },
            { id: '2', label: 'Cette semaine', value: 'week'     },
            { id: '3', label: 'Ce mois',       value: 'month'    },
            { id: '4', label: 'Émergentes',    value: 'emerging' },
            { id: '5', label: 'Plus vues',     value: 'mostViewed'},
          ]}
          active="today"
          onChange={() => {}}
        />
      </Section>

      {/* ── LiveCurve ──────────────────────────────────────────────────── */}
      <Section title="LiveCurve">
        <div className="space-y-3">
          {(
            [
              { growthRate: 180, color: 'violet' as const, label: 'growthRate=180, violet' },
              { growthRate: 30,  color: 'blue'   as const, label: 'growthRate=30, blue'   },
              { growthRate: -15, color: 'green'  as const, label: 'growthRate=-15, green' },
            ]
          ).map(({ growthRate, color, label }) => (
            <div
              key={color}
              className="relative h-20 rounded-2xl border border-[var(--color-border)] overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <LiveCurve growthRate={growthRate} color={color} opacity={0.20} />
              <p className="absolute inset-0 flex items-center justify-center text-xs text-white/25">
                {label}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── InsightPanel ───────────────────────────────────────────────── */}
      <Section title="InsightPanel">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InsightPanel insight={mockInsight} watchersCount={2847} labels={insightLabels} />
          <InsightPanel
            insight={{ ...mockInsight, postNowProbability: 'low', timing: 'too_late', postWindow: { status: 'fading' } }}
            labels={insightLabels}
          />
        </div>
        <div className="mt-4">
          <p style={{ color: 'rgba(240,240,248,0.35)', fontSize: 11, marginBottom: 8 }}>
            Mode condensé (affiché au hover sur les cartes)
          </p>
          <InsightPanel insight={mockInsight} labels={insightLabels} condensed />
        </div>
      </Section>

      {/* ── WatchlistToggle ─────────────────────────────────────────────── */}
      <Section title="WatchlistToggle">
        <div className="flex gap-3 flex-wrap">
          <WatchlistToggle trendId="t1" isFollowing={false} onToggle={() => {}} followLabel="Suivre" unfollowLabel="Arrêter" />
          <WatchlistToggle trendId="t2" isFollowing={true}  onToggle={() => {}} followLabel="Suivre" unfollowLabel="Arrêter" />
          <WatchlistToggle trendId="t3" isFollowing={false} onToggle={() => {}} followLabel="Suivre" unfollowLabel="Arrêter" size="sm" />
        </div>
      </Section>

      {/* ── SectionHeader ───────────────────────────────────────────────── */}
      <Section title="SectionHeader">
        <div className="space-y-4 max-w-md">
          <SectionHeader title="Ce qui explose partout en ce moment" />
          <SectionHeader title="Trends" subtitle="Ce qui monte, ce qui explose, ce qui s'installe" action={{ label: 'Voir tout', onClick: () => {} }} />
        </div>
      </Section>

    </div>
  )
}

// ─── Helper interne ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`ds-${title}`} className="space-y-5">
      <h2
        id={`ds-${title}`}
        style={{
          fontSize:      11,
          fontWeight:    700,
          color:         'rgba(240,240,248,0.28)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          borderBottom:  '1px solid rgba(255,255,255,0.05)',
          paddingBottom: 8,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
