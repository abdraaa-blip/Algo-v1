import { NextResponse } from 'next/server'
import { fetchTrendingPeople } from '@/lib/api/tmdb-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const result = await fetchTrendingPeople('day')
    
    return NextResponse.json({
      success: true,
      data: result.data,
      fetchedAt: result.fetchedAt,
      expiresAt: result.expiresAt,
      source: result.source,
      count: result.data.length
    })
  } catch (error) {
    console.error('[ALGO API] Live celebrities fetch failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch celebrities', data: [], source: 'error' },
      { status: 500 }
    )
  }
}
