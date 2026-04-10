import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Statut des services',
  description: 'État des API et intégrations ALGO (clés, connectivité) — diagnostic technique.',
  path: '/status',
  keywords: ['statut', 'API', 'ALGO'],
})

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children
}
