/**
 * @module real-data-service
 * @description ALGO Real Data Service - Real-time trending data aggregation
 *
 * @exports fetchRealVideos - Fetch YouTube trending videos by country
 * @exports fetchAllVideos - Fetch videos from all configured countries
 * @exports fetchRealNews - Fetch news headlines by country
 * @exports fetchAllNews - Fetch news from all configured countries
 * @exports fetchGoogleTrends - Fetch Google Trends by country
 * @exports fetchAllTrends - Fetch trends from all countries
 * @exports RealVideo - Video data type
 * @exports RealTrend - Trend data type
 * @exports RealNewsArticle - News article type
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RealTrend {
  id: string;
  title: string;
  description: string;
  trafficVolume: string;
  relatedQueries: string[];
  newsUrl?: string;
  imageUrl?: string;
  country: string;
  source: string;
}

export interface RealNewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: string; // IMPORTANT: Always a string, never an object {id, name}
  author: string | null;
  country: string;
}

export interface CachedData<T> {
  data: T[];
  fetchedAt: string;
  expiresAt: string;
  source: "live" | "cached" | "fallback";
}

export interface RealVideo {
  id: string;
  title: string;
  channel: string;
  /** Alias UI (YouTube API) — préférer `channel` si les deux sont présents. */
  channelTitle?: string;
  thumbnail: string;
  views: number;
  /** Alias numérique brut pour stats détaillées. */
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  viewsFormatted: string;
  publishedAt: string;
  publishedAtFormatted: string;
  duration: string;
  viralScore: number;
  growthRate: number;
  badge: "Viral" | "Early" | "Breaking" | "Trend";
  country: string;
  url: string;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes (increased to reduce API calls)
const RATE_LIMIT_BACKOFF_MS = 60 * 60 * 1000; // 1 hour backoff when rate limited

// Track rate limit state to avoid hammering APIs
const rateLimitState = {
  newsApi: { limited: false, until: 0 },
  youtubeApi: { limited: false, until: 0 },
};

// Track in-flight requests to prevent concurrent duplicate calls
const inFlightRequests = new Map<string, Promise<unknown>>();

function isRateLimited(api: "newsApi" | "youtubeApi"): boolean {
  const state = rateLimitState[api];
  if (state.limited && Date.now() < state.until) {
    return true;
  }
  if (state.limited && Date.now() >= state.until) {
    state.limited = false; // Reset after backoff period
  }
  return false;
}

// Track if we've already logged the rate limit message this session
const rateLimitLogged = { newsApi: false, youtubeApi: false };

function setRateLimited(api: "newsApi" | "youtubeApi"): void {
  rateLimitState[api] = {
    limited: true,
    until: Date.now() + RATE_LIMIT_BACKOFF_MS,
  };
  // Only log once per session to reduce noise
  if (!rateLimitLogged[api]) {
    console.log(`[ALGO] ${api} rate limited, using fallback data`);
    rateLimitLogged[api] = true;
  }
}

// Deduplicate concurrent requests
async function deduplicatedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fetchFn().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}

const cache = {
  trends: new Map<string, CachedData<RealTrend>>(),
  news: new Map<string, CachedData<RealNewsArticle>>(),
  videos: new Map<string, CachedData<RealVideo>>(),
};

function isCacheValid<T>(cached: CachedData<T> | undefined): boolean {
  if (!cached) return false;
  return new Date(cached.expiresAt) > new Date();
}

// ─── Google Trends ────────────────────────────────────────────────────────────

const TRENDS_COUNTRIES = ["FR", "US", "GB", "NG", "MA", "SN"];

export async function fetchGoogleTrends(
  country: string,
): Promise<CachedData<RealTrend>> {
  const cacheKey = `trends_${country}`;
  const cached = cache.trends.get(cacheKey);

  if (isCacheValid(cached)) {
    return { ...cached!, source: "cached" };
  }

  // Try extracting trending topics from Google News RSS (which works)
  try {
    const newsConfig =
      GOOGLE_NEWS_COUNTRY_CODES[country.toLowerCase()] ||
      GOOGLE_NEWS_COUNTRY_CODES.fr;
    const rssUrl = `https://news.google.com/rss?hl=${newsConfig.hl}&gl=${newsConfig.gl}&ceid=${newsConfig.ceid}`;

    const response = await fetch(rssUrl, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ALGO/1.0)" },
    });

    if (!response.ok) {
      throw new Error(`Google News returned ${response.status}`);
    }

    const xml = await response.text();
    const trends = extractTrendsFromNews(xml, country);

    if (trends.length > 0) {
      const now = new Date();
      const result: CachedData<RealTrend> = {
        data: trends,
        fetchedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
        source: "live",
      };

      cache.trends.set(cacheKey, result);
      return result;
    }

    throw new Error("No trends extracted");
  } catch {
    // Fallback to estimated trends
    if (cached) return { ...cached, source: "fallback" };
    return generateEstimatedTrends(country);
  }
}

