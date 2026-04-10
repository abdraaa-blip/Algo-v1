import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Transparence algorithme',
  description:
    'Comment ALGO calcule les scores viraux : signaux, pondérations et seuils — transparence sur la méthode.',
  path: '/algorithm',
  keywords: ['algorithme', 'score viral', 'transparence', 'ALGO'],
})

export default function AlgorithmLayout({ children }: { children: React.ReactNode }) {
  return children
}
