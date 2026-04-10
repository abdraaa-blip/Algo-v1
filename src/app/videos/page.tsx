import type { Metadata } from 'next'
import { VideosClientShell } from './VideosClientShell'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { ALGO_UI_LOADING } from '@/lib/copy/ui-strings'

export const metadata: Metadata = buildPageMetadata({
  title: 'Vidéos virales',
  description:
    'Tendances YouTube en direct — France, US, UK, Nigeria. ALGO agrège les signaux viraux pour créateurs et curieux.',
  path: '/videos',
  keywords: ['youtube', 'vidéos virales', 'tendances', 'shorts', 'créateurs', 'ALGO'],
})

export default function VideosPage() {
  const labels = {
    title: 'Videos Virales',
    subtitle: 'Tendances YouTube (MAJ toutes les 30 min)',
    loading: ALGO_UI_LOADING.videos,
    emptyTitle: 'Aucune video',
    emptySub: 'Aucune video disponible pour ce filtre.',
    filterAll: 'Tout',
    filters: {
      time: [
        { id: 'all', label: 'Tout', value: 'all' },
        { id: '24h', label: '24h', value: '24h' },
        { id: '7d', label: '7j', value: '7d' },
      ],
      category: [
        { id: 'all', label: 'Tout', value: 'all' },
      ],
    },
  }

  return (
    <VideosClientShell
      locale="fr"
      labels={labels}
    />
  )
}
