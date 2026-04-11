/**
 * Route NewsAPI « compacte » (widgets / intégrations). La page `/news` consomme **`/api/live-news`**
 * (RSS + NewsAPI + fallbacks, voir `real-data-service.ts`).
 */
import { NextRequest, NextResponse } from "next/server";
import { parseDefaultedListLimit } from "@/lib/api/query-limit";
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/api/rate-limiter";

function hashToRange(input: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 33 + input.charCodeAt(i)) | 0;
  const span = max - min + 1;
  return min + (Math.abs(h) % span);
}

/** Scores d’affichage déterministes (pas de `Math.random` — évite métriques qui changent à chaque requête). */
function scoresFromArticle(
  i: number,
  title: string,
  publishedAt: string,
): {
  viralScore: number;
  importanceScore: number;
  speedScore: number;
} {
  const t = `${title}|${publishedAt}|${i}`;
  return {
    viralScore: hashToRange(t, 72, 91),
    importanceScore: hashToRange(`${t}|imp`, 70, 93),
    speedScore: hashToRange(`${t}|spd`, 68, 88),
  };
}

interface NewsAPIArticle {
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
  source?: { name?: string };
}

export async function GET(req: NextRequest) {
  const identifier = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`api-news:${identifier}`, {
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
  const country =
    searchParams.get("country") || searchParams.get("scopeCode") || "fr";
  const category = searchParams.get("category");
  const limit = parseDefaultedListLimit(searchParams.get("limit"), 10, 100);
  const newsApiKey = process.env.NEWSAPI_KEY || process.env.NEWS_API_KEY;

  // Try real API if key is available (aligné avec `real-data-service` / `/api/status`)
  if (newsApiKey) {
    try {
      const countryParam =
        country && country !== "global"
          ? `&country=${country.toLowerCase()}`
          : "&country=fr";

      const categoryParam = category
        ? `&category=${category}`
        : "&category=technology";

      const res = await fetch(
        `https://newsapi.org/v2/top-headlines?${categoryParam}${countryParam}&pageSize=${limit}&language=fr`,
        {
          headers: { "X-Api-Key": newsApiKey },
          next: { revalidate: 300 },
        },
      );

      if (res.ok) {
        const data = await res.json();

        const news = ((data.articles || []) as NewsAPIArticle[]).map(
          (a, i: number) => {
            const title = a.title || "";
            const publishedAt = a.publishedAt || new Date().toISOString();
            const { viralScore, importanceScore, speedScore } =
              scoresFromArticle(i, title, publishedAt);
            return {
              id: `n${i + 1}`,
              title,
              summary: a.description || "",
              sourceUrl: a.url || "",
              sourceName: a.source?.name || "News",
              imageUrl:
                a.urlToImage ||
                `https://picsum.photos/seed/news${1000 + i}/800/450`,
              publishedAt,
              category: category || "tech",
              viralScore,
              importanceScore,
              speedScore,
              tags: [a.source?.name || "News", "Tech"],
              country: country?.toUpperCase() || "FR",
              language: "fr",
              relatedContentIds: [],
              relatedTrendIds: [],
            };
          },
        );

        return NextResponse.json({
          items: news,
          total: news.length,
          meta: {
            route: "/api/news",
            canonicalNewsPage: "/api/live-news",
            fetchRevalidateSec: 300,
            scoresNote:
              "Scores déterministes (hash titre + date), pas des métriques NewsAPI.",
          },
        });
      }
    } catch {
      // Fall through to mock data
    }
  }

  // Fallback mock data
  const mockNews = Array.from({ length: limit }, (_, i) => {
    const title = `Breaking News Story ${i + 1}`;
    const publishedAt = new Date(Date.now() - i * 3600000).toISOString();
    const { viralScore, importanceScore, speedScore } = scoresFromArticle(
      i,
      title,
      publishedAt,
    );
    return {
      id: `news-${i + 1}`,
      title,
      summary: "This is a mock news summary for development.",
      sourceUrl: `https://news.example.com/article/${i + 1}`,
      sourceName: ["TechCrunch", "The Verge", "BBC", "CNN"][i % 4],
      imageUrl: `https://picsum.photos/seed/news${1000 + i}/800/450`,
      publishedAt,
      category: category || "tech",
      viralScore,
      importanceScore,
      speedScore,
      country: country?.toUpperCase() || "FR",
    };
  });

  return NextResponse.json({
    items: mockNews,
    total: mockNews.length,
    meta: {
      route: "/api/news",
      canonicalNewsPage: "/api/live-news",
      source: "mock",
    },
  });
}
