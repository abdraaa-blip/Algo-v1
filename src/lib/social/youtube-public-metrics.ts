import {
  recordYoutubeObservation,
  getYoutubeObservationSeries,
} from "@/lib/social/youtube-observation-series";

export type YoutubeVideoPublicMetrics = {
  videoId: string;
  title: string | null;
  publishedAt: string | null;
  views: number;
  likes: number;
  comments: number;
  fetchedAt: string;
  observationSeries: ReturnType<typeof getYoutubeObservationSeries>;
};

type Cached = {
  expiresAtMs: number;
  data: Omit<YoutubeVideoPublicMetrics, "fetchedAt" | "observationSeries">;
};

const GOOGLE_CACHE_TTL_MS = 90_000;
const googleCache = new Map<string, Cached>();

function toNum(s: string | undefined): number {
  if (s == null || s === "") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Appel YouTube Data API v3 · `videos.list` · clé serveur `YOUTUBE_API_KEY`.
 */
export async function fetchYoutubePublicMetrics(
  videoId: string,
): Promise<YoutubeVideoPublicMetrics | null> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) return null;

  const now = Date.now();
  const cached = googleCache.get(videoId);
  let base: Omit<YoutubeVideoPublicMetrics, "fetchedAt" | "observationSeries">;

  if (cached && cached.expiresAtMs > now) {
    base = cached.data;
  } else {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,statistics");
    url.searchParams.set("id", videoId);
    url.searchParams.set("key", key);

    const res = await fetch(url.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return null;
    }

    const json = (await res.json()) as {
      items?: Array<{
        id?: string;
        snippet?: { title?: string; publishedAt?: string };
        statistics?: {
          viewCount?: string;
          likeCount?: string;
          commentCount?: string;
        };
      }>;
    };

    const item = json.items?.[0];
    if (!item) return null;

    const stats = item.statistics ?? {};
    base = {
      videoId,
      title: item.snippet?.title ?? null,
      publishedAt: item.snippet?.publishedAt ?? null,
      views: toNum(stats.viewCount),
      likes: toNum(stats.likeCount),
      comments: toNum(stats.commentCount),
    };
    googleCache.set(videoId, {
      expiresAtMs: now + GOOGLE_CACHE_TTL_MS,
      data: base,
    });
  }

  const observationSeries = recordYoutubeObservation(videoId, {
    views: base.views,
    likes: base.likes,
    comments: base.comments,
  });

  return {
    ...base,
    fetchedAt: new Date().toISOString(),
    observationSeries,
  };
}

export function isYoutubeDataApiConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY?.trim());
}
