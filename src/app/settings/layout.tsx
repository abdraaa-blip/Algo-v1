import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Paramètres',
  description: 'Préférences ALGO : région, langue et affichage.',
  path: '/settings',
  noindex: true,
})

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
