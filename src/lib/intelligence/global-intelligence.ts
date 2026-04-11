type Json = Record<string, unknown>
import { withResilience } from '@/lib/resilience/circuit-breaker'

export interface GlobalIntelligenceSnapshot {
  generatedAt: string
  scope: {
    region: string
    locale: string
  }
  sources: {
    news: { count: number; source: string }
    social: { count: number; source: string }
    videos: { count: number; source: string }
    finance: { count: number; source: string }
    science: { count: number; source: string }
    economic: { count: number; source: string }
    socialExternal: { count: number; source: string }
    commerce: { count: number; source: string }
    firstPartySignals: { engagementRate: number; frictionRate: number; source: string }
  }
  categories: Array<{
    name: string
    score: number
    momentum: 'up' | 'stable' | 'down'
    signals: string[]
  }>
  anomalies: Array<{
    type: 'spike' | 'friction' | 'drop'
    severity: 'low' | 'medium' | 'high'
    message: string
  }>
  opportunities: Array<{
    type: 'content' | 'product' | 'timing'
    title: string
    confidence: number
    rationale: string
  }>
}

function toNum(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

async function safeFetchJson(url: string): Promise<Json | null> {
  return withResilience<Json | null>(
    `global-fetch:${new URL(url).hostname}`,
    async () => {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'ALGO-Intelligence/1.0' },
      })
      if (!res.ok) {
        if (res.status < 500 && res.status !== 429) return null
        throw new Error(`Upstream ${res.status}`)
      }
      return (await res.json()) as Json
    },
    {
      fallback: () => null,
      retries: 3,
      retryDelay: 250,
      circuit: { failureThreshold: 4, resetTimeout: 45_000 },
      bulkhead: { maxConcurrent: 12, maxQueued: 20, timeout: 12_000 },
    }
  )
}

async function fetchFinanceSignals(): Promise<{ count: number; source: string; items: string[] }> {
  // Public market signal proxy (crypto market movers) for economic/financial pulse.
  const url =
    'https://api.coingecko.com/api/v3/search/trending'
  const json = await safeFetchJson(url)
  const coins = Array.isArray(json?.coins) ? (json?.coins as Array<{ item?: { name?: string } }>) : []
  const items = coins.map((c) => c.item?.name).filter((v): v is string => Boolean(v)).slice(0, 8)
  return {
    count: items.length,
    source: items.length > 0 ? 'coingecko' : 'fallback',
    items,
  }
}

async function fetchScienceSignals(): Promise<{ count: number; source: string; items: string[] }> {
  const url = 'https://api.crossref.org/works?rows=8&sort=published&order=desc'
  const json = await safeFetchJson(url)
  const msg = (json?.message || null) as { items?: Array<{ title?: string[] }> } | null
  const items = Array.isArray(msg?.items)
    ? msg.items
      .map((item) => Array.isArray(item.title) ? item.title[0] : '')
      .filter((t): t is string => Boolean(t))
      .slice(0, 8)
    : []
  return {
    count: items.length,
    source: items.length > 0 ? 'crossref' : 'fallback',
    items,
  }
}

async function fetchEconomicSignals(region: string): Promise<{ count: number; source: string; items: string[] }> {
  const country = region.toLowerCase()
  const url = `https://api.worldbank.org/v2/country/${country}/indicator/FP.CPI.TOTL.ZG?format=json`
  const json = await safeFetchJson(url)
  const arr = Array.isArray(json) ? (json as Array<Record<string, unknown>>) : []
  const rows = Array.isArray(arr[1]) ? (arr[1] as Array<Record<string, unknown>>) : []
  const items = rows
    .slice(0, 6)
    .map((r) => {
      const year = String(r.date || '')
      const val = Number(r.value)
      if (!year || !Number.isFinite(val)) return ''
      return `inflation_${year}_${val.toFixed(2)}`
    })
    .filter(Boolean)
  return {
    count: items.length,
    source: items.length > 0 ? 'worldbank' : 'fallback',
    items,
  }
}

async function fetchExternalSocialSignals(): Promise<{ count: number; source: string; items: string[] }> {
  const reddit = await safeFetchJson('https://www.reddit.com/r/popular/hot.json?limit=8')
  const children = Array.isArray((reddit?.data as Json | undefined)?.children)
    ? (((reddit?.data as Json).children as Array<{ data?: { title?: string } }>))
    : []
  const items = children
    .map((c) => c.data?.title || '')
    .filter((t): t is string => Boolean(t))
    .slice(0, 8)
  return {
    count: items.length,
    source: items.length > 0 ? 'reddit-popular' : 'fallback',
    items,
  }
}

