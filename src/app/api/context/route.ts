import { NextRequest, NextResponse } from 'next/server'

/**
 * Contexte public non nominatif pour personnalisation légère (SEO / UX).
 * Vercel : `x-vercel-ip-country`. Ailleurs : souvent vide — le client garde la langue navigateur.
 */
export function GET(request: NextRequest) {
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-appengine-country') ||
    ''

  const accept = request.headers.get('accept-language') || ''
  const primary = accept.split(',')[0]?.trim().split(';')[0]?.toLowerCase().slice(0, 12) || 'fr'

  return NextResponse.json(
    {
      country: country || null,
      languageHint: primary,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=120',
      },
    }
  )
}
