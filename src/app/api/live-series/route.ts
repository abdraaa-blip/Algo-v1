import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/tv/day?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`,
      { next: { revalidate: 300 } }
    )
    const data = await res.json()
    return NextResponse.json({ data: data.results || [] })
  } catch (error) {
    console.error('[API] live-series error:', error)
    return NextResponse.json({ data: [], error: 'Failed to fetch series' }, { status: 500 })
  }
}