// Extract trending topics from news headlines
function extractTrendsFromNews(xml: string, country: string): RealTrend[] {
  const trends: RealTrend[] = [];
  const seenTitles = new Set<string>();
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let index = 0;

  // Common stop words to filter out
  const stopWords = [
    "the",
    "a",
    "an",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
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
  ];

  while ((match = itemRegex.exec(xml)) !== null && index < 15) {
    const itemXml = match[1];
    const title = extractXmlTag(itemXml, "title");
    const source = extractXmlTag(itemXml, "source") || "News";
    const link = extractXmlTag(itemXml, "link") || "";
    const pubDate = extractXmlTag(itemXml, "pubDate") || "";

    if (!title) continue;

    // Clean title and extract key topic
    const cleanTitle = title
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .trim();

    // Extract main topic (first significant words)
    const words = cleanTitle
      .split(/[\s\-:,]+/)
      .filter((w) => w.length > 2 && !stopWords.includes(w.toLowerCase()));
    const topicKey = words.slice(0, 3).join(" ");

    if (!topicKey || seenTitles.has(topicKey.toLowerCase())) continue;
    seenTitles.add(topicKey.toLowerCase());

    // Estimate traffic based on recency
    const pubTime = new Date(pubDate).getTime();
    const hoursSincePublish = (Date.now() - pubTime) / (1000 * 60 * 60);
    const traffic =
      hoursSincePublish < 1
        ? "500K+"
        : hoursSincePublish < 3
          ? "200K+"
          : hoursSincePublish < 6
            ? "100K+"
            : "50K+";

    trends.push({
      id: `trend_${country}_${index}_${Date.now()}`,
      title: topicKey.length > 50 ? topicKey.slice(0, 50) + "..." : topicKey,
      description: cleanTitle.slice(0, 150),
      trafficVolume: traffic,
      relatedQueries: [],
      newsUrl: link || undefined,
      country: country.toUpperCase(),
      source: source.replace(/<[^>]*>/g, "") || "ALGO Intelligence",
    });
    index++;
  }

  return trends;
}

