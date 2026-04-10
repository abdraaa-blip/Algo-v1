import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Bienvenue',
  description: 'Configure ton expérience ALGO : région, centres d’intérêt et langue.',
  path: '/onboarding',
  keywords: ['onboarding', 'ALGO', 'préférences'],
})

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children
}
