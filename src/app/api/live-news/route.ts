import { NextResponse, type NextRequest } from 'next/server'
import { fetchRealNews, fetchAllNews } from '@/lib/api/real-data-service'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/api/rate-limiter'
import { sanitizeInput } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function fallbackNewsImage(index: number, title: string): string {
  let h = 0
  const s = title || `article-${index}`
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  const seed = `algo${index}n${Math.abs(h)}`
  return `https://picsum.photos/seed/${seed}/800/450`
}

/** Score d’affichage dérivé de la fraîcheur (pas une métrique NewsAPI réelle). */
function importanceFromPublishedAt(publishedAt: string): number {
  const t = Date.parse(publishedAt)
  if (Number.isNaN(t)) return 75
  const hours = (Date.now() - t) / 3_600_000
  if (hours <= 1) return 96
  if (hours <= 3) return 92
  if (hours <= 12) return 86
  if (hours <= 24) return 80
  if (hours <= 48) return 74
  return 68
}

/**
 * GET /api/live-news
 * Fetches real-time news from NewsAPI
 * Rate limited: 60 requests per minute per IP
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(identifier, { limit: 60, windowMs: 60000 })
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const rawCountry = searchParams.get('country')
  const country = rawCountry ? sanitizeInput(rawCountry).toLowerCase() : null
  
  try {
    const result = country 
      ? await fetchRealNews(country)
      : await fetchAllNews()
    
    // Determine honest status based on source
    const status = result.source === 'live' ? 'active' 
      : result.source === 'cached' ? 'delayed' 
      : 'static'
    
    // Map data to client-expected format
    const mappedData = result.data.map((article, index) => {
      const imageUrl =
        article.urlToImage && article.urlToImage.startsWith('http')
          ? article.urlToImage
          : fallbackNewsImage(index, article.title)
      return {
      id: article.id || `news_${index}_${Date.now()}`,
      title: article.title,
      source: article.source,
      sourceName: article.source, // Client expects sourceName
      url: article.url,
      image: imageUrl,
      urlToImage: imageUrl,
      publishedAt: article.publishedAt,
      fetchedAt: result.fetchedAt,
      category: 'general',
      importanceScore: importanceFromPublishedAt(article.publishedAt),
    }
    })
    
    return NextResponse.json({
      success: true,
      data: mappedData,
      source: result.source,
      fetchedAt: result.fetchedAt,
      // Honest status - not "live", just "active"
      status,
      count: mappedData.length,
      // Transparency metadata
      meta: {
        refreshIntervalMs: 15 * 60 * 1000,
        refreshIntervalLabel: '15 min',
        region: country?.toUpperCase() || 'ALL',
        dataFreshness: result.source === 'live' ? 'recent' : 'cached',
        sourceName: 'Google News RSS',
      }
    }, { headers: createRateLimitHeaders(rateLimit) })
  } catch (error) {
    console.error('[ALGO API] Live news fetch failed:', error)
    return NextResponse.json({
      success: false, 
      error: 'Failed to fetch news', 
      data: [], 
      status: 'error',
      source: 'error',
      fallbackMessage: 'Les actualites sont temporairement indisponibles.',
    }, { status: 500, headers: createRateLimitHeaders(rateLimit) })
  }
}
