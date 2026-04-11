import { NextResponse, type NextRequest } from "next/server";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
} from "@/lib/api/rate-limiter";
import { ALGO_ECOSYSTEM_API_VERSION } from "@/lib/ecosystem/constants";
import {
  extractPlatformApiKey,
  fingerprintPlatformKey,
  platformApiKeysConfigured,
  verifyPlatformApiKey,
} from "@/lib/ecosystem/platform-auth";
import {
  fetchSnapshotBundle,
  parseSnapshotQuery,
} from "@/lib/ecosystem/snapshot-store";
import { supabaseServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const RATE = { limit: 60, windowMs: 60_000 };

/**
 * GET /api/v1/snapshot
 * Export incrémental depuis Supabase (tables trend_signal, viral_score_snapshot, model_weight_version).
 *
 * Query :
 * - since : ISO 8601 (optionnel, défaut : dernières 24 h)
 * - types : liste séparée par virgules (optionnel, défaut : les trois tables)
 * - limit : max lignes **par type** (1–500, défaut 100)
 *
 * Auth : clé plateforme + `SUPABASE_SERVICE_ROLE_KEY` côté serveur.
 */
export async function GET(request: NextRequest) {
  if (!platformApiKeysConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Platform API keys not configured",
        ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
      },
      { status: 503 },
    );
  }

  if (!supabaseServiceRoleConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Snapshot export requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL on the server",
        ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
      },
      { status: 503 },
    );
  }

  const key = extractPlatformApiKey(request);
  if (!verifyPlatformApiKey(key)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const keyFp = fingerprintPlatformKey(key!);
  const identifier = `platform:v1:snapshot:${keyFp}:${getClientIdentifier(request)}`;
  const rateLimit = checkRateLimit(identifier, RATE);
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

  const parsed = parseSnapshotQuery(new URL(request.url).searchParams);
  if (!parsed.ok) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error,
        ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
      },
      { status: 400 },
    );
  }

  const result = await fetchSnapshotBundle(parsed.value);
  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
      },
      { status: 500, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  return NextResponse.json(result.data, {
    headers: createRateLimitHeaders(rateLimit),
  });
}
