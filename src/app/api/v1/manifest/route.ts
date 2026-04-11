import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";
import { buildManifestPayload } from "@/lib/ecosystem/catalog";
import {
  DATA_LANDSCAPE,
  TARGET_ENTITY_VIEWS,
} from "@/lib/ecosystem/data-landscape";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/manifest
 * Public · inventaire pour intégrations (pas de secrets).
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`api-v1-manifest:${identifier}`, {
    limit: 240,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const url = new URL(request.url);
  const base =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    `${url.protocol}//${url.host}`;

  const manifest = buildManifestPayload(base);

  return NextResponse.json({
    ...manifest,
    dataLandscape: {
      targetEntityViews: [...TARGET_ENTITY_VIEWS],
      domains: DATA_LANDSCAPE,
    },
  });
}
