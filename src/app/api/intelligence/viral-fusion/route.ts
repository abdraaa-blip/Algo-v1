import { NextRequest, NextResponse } from "next/server";
import { getSessionBillingSnapshot } from "@/lib/billing/read-plan";
import { buildViralFusionPayload } from "@/lib/intelligence/viral-fusion";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";
import { validators } from "@/lib/security";

export const dynamic = "force-dynamic";

const FUSION_CACHE_TTL_MS = 30_000;
const fusionCache = new Map<
  string,
  { expiresAtMs: number; payload: unknown }
>();

/**
 * GET /api/intelligence/viral-fusion?region=FR
 * Tendances + YouTube (sauf si `ALGO_FUSION_YOUTUBE_REQUIRE_PRO=1` et utilisateur non Pro).
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, { limit: 30, windowMs: 60_000 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded" },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const { searchParams } = new URL(request.url);
  const rawRegion = searchParams.get("region") || "FR";
  const region = rawRegion.toUpperCase();
  if (!validators.countryCode(region)) {
    return NextResponse.json(
      { success: false, error: "Invalid region" },
      { status: 400, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const requireProForYoutube =
    process.env.ALGO_FUSION_YOUTUBE_REQUIRE_PRO === "1";
  const snap = requireProForYoutube ? await getSessionBillingSnapshot() : null;
  const includeYouTube = !requireProForYoutube || snap?.plan === "pro";
  const cacheKey = requireProForYoutube
    ? `${region}:${snap?.plan ?? "free"}`
    : region;

  const nowMs = Date.now();
  const hit = fusionCache.get(cacheKey);
  if (hit && hit.expiresAtMs > nowMs) {
    return NextResponse.json(hit.payload, {
      headers: createRateLimitHeaders(rateLimit),
    });
  }

  try {
    const payload = await buildViralFusionPayload(region, { includeYouTube });
    fusionCache.set(cacheKey, {
      expiresAtMs: nowMs + FUSION_CACHE_TTL_MS,
      payload,
    });
    return NextResponse.json(
      { ...payload, cacheTtlMs: FUSION_CACHE_TTL_MS },
      { headers: createRateLimitHeaders(rateLimit) },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "viral-fusion build failed",
      },
      { status: 500, headers: createRateLimitHeaders(rateLimit) },
    );
  }
}
