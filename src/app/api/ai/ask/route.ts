import { NextRequest, NextResponse } from "next/server";
import {
  attachAskOutputQuality,
  decideAlgoAskRoute,
  processAlgoAiRequest,
  qualityTransparencyHints,
} from "@/core/system";
import { buildAskTransparencyLines } from "@/lib/ai/ai-transparency";
import {
  ALGO_ASK_FALLBACK_NO_QUESTION,
  buildAlgoAskFallbackResponse,
} from "@/lib/ai/algo-ask-fallback";
import { parseAlgoExpertiseLevel } from "@/lib/ai/algo-persona";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
} from "@/lib/api/rate-limiter";
import { addLog } from "@/core/observability/logStore";

function sanitizeConversationHistory(
  raw: unknown,
): Array<{ role: "user" | "assistant"; content: string }> | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const item of raw.slice(-12)) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: string }).role;
    const content = (item as { content?: string }).content;
    if (
      (role === "user" || role === "assistant") &&
      typeof content === "string" &&
      content.trim()
    ) {
      out.push({ role, content: content.trim().slice(0, 6000) });
    }
  }
  return out.length ? out : undefined;
}

const EMPTY_META = {
  serverEnrichedTrends: false,
  trendTitlesPassedToModel: 0,
  region: "ALL" as const,
};

/**
 * POST /api/ai/ask
 * Q&R ALGO AI · contexte tendances fusionné (client + enrichissement serveur si besoin).
 * Couche `src/core/system.ts` : `processAlgoAiRequest` (route + indices + pipeline) · enveloppe + QC + confiance.
 * Repli automatique : toujours un texte utile dans `answer` (pas de « erreur technique » exposée).
 */
