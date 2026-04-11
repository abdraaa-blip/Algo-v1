import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";

/** IDs YouTube réels + miniatures i.ytimg : les liens `/content/[id]` doivent rester résolvables. */
const FALLBACK_VIDEOS = [
  {
    id: "dQw4w9WgXcQ",
    title: "Cette IA revolutionne la creation de contenu",
    platform: "YouTube",
    category: "Tech",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    views: 2400000,
    viralScore: 94,
    growthRate: 234,
    growthTrend: "up",
    badge: "Viral",
    sourceUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "jNQXAC9IVRw",
    title: "Le secret des createurs a succes revele",
    platform: "YouTube",
    category: "Lifestyle",
    thumbnail: "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    views: 1800000,
    viralScore: 89,
    growthRate: 178,
    growthTrend: "up",
    badge: "Early",
    sourceUrl: "https://youtube.com/watch?v=jNQXAC9IVRw",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "9bZkp7q19f0",
    title: "Reaction au trailer qui a casse Internet",
    platform: "YouTube",
    category: "Entertainment",
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    views: 3200000,
    viralScore: 92,
    growthRate: 156,
    growthTrend: "up",
    badge: "Viral",
    sourceUrl: "https://youtube.com/watch?v=9bZkp7q19f0",
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Comment cette recette est devenue virale",
    platform: "YouTube",
    category: "Food",
    thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    views: 980000,
    viralScore: 78,
    growthRate: 89,
    growthTrend: "up",
    badge: "Trend",
    sourceUrl: "https://youtube.com/watch?v=kJQP7kiw5Fk",
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "L_jWHffIx5E",
    title: "Le jeu qui rend tout le monde fou",
    platform: "YouTube",
    category: "Gaming",
    thumbnail: "https://i.ytimg.com/vi/L_jWHffIx5E/hqdefault.jpg",
    views: 1500000,
    viralScore: 85,
    growthRate: 134,
    growthTrend: "up",
    badge: "Early",
    sourceUrl: "https://youtube.com/watch?v=L_jWHffIx5E",
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: "y6120QOlsfU",
    title: "Ce documentaire change tout",
    platform: "YouTube",
    category: "Documentary",
    thumbnail: "https://i.ytimg.com/vi/y6120QOlsfU/hqdefault.jpg",
    views: 2100000,
    viralScore: 88,
    growthRate: 112,
    growthTrend: "up",
    badge: "Trend",
    sourceUrl: "https://youtube.com/watch?v=y6120QOlsfU",
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  const identifier = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`api-videos:${identifier}`, {
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
  const country = searchParams.get("country") || "FR";
  const regionCode = country === "global" ? "FR" : country.toUpperCase();

  // Try YouTube API first
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=12&key=${process.env.YOUTUBE_API_KEY}`,
        { next: { revalidate: 1800 } },
      );

      if (res.ok) {
        const data = await res.json();

        const videos = (data.items || []).map(
          (item: Record<string, unknown>) => {
            const snippet = item.snippet as Record<string, unknown> | undefined;
            const statistics = item.statistics as
              | Record<string, unknown>
              | undefined;
            const thumbnails = snippet?.thumbnails as
              | Record<string, { url?: string }>
              | undefined;

            const views = parseInt(String(statistics?.viewCount || "0"));
            const likes = parseInt(String(statistics?.likeCount || "0"));
            const growthRate = Math.min(
              Math.floor((likes / Math.max(views, 1)) * 1000),
              500,
            );
            const viralScore = Math.min(Math.floor(growthRate / 5) + 60, 99);

            return {
              id: item.id,
              title: snippet?.title || "",
              platform: "YouTube",
              category: "Trending",
              thumbnail:
                thumbnails?.maxres?.url ||
                thumbnails?.high?.url ||
                thumbnails?.medium?.url ||
                "",
              views,
              viralScore,
              growthRate,
              growthTrend: "up" as const,
              badge:
                viralScore > 90 ? "Viral" : viralScore > 80 ? "Early" : "Trend",
              sourceUrl: `https://youtube.com/watch?v=${item.id}`,
              publishedAt: snippet?.publishedAt || new Date().toISOString(),
              channelTitle: snippet?.channelTitle || "",
              description: snippet?.description || "",
            };
          },
        );

        return NextResponse.json({
          data: videos,
          source: "youtube",
          country: regionCode,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("[API/videos] YouTube error:", e);
    }
  }

  // Fallback to mock data
  return NextResponse.json({
    data: FALLBACK_VIDEOS,
    source: "fallback",
    country: regionCode,
    timestamp: new Date().toISOString(),
  });
}
