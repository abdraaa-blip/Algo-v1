import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Stars & célébrités',
  description: 'Personnalités et talents en vue — popularité, filmographie et signaux culturels.',
  path: '/stars',
  keywords: ['stars', 'célébrités', 'cinéma', 'TMDB', 'ALGO'],
})

export default function StarsLayout({ children }: { children: React.ReactNode }) {
  return children
}
