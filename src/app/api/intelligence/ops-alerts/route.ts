import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";
import { collectOpsStatus } from "@/lib/intelligence/ops-alerts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`intelligence-ops-alerts:${identifier}`, {
    limit: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded",
        retryAfter: rateLimit.retryAfter,
      },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const snapshot = collectOpsStatus();

  return NextResponse.json({
    success: true,
    ...snapshot,
  });
}
