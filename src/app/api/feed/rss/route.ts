/**
 * ALGO RSS Feed
 * 
 * Provides RSS feed of trending content for power users
 * Subscribe to stay updated on viral trends
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIdentifier } from '@/lib/api/rate-limiter'

export const revalidate = 300 // Revalidate every 5 minutes

interface TrendItem {
  keyword: string
  score: { overall: number; tier: string }
  platform: string
  velocity: number
  volume: number
}

// Generate RSS XML
function generateRSS(trends: TrendItem[], baseUrl: string): string {
  const now = new Date().toUTCString()
  
  const items = trends.map(trend => `
    <item>
      <title><![CDATA[${escapeXml(trend.keyword)} - Score ${trend.score.overall}/100 (${trend.score.tier})]]></title>
      <link>${baseUrl}/trends?q=${encodeURIComponent(trend.keyword)}</link>
      <description><![CDATA[
        Trending on ${trend.platform}
        Velocity: ${trend.velocity > 0 ? '+' : ''}${trend.velocity}%
        Volume: ${formatNumber(trend.volume)} mentions
        Tier: ${trend.score.tier}
      ]]></description>
      <pubDate>${now}</pubDate>
      <guid isPermaLink="false">algo-trend-${encodeURIComponent(trend.keyword)}-${Date.now()}</guid>
      <category>${trend.platform}</category>
    </item>
  `).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ALGO - Viral Trends Feed</title>
    <link>${baseUrl}</link>
    <description>Real-time viral content trends detected by ALGO algorithm</description>
    <language>fr</language>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>5</ttl>
    <atom:link href="${baseUrl}/api/feed/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>ALGO</title>
      <link>${baseUrl}</link>
    </image>
    ${items}
  </channel>
</rss>`
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`api-feed-rss:${identifier}`, { limit: 40, windowMs: 60_000 })
  if (!rateLimit.success) {
    return new NextResponse(`Rate limit exceeded. Retry after ${rateLimit.retryAfter ?? 0}s`, {
      status: 429,
      headers: createRateLimitHeaders(rateLimit),
    })
  }

  const { searchParams } = new URL(request.url)
  const country = searchParams.get('country') || 'US'
  const limit = parseInt(searchParams.get('limit') || '20')
  
  try {
    // Fetch trends from our API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://algo.app'
    const trendsResponse = await fetch(
      `${request.nextUrl.origin}/api/realtime/trends?country=${country}&limit=${limit}`,
      { next: { revalidate: 300 } }
    )
    
    if (!trendsResponse.ok) {
      throw new Error('Failed to fetch trends')
    }
    
    const data = await trendsResponse.json()
    const trends = data.trends || []
    
    const rss = generateRSS(trends, baseUrl)
    
    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
    
  } catch (error) {
    console.error('[ALGO RSS] Error:', error)
    
    // Return minimal valid RSS on error
    const errorRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ALGO - Feed Temporarily Unavailable</title>
    <link>${process.env.NEXT_PUBLIC_APP_URL || 'https://algo.app'}</link>
    <description>Feed is temporarily unavailable. Please try again later.</description>
  </channel>
</rss>`
    
    return new NextResponse(errorRss, {
      status: 503,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Retry-After': '60',
      }
    })
  }
}
