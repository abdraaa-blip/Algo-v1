import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";
import { buildGlobalIntelligence } from "@/lib/intelligence/global-intelligence";
import { runWhatIfSimulation } from "@/lib/autonomy/what-if";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`intelligence-simulate:${identifier}`, {
    limit: 25,
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

  try {
    const body = (await request.json()) as {
      region?: string;
      locale?: string;
      baselineScore?: number;
      scenario?: {
        engagementDelta?: number;
        frictionDelta?: number;
        anomalyBoost?: number;
        viralityDelta?: number;
      };
    };
    const region = (body.region || "FR").toUpperCase();
    const locale = (body.locale || "fr").toLowerCase();
    const snapshot = await buildGlobalIntelligence({ region, locale });
    const baselineScore =
      typeof body.baselineScore === "number"
        ? body.baselineScore
        : Math.round(
            snapshot.categories.reduce((acc, c) => acc + c.score, 0) /
              Math.max(1, snapshot.categories.length),
          );

    const result = runWhatIfSimulation({
      baselineScore,
      baselineEngagementRate: snapshot.sources.firstPartySignals.engagementRate,
      baselineFrictionRate: snapshot.sources.firstPartySignals.frictionRate,
      baselineAnomalyCount: snapshot.anomalies.length,
      scenario: body.scenario || {},
    });

    return NextResponse.json({
      success: true,
      data: {
        region,
        locale,
        simulation: result,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to run simulation",
      },
      { status: 500 },
    );
  }
}
