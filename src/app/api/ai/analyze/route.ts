import { NextRequest, NextResponse } from "next/server";
import { analyzeContent } from "@/lib/ai/algo-brain";
import { AI_TRANSPARENCY_ANALYZE_LINES_FR } from "@/lib/ai/ai-transparency";
import { parseAlgoExpertiseLevel } from "@/lib/ai/algo-persona";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
} from "@/lib/api/rate-limiter";

/**
 * POST /api/ai/analyze
 * Analyze why content is going viral
 */
export async function POST(req: NextRequest) {
  const identifier = getClientIdentifier(req);
  const rateLimit = checkRateLimit(identifier, { limit: 20, windowMs: 60000 });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  try {
    const body = await req.json();

    const { title, description, platform, category, metrics, expertiseLevel } =
      body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const analysis = await analyzeContent(
      {
        title,
        description,
        platform: platform || "unknown",
        category: category || "general",
        metrics: metrics || {},
      },
      { expertiseLevel: parseAlgoExpertiseLevel(expertiseLevel) },
    );

    const analyzedAt = new Date().toISOString();
    return NextResponse.json(
      {
        success: true,
        analysis,
        analyzedAt,
        transparencyLines: [
          ...AI_TRANSPARENCY_ANALYZE_LINES_FR,
          `Horodatage de l’analyse : ${analyzedAt}.`,
        ],
      },
      { headers: createRateLimitHeaders(rateLimit) },
    );
  } catch (error) {
    console.error("[ALGO AI] Analyze error:", error);
    return NextResponse.json(
      { success: false, error: "Analysis failed" },
      { status: 500 },
    );
  }
}
