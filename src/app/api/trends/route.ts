import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'

export async function GET(req: NextRequest) {
  const identifier = getClientIdentifier(req)
  const rateLimit = checkRateLimit(`api-trends:${identifier}`, { limit: 60, windowMs: 60_000 })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) }
    )
  }

  const { searchParams } = new URL(req.url)
  const country = searchParams.get('country') || searchParams.get('scopeCode') || 'FR'
  const geo = country === 'global' ? 'FR' : country.toUpperCase()
  
  try {
    const res = await fetch(
      `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
      { next: { revalidate: 900 } }
    )
    
    if (!res.ok) throw new Error('Google Trends error')
    const xml = await res.text()
    
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
    
    const trends = items.slice(0, 20).map((item, i) => {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || [])[1] || 
                    (item.match(/<title>(.*?)<\/title>/) || [])[1] || `Trend ${i+1}`
      const trafficText = (item.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/) || [])[1] || '10K+'
      const traffic = parseInt(trafficText.replace(/[^0-9]/g, '')) || 10000
      const growthRate = Math.min(Math.floor(traffic / 1000), 500)
      
      return {
        id: `t-google-${i}`,
        name: `#${title.replace(/\s+/g, '')}`,
        displayName: title,
        platform: 'Twitter',
        category: 'Actu',
        growthRate,
        growth: growthRate,
        growthTrend: 'up',
        score: Math.min(60 + Math.floor(growthRate / 10), 99),
        volume: traffic,
        volumeLabel: trafficText,
        momentum: growthRate > 200 ? 'exploding' : growthRate > 100 ? 'rising' : 'stable',
        rank: i + 1,
        relatedContentIds: [],
        explanation: `Sujet tendance sur Google ${geo} · ${trafficText} recherches.`,
        recommendedFormat: ['face_cam', 'reaction'],
        country: geo,
        language: geo === 'FR' ? 'fr' : 'en',
        watchersCount: traffic,
        isExploding: growthRate > 200,
        curveData: Array.from({ length: 24 }, (_, j) => Math.min(100, 30 + j * 3 + Math.random() * 10)),
      }
    })
    
    return NextResponse.json({
      items: trends,
      total: trends.length,
    })
  } catch {
    // Fallback to mock data
    const mockTrends = Array.from({ length: 10 }, (_, i) => ({
      id: `mock-${i}`,
      name: `#Trend${i + 1}`,
      displayName: `Trending Topic ${i + 1}`,
      category: 'Actu',
      growthRate: 50 + Math.floor(Math.random() * 200),
      growth: 50 + Math.floor(Math.random() * 200),
      score: 60 + Math.floor(Math.random() * 30),
      volume: 10000 + Math.floor(Math.random() * 90000),
      volumeLabel: '10K+',
      momentum: 'rising',
      rank: i + 1,
      country: geo,
      curveData: Array.from({ length: 24 }, () => 30 + Math.random() * 40),
    }))
    
    return NextResponse.json({
      items: mockTrends,
      total: mockTrends.length,
    })
  }
}
