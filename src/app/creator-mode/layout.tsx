import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Mode créateur',
  description:
    'Studio créateur ALGO : contenus viraux, insights et formats qui performent — conçu pour publier plus vite et mieux.',
  path: '/creator-mode',
  keywords: ['créateur', 'contenu viral', 'insights', 'ALGO'],
})

export default function CreatorModeLayout({ children }: { children: React.ReactNode }) {
  return children
}
