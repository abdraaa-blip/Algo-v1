/**
 * ALGO Live Data API
 * 
 * Returns structured data with transparent status and timestamps.
 * IMPORTANT: Data is NOT truly "live" - it's updated periodically via caching.
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchAllSources, fetchYouTubeTrending, fetchRedditHot, fetchHackerNews, fetchGitHubTrending, getSourceStatuses } from '@/lib/datasources'
import { DATA_SOURCES } from '@/lib/data-pipeline'

export const revalidate = 300 // Revalidate every 5 minutes

// Helper to create honest response metadata
function createResponseMeta(country: string, sourceStatuses: Record<string, unknown>) {
  const now = new Date()
  const activeCount = Object.values(sourceStatuses).filter(
    (s: unknown) => (s as { status: string })?.status === 'success'
  ).length
  const totalCount = Object.keys(sourceStatuses).length
  
  return {
    fetchedAt: now.toISOString(),
    // Honestly: not real-time, just periodically refreshed
    dataFreshness: 'periodically_updated',
    refreshInterval: '5 minutes',
    activeSourcesCount: activeCount,
    totalSourcesCount: totalCount,
    region: country,
    // Honest status labels
    statusLabels: {
      active: 'Donnees recentes (mises a jour dans les 15 dernieres minutes)',
      delayed: 'Donnees differees (mises a jour dans la derniere heure)',
      static: 'Donnees en cache (plus d\'une heure)',
    },
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')
    const country = searchParams.get('country') || 'FR'
    
    let result
    
    if (source) {
      switch (source.toLowerCase()) {
        case 'youtube': 
          result = { youtube: await fetchYouTubeTrending(country) }
          break
        case 'reddit': 
          result = { reddit: await fetchRedditHot() }
          break
        case 'hackernews': 
        case 'hn': 
          result = { hackernews: await fetchHackerNews() }
          break
        case 'github': 
          result = { github: await fetchGitHubTrending() }
          break
        default: 
          result = await fetchAllSources()
      }
    } else {
      result = await fetchAllSources()
    }
    
    const sourceStatuses = getSourceStatuses()
    const meta = createResponseMeta(country, sourceStatuses)
    const latencyMs = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      // Transparent metadata
      meta: {
        ...meta,
        latencyMs,
        timestamp: Date.now(),
      },
      // Source-specific information with honest refresh intervals
      sourceInfo: Object.fromEntries(
        Object.keys(DATA_SOURCES).map(key => [
          key,
          {
            name: DATA_SOURCES[key].name,
            refreshIntervalMs: DATA_SOURCES[key].refreshIntervalMs,
            refreshIntervalLabel: `${Math.round(DATA_SOURCES[key].refreshIntervalMs / 60000)} min`,
          }
        ])
      ),
      country,
      sources: sourceStatuses,
      data: result,
    })
  } catch (error) {
    const latencyMs = Date.now() - startTime
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        fetchedAt: new Date().toISOString(),
        latencyMs,
        dataFreshness: 'error',
      },
      // Fallback message for UI
      fallbackMessage: 'Les donnees sont temporairement indisponibles. Veuillez reessayer.',
    }, { status: 500 })
  }
}