function extractXmlTag(xml: string, tag: string): string | null {
  const regex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`,
  );
  const match = regex.exec(xml);
  return match ? (match[1] || match[2] || "").trim() : null;
}

function generateEstimatedTrends(country: string): CachedData<RealTrend> {
  // Dynamic topics based on current date/time for variety
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Country-specific trending topics
  const countryTopics: Record<
    string,
    Array<{ title: string; desc: string; traffic: string }>
  > = {
    FR: [
      {
        title: "Ligue 1 Résultats",
        desc: "Scores et classements du championnat",
        traffic: "500K+",
      },
      {
        title: "ChatGPT 5",
        desc: "Nouvelles fonctionnalités IA",
        traffic: "350K+",
      },
      {
        title: "Élections 2027",
        desc: "Sondages et analyses politiques",
        traffic: "280K+",
      },
      {
        title: "Festival Cannes",
        desc: "Films en compétition",
        traffic: "200K+",
      },
      {
        title: "Météo France",
        desc: "Prévisions et alertes",
        traffic: "450K+",
      },
      {
        title: "SNCF Grève",
        desc: "Perturbations transports",
        traffic: "380K+",
      },
      {
        title: "Netflix Top 10",
        desc: "Séries les plus regardées",
        traffic: "420K+",
      },
      {
        title: "iPhone 17 Rumors",
        desc: "Fuites et spécifications",
        traffic: "180K+",
      },
    ],
    US: [
      {
        title: "NBA Playoffs",
        desc: "Live scores and highlights",
        traffic: "1.2M+",
      },
      {
        title: "AI Regulation",
        desc: "New government policies",
        traffic: "450K+",
      },
      { title: "Stock Market", desc: "S&P 500 movements", traffic: "680K+" },
      {
        title: "Taylor Swift Tour",
        desc: "Concert dates and tickets",
        traffic: "890K+",
      },
      { title: "Supreme Court", desc: "Latest rulings", traffic: "320K+" },
      {
        title: "Marvel Phase 6",
        desc: "New movie announcements",
        traffic: "750K+",
      },
      { title: "Tesla Updates", desc: "Elon Musk news", traffic: "580K+" },
      { title: "TikTok Ban", desc: "Legal developments", traffic: "920K+" },
    ],
    GB: [
      {
        title: "Premier League",
        desc: "Match results and standings",
        traffic: "850K+",
      },
      { title: "Royal Family", desc: "Latest royal news", traffic: "420K+" },
      { title: "UK Weather", desc: "Storm warnings", traffic: "380K+" },
      { title: "Brexit Impact", desc: "Economic analysis", traffic: "290K+" },
      { title: "NHS Updates", desc: "Healthcare news", traffic: "350K+" },
      { title: "Love Island", desc: "Reality TV drama", traffic: "520K+" },
      { title: "London Events", desc: "Concerts and shows", traffic: "280K+" },
      { title: "UK Politics", desc: "Parliament news", traffic: "310K+" },
    ],
    NG: [
      {
        title: "Afrobeats Charts",
        desc: "Top songs this week",
        traffic: "650K+",
      },
      { title: "BBNaija Updates", desc: "Reality show news", traffic: "780K+" },
      { title: "Naira Exchange", desc: "Currency rates", traffic: "420K+" },
      { title: "Nollywood", desc: "New movie releases", traffic: "380K+" },
      { title: "Super Eagles", desc: "Football team news", traffic: "550K+" },
      { title: "Lagos Traffic", desc: "Road updates", traffic: "290K+" },
      { title: "Tech Startups", desc: "Nigerian tech scene", traffic: "180K+" },
      { title: "ASUU Strike", desc: "University updates", traffic: "340K+" },
    ],
    MA: [
      { title: "Botola Pro", desc: "Football marocain", traffic: "420K+" },
      {
        title: "Ramadan 2026",
        desc: "Horaires et programmes",
        traffic: "380K+",
      },
      {
        title: "Tourisme Maroc",
        desc: "Destinations tendance",
        traffic: "250K+",
      },
      {
        title: "Economie Maroc",
        desc: "Actualites economiques",
        traffic: "180K+",
      },
      {
        title: "Musique Marocaine",
        desc: "Nouveaux artistes",
        traffic: "320K+",
      },
      { title: "Tech Maroc", desc: "Startups et innovation", traffic: "150K+" },
      {
        title: "Cinema Marocain",
        desc: "Films et festivals",
        traffic: "200K+",
      },
      { title: "Mode Casablanca", desc: "Fashion week", traffic: "280K+" },
    ],
    SN: [
      {
        title: "CAN 2026",
        desc: "Coupe d Afrique des Nations",
        traffic: "520K+",
      },
      {
        title: "Politique Senegal",
        desc: "Actualites gouvernement",
        traffic: "280K+",
      },
      {
        title: "Musique Senegalaise",
        desc: "Mbalax et hip-hop",
        traffic: "350K+",
      },
      { title: "Dakar Fashion", desc: "Mode africaine", traffic: "180K+" },
      { title: "Tech Dakar", desc: "Innovation et startups", traffic: "120K+" },
      {
        title: "Lutte Senegalaise",
        desc: "Combats et resultats",
        traffic: "450K+",
      },
      {
        title: "Economie CEDEAO",
        desc: "Actualites regionales",
        traffic: "150K+",
      },
      {
        title: "Series Senegalaises",
        desc: "TV et streaming",
        traffic: "290K+",
      },
    ],
  };

  // Get topics for country or use default
  const topics = countryTopics[country.toUpperCase()] || countryTopics.FR;

  // Shuffle and add time-based variation
  const shuffled = [...topics].sort(() => Math.random() - 0.5);

  // Add time-based topics
  if (hour >= 18 && hour <= 23) {
    shuffled.unshift({
      title: "Prime Time TV",
      desc: "Emissions du soir en direct",
      traffic: "600K+",
    });
  }
  if (isWeekend) {
    shuffled.unshift({
      title: "Weekend Plans",
      desc: "Sorties et evenements",
      traffic: "450K+",
    });
  }

  const trends: RealTrend[] = shuffled.slice(0, 10).map((topic, i) => ({
    id: `dynamic_${country}_${i}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: topic.title,
    description: topic.desc,
    trafficVolume: topic.traffic,
    relatedQueries: [],
    country: country.toUpperCase(),
    source: "ALGO Intelligence",
  }));

  const now = new Date();
  return {
    data: trends,
    fetchedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
    source: "fallback",
  };
}

