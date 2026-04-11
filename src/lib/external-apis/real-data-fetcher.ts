/**
 * Real Data Fetcher - Fetches actual trending content from public APIs
 * Uses RSS feeds, public APIs, and scraping-safe endpoints
 *
 * Pas de directive `use server` ici : ce module est importé par des Route Handlers ;
 * une clé `YOUTUBE_API_KEY` doit être lue au runtime (Vercel), pas figée au build.
 */

// ==================== YOUTUBE TRENDING ====================
interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  viewCount: number;
  publishedAt: string;
  duration: string;
}

export type YoutubeTrendingPipeline =
  | "youtube-data-api"
  | "invidious"
  | "fallback";

export type YoutubeTrendingDiagnostics = {
  keyConfigured: boolean;
  pipeline: YoutubeTrendingPipeline;
  /** Indication courte (pas de secret) pour déboguer prod */
  hint?: string;
};

async function fetchYouTubeTrendingResolved(
  country: string = "US",
): Promise<{
  videos: YouTubeVideo[];
  diagnostics: YoutubeTrendingDiagnostics;
}> {
  const rawKey = process.env.YOUTUBE_API_KEY;
  const apiKey = rawKey ? trimEnvSecret(rawKey) : "";
  const regionForApis = normalizeYoutubeRegionCode(country);

  const diagnostics: YoutubeTrendingDiagnostics = {
    keyConfigured: Boolean(apiKey),
    pipeline: "fallback",
    hint: undefined,
  };

  if (apiKey) {
    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/videos");
      url.searchParams.set("part", "snippet,statistics,contentDetails");
      url.searchParams.set("chart", "mostPopular");
      url.searchParams.set("regionCode", regionForApis);
      url.searchParams.set("maxResults", "20");
      url.searchParams.set("key", apiKey);

      const response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const text = await response.text();
      if (!response.ok) {
        const snippet = text.slice(0, 280);
        console.error("[ALGO] YouTube Data API HTTP", response.status, snippet);
        diagnostics.hint = `YouTube HTTP ${response.status} · vérifie clé + API YouTube Data v3 activée + restrictions de clé (IP / référent)`;
        throw new Error(`YouTube Data API HTTP ${response.status}`);
      }
      if (text.trimStart().startsWith("<")) {
        console.error(
          "[ALGO] YouTube Data API: réponse HTML (clé refusée, quota ou restriction référent)",
        );
        diagnostics.hint =
          "Réponse HTML (souvent clé restreinte aux référents navigateur — pour Vercel, utilise une clé “Sans restriction” ou restriction par IP serveur)";
        throw new Error("YouTube Data API HTML response");
      }
      const data = JSON.parse(text) as {
        error?: { message?: string };
        items?: Array<{
          id: string;
          snippet: {
            title: string;
            channelTitle: string;
            publishedAt: string;
            thumbnails: { high?: { url: string }; medium?: { url: string } };
          };
          statistics?: { viewCount?: string };
          contentDetails?: { duration?: string };
        }>;
      };
      if (data.error?.message) {
        console.error("[ALGO] YouTube Data API:", data.error.message);
        diagnostics.hint = data.error.message.slice(0, 200);
        throw new Error(data.error.message);
      }
      const items = data.items || [];
      if (items.length > 0) {
        diagnostics.pipeline = "youtube-data-api";
        diagnostics.hint = undefined;
        return {
          videos: items.map((item) => ({
            id: item.id,
            title: item.snippet.title,
            thumbnail:
              item.snippet.thumbnails.high?.url ||
              item.snippet.thumbnails.medium?.url ||
              `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
            channelName: item.snippet.channelTitle,
            viewCount: parseInt(item.statistics?.viewCount || "0", 10),
            publishedAt: item.snippet.publishedAt,
            duration: parseIso8601Duration(item.contentDetails?.duration),
          })),
          diagnostics: { ...diagnostics },
        };
      }
      diagnostics.hint =
        "YouTube a répondu OK mais items vides (région ?) — fallback Invidious";
    } catch (e) {
      console.error("[ALGO] YouTube Data API (fallback Invidious):", e);
    }
  } else {
    diagnostics.hint =
      "YOUTUBE_API_KEY absente sur cet environnement (Vercel → Production + redeploy)";
  }

  try {
    const response = await fetch(
      `https://vid.puffyan.us/api/v1/trending?region=${encodeURIComponent(regionForApis)}&type=Default`,
      { next: { revalidate: 900 } },
    );

    if (!response.ok) {
      const fallback = await fetch(
        `https://invidious.snopyta.org/api/v1/trending?region=${encodeURIComponent(regionForApis)}`,
        { next: { revalidate: 900 } },
      );
      if (!fallback.ok) throw new Error("YouTube API unavailable");
      const fbText = await fallback.text();
      if (fbText.trimStart().startsWith("<")) throw new Error("Invidious HTML");
      const data = JSON.parse(fbText) as InvidiousVideo[];
      diagnostics.pipeline = "invidious";
      diagnostics.hint = undefined;
      return { videos: mapYouTubeData(data), diagnostics: { ...diagnostics } };
    }

    const bodyText = await response.text();
    if (bodyText.trimStart().startsWith("<")) throw new Error("Invidious HTML");
    const data = JSON.parse(bodyText) as InvidiousVideo[];
    diagnostics.pipeline = "invidious";
    diagnostics.hint = undefined;
    return { videos: mapYouTubeData(data), diagnostics: { ...diagnostics } };
  } catch (error) {
    console.error("[ALGO] YouTube fetch error:", error);
    diagnostics.pipeline = "fallback";
    if (!diagnostics.hint) {
      diagnostics.hint = "Invidious indisponible — données de secours";
    }
    return {
      videos: getFallbackYouTubeData(),
      diagnostics: { ...diagnostics },
    };
  }
}

/** Même logique que `fetchYouTubeTrending` + diagnostic (pipeline, hint) pour l’UI / support. */
export async function fetchYouTubeTrendingWithDiagnostics(
  country: string = "US",
): Promise<{
  videos: YouTubeVideo[];
  diagnostics: YoutubeTrendingDiagnostics;
}> {
  return fetchYouTubeTrendingResolved(country);
}

export async function fetchYouTubeTrending(
  country: string = "US",
): Promise<YouTubeVideo[]> {
  return (await fetchYouTubeTrendingResolved(country)).videos;
}

interface InvidiousVideo {
  videoId: string;
  title: string;
  videoThumbnails?: { url: string }[];
  author: string;
  viewCount?: number;
  published: number;
  lengthSeconds?: number;
}

function mapYouTubeData(data: InvidiousVideo[]): YouTubeVideo[] {
  return data.slice(0, 20).map((item) => ({
    id: item.videoId,
    title: item.title,
    thumbnail:
      item.videoThumbnails?.[4]?.url ||
      item.videoThumbnails?.[0]?.url ||
      `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
    channelName: item.author,
    viewCount: item.viewCount || 0,
    publishedAt: new Date(item.published * 1000).toISOString(),
    duration: formatDuration(item.lengthSeconds || 0),
  }));
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** ISO 8601 durée vidéo YouTube (ex. PT4M13S) → affichage type 4:13 */
function parseIso8601Duration(iso: string | undefined): string {
  if (!iso) return "0:00";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function normalizeYoutubeRegionCode(country: string): string {
  const c = country.trim().toUpperCase();
  if (c === "ALL" || c.length < 2) return "US";
  return c.slice(0, 2);
}

/** Valeur copiée-collée depuis Vercel avec guillemets englobants */
function trimEnvSecret(value: string): string {
  let s = value.trim();
  if (s.length >= 2) {
    const q = s[0];
    if ((q === '"' || q === "'") && s[s.length - 1] === q) {
      s = s.slice(1, -1).trim();
    }
  }
  return s;
}

/** Pour `meta` API : le serveur voit-il une clé (après trim / guillemets) ? */
export function isYoutubeApiKeyPresent(): boolean {
  const raw = process.env.YOUTUBE_API_KEY;
  if (raw == null || !String(raw).trim()) return false;
  return trimEnvSecret(String(raw)).length > 0;
}

// ==================== REDDIT HOT ====================
interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  thumbnail: string | null;
  url: string;
  score: number;
  numComments: number;
  author: string;
  createdAt: string;
  isVideo: boolean;
  videoUrl?: string;
}

export async function fetchRedditHot(
  subreddit: string = "all",
): Promise<RedditPost[]> {
  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`,
      {
        next: { revalidate: 300 }, // Cache 5 minutes
        headers: { "User-Agent": "ALGO/1.0" },
      },
    );

    if (!response.ok) throw new Error("Reddit API unavailable");

    interface RedditApiResponse {
      data: {
        children: Array<{
          data: {
            id: string;
            title: string;
            subreddit: string;
            thumbnail: string;
            url: string;
            score: number;
            num_comments: number;
            author: string;
            created_utc: number;
            is_video: boolean;
            media?: { reddit_video?: { fallback_url?: string } };
          };
        }>;
      };
    }
    const data: RedditApiResponse = await response.json();
    return data.data.children.map((item) => ({
      id: item.data.id,
      title: item.data.title,
      subreddit: item.data.subreddit,
      thumbnail: item.data.thumbnail?.startsWith("http")
        ? item.data.thumbnail
        : null,
      url: item.data.url,
      score: item.data.score,
      numComments: item.data.num_comments,
      author: item.data.author,
      createdAt: new Date(item.data.created_utc * 1000).toISOString(),
      isVideo: item.data.is_video,
      videoUrl: item.data.media?.reddit_video?.fallback_url,
    }));
  } catch (error) {
    console.error("[ALGO] Reddit fetch error:", error);
    return [];
  }
}

// ==================== HACKER NEWS ====================
interface HNStory {
  id: number;
  title: string;
  url: string;
  score: number;
  by: string;
  time: number;
  descendants: number;
}

export async function fetchHackerNewsTop(): Promise<HNStory[]> {
  try {
    const idsResponse = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
      { next: { revalidate: 600 } },
    );
    const ids = await idsResponse.json();

    const stories = await Promise.all(
      ids.slice(0, 15).map(async (id: number) => {
        const res = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
        );
        return res.json();
      }),
    );

    return stories.filter((s) => s && s.title);
  } catch (error) {
    console.error("[ALGO] HN fetch error:", error);
    return [];
  }
}

// ==================== RSS FEEDS (NEWS) ====================
interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  thumbnail: string | null;
}

export async function fetchNewsRSS(): Promise<NewsArticle[]> {
  try {
    // Using rss2json service for RSS parsing
    const feeds = [
      {
        url: "https://www.reddit.com/r/worldnews/.rss",
        source: "Reddit WorldNews",
      },
      { url: "https://hnrss.org/frontpage", source: "Hacker News" },
    ];

    const allArticles: NewsArticle[] = [];

    for (const feed of feeds) {
      try {
        const response = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`,
          { next: { revalidate: 600 } },
        );
        const data = await response.json();

        interface RSSItem {
          guid?: string;
          link: string;
          title: string;
          description?: string;
          pubDate: string;
          thumbnail?: string;
          enclosure?: { link?: string };
        }
        if (data.items) {
          allArticles.push(
            ...(data.items as RSSItem[]).slice(0, 10).map((item) => ({
              id: item.guid || item.link,
              title: item.title,
              description:
                item.description?.replace(/<[^>]*>/g, "").slice(0, 200) || "",
              url: item.link,
              source: feed.source,
              publishedAt: item.pubDate,
              thumbnail: item.thumbnail || item.enclosure?.link || null,
            })),
          );
        }
      } catch (e) {
        console.error(`[ALGO] RSS feed error for ${feed.source}:`, e);
      }
    }

    return allArticles;
  } catch (error) {
    console.error("[ALGO] News fetch error:", error);
    return [];
  }
}

// ==================== GOOGLE TRENDS (via proxy) ====================
interface GoogleTrend {
  keyword: string;
  traffic: string;
  relatedQueries: string[];
  articleUrls: string[];
}

export async function fetchGoogleTrends(
  country: string = "US",
): Promise<GoogleTrend[]> {
  try {
    // Using SerpAPI or similar if available, otherwise generate from keywords
    // For now, we aggregate trending topics from multiple sources
    const redditTrending = await fetchRedditHot("popular");
    const ytTrending = await fetchYouTubeTrending(country);

    // Extract keywords from titles
    const keywords = new Map<string, number>();

    redditTrending.forEach((post) => {
      const words = post.title
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4);
      words.forEach((w) =>
        keywords.set(w, (keywords.get(w) || 0) + post.score / 1000),
      );
    });

    ytTrending.forEach((video) => {
      const words = video.title
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4);
      words.forEach((w) =>
        keywords.set(w, (keywords.get(w) || 0) + video.viewCount / 100000),
      );
    });

    // Sort by score and return top 20
    return Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, score]) => ({
        keyword,
        traffic: formatTraffic(score),
        relatedQueries: [],
        articleUrls: [],
      }));
  } catch (error) {
    console.error("[ALGO] Trends fetch error:", error);
    return [];
  }
}

function formatTraffic(score: number): string {
  if (score > 100) return "100K+";
  if (score > 50) return "50K+";
  if (score > 10) return "10K+";
  return "5K+";
}

// ==================== AGGREGATED VIRAL CONTENT ====================
export interface ViralContent {
  id: string;
  type: "video" | "article" | "post" | "trend";
  title: string;
  description?: string;
  thumbnail: string | null;
  source: string;
  platform: "youtube" | "reddit" | "twitter" | "tiktok" | "news";
  url: string;
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  publishedAt: string;
  viralScore: number;
  embedUrl?: string;
}

export async function fetchAllViralContent(
  country: string = "US",
): Promise<ViralContent[]> {
  const [youtube, reddit, hn] = await Promise.all([
    fetchYouTubeTrending(country),
    fetchRedditHot("popular"),
    fetchHackerNewsTop(),
  ]);

  const content: ViralContent[] = [];

  // Map YouTube videos
  youtube.forEach((video, i) => {
    content.push({
      id: `yt-${video.id}`,
      type: "video",
      title: video.title,
      thumbnail: video.thumbnail,
      source: video.channelName,
      platform: "youtube",
      url: `https://youtube.com/watch?v=${video.id}`,
      embedUrl: `https://www.youtube.com/embed/${video.id}`,
      metrics: { views: video.viewCount },
      publishedAt: video.publishedAt,
      viralScore: Math.max(95 - i * 3, 40),
    });
  });

  // Map Reddit posts
  reddit.forEach((post, i) => {
    content.push({
      id: `reddit-${post.id}`,
      type: post.isVideo ? "video" : "post",
      title: post.title,
      thumbnail: post.thumbnail,
      source: `r/${post.subreddit}`,
      platform: "reddit",
      url: `https://reddit.com${post.url}`,
      embedUrl: post.videoUrl,
      metrics: { likes: post.score, comments: post.numComments },
      publishedAt: post.createdAt,
      viralScore: Math.max(90 - i * 2, 35),
    });
  });

  // Map HN stories
  hn.forEach((story, i) => {
    content.push({
      id: `hn-${story.id}`,
      type: "article",
      title: story.title,
      thumbnail: null,
      source: "Hacker News",
      platform: "news",
      url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
      metrics: { likes: story.score, comments: story.descendants },
      publishedAt: new Date(story.time * 1000).toISOString(),
      viralScore: Math.max(85 - i * 3, 30),
    });
  });

  // Sort by viral score
  return content.sort((a, b) => b.viralScore - a.viralScore);
}

// ==================== FALLBACK DATA ====================
function getFallbackYouTubeData(): YouTubeVideo[] {
  return [
    {
      id: "dQw4w9WgXcQ",
      title: "Trending Video #1",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      channelName: "Trending Channel",
      viewCount: 1000000,
      publishedAt: new Date().toISOString(),
      duration: "3:32",
    },
  ];
}
