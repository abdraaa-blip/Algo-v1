import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";
import type { ActionProposal } from "@/lib/autonomy/types";
import { executeAutonomyProposal } from "@/lib/autonomy/executor";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`intelligence-execute:${identifier}`, {
    limit: 20,
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
    const body = (await request.json()) as { proposal?: ActionProposal };
    if (!body?.proposal) {
      return NextResponse.json(
        { success: false, error: "proposal is required" },
        { status: 400 },
      );
    }
    const result = executeAutonomyProposal(body.proposal);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Execution failed",
      },
      { status: 500 },
    );
  }
}
