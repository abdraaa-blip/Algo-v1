import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";
import { ALGO_ECOSYSTEM_API_VERSION } from "@/lib/ecosystem/constants";
import { platformApiKeysConfigured } from "@/lib/ecosystem/platform-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/health
 * Public · léger, pour probes d’écosystème.
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`api-v1-health:${identifier}`, {
    limit: 300,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Rate limit exceeded",
        retryAfter: rateLimit.retryAfter,
        ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
      },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  return NextResponse.json({
    ok: true,
    ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
    platformKeysConfigured: platformApiKeysConfigured(),
    timestamp: new Date().toISOString(),
  });
}
