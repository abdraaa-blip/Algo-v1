import {
  fetchGoogleTrends,
  fetchAllTrends,
  type CachedData,
  type RealTrend,
} from '@/lib/api/real-data-service'

export type LiveTrendsPayload = CachedData<RealTrend> & {
  success: true
  status: 'active' | 'delayed' | 'static'
  count: number
  meta: {
    refreshIntervalMs: number
    refreshIntervalLabel: string
    region: string
    dataFreshness: string
    sourceName: string
  }
}

/**
 * Cœur partagé pour `/api/live-trends` et `/api/v1/trends` (écosystème).
 * `country` : code ISO déjà validé ou null pour agrégat.
 */
export async function buildLiveTrendsPayload(country: string | null): Promise<LiveTrendsPayload> {
  const result = country ? await fetchGoogleTrends(country) : await fetchAllTrends()

  const status =
    result.source === 'live' ? 'active' : result.source === 'cached' ? 'delayed' : 'static'

  return {
    success: true,
    ...result,
    status,
    count: result.data.length,
    meta: {
      refreshIntervalMs: 15 * 60 * 1000,
      refreshIntervalLabel: '15 min',
      region: country || 'ALL',
      dataFreshness: result.source === 'live' ? 'recent' : 'cached',
      sourceName: 'Google Trends (via News RSS)',
    },
  }
}
