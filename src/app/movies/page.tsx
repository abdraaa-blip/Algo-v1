import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MoviesClientShell } from './MoviesClientShell'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Films & séries',
  description: 'Films et séries qui font le buzz — scores, affluence et tendances culturelles.',
  path: '/movies',
  keywords: ['films', 'séries', 'cinéma', 'streaming', 'ALGO'],
})

const labels = {
  title: 'Films & Series',
  subtitle: 'Ce qui fait le buzz',
  filters: {
    all: 'Tout',
    movies: 'Films',
    series: 'Series',
    documentary: 'Documentaires',
  },
  sortBy: {
    viralScore: 'Score Viral',
    rating: 'Note',
    recent: 'Recent',
    mentions: 'Mentions',
  },
  platforms: 'Plateformes',
  watch: 'Regarder',
  trailer: 'Bande-annonce',
  cast: 'Casting',
  whereToWatch: 'Ou regarder',
}

export default function MoviesPage() {
  return (
    <Suspense fallback={<MoviesSkeleton />}>
      <MoviesClientShell locale="fr" labels={labels} />
    </Suspense>
  )
}

function MoviesSkeleton() {
  return (
    <div className="min-h-screen p-4 space-y-6">
      <div className="h-10 w-64 bg-[var(--color-card)] rounded-lg animate-pulse" />
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-[var(--color-card)] rounded-full animate-pulse flex-shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-[var(--color-card)] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
