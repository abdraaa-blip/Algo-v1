import { absoluteUrl, getSiteBaseUrl, SITE_NAME, SITE_SILENT_SLOGAN, SITE_TAGLINE } from './site'

export function organizationJsonLd() {
  const url = getSiteBaseUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    description: `${SITE_NAME} · ${SITE_TAGLINE}. ${SITE_SILENT_SLOGAN} Radar de tendances et d’aide à la décision basé sur des signaux publics.`,
    url,
    logo: absoluteUrl('/icons/icon-512.png'),
    sameAs: [] as string[],
  }
}

export function websiteJsonLd() {
  const url = getSiteBaseUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function personProfileJsonLd(input: {
  name: string
  description?: string | null
  urlPath: string
  image?: string | null
  sameAs?: string[]
}) {
  const url = absoluteUrl(input.urlPath)
  const obj: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: input.name,
    url,
  }
  if (input.description) obj.description = input.description
  if (input.image) obj.image = input.image
  if (input.sameAs?.length) obj.sameAs = input.sameAs
  return obj
}

export function articleContentJsonLd(input: {
  headline: string
  description: string
  urlPath: string
  image?: string | null
  datePublished?: string
}) {
  const url = absoluteUrl(input.urlPath)
  const obj: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/icons/icon-512.png') },
    },
  }
  if (input.image) obj.image = [input.image]
  if (input.datePublished) obj.datePublished = input.datePublished
  return obj
}

export function newsArticleJsonLd(input: {
  headline: string
  description: string
  urlPath: string
  datePublished: string
  image?: string | null
  authorName?: string
  publisherName?: string
}) {
  const url = absoluteUrl(input.urlPath)
  const obj: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: input.headline,
    description: input.description,
    url,
    datePublished: input.datePublished,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }
  if (input.image) obj.image = [input.image]
  if (input.authorName) obj.author = { '@type': 'Person', name: input.authorName }
  obj.publisher = {
    '@type': 'Organization',
    name: input.publisherName ?? SITE_NAME,
    logo: { '@type': 'ImageObject', url: absoluteUrl('/icons/icon-512.png') },
  }
  return obj
}
