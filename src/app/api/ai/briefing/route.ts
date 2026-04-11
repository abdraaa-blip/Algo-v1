import { NextRequest, NextResponse } from "next/server";
import { generateDailyBriefing } from "@/lib/ai/algo-brain";
import { AI_TRANSPARENCY_BRIEFING_LINES_FR } from "@/lib/ai/ai-transparency";
import { parseAlgoExpertiseLevel } from "@/lib/ai/algo-persona";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
} from "@/lib/api/rate-limiter";

/**
 * POST /api/ai/briefing
 * Generate personalized daily briefing
 */
export async function POST(req: NextRequest) {
  const identifier = getClientIdentifier(req);
  const rateLimit = checkRateLimit(identifier, { limit: 10, windowMs: 60000 });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  try {
    const body = await req.json();
    const { userInterests, userCountry, topContent, expertiseLevel } = body;

    const briefing = await generateDailyBriefing({
      userInterests: userInterests || [],
      userCountry: userCountry || "FR",
      topContent: topContent || [],
      expertiseLevel: parseAlgoExpertiseLevel(expertiseLevel),
    });

    const generatedAt = new Date().toISOString();
    return NextResponse.json(
      {
        success: true,
        briefing,
        generatedAt,
        transparencyLines: [
          ...AI_TRANSPARENCY_BRIEFING_LINES_FR,
          `Horodatage du briefing : ${generatedAt}.`,
        ],
      },
      { headers: createRateLimitHeaders(rateLimit) },
    );
  } catch (error) {
    console.error("[ALGO AI] Briefing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate briefing" },
      { status: 500 },
    );
  }
}
