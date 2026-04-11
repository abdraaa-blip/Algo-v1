import type { Metadata } from 'next'
import { NewsClientShell } from './NewsClientShell'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Actualités',
  description:
    'Actualités tendance France et monde · agrégation et lecture ALGO des signaux qui comptent pour les créateurs.',
  path: '/news',
  keywords: ['actualités', 'news', 'breaking', 'veille', 'ALGO'],
})

export default function NewsPage() {
  return <NewsClientShell />
}
