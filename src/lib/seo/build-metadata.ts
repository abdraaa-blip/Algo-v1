import type { Metadata } from 'next'
import {
  absoluteUrl,
  DEFAULT_OG_IMAGE_PATH,
  getSiteBaseUrl,
  SITE_NAME,
  SITE_SILENT_SLOGAN,
  SITE_TAGLINE,
} from './site'

export type BuildPageMetadataInput = {
  /** Page title without trailing brand (brand appended unless `rawTitle` is true). */
  title: string
  description: string
  /** Path starting with / */
  path: string
  keywords?: string[]
  ogType?: 'website' | 'article' | 'profile' | 'video.other'
  /** Absolute URL or path starting with / */
  ogImage?: string | null
  locale?: string
  /** ISO region for og:locale:alternate */
  alternateLocales?: string[]
  /** If true, use `title` as full document title */
  rawTitle?: boolean
  noindex?: boolean
}

function truncate(s: string, n: number): string {
  const t = s.trim()
  if (t.length <= n) return t
  return `${t.slice(0, n - 1).trim()}…`
}

/**
 * Consistent SEO + Open Graph + Twitter Cards for App Router pages.
 */
export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const base = getSiteBaseUrl()
  const path = input.path.startsWith('/') ? input.path : `/${input.path}`
  const fullTitle = input.rawTitle ? input.title : `${input.title} · ${SITE_NAME}`
  const desc = truncate(input.description || `${SITE_NAME} · tendances, radar et intelligence culturelle.`, 160)

  let ogImageUrl: string
  if (input.ogImage) {
    ogImageUrl = input.ogImage.startsWith('http') ? input.ogImage : absoluteUrl(input.ogImage)
  } else {
    ogImageUrl = absoluteUrl(DEFAULT_OG_IMAGE_PATH)
  }

  const pageUrl = `${base}${path}`

  const meta: Metadata = {
    title: fullTitle,
    description: desc,
    keywords: input.keywords?.length ? input.keywords : undefined,
    alternates: { canonical: path },
    openGraph: {
      title: input.title,
      description: truncate(input.description, 200),
      url: pageUrl,
      siteName: SITE_NAME,
      locale: input.locale ?? 'fr_FR',
      type: input.ogType ?? 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: input.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: truncate(input.description, 200),
      images: [ogImageUrl],
    },
    robots: input.noindex ? { index: false, follow: false } : { index: true, follow: true },
  }

  if (input.alternateLocales?.length) {
    meta.openGraph = {
      ...meta.openGraph,
      alternateLocale: input.alternateLocales,
    }
  }

  return meta
}

/** Root layout metadata (home, defaults). */
export function buildRootMetadata(): Metadata {
  const base = getSiteBaseUrl()
  const defaultTitle = `ALGO · ${SITE_TAGLINE}`
  const defaultDesc = `${SITE_SILENT_SLOGAN} ALGO structure les signaux publics : tendances, formats, timing, pour décider vite. Des indicateurs, pas du bruit ni des certitudes magiques.`

  const ogImageUrl = absoluteUrl(DEFAULT_OG_IMAGE_PATH)

  return {
    metadataBase: new URL(base),
    title: defaultTitle,
    description: defaultDesc,
    keywords: [
      'viral',
      'tendances',
      'trends',
      'algorithme',
      'radar',
      'culture',
      'social media',
      'créateur',
      'influenceur',
      'veille',
      'intelligence',
    ],
    alternates: {
      canonical: '/',
      types: {
        'application/rss+xml': '/api/feed/rss',
      },
    },
    manifest: '/manifest.json',
    openGraph: {
      title: defaultTitle,
      description: truncate(defaultDesc, 200),
      type: 'website',
      siteName: SITE_NAME,
      locale: 'fr_FR',
      url: base,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: defaultTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description: truncate(defaultDesc, 200),
      images: [ogImageUrl],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: SITE_NAME,
    },
  }
}
