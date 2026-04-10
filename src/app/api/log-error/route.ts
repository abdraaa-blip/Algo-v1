import { NextResponse } from 'next/server'
import { rateLimitMiddleware, sanitizeInput } from '@/lib/security'

interface ErrorLog {
  error: string
  stack?: string
  componentStack?: string
  url: string
  timestamp: string
  userAgent?: string
  userId?: string
}

/**
 * Error Logging Endpoint
 * Receives client-side errors for monitoring
 */
export async function POST(request: Request) {
  // Rate limit to prevent spam
  const rateLimitResponse = rateLimitMiddleware(request, {
    maxRequests: 50,
    windowMs: 60 * 1000,
  })
  
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json() as ErrorLog
    
    // Sanitize inputs
    const sanitizedError: ErrorLog = {
      error: sanitizeInput(body.error || 'Unknown error'),
      stack: body.stack ? sanitizeInput(body.stack).slice(0, 5000) : undefined,
      componentStack: body.componentStack ? sanitizeInput(body.componentStack).slice(0, 2000) : undefined,
      url: sanitizeInput(body.url || 'Unknown URL'),
      timestamp: body.timestamp || new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.slice(0, 500) || undefined,
    }

    // Log to console (in production, send to logging service)
    console.error('[ALGO Client Error]', JSON.stringify(sanitizedError, null, 2))

    // In production, you would send to:
    // - Sentry, LogRocket, Datadog, etc.
    // - Your own logging database
    // - Slack/Discord webhook for critical errors

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
