import { NextResponse } from 'next/server'
import { ALGO_ECOSYSTEM_API_VERSION } from '@/lib/ecosystem/constants'
import { platformApiKeysConfigured } from '@/lib/ecosystem/platform-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/health
 * Public — léger, pour probes d’écosystème.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
    platformKeysConfigured: platformApiKeysConfigured(),
    timestamp: new Date().toISOString(),
  })
}