export async function fetchAllTrends(): Promise<CachedData<RealTrend>> {
  const results = await Promise.all(
    TRENDS_COUNTRIES.map((c) => fetchGoogleTrends(c)),
  );

  const allTrends = results.flatMap((r) => r.data);
  const now = new Date();

  return {
    data: allTrends,
    fetchedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
    source: results.some((r) => r.source === "live") ? "live" : "cached",
  };
}

// ─── NewsAPI ──────────────────────────────────────────────────────────────────

const NEWS_COUNTRIES = ["us", "gb", "fr", "ng", "za"];
const NEWS_API_KEY = process.env.NEWSAPI_KEY || process.env.NEWS_API_KEY || "";

// ─── Google News RSS (Free, no API key required) ─────────────────────────────

const GOOGLE_NEWS_COUNTRY_CODES: Record<
  string,
  { hl: string; gl: string; ceid: string }
> = {
  fr: { hl: "fr", gl: "FR", ceid: "FR:fr" },
  us: { hl: "en", gl: "US", ceid: "US:en" },
  gb: { hl: "en", gl: "GB", ceid: "GB:en" },
  ng: { hl: "en", gl: "NG", ceid: "NG:en" },
  ma: { hl: "fr", gl: "MA", ceid: "MA:fr" },
  sn: { hl: "fr", gl: "SN", ceid: "SN:fr" },
  za: { hl: "en", gl: "ZA", ceid: "ZA:en" },
};

async function fetchGoogleNewsRSS(
  country: string,
): Promise<CachedData<RealNewsArticle>> {
  const config =
    GOOGLE_NEWS_COUNTRY_CODES[country.toLowerCase()] ||
    GOOGLE_NEWS_COUNTRY_CODES.fr;
  const rssUrl = `https://news.google.com/rss?hl=${config.hl}&gl=${config.gl}&ceid=${config.ceid}`;

  const response = await fetch(rssUrl, {
    next: { revalidate: 300 }, // 5 min cache
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ALGO/1.0; +https://algo.app)",
    },
  });

  if (!response.ok) {
    throw new Error(`Google News RSS returned ${response.status}`);
  }

  const xml = await response.text();

  // Parse RSS XML manually (simple parsing for <item> elements)
  const items: RealNewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let index = 0;

  while ((match = itemRegex.exec(xml)) !== null && index < 15) {
    const itemXml = match[1];

    // Extract fields
    const title = extractXmlTag(itemXml, "title");
    const link = extractXmlTag(itemXml, "link");
    const pubDate = extractXmlTag(itemXml, "pubDate");
    const source = extractXmlTag(itemXml, "source") || "Google News";
    const description = extractXmlTag(itemXml, "description") || "";

    // Try to extract image from description or media:content
    let imageUrl: string | null = null;
    const imgMatch =
      description.match(/<img[^>]+src="([^"]+)"/) ||
      itemXml.match(/media:content[^>]+url="([^"]+)"/);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }

    // Clean HTML from title and description
    if (!title || !link) continue;
    const cleanTitle = title
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"');
    const cleanDesc = description.replace(/<[^>]*>/g, "").slice(0, 200);

    if (cleanTitle) {
      items.push({
        id: `gnews_${country}_${index}_${Date.now()}`,
        title: cleanTitle,
        description: cleanDesc || "",
        url: link,
        urlToImage: imageUrl,
        publishedAt: pubDate
          ? new Date(pubDate).toISOString()
          : new Date().toISOString(),
        source: source.replace(/<[^>]*>/g, ""),
        author: null,
        country: country.toUpperCase(),
      });
      index++;
    }
  }

  const now = new Date();
  return {
    data: items,
    fetchedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
    source: "live",
  };
}