export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const identifier = getClientIdentifier(req);
  const rateLimit = checkRateLimit(identifier, { limit: 30, windowMs: 60000 });

  if (!rateLimit.success) {
    const answer =
      "Tu as envoyé beaucoup de questions d’affilée. Fais une courte pause, puis réessaie : le contexte tendances reste disponible sur /trends.";
    const { standard, quality } = attachAskOutputQuality("", answer);
    const route = decideAlgoAskRoute("");
    addLog({
      layer: "api",
      type: "warning",
      message: "ai.ask rate_limited",
      metadata: {
        durationMs: Date.now() - startedAt,
        httpStatus: 429,
        route: "POST /api/ai/ask",
      },
    });
    return NextResponse.json(
      {
        success: true,
        kind: "algo.ai_ask",
        degraded: true,
        answer,
        standard,
        quality,
        systemRoute: route,
        systemConfidence: 0.72,
        answeredAt: new Date().toISOString(),
        contextMeta: EMPTY_META,
        transparencyLines: [
          ...buildAskTransparencyLines(EMPTY_META),
          "Rythme : ralentis un instant pour laisser passer la limite de flux.",
          `Route système : ${route} (heuristique · hors question).`,
          ...qualityTransparencyHints(quality),
        ],
      },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    const answer = ALGO_ASK_FALLBACK_NO_QUESTION;
    const { standard, quality } = attachAskOutputQuality("", answer);
    const route = decideAlgoAskRoute("");
    addLog({
      layer: "api",
      type: "warning",
      message: "ai.ask body_parse_failed",
      metadata: {
        durationMs: Date.now() - startedAt,
        route: "POST /api/ai/ask",
      },
    });
    return NextResponse.json(
      {
        success: true,
        kind: "algo.ai_ask",
        degraded: true,
        answer,
        standard,
        quality,
        systemRoute: route,
        systemConfidence: 0.7,
        answeredAt: new Date().toISOString(),
        contextMeta: EMPTY_META,
        transparencyLines: [
          ...buildAskTransparencyLines(EMPTY_META),
          "Message reformulé : le corps de la requête n’était pas lisible comme prévu.",
          `Route système : ${route} (heuristique · hors question).`,
          ...qualityTransparencyHints(quality),
        ],
      },
      { status: 200, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const question = body.question;
  const context = body.context as
    | { currentTrends?: string[]; userCountry?: string }
    | undefined;
  const conversationHistory = sanitizeConversationHistory(
    body.conversationHistory,
  );
  const expertiseLevel = parseAlgoExpertiseLevel(body.expertiseLevel);
  const country = typeof body.country === "string" ? body.country : null;
  const serverEnrich =
    typeof body.serverEnrich === "boolean" ? body.serverEnrich : undefined;

  if (!question || typeof question !== "string") {
    const answer = ALGO_ASK_FALLBACK_NO_QUESTION;
    const { standard, quality } = attachAskOutputQuality("", answer);
    const route = decideAlgoAskRoute("");
    addLog({
      layer: "api",
      type: "warning",
      message: "ai.ask missing_question",
      metadata: {
        durationMs: Date.now() - startedAt,
        route: "POST /api/ai/ask",
      },
    });
    return NextResponse.json(
      {
        success: true,
        kind: "algo.ai_ask",
        degraded: true,
        answer,
        standard,
        quality,
        systemRoute: route,
        systemConfidence: 0.7,
        answeredAt: new Date().toISOString(),
        contextMeta: EMPTY_META,
        transparencyLines: [
          ...buildAskTransparencyLines(EMPTY_META),
          "Invite à formuler une question courte : plateforme, objectif, délai.",
          `Route système : ${route} (heuristique · hors question).`,
          ...qualityTransparencyHints(quality),
        ],
      },
      { status: 200, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  try {
    const {
      answer,
      structured,
      meta,
      standard,
      quality,
      route,
      systemConfidence,
    } = await processAlgoAiRequest({
      question,
      clientContext: context,
      countryHint: country,
      conversationHistory,
      expertiseLevel,
      serverEnrich,
    });

    addLog({
      layer: "api",
      type: "info",
      message: "ai.ask ok",
      metadata: {
        durationMs: Date.now() - startedAt,
        route: "POST /api/ai/ask",
        systemRoute: route,
        degraded: false,
        trendTitlesPassedToModel: meta.trendTitlesPassedToModel,
      },
    });
    return NextResponse.json(
      {
        success: true,
        kind: "algo.ai_ask",
        answer,
        standard,
        quality,
        systemRoute: route,
        systemConfidence,
        ...(structured ? { structured } : {}),
        answeredAt: new Date().toISOString(),
        contextMeta: meta,
        transparencyLines: [
          ...buildAskTransparencyLines(meta),
          `Route système : ${route} (heuristique mots-clés).`,
          `Confiance système (indicateur interne, pas une garantie) : ${systemConfidence}.`,
          ...qualityTransparencyHints(quality),
        ],
      },
      { headers: createRateLimitHeaders(rateLimit) },
    );
  } catch (error) {
    console.error("[ALGO AI] Ask route · repli final", error);
    addLog({
      layer: "api",
      type: "error",
      message: "ai.ask pipeline_exception",
      metadata: {
        durationMs: Date.now() - startedAt,
        route: "POST /api/ai/ask",
        errorName: error instanceof Error ? error.name : "unknown",
      },
    });
    const trends =
      context?.currentTrends?.filter(
        (t) => typeof t === "string" && t.trim(),
      ) ?? [];
    const answer = buildAlgoAskFallbackResponse(question, {
      userCountry: context?.userCountry ?? country ?? undefined,
      firstTrendTitle: trends[0],
    });
    const { standard, quality } = attachAskOutputQuality(question, answer);
    const route = decideAlgoAskRoute(question);
    addLog({
      layer: "api",
      type: "warning",
      message: "ai.ask degraded_fallback",
      metadata: {
        durationMs: Date.now() - startedAt,
        route: "POST /api/ai/ask",
        systemRoute: route,
      },
    });
    return NextResponse.json(
      {
        success: true,
        kind: "algo.ai_ask",
        degraded: true,
        answer,
        standard,
        quality,
        systemRoute: route,
        systemConfidence: 0.74,
        answeredAt: new Date().toISOString(),
        contextMeta: {
          serverEnrichedTrends: false,
          trendTitlesPassedToModel: trends.length,
          region: EMPTY_META.region,
        },
        transparencyLines: [
          ...buildAskTransparencyLines({
            serverEnrichedTrends: false,
            trendTitlesPassedToModel: trends.length,
            region: EMPTY_META.region,
          }),
          "Réponse en synthèse : garde ces pistes et précise ta question si tu veux un plan plus serré.",
          `Route système : ${route} (heuristique mots-clés).`,
          ...qualityTransparencyHints(quality),
        ],
      },
      { status: 200, headers: createRateLimitHeaders(rateLimit) },
    );
  }
}
