/**
 * ALGO Live Data API
 *
 * Returns structured data with transparent status and timestamps.
 * IMPORTANT: Data is NOT truly "live" - it's updated periodically via caching.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";
import {
  fetchAllSources,
  fetchYouTubeTrending,
  fetchRedditHot,
  fetchHackerNews,
  fetchGitHubTrending,
  getSourceStatuses,
  type SourceStatus,
} from "@/lib/datasources";
import { DATA_SOURCES } from "@/lib/data-pipeline";

export const revalidate = 300; // Revalidate every 5 minutes

// Helper to create honest response metadata
function createResponseMeta(country: string, sourceStatuses: SourceStatus[]) {
  const now = new Date();
  const activeCount = sourceStatuses.filter(
    (s) => s.status === "live" || s.status === "cached",
  ).length;
  const totalCount = sourceStatuses.length;

  return {
    fetchedAt: now.toISOString(),
    // Honestly: not real-time, just periodically refreshed
    dataFreshness: "periodically_updated",
    refreshInterval: "5 minutes",
    activeSourcesCount: activeCount,
    totalSourcesCount: totalCount,
    region: country,
    // Honest status labels
    statusLabels: {
      active: "Données récentes (mises à jour dans les 15 dernières minutes)",
      delayed: "Données différées (mises à jour dans la dernière heure)",
      static: "Données en cache (plus d'une heure)",
    },
  };
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`api-live:${identifier}`, {
    limit: 60,
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

  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const country = searchParams.get("country") || "FR";

    let result;

    if (source) {
      switch (source.toLowerCase()) {
        case "youtube":
          result = { youtube: await fetchYouTubeTrending(country) };
          break;
        case "reddit":
          result = { reddit: await fetchRedditHot() };
          break;
        case "hackernews":
        case "hn":
          result = { hackernews: await fetchHackerNews() };
          break;
        case "github":
          result = { github: await fetchGitHubTrending() };
          break;
        default:
          result = await fetchAllSources();
      }
    } else {
      result = await fetchAllSources();
    }

    const sourceStatuses = getSourceStatuses();
    const meta = createResponseMeta(country, sourceStatuses);
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      // Transparent metadata
      meta: {
        ...meta,
        latencyMs,
        timestamp: Date.now(),
      },
      // Source-specific information with honest refresh intervals
      sourceInfo: Object.fromEntries(
        Object.keys(DATA_SOURCES).map((key) => [
          key,
          {
            name: DATA_SOURCES[key].name,
            refreshIntervalMs: DATA_SOURCES[key].refreshIntervalMs,
            refreshIntervalLabel: `${Math.round(DATA_SOURCES[key].refreshIntervalMs / 60000)} min`,
          },
        ]),
      ),
      country,
      sources: sourceStatuses,
      data: result,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        meta: {
          fetchedAt: new Date().toISOString(),
          latencyMs,
          dataFreshness: "error",
        },
        // Fallback message for UI
        fallbackMessage:
          "Les données sont temporairement indisponibles. Réessaie dans un instant.",
      },
      { status: 500 },
    );
  }
}
