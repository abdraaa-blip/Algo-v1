import { NextRequest, NextResponse } from "next/server";
import { parseDefaultedListLimit } from "@/lib/api/query-limit";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";
import { getLearningHistory } from "@/lib/autonomy/learning-history";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(
    `intelligence-learning-history:${identifier}`,
    { limit: 90, windowMs: 60_000 },
  );
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

  const { searchParams } = new URL(request.url);
  const limit = parseDefaultedListLimit(searchParams.get("limit"), 100, 500);
  const history = getLearningHistory(limit);

  const latest = history[0] || null;
  const prev = history[1] || null;
  const alerts: Array<{
    type: "drift" | "feedback" | "stability";
    severity: "low" | "medium" | "high";
    message: string;
  }> = [];

  if (latest) {
    if (latest.wrongRatio >= 0.35) {
      alerts.push({
        type: "feedback",
        severity: "high",
        message:
          "Wrong feedback ratio is high. Consider tightening auto-execution threshold.",
      });
    } else if (latest.wrongRatio >= 0.2) {
      alerts.push({
        type: "feedback",
        severity: "medium",
        message:
          "Wrong feedback ratio is increasing. Monitor autonomy policy drift.",
      });
    }
  }

  if (latest && prev) {
    const thresholdJump = Math.abs(
      latest.nextMinConfidence - prev.nextMinConfidence,
    );
    if (thresholdJump >= 0.05) {
      alerts.push({
        type: "drift",
        severity: "medium",
        message: `Threshold moved quickly (${thresholdJump.toFixed(2)}). Validate decision quality.`,
      });
    }
  }

  const recent = history.slice(0, 10);
  const appliedCount = recent.filter((h) => h.applied).length;
  if (recent.length >= 8 && appliedCount === 0) {
    alerts.push({
      type: "stability",
      severity: "low",
      message: "Learning loop stable with no recent threshold changes.",
    });
  }

  return NextResponse.json({
    success: true,
    data: history,
    alerts,
  });
}
