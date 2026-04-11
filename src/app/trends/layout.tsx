import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Tendances en direct',
  description:
    'Radar des tendances Google et signaux sociaux, mis à jour en continu. Repère ce qui monte tôt, sans promesse de certitude.',
  path: '/trends',
  keywords: ['tendances', 'google trends', 'viral', 'radar', 'ALGO'],
})

export default function TrendsLayout({ children }: { children: React.ReactNode }) {
  return children
}
