'use client'

import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'

import { Card }           from '@/components/ui/Card'
import { SectionHeader }  from '@/components/ui/SectionHeader'
import { EmptyState }     from '@/components/ui/EmptyState'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'

import { useFavorites } from '@/hooks/useFavorites'

const STAGGER = ['algo-s1','algo-s2','algo-s3','algo-s4','algo-s5','algo-s6'] as const

const badgeLabels = {
  Viral: 'Viral',
  Early: 'Early',
  Breaking: 'Breaking',
  Trend: 'Trend',
  AlmostViral: 'Presque viral',
  coolOff: 'Refroidissement',
  exploding: 'En explosion',
}

const insightLabels = {
  title: 'Insights',
  postNow: { high: 'Forte chance', medium: 'Moyenne', low: 'Faible' },
  timing: { now: 'Maintenant', too_late: 'Trop tard', too_early: 'Trop tot' },
  bestPlatform: 'Meilleure plateforme',
  bestFormat: 'Meilleur format',
  watchers: '{count} observateurs',
  postWindow: { optimal: 'Optimal', saturated: 'Sature', fading: 'En baisse' },
  formatLabels: { face_cam: 'Face cam', text: 'Texte', montage: 'Montage', narration: 'Narration', duet: 'Duo', reaction: 'Reaction' },
}

const cardLabels = {
  badge: badgeLabels,
  viralScoreAriaLabel: 'Score viral',
  insight: insightLabels,
}

export default function FavoritesPage() {
  const router = useRouter()
  const { contents, isLoaded } = useFavorites()

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <SectionHeader
        title="Mes Favoris"
        subtitle="Les contenus que tu as sauvegardes"
      />

      {!isLoaded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} shape="card" />
          ))}
        </div>
      )}

      {isLoaded && contents.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="Aucun favori"
          subtitle="Explore des contenus et sauvegarde ceux qui t'interessent."
          cta={{
            label: 'Explorer',
            onClick: () => router.push('/'),
          }}
        />
      )}

      {isLoaded && contents.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          role="list"
          aria-label="Mes Favoris"
        >
          {contents.map((content, i) => (
            <div key={content.id} role="listitem">
              <Card
                content={content}
                labels={cardLabels}
                locale="fr"
                showInsight
                animClass={STAGGER[i % 6]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
