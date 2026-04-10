import type { Metadata } from 'next'
import { TrendingClientShell } from './TrendingClientShell'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Vidéos tendance YouTube',
  description: 'Classement des vidéos YouTube qui montent — mise à jour fréquente, multi-régions.',
  path: '/trending',
  keywords: ['youtube', 'trending', 'vidéos', 'viral', 'ALGO'],
})

export default function TrendingPage() {
  return <TrendingClientShell />
}
