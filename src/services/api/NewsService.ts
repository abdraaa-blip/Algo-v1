// =============================================================================
// ALGO V1 · NewsService
// Service unifié pour les actualités — connecté à Google News RSS
// Architecture professionnelle: cache, validation, fallbacks
// =============================================================================

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: string;
  author: string | null;
  country: string;
  category: string;
  importanceScore: number;
  speedScore: number;
  tags: string[];
}

export interface NewsServiceResponse {
  success: boolean;
  data: NewsArticle[];
  source: "live" | "cache" | "fallback";
  error?: string;
  timestamp: string;
}

export interface NewsDetailResponse {
  success: boolean;
  data: NewsArticle | null;
  source: "live" | "cache" | "fallback";
  error?: string;
  contentIdeas?: string[];
}

// ─── Cache Configuration ──────────────────────────────────────────────────────

const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes for news (fresher data needed)
const newsCache: Map<string, { data: NewsArticle[]; expiresAt: Date }> =
  new Map();

// ─── Utility Functions ────────────────────────────────────────────────────────

function calculateImportanceScore(article: NewsArticle): number {
  let score = 70; // Base score

  const hoursAgo =
    (Date.now() - new Date(article.publishedAt).getTime()) / 3600000;
  if (hoursAgo < 1) score += 20;
  else if (hoursAgo < 3) score += 15;
  else if (hoursAgo < 6) score += 10;
  else if (hoursAgo < 12) score += 5;

  if (article.title.length > 80) score += 5;
  if (article.description && article.description.length > 100) score += 5;
  if (article.urlToImage) score += 3;

  return Math.min(99, score);
}

function calculateSpeedScore(publishedAt: string): number {
  const hoursAgo = (Date.now() - new Date(publishedAt).getTime()) / 3600000;

  if (hoursAgo < 0.5) return 98;
  if (hoursAgo < 1) return 92;
  if (hoursAgo < 2) return 85;
  if (hoursAgo < 4) return 75;
  if (hoursAgo < 8) return 65;
  if (hoursAgo < 12) return 55;
  if (hoursAgo < 24) return 45;
  return 30;
}

function extractTags(title: string): string[] {
  const stopWords = new Set([
    "le",
    "la",
    "les",
    "un",
    "une",
    "des",
    "du",
    "de",
    "et",
    "en",
    "au",
    "aux",
    "a",
    "the",
    "an",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "est",
    "sont",
    "dans",
    "sur",
    "pour",
    "par",
    "que",
    "qui",
    "quoi",
  ]);

  const words = title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u00C0-\u017F\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  return [...new Set(words)]
    .slice(0, 5)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
}

function guessCategory(title: string): string {
  const titleLower = title.toLowerCase();

  if (
    /tech|ia|ai|digital|startup|innovation|robot|cyber|apple|google|microsoft/.test(
      titleLower,
    )
  )
    return "Tech";
  if (
    /sport|football|match|ligue|nba|tennis|rugby|jeux olympiques|psg|real|barca/.test(
      titleLower,
    )
  )
    return "Sport";
  if (/film|cinema|serie|netflix|disney|marvel|acteur|actrice/.test(titleLower))
    return "Entertainment";
  if (
    /politique|president|gouvernement|election|ministre|vote|assemblee/.test(
      titleLower,
    )
  )
    return "Politique";
  if (
    /economie|bourse|marche|entreprise|finance|euro|dollar|inflation/.test(
      titleLower,
    )
  )
    return "Economie";
  if (
    /musique|concert|artiste|album|spotify|rappeur|chanteuse/.test(titleLower)
  )
    return "Musique";
  if (/science|recherche|decouverte|etude|espace|nasa|climat/.test(titleLower))
    return "Science";
  if (/sante|covid|hopital|medecin|medicament|vaccin/.test(titleLower))
    return "Sante";

  return "Actualite";
}

// ─── API Fetcher ──────────────────────────────────────────────────────────────

async function fetchNewsFromAPI(
  country: string = "fr",
  isBreaking: boolean = false,
): Promise<NewsArticle[]> {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const url = isBreaking
    ? `${baseUrl}/api/live-news?breaking=true`
    : `${baseUrl}/api/live-news?country=${country}`;

  const res = await fetch(url, {
    next: { revalidate: 180 }, // Revalidate every 3 minutes
  });

  if (!res.ok) {
    throw new Error(`News API returned ${res.status}`);
  }

  const data = await res.json();

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error("Invalid news API response");
  }

  // Enrich articles with calculated scores and categories
  return data.data.map((article: NewsArticle) => ({
    ...article,
    importanceScore: calculateImportanceScore(article),
    speedScore: calculateSpeedScore(article.publishedAt),
    category: article.category || guessCategory(article.title),
    tags: extractTags(article.title),
  }));
}

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Get latest news for a country
 */
