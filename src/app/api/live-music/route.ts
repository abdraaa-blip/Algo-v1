import { NextResponse, type NextRequest } from 'next/server'
import { fetchTopTracks, fetchTopArtists, fetchAllMusicCharts } from '@/lib/api/lastfm-service'
import { EXTENDED_MUSIC_COUNTRIES } from '@/lib/geo/global-presets'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Map country codes to Last.fm country names
const COUNTRY_MAP: Record<string, string> = {
  FR: 'France',
  US: 'United States',
  GB: 'United Kingdom',
  NG: 'Nigeria',
  SN: 'Senegal',
  MA: 'Morocco',
  ZA: 'South Africa',
  EG: 'Egypt',
  DE: 'Germany',
  ES: 'Spain',
  IT: 'Italy',
  BR: 'Brazil',
  AR: 'Argentina',
  MX: 'Mexico',
  JP: 'Japan',
  KR: 'South Korea',
  IN: 'India',
  TR: 'Turkey',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
}

// Keep mapping aligned with shared UI presets
void EXTENDED_MUSIC_COUNTRIES

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all' // tracks, artists, all
  const countryCode = searchParams.get('country')
  const limit = parseInt(searchParams.get('limit') || '30', 10)
  
  const country = countryCode ? COUNTRY_MAP[countryCode.toUpperCase()] : undefined
  
  try {
    switch (type) {
      case 'tracks':
        const tracksResult = await fetchTopTracks(country, limit)
        return NextResponse.json({
          success: true,
          type: 'tracks',
          country: country || 'Global',
          ...tracksResult,
          count: tracksResult.data.length
        })
        
      case 'artists':
        const artistsResult = await fetchTopArtists(country, limit)
        return NextResponse.json({
          success: true,
          type: 'artists',
          country: country || 'Global',
          ...artistsResult,
          count: artistsResult.data.length
        })
        
      case 'all':
      default:
        const allResult = await fetchAllMusicCharts(country)
        return NextResponse.json({
          success: true,
          type: 'all',
          country: country || 'Global',
          ...allResult,
          counts: {
            tracks: allResult.tracks.length,
            artists: allResult.artists.length
          }
        })
    }
  } catch (error) {
    console.error('[ALGO API] Last.fm fetch failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch music data', data: [], source: 'error' },
      { status: 500 }
    )
  }
}
