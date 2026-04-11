/**
 * Construit des entrées RawContentInput à partir des flux ALGO (tendances + news).
 * Utilisé par GET /api/intelligence/core · pas d’appel HTTP interne.
 */

import type { RawContentInput } from "@/lib/algo-engine";
import { fetchGoogleTrends, fetchRealNews } from "@/lib/api/real-data-service";

export function parseTrafficToGrowth(traffic: string): number {
  const digits = traffic.replace(/\D/g, "");
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n <= 0) return 38;
  return Math.min(95, Math.round(28 + Math.log10(n + 1) * 20));
}

export interface BuildLiveCoreItemsOptions {
  maxTrends?: number;
  maxNews?: number;
}

/**
 * Agrège tendances Google (pays) + articles news pour un pays ISO2.
 */
export async function buildLiveRawItemsForCore(
  country: string,
  options: BuildLiveCoreItemsOptions = {},
): Promise<RawContentInput[]> {
  const maxTrends = Math.min(20, Math.max(4, options.maxTrends ?? 12));
  const maxNews = Math.min(16, Math.max(4, options.maxNews ?? 10));

  const [trends, news] = await Promise.all([
    fetchGoogleTrends(country.toUpperCase()),
    fetchRealNews(country.toUpperCase()),
  ]);

  const items: RawContentInput[] = [];

  for (const t of trends.data.slice(0, maxTrends)) {
    const g = parseTrafficToGrowth(t.trafficVolume);
    items.push({
      id: `core-trend-${t.id}`,
      title: t.title,
      description: t.description,
      growthRate: g,
      engagement: Math.round(g * 0.55),
      publishedAt: trends.fetchedAt,
      source: t.source || "google-trends",
      category: t.country || country,
      type: "trend",
    });
  }

  for (const a of news.data.slice(0, maxNews)) {
    items.push({
      id: `core-news-${a.id}`,
      title: a.title,
      description: a.description,
      publishedAt: a.publishedAt,
      source: a.source,
      category: a.country || country,
      type: "news",
      engagement: 42,
      growthRate: 35,
    });
  }

  return items;
}
