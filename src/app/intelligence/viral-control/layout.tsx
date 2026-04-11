import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Viral Control Center',
  description:
    'Cockpit décisionnel ALGO : score viral agrégé, dynamique, anomalies et pistes d’action. Indicateurs radar, pas des compteurs réseau bruts.',
  path: '/intelligence/viral-control',
  keywords: ['viral', 'cockpit', 'radar', 'ALGO', 'intelligence', 'tendances'],
  noindex: true,
})

export default function ViralControlLayout({ children }: { children: React.ReactNode }) {
  return children
}
