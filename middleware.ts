import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const opsToken = process.env.INTELLIGENCE_DASHBOARD_TOKEN
  const isOpsLogsRoute = request.nextUrl.pathname.startsWith('/intelligence/logs')
  if (isOpsLogsRoute && opsToken) {
    const cookieToken = request.cookies.get('intelligence_ops_token')?.value || ''
    const queryToken = request.nextUrl.searchParams.get('opsToken') || ''

    if (queryToken) {
      if (queryToken !== opsToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const cleanUrl = request.nextUrl.clone()
      cleanUrl.searchParams.delete('opsToken')
      const response = NextResponse.redirect(cleanUrl)
      response.cookies.set('intelligence_ops_token', queryToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12,
      })
      return response
    }

    if (cookieToken !== opsToken) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/intelligence'
      redirectUrl.searchParams.set('ops', 'required')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Update Supabase session
  const response = await updateSession(request)
  
  // Add security headers to the response
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  
  // Content Security Policy
  const isDev = process.env.NODE_ENV !== 'production'
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com https://plausible.io"
    : "script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com https://plausible.io"

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://accounts.google.com",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.github.com https://*.reddit.com https://hacker-news.firebaseio.com https://*.invidious.io https://vid.puffyan.us https://accounts.google.com https://plausible.io",
    "media-src 'self' https: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
