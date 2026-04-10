import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Favoris',
  description: 'Vos favoris ALGO.',
  path: '/favorites',
  noindex: true,
})

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children
}
