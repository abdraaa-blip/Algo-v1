import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'ALGO AI',
  description:
    "Intelligence analytique d'ALGO : guide stratégique, analyse de signaux, idées et veille — réponses directes, utiles, alignées avec Viral Analyzer et les tendances du produit.",
  path: '/ai',
  keywords: ['ALGO AI', 'assistant IA', 'tendances', 'analyse', 'recommandations', 'radar'],
})

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return children
}