export async function getNews(
  country: string = "fr",
): Promise<NewsServiceResponse> {
  const cacheKey = `news_${country}`;
  const cached = newsCache.get(cacheKey);

  if (cached && cached.expiresAt > new Date()) {
    return {
      success: true,
      data: cached.data,
      source: "cache",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const articles = await fetchNewsFromAPI(country, false);

    // Sort by importance score
    articles.sort((a, b) => b.importanceScore - a.importanceScore);

    // Cache results
    newsCache.set(cacheKey, {
      data: articles,
      expiresAt: new Date(Date.now() + CACHE_DURATION),
    });

    return {
      success: true,
      data: articles,
      source: "live",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[NewsService] Error fetching news:", error);

    if (cached) {
      return {
        success: true,
        data: cached.data,
        source: "cache",
        error: "Using cached data due to API error",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      data: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get breaking news from multiple countries
 */
export async function getBreakingNews(): Promise<NewsServiceResponse> {
  const cacheKey = "breaking_news";
  const cached = newsCache.get(cacheKey);

  if (cached && cached.expiresAt > new Date()) {
    return {
      success: true,
      data: cached.data,
      source: "cache",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const articles = await fetchNewsFromAPI("", true);

    // Sort by speed score for breaking news
    articles.sort((a, b) => b.speedScore - a.speedScore);

    newsCache.set(cacheKey, {
      data: articles,
      expiresAt: new Date(Date.now() + CACHE_DURATION),
    });

    return {
      success: true,
      data: articles,
      source: "live",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[NewsService] Error fetching breaking news:", error);

    if (cached) {
      return {
        success: true,
        data: cached.data,
        source: "cache",
        error: "Using cached data",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      data: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get a specific news article by ID
 */
export async function getNewsById(newsId: string): Promise<NewsDetailResponse> {
  // First check all caches
  for (const [, cached] of newsCache) {
    const found = cached.data.find((article) => article.id === newsId);
    if (found) {
      return {
        success: true,
        data: found,
        source: "cache",
        contentIdeas: generateNewsContentIdeas(found),
      };
    }
  }

  // If not in cache, fetch fresh news and search
  const countries = ["fr", "us", "gb"];

  for (const country of countries) {
    const response = await getNews(country);
    if (response.success) {
      const found = response.data.find((article) => article.id === newsId);
      if (found) {
        return {
          success: true,
          data: found,
          source: response.source,
          contentIdeas: generateNewsContentIdeas(found),
        };
      }
    }
  }

  return {
    success: false,
    data: null,
    source: "fallback",
    error: "Article not found",
  };
}

/**
 * Search news articles
 */
export async function searchNews(
  query: string,
  country: string = "fr",
): Promise<NewsServiceResponse> {
  const response = await getNews(country);

  if (!response.success) return response;

  const q = query.toLowerCase();
  const filtered = response.data.filter(
    (article) =>
      article.title.toLowerCase().includes(q) ||
      article.description?.toLowerCase().includes(q) ||
      article.source.toLowerCase().includes(q) ||
      article.tags.some((tag) => tag.toLowerCase().includes(q)),
  );

  return {
    ...response,
    data: filtered,
  };
}

/**
 * Get news by category
 */
export async function getNewsByCategory(
  category: string,
  country: string = "fr",
): Promise<NewsServiceResponse> {
  const response = await getNews(country);

  if (!response.success) return response;

  const filtered = response.data.filter(
    (article) => article.category.toLowerCase() === category.toLowerCase(),
  );

  return {
    ...response,
    data: filtered,
  };
}

/**
 * Generate content ideas for creators based on news article
 */
function generateNewsContentIdeas(article: NewsArticle): string[] {
  const ideas: string[] = [];

  // Speed-based ideas
  if (article.speedScore > 85) {
    ideas.push(`Breaking: "${article.title}" - Reaction et analyse immediate`);
    ideas.push(`Ce qu'on sait sur "${article.title}" - Recap en 60 secondes`);
  }

  // Category-based ideas
  switch (article.category) {
    case "Tech":
      ideas.push(`L'impact de cette news tech sur notre quotidien`);
      ideas.push(`Mon avis de geek sur "${article.title}"`);
      break;
    case "Sport":
      ideas.push(`Analyse tactique: "${article.title}"`);
      ideas.push(`Les reactions des fans a "${article.title}"`);
      break;
    case "Entertainment":
      ideas.push(`Pourquoi "${article.title}" fait le buzz`);
      ideas.push(`Mon opinion sur cette news entertainment`);
      break;
    case "Politique":
      ideas.push(`"${article.title}" explique simplement`);
      ideas.push(`Les consequences de "${article.title}" pour nous`);
      break;
    default:
      ideas.push(`Mon point de vue sur "${article.title}"`);
  }

  // Universal ideas
  ideas.push(`Thread Twitter: "${article.title}" en 10 points`);
  ideas.push(`Video reaction a "${article.title}"`);
  ideas.push(`Pourquoi tout le monde parle de "${article.title}"`);

  // Importance-based ideas
  if (article.importanceScore > 85) {
    ideas.push(`Cette news change tout: "${article.title}"`);
  }

  return ideas.slice(0, 6);
}

// ─── Export Service Object ────────────────────────────────────────────────────

export const NewsService = {
  get: getNews,
  getBreaking: getBreakingNews,
  getById: getNewsById,
  search: searchNews,
  getByCategory: getNewsByCategory,
  generateContentIdeas: generateNewsContentIdeas,
};
