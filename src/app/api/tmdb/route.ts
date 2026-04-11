import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";

interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  popularity: number;
  poster_path?: string;
  media_type?: string;
  original_language?: string;
}

export async function GET(req: NextRequest) {
  const identifier = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`api-tmdb:${identifier}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rateLimit.retryAfter },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") || "fr-FR";

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${process.env.TMDB_API_KEY}&language=${lang}`,
      { next: { revalidate: 21600 } },
    );

    if (!res.ok) throw new Error("TMDB error");
    const data = await res.json();

    const contents = ((data.results || []) as TMDBItem[])
      .slice(0, 10)
      .map((item) => ({
        id: `tmdb-${item.id}`,
        title: item.title || item.name || "",
        category: "Culture",
        platform: "YouTube",
        country: "US",
        language: item.original_language || "fr",
        viralScore: Math.min(Math.floor(item.popularity / 10), 99),
        badge:
          item.popularity > 500
            ? "Viral"
            : item.popularity > 200
              ? "Trend"
              : "Early",
        growthRate: Math.min(Math.floor(item.popularity / 5), 400),
        growthTrend: "up",
        detectedAt: new Date().toISOString(),
        thumbnail: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : "",
        sourceUrl: `https://www.themoviedb.org/${item.media_type}/${item.id}`,
        explanation: item.overview || "Contenu tendance cette semaine.",
        creatorTips:
          "Fais une réaction ou une analyse de ce contenu populaire.",
        insight: {
          postNowProbability: item.popularity > 500 ? "high" : "medium",
          timing: "now",
          bestPlatform: ["YouTube", "TikTok"],
          bestFormat: "reaction",
          timingLabel: {
            fr: "Tendance cette semaine",
            en: "Trending this week",
          },
          postWindow: { status: "optimal" },
        },
        sourceDistribution: [
          { platform: "YouTube", percentage: 60, momentum: "high" },
          { platform: "Instagram", percentage: 40, momentum: "medium" },
        ],
        watchersCount: Math.floor(item.popularity * 100),
        isExploding: item.popularity > 500,
      }));

    return NextResponse.json(contents);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