async function fetchCommerceSignals(): Promise<{ count: number; source: string; items: string[] }> {
  const market = await safeFetchJson(
    'https://api.coingecko.com/api/v3/search/trending'
  )
  const coins = Array.isArray(market?.coins) ? (market.coins as Array<{ item?: { name?: string } }>) : []
  const items = coins.map((c) => c.item?.name).filter((v): v is string => Boolean(v)).slice(0, 6)
  return {
    count: items.length,
    source: items.length > 0 ? 'market-proxy' : 'fallback',
    items,
  }
}

function buildCategoryScores(inputs: {
  newsTitles: string[]
  socialTitles: string[]
  videoTitles: string[]
  financeItems: string[]
  scienceItems: string[]
  economicItems: string[]
  socialExternalItems: string[]
  commerceItems: string[]
  engagementRate: number
  frictionRate: number
}) {
  const asText = (arr: string[]) => arr.join(' ').toLowerCase()
  const corpus = {
    news: asText(inputs.newsTitles),
    social: asText(inputs.socialTitles),
    videos: asText(inputs.videoTitles),
    finance: asText(inputs.financeItems),
    science: asText(inputs.scienceItems),
    economic: asText(inputs.economicItems),
    socialExternal: asText(inputs.socialExternalItems),
    commerce: asText(inputs.commerceItems),
  }
  const scoreKeywords = {
    culture: ['music', 'movie', 'cinema', 'series', 'festival', 'artist'],
    tech: ['ai', 'ia', 'startup', 'robot', 'tech', 'innovation'],
    finance: ['crypto', 'bitcoin', 'market', 'bourse', 'stock', 'economy'],
    science: ['science', 'research', 'study', 'space', 'medical'],
  }

  const categories = Object.entries(scoreKeywords).map(([name, keys]) => {
    let hits = 0
    for (const k of keys) {
      if (corpus.news.includes(k)) hits += 1
      if (corpus.social.includes(k)) hits += 1
      if (corpus.videos.includes(k)) hits += 1
      if (corpus.finance.includes(k)) hits += 1
      if (corpus.science.includes(k)) hits += 1
      if (corpus.economic.includes(k)) hits += 1
      if (corpus.socialExternal.includes(k)) hits += 1
      if (corpus.commerce.includes(k)) hits += 1
    }
    const base = Math.min(100, 30 + hits * 8)
    const adj = Math.round(base + inputs.engagementRate * 20 - inputs.frictionRate * 30)
    const score = Math.max(0, Math.min(100, adj))
    const momentum: 'up' | 'stable' | 'down' = score >= 65 ? 'up' : score >= 45 ? 'stable' : 'down'
    return {
      name,
      score,
      momentum,
      signals: keys.slice(0, 3),
    }
  })
  return categories
}

function detectAnomalies(params: {
  socialCount: number
  videoCount: number
  engagementRate: number
  frictionRate: number
}) {
  const anomalies: GlobalIntelligenceSnapshot['anomalies'] = []
  if (params.socialCount > 40 || params.videoCount > 20) {
    anomalies.push({
      type: 'spike',
      severity: 'medium',
      message: 'Pic de volume détecté sur les sources sociales et vidéo.',
    })
  }
  if (params.frictionRate > 0.2) {
    anomalies.push({
      type: 'friction',
      severity: 'high',
      message: 'Friction utilisateur élevée : prioriser la stabilité UX / perf.',
    })
  }
  if (params.engagementRate < 0.05) {
    anomalies.push({
      type: 'drop',
      severity: 'medium',
      message: "Baisse d'engagement détectée sur les dernières 24 h.",
    })
  }
  return anomalies
}

function inferProductOpportunities(titles: string[]): GlobalIntelligenceSnapshot['opportunities'] {
  const productHints = [
    'headphone', 'camera', 'ring light', 'microphone', 'keyboard', 'gaming',
    'beauty', 'skincare', 'fitness', 'supplement', 'phone case', 'pet',
  ]
  const text = titles.join(' ').toLowerCase()
  const found = productHints.filter((k) => text.includes(k)).slice(0, 3)
  const mapped = found.map((k) => ({
    type: 'product' as const,
    title: `Signal produit emergent: ${k}`,
    confidence: 0.62,
    rationale: 'Fréquence croissante sur titres sociaux / vidéo + potentiel UGC.',
  }))
  return mapped
}

