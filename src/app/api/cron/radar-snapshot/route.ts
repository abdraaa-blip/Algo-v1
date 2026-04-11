import { NextRequest, NextResponse } from "next/server";
import { ALGO_ECOSYSTEM_API_VERSION } from "@/lib/ecosystem/constants";
import { buildPredictiveIntelligenceBundle } from "@/lib/intelligence/predictive-intelligence-bundle";
import { recordRadarSnapshotIfDue } from "@/lib/intelligence/radar-snapshot-store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** `ALGO_RADAR_CRON_REGIONS` ex. `FR,US,GB` · défaut léger (coût / latence) ; étend si besoin. */
function parseRadarCronRegions(raw: string | undefined): string[] {
  if (!raw?.trim()) return ["FR", "US"];
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c));
}

/**
 * Cron : enregistre un point radar par région (bypass throttle) pour alimenter l’historique 7j
 * même sans trafic sur `/intelligence`. Auth : `Authorization: Bearer ${CRON_SECRET}`.
 * Voir `vercel.json`.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "CRON_SECRET is not configured",
        ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
      },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const regions = parseRadarCronRegions(process.env.ALGO_RADAR_CRON_REGIONS);
  const locale = "fr";
  const started = Date.now();
  const results: Array<{
    region: string;
    ok: boolean;
    error?: string;
    score?: number;
  }> = [];

  for (const region of regions) {
    try {
      const bundle = await buildPredictiveIntelligenceBundle({
        region,
        locale,
      });
      recordRadarSnapshotIfDue(
        null,
        {
          region: bundle.region,
          locale: bundle.locale,
          viralityScore: bundle.predictedViralityScore,
          confidence: bundle.confidence,
          anomalyCount: bundle.anomalyCount,
          generatedAt: bundle.generatedAt,
        },
        { bypassThrottle: true },
      );
      results.push({ region, ok: true, score: bundle.predictedViralityScore });
    } catch (e) {
      results.push({
        region,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    ecosystemApiVersion: ALGO_ECOSYSTEM_API_VERSION,
    durationMs: Date.now() - started,
    regions,
    results,
  });
}
