import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'

interface NewsAPIArticle {
  title?: string
  description?: string
  url?: string
  urlToImage?: string
  publishedAt?: string
  source?: { name?: string }
}

export async function GET(req: NextRequest) {
  const identifier = getClientIdentifier(req)
  const rateLimit = checkRateLimit(`api-news:${identifier}`, { limit: 60, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(req.url)
  const country = searchParams.get('country') || searchParams.get('scopeCode') || 'fr'
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '10')
  
  // Try real API if key is available
  if (process.env.NEWSAPI_KEY) {
    try {
      const countryParam = country && country !== 'global' 
        ? `&country=${country.toLowerCase()}` 
        : '&country=fr'
      
      const categoryParam = category ? `&category=${category}` : '&category=technology'
      
      const res = await fetch(
        `https://newsapi.org/v2/top-headlines?${categoryParam}${countryParam}&pageSize=${limit}&language=fr`,
        {
          headers: { 'X-Api-Key': process.env.NEWSAPI_KEY },
          next: { revalidate: 300 }
        }
      )
      
      if (res.ok) {
        const data = await res.json()
        
        const news = ((data.articles || []) as NewsAPIArticle[]).map((a, i: number) => ({
          id: `n${i + 1}`,
          title: a.title || '',
          summary: a.description || '',
          sourceUrl: a.url || '',
          sourceName: a.source?.name || 'News',
          imageUrl: a.urlToImage || `https://picsum.photos/seed/news${1000 + i}/800/450`,
          publishedAt: a.publishedAt || new Date().toISOString(),
          category: category || 'tech',
          viralScore: Math.floor(Math.random() * 20) + 75,
          importanceScore: Math.floor(Math.random() * 20) + 75,
          speedScore: Math.floor(Math.random() * 20) + 70,
          tags: [a.source?.name || 'News', 'Tech'],
          country: country?.toUpperCase() || 'FR',
          language: 'fr',
          relatedContentIds: [],
          relatedTrendIds: [],
        }))
        
        return NextResponse.json({
          items: news,
          total: news.length,
        })
      }
    } catch {
      // Fall through to mock data
    }
  }
  
  // Fallback mock data
  const mockNews = Array.from({ length: limit }, (_, i) => ({
    id: `news-${i + 1}`,
    title: `Breaking News Story ${i + 1}`,
    summary: 'This is a mock news summary for development.',
    sourceUrl: `https://news.example.com/article/${i + 1}`,
    sourceName: ['TechCrunch', 'The Verge', 'BBC', 'CNN'][i % 4],
    imageUrl: `https://picsum.photos/seed/news${1000 + i}/800/450`,
    publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
    category: category || 'tech',
    viralScore: 60 + Math.floor(Math.random() * 30),
    country: country?.toUpperCase() || 'FR',
  }))
  
  return NextResponse.json({
    items: mockNews,
    total: mockNews.length,
  })
}
