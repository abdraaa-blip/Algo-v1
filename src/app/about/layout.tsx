import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'À propos',
  description:
    'Mission ALGO : lire les signaux culturels et algorithmiques (indicateurs, pas des certitudes) · pour créateurs et curieux.',
  path: '/about',
  keywords: ['ALGO', 'mission', 'tendances', 'créateurs', 'radar'],
})

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
