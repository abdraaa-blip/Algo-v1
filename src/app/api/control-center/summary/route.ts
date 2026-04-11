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
 * GET /api/control-center/summary
 * Données **non sensibles** pour le tableau de bord Control Center (déploiement + écosystème).
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`api-control-center-summary:${identifier}`, {
    limit: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Rate limit exceeded",
        retryAfter: rateLimit.retryAfter,
      },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const sha = process.env.VERCEL_GIT_COMMIT_SHA || "";
  const commitShort = sha.length >= 7 ? sha.slice(0, 7) : null;

  return NextResponse.json(
    {
      ok: true,
      kind: "algo.controlCenter.summary",
      generatedAt: new Date().toISOString(),
      runtime: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV ?? null,
        deploymentId: process.env.VERCEL_DEPLOYMENT_ID?.slice(0, 14) ?? null,
        commitShort,
        packageVersion: process.env.npm_package_version ?? null,
      },
      ecosystem: {
        platformKeysConfigured: platformApiKeysConfigured(),
        ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