export async function buildGlobalIntelligence(params?: {
  region?: string
  locale?: string
}): Promise<GlobalIntelligenceSnapshot> {
  const region = (params?.region || 'FR').toUpperCase()
  const locale = (params?.locale || 'fr').toLowerCase()
  const baseUrl = getBaseUrl()

  const [newsJson, trendsJson, videosJson, analyticsJson, finance, science, economic, socialExternal, commerce] = await Promise.all([
    safeFetchJson(`${baseUrl}/api/live-news?country=${region.toLowerCase()}`),
    safeFetchJson(`${baseUrl}/api/live-trends?country=${region}`),
    safeFetchJson(`${baseUrl}/api/live-videos?country=${region}`),
    safeFetchJson(`${baseUrl}/api/analytics/events?hours=24`),
    fetchFinanceSignals(),
    fetchScienceSignals(),
    fetchEconomicSignals(region),
    fetchExternalSocialSignals(),
    fetchCommerceSignals(),
  ])

  const newsItems = Array.isArray(newsJson?.data) ? (newsJson?.data as Json[]) : []
  const trendItems = Array.isArray(trendsJson?.data) ? (trendsJson?.data as Json[]) : []
  const videoItems = Array.isArray(videosJson?.data) ? (videosJson?.data as Json[]) : []
  const engagementRate = toNum((analyticsJson?.adaptiveSignals as Json | undefined)?.engagementRate, 0)
  const frictionRate = toNum((analyticsJson?.adaptiveSignals as Json | undefined)?.frictionRate, 0)

  const newsTitles = newsItems.map((n) => String(n.title || '')).filter(Boolean)
  const socialTitles = trendItems.map((t) => String(t.title || t.name || '')).filter(Boolean)
  const videoTitles = videoItems.map((v) => String(v.title || '')).filter(Boolean)

  const categories = buildCategoryScores({
    newsTitles,
    socialTitles,
    videoTitles,
    financeItems: finance.items,
    scienceItems: science.items,
    economicItems: economic.items,
    socialExternalItems: socialExternal.items,
    commerceItems: commerce.items,
    engagementRate,
    frictionRate,
  })
  const anomalies = detectAnomalies({
    socialCount: socialTitles.length,
    videoCount: videoTitles.length,
    engagementRate,
    frictionRate,
  })

  const opportunities: GlobalIntelligenceSnapshot['opportunities'] = [
    {
      type: 'content',
      title: 'Accélérer les contenus sur signaux montants',
      confidence: categories.some((c) => c.momentum === 'up') ? 0.74 : 0.58,
      rationale: 'Catégories avec momentum positif détectées dans les flux agrégés.',
    },
    {
      type: 'timing',
      title: 'Fenêtre de publication dynamique',
      confidence: 0.66,
      rationale: "Combinaison engagement/friction et volume social pour ajuster le timing de publication.",
    },
    ...inferProductOpportunities([...socialTitles, ...videoTitles]),
    {
      type: 'content',
      title: 'Scientific signal leverage',
      confidence: science.count > 0 ? 0.61 : 0.42,
      rationale: 'Recent research bursts can seed high-trust narratives and explainers.',
    },
    {
      type: 'timing',
      title: 'Economic context-aware publishing',
      confidence: economic.count > 0 ? 0.59 : 0.4,
      rationale: 'Macro volatility windows can shift user attention and conversion timing.',
    },
    {
      type: 'product',
      title: 'Commerce demand pulse detected',
      confidence: commerce.count > 0 ? 0.57 : 0.39,
      rationale: 'Cross-market rising entities indicate monetizable attention clusters.',
    },
  ]

  return {
    generatedAt: new Date().toISOString(),
    scope: { region, locale },
    sources: {
      news: { count: newsTitles.length, source: String(newsJson?.source || 'mixed') },
      social: { count: socialTitles.length, source: String(trendsJson?.source || 'mixed') },
      videos: { count: videoTitles.length, source: String(videosJson?.source || 'mixed') },
      finance: { count: finance.count, source: finance.source },
      science: { count: science.count, source: science.source },
      economic: { count: economic.count, source: economic.source },
      socialExternal: { count: socialExternal.count, source: socialExternal.source },
      commerce: { count: commerce.count, source: commerce.source },
      firstPartySignals: {
        engagementRate,
        frictionRate,
        source: analyticsJson ? 'analytics-events' : 'fallback',
      },
    },
    categories,
    anomalies,
    opportunities,
  }
}
