import { NextRequest, NextResponse } from "next/server";
import {
  parseYoutubeVideoIdFromUrl,
  isLikelyYoutubeVideoId,
} from "@/lib/social/youtube-video-id";
import {
  fetchYoutubePublicMetrics,
  isYoutubeDataApiConfigured,
} from "@/lib/social/youtube-public-metrics";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";

export const dynamic = "force-dynamic";

/**
 * GET /api/social/youtube/video-metrics?videoId=… ou ?videoUrl=…
 * Métriques publiques + série d’observations (mémoire serveur). Cache Google ~90 s.
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, { limit: 40, windowMs: 60_000 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded" },
      { status: 429, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("videoId")?.trim();
  const urlParam = searchParams.get("videoUrl")?.trim();

  const videoId =
    idParam && isLikelyYoutubeVideoId(idParam)
      ? idParam
      : urlParam
        ? parseYoutubeVideoIdFromUrl(urlParam)
        : null;

  if (!videoId) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid videoId / videoUrl" },
      { status: 400, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  if (!isYoutubeDataApiConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "YOUTUBE_API_KEY not configured",
        configured: false,
        videoId,
      },
      { status: 503, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  const data = await fetchYoutubePublicMetrics(videoId);
  if (!data) {
    return NextResponse.json(
      { success: false, error: "YouTube API returned no data", videoId },
      { status: 502, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  return NextResponse.json(
    {
      success: true,
      kind: "algo.youtube.video_metrics",
      cacheTtlMs: 90_000,
      data,
    },
    { headers: createRateLimitHeaders(rateLimit) },
  );
}
