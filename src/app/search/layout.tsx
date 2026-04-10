import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Recherche',
  description:
    'Recherche unifiée ALGO : tendances, contenus viraux, actualités et sujets — signaux multi-sources.',
  path: '/search',
  keywords: ['recherche', 'tendances', 'viral', 'actualités', 'ALGO'],
})

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