// Dynamic fallback news generator - provides variety when APIs are unavailable
function generateFallbackNews(): RealNewsArticle[] {
  const now = new Date();
  const hour = now.getHours();

  const newsTemplates = [
    {
      title: "Tech : les nouvelles fonctionnalités IA qui changent tout",
      description:
        "L'intelligence artificielle continue de révolutionner notre quotidien avec des applications toujours plus innovantes.",
      source: "Tech Insider",
      country: "US",
      image:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
    },
    {
      title: "Sport : résultats et analyses des matchs du jour",
      description:
        "Retour sur les rencontres sportives majeures et les performances des équipes.",
      source: "Sport Live",
      country: "FR",
      image:
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    },
    {
      title: "Cinéma : les films les plus attendus de la saison",
      description:
        "Découvre les sorties ciné qui vont marquer les prochaines semaines.",
      source: "Cine Actu",
      country: "FR",
      image:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800",
    },
    {
      title: "Musique: Les artistes qui dominent les charts",
      description:
        "Tour d'horizon des tubes du moment et des nouveaux talents à suivre.",
      source: "Music Today",
      country: "US",
      image:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    },
    {
      title: "Économie : les marchés financiers en mouvement",
      description: "Analyse des tendances économiques et des indicateurs clés.",
      source: "Finance Daily",
      country: "GB",
      image:
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
    },
    {
      title: "Culture : les événements qui font vibrer la scène culturelle",
      description: "Expositions, spectacles et festivals à ne pas manquer.",
      source: "Culture Mag",
      country: "FR",
      image:
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
    },
    {
      title: "Gaming : les jeux vidéo qui cartonnent en ce moment",
      description: "Tests, previews et actualités du monde vidéoludique.",
      source: "Game Zone",
      country: "US",
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
    },
    {
      title: "Mode : les tendances qui définissent le style actuel",
      description: "Fashion week, streetwear et inspirations du moment.",
      source: "Style Report",
      country: "FR",
      image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800",
    },
  ];

  // Time-based news
  if (hour >= 6 && hour < 12) {
    newsTemplates.unshift({
      title: "Matinale : ce qu'il faut retenir de l'actualité",
      description:
        "Résumé des informations importantes pour bien commencer la journée.",
      source: "Morning Brief",
      country: "FR",
      image:
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
    });
  } else if (hour >= 18) {
    newsTemplates.unshift({
      title: "Soirée : le récap de la journée en quelques minutes",
      description:
        "Les faits marquants et les infos à retenir avant de conclure la journée.",
      source: "Evening Digest",
      country: "FR",
      image:
        "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800",
    });
  }

  return newsTemplates.slice(0, 8).map((template, i) => ({
    id: `fallback_${i}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: template.title,
    description: template.description,
    url: "/news",
    urlToImage: template.image,
    publishedAt: new Date(now.getTime() - i * 3600000).toISOString(), // Stagger by hours
    source: template.source,
    author: null,
    country: template.country,
  }));
}

// Cached fallback news (regenerates every hour)
let cachedFallbackNews: {
  data: RealNewsArticle[];
  generatedAt: number;
} | null = null;

function getFallbackNews(): RealNewsArticle[] {
  const now = Date.now();
  const ONE_HOUR = 3600000;

  if (!cachedFallbackNews || now - cachedFallbackNews.generatedAt > ONE_HOUR) {
    cachedFallbackNews = {
      data: generateFallbackNews(),
      generatedAt: now,
    };
  }

  return cachedFallbackNews.data;
}

export async function fetchRealNews(
  country: string,
): Promise<CachedData<RealNewsArticle>> {
  const cacheKey = `news_${country}`;
  const cached = cache.news.get(cacheKey);

  // Return cached data if valid
  if (isCacheValid(cached)) {
    return { ...cached!, source: "cached" };
  }

  // Check rate limit FIRST - return stale cache or fallback if limited
  if (isRateLimited("newsApi")) {
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: getFallbackNews(),
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }

  // Use deduplication to prevent concurrent requests for the same country
  return deduplicatedFetch(cacheKey, () =>
    fetchRealNewsInternal(country, cached),
  );
}

async function fetchRealNewsInternal(
  country: string,
  cached: CachedData<RealNewsArticle> | undefined,
): Promise<CachedData<RealNewsArticle>> {
  const cacheKey = `news_${country}`;

  // Try Google News RSS first (free, no API key required)
  try {
    const googleNewsResult = await fetchGoogleNewsRSS(country);
    if (googleNewsResult.data.length > 0) {
      cache.news.set(cacheKey, googleNewsResult);
      return googleNewsResult;
    }
  } catch (e) {
    console.warn("[ALGO Real Data] Google News RSS failed, trying NewsAPI:", e);
  }

  // Double-check rate limit inside the deduplicated function
  if (isRateLimited("newsApi")) {
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: getFallbackNews(),
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=${country.toLowerCase()}&pageSize=20&apiKey=${NEWS_API_KEY}`,
      { next: { revalidate: 300 } }, // 5 min revalidate to reduce calls
    );

    // Handle rate limiting gracefully - silently use fallback
    if (response.status === 429) {
      setRateLimited("newsApi");
      if (cached) return { ...cached, source: "fallback" };
      return {
        data: getFallbackNews(),
        fetchedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        source: "fallback",
      };
    }

    if (!response.ok) {
      throw new Error(`NewsAPI returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "ok" || !data.articles) {
      throw new Error("Invalid NewsAPI response");
    }

    // CRITICAL: Extract source.name as string, never pass the object directly
    const articles: RealNewsArticle[] = data.articles.map(
      (
        article: {
          title: string;
          description: string;
          url: string;
          urlToImage: string | null;
          publishedAt: string;
          source: { id: string | null; name: string };
          author: string | null;
        },
        index: number,
      ) => ({
        id: `news_${country}_${index}_${Date.now()}`,
        title: article.title || "Untitled",
        description: article.description || "",
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        // IMPORTANT: source is ALWAYS a string - extract .name from the NewsAPI object
        source: String(article.source?.name || "Unknown"),
        author: article.author,
        country: country.toUpperCase(),
      }),
    );

    const now = new Date();
    const result: CachedData<RealNewsArticle> = {
      data: articles,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
      source: "live",
    };

    cache.news.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("[ALGO Real Data] NewsAPI fetch failed:", error);
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: getFallbackNews(),
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

export async function fetchAllNews(): Promise<CachedData<RealNewsArticle>> {
  // If rate limited, don't even try - return fallback immediately
  if (isRateLimited("newsApi")) {
    return {
      data: getFallbackNews(),
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }

  // Fetch sequentially to respect rate limits (not in parallel)
  const results: CachedData<RealNewsArticle>[] = [];
  for (const country of NEWS_COUNTRIES) {
    // Stop fetching if we hit rate limit
    if (isRateLimited("newsApi")) break;
    const result = await fetchRealNews(country);
    results.push(result);
  }

  const allNews = results.flatMap((r) => r.data);
  const now = new Date();

  return {
    data: allNews.length > 0 ? allNews : getFallbackNews(),
    fetchedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
    source: results.some((r) => r.source === "live")
      ? "live"
      : results.length > 0
        ? "cached"
        : "fallback",
  };
}

// ─── YouTube ──────────────────────────────────────────────────────────────────

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  viewCount: string;
  publishedAt: string;
  duration?: string;
}

const YOUTUBE_API_KEY =
  process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_DATA_API_KEY || "";

export async function fetchYouTubeTrending(
  country: string = "FR",
): Promise<CachedData<YouTubeVideo>> {
  if (!YOUTUBE_API_KEY) {
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${country}&maxResults=20&key=${YOUTUBE_API_KEY}`,
      { next: { revalidate: 0 } },
    );

    if (!response.ok) {
      throw new Error(`YouTube API returned ${response.status}`);
    }

    const data = await response.json();

    const videos: YouTubeVideo[] = (data.items || []).map(
      (item: {
        id: string;
        snippet: {
          title: string;
          channelTitle: string;
          thumbnails: { high?: { url: string }; medium?: { url: string } };
          publishedAt: string;
        };
        statistics: { viewCount: string };
        contentDetails?: { duration?: string };
      }) => ({
        id: item.id,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          "",
        viewCount: item.statistics.viewCount,
        publishedAt: item.snippet.publishedAt,
        duration: item.contentDetails?.duration,
      }),
    );

    const now = new Date();
    return {
      data: videos,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      source: "live",
    };
  } catch (error) {
    console.error("[ALGO Real Data] YouTube fetch failed:", error);
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

// ─── Real Videos (YouTube wrapper) ────────────────────────────────────────────
// EXPORTS: fetchRealVideos, fetchAllVideos

const VIDEO_COUNTRIES = ["FR", "US", "GB", "NG"];

export async function fetchRealVideos(
  country: string,
): Promise<CachedData<RealVideo>> {
  const cacheKey = `videos_${country}`;
  const cached = cache.videos.get(cacheKey);

  if (isCacheValid(cached)) {
    return { ...cached!, source: "cached" };
  }

  if (!YOUTUBE_API_KEY) {
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${country.toUpperCase()}&maxResults=25&key=${YOUTUBE_API_KEY}`,
      { next: { revalidate: 0 } },
    );

    if (!response.ok) {
      throw new Error(`YouTube API returned ${response.status}`);
    }

    const data = await response.json();

    const videos: RealVideo[] = (data.items || []).map(
      (
        item: {
          id: string;
          snippet: {
            title: string;
            channelTitle: string;
            thumbnails: { high?: { url: string }; medium?: { url: string } };
            publishedAt: string;
          };
          statistics: { viewCount: string; likeCount?: string };
          contentDetails?: { duration?: string };
        },
        index: number,
      ) => {
        const views = parseInt(item.statistics.viewCount || "0", 10);
        const likes = parseInt(item.statistics.likeCount || "0", 10);
        const growthRate = Math.min(
          Math.floor((likes / Math.max(views, 1)) * 1000),
          500,
        );
        const viralScore = Math.min(Math.floor(growthRate / 5) + 60, 99);

        return {
          id: item.id,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail:
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.medium?.url ||
            "",
          views,
          viewsFormatted: formatViewCount(views),
          publishedAt: item.snippet.publishedAt,
          publishedAtFormatted: formatRelativeTime(item.snippet.publishedAt),
          duration: parseDuration(item.contentDetails?.duration || ""),
          viralScore,
          growthRate,
          badge: (index < 3
            ? "Viral"
            : index < 8
              ? "Early"
              : growthRate > 100
                ? "Breaking"
                : "Trend") as RealVideo["badge"],
          country: country.toUpperCase(),
          url: `https://youtube.com/watch?v=${item.id}`,
        };
      },
    );

    const now = new Date();
    const result: CachedData<RealVideo> = {
      data: videos,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(), // 15 minutes
      source: "live",
    };

    cache.videos.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("[ALGO Real Data] YouTube videos fetch failed:", error);
    if (cached) return { ...cached, source: "fallback" };
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

export async function fetchAllVideos(): Promise<CachedData<RealVideo>> {
  const results = await Promise.all(
    VIDEO_COUNTRIES.map((c) => fetchRealVideos(c)),
  );

  const allVideos = results.flatMap((r) => r.data);
  const now = new Date();

  return {
    data: allVideos,
    fetchedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
    source: results.some((r) => r.source === "live") ? "live" : "cached",
  };
}

// ─── TMDB ─────────────────────────────────────────────────────────────────────

export interface TMDBContent {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  mediaType: "movie" | "tv";
  genres: string[];
}

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";

const TMDB_GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

export async function fetchTMDBTrending(
  mediaType: "movie" | "tv" | "all" = "all",
): Promise<CachedData<TMDBContent>> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/${mediaType}/day?api_key=${TMDB_API_KEY}&language=fr-FR`,
      { next: { revalidate: 0 } },
    );

    if (!response.ok) {
      throw new Error(`TMDB API returned ${response.status}`);
    }

    const data = await response.json();

    const content: TMDBContent[] = (data.results || []).map(
      (item: {
        id: number;
        title?: string;
        name?: string;
        overview: string;
        poster_path: string | null;
        backdrop_path: string | null;
        release_date?: string;
        first_air_date?: string;
        vote_average: number;
        media_type?: string;
        genre_ids: number[];
      }) => ({
        id: item.id,
        title: item.title || item.name || "Unknown",
        overview: item.overview,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        releaseDate: item.release_date || item.first_air_date || "",
        voteAverage: item.vote_average,
        mediaType: item.media_type === "tv" ? "tv" : "movie",
        genres: (item.genre_ids || []).map(
          (id: number) => TMDB_GENRE_MAP[id] || "Other",
        ),
      }),
    );

    const now = new Date();
    return {
      data: content,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      source: "live",
    };
  } catch (error) {
    console.error("[ALGO Real Data] TMDB fetch failed:", error);
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

// ─── LastFM ───────────────────────────────────────────────────────────────────

export interface LastFMTrack {
  name: string;
  artist: string;
  playcount: string;
  listeners: string;
  imageUrl: string | null;
  url: string;
}

export interface LastFMArtist {
  name: string;
  playcount: string;
  listeners: string;
  imageUrl: string | null;
  url: string;
}

const LASTFM_API_KEY = process.env.LASTFM_API_KEY || "";

export async function fetchLastFMTracks(
  country?: string,
): Promise<CachedData<LastFMTrack>> {
  try {
    const endpoint = country
      ? `https://ws.audioscrobbler.com/2.0/?method=geo.gettoptracks&api_key=${LASTFM_API_KEY}&format=json&limit=30&country=${country}`
      : `https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${LASTFM_API_KEY}&format=json&limit=30`;

    const response = await fetch(endpoint, { next: { revalidate: 0 } });

    if (!response.ok) {
      throw new Error(`LastFM API returned ${response.status}`);
    }

    const data = await response.json();
    const tracksData = country ? data.tracks?.track : data.tracks?.track;

    const tracks: LastFMTrack[] = (tracksData || []).map(
      (track: {
        name: string;
        artist: { name: string } | string;
        playcount: string;
        listeners: string;
        image: Array<{ "#text": string }>;
        url: string;
      }) => ({
        name: track.name,
        artist:
          typeof track.artist === "string" ? track.artist : track.artist.name,
        playcount: track.playcount,
        listeners: track.listeners,
        imageUrl:
          track.image?.[3]?.["#text"] || track.image?.[2]?.["#text"] || null,
        url: track.url,
      }),
    );

    const now = new Date();
    return {
      data: tracks,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      source: "live",
    };
  } catch (error) {
    console.error("[ALGO Real Data] LastFM tracks fetch failed:", error);
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

export async function fetchLastFMArtists(
  country?: string,
): Promise<CachedData<LastFMArtist>> {
  try {
    const endpoint = country
      ? `https://ws.audioscrobbler.com/2.0/?method=geo.gettopartists&api_key=${LASTFM_API_KEY}&format=json&limit=30&country=${country}`
      : `https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${LASTFM_API_KEY}&format=json&limit=30`;

    const response = await fetch(endpoint, { next: { revalidate: 0 } });

    if (!response.ok) {
      throw new Error(`LastFM API returned ${response.status}`);
    }

    const data = await response.json();
    const artistsData = country
      ? data.topartists?.artist
      : data.artists?.artist;

    const artists: LastFMArtist[] = (artistsData || []).map(
      (artist: {
        name: string;
        playcount: string;
        listeners: string;
        image: Array<{ "#text": string }>;
        url: string;
      }) => ({
        name: artist.name,
        playcount: artist.playcount,
        listeners: artist.listeners,
        imageUrl:
          artist.image?.[3]?.["#text"] || artist.image?.[2]?.["#text"] || null,
        url: artist.url,
      }),
    );

    const now = new Date();
    return {
      data: artists,
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      source: "live",
    };
  } catch (error) {
    console.error("[ALGO Real Data] LastFM artists fetch failed:", error);
    return {
      data: [],
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format view count to human readable format
 * @example formatViewCount(1234567) => "1.2M"
 */
export function formatViewCount(count: number): string {
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1)}B`;
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Format relative time from ISO date string
 * @example formatRelativeTime("2026-04-05T10:00:00Z") => "il y a 2h"
 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `il y a ${diffYears}a`;
  if (diffMonths > 0) return `il y a ${diffMonths}mo`;
  if (diffWeeks > 0) return `il y a ${diffWeeks}sem`;
  if (diffDays > 0) return `il y a ${diffDays}j`;
  if (diffHours > 0) return `il y a ${diffHours}h`;
  if (diffMins > 0) return `il y a ${diffMins}min`;
  return "a l'instant";
}

/**
 * Parse YouTube ISO 8601 duration to human readable format
 * @example parseDuration("PT4M13S") => "4:13"
 */
export function parseDuration(isoDuration: string): string {
  if (!isoDuration) return "0:00";

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
