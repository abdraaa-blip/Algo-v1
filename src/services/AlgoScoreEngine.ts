/**
 * ALGO Score Engine (Rebuilt 2026-04-05)
 *
 * Calculates viral scores for content items.
 */

import { AlgoEventBus } from "./AlgoEventBus";

interface ContentItem {
  id: string;
  title?: string;
  keyword?: string;
  name?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  publishedAt?: string;
}

interface ScoreResult {
  score: number;
  momentum: "rising" | "stable" | "falling";
  factors: Record<string, number>;
}

class AlgoScoreEngineClass {
  private trendingKeywords: Set<string> = new Set();
  private initialized = false;

  /**
   * Start the score engine (alias for initialize)
   */
  start(): void {
    this.initialize();
  }

  /**
   * Stop the score engine
   */
  stop(): void {
    this.initialized = false;
    this.trendingKeywords.clear();
  }

  /**
   * Initialize the score engine
   */
  initialize(): void {
    if (this.initialized) return;

    // Subscribe to trend updates
    AlgoEventBus.subscribe("data:trends:updated", (data) => {
      if (Array.isArray(data)) {
        this.updateTrendingKeywords(data);
      }
    });

    this.initialized = true;
    console.log("[ALGO ScoreEngine] Initialized");
  }

  /**
   * Calculate viral score for a content item
   */
  calculateScore(item: ContentItem): ScoreResult {
    const factors: Record<string, number> = {};
    let totalScore = 50; // Base score

    // Engagement factor
    const engagement =
      (item.likes || 0) + (item.comments || 0) * 2 + (item.shares || 0) * 3;
    factors.engagement = Math.min(engagement / 1000, 30);
    totalScore += factors.engagement;

    // Trending factor - check if title/keyword matches trending
    const textToCheck = (
      item.title ||
      item.keyword ||
      item.name ||
      ""
    ).toLowerCase();
    let trendingBonus = 0;
    for (const keyword of this.trendingKeywords) {
      if (textToCheck.includes(keyword)) {
        trendingBonus += 10;
      }
    }
    factors.trending = Math.min(trendingBonus, 20);
    totalScore += factors.trending;

    // Recency factor
    if (item.publishedAt) {
      const ageHours =
        (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60);
      factors.recency = Math.max(0, 10 - ageHours / 2);
      totalScore += factors.recency;
    }

    // Normalize score to 0-100
    const finalScore = Math.min(100, Math.max(0, totalScore));

    // Determine momentum
    let momentum: "rising" | "stable" | "falling" = "stable";
    if (factors.trending > 5) momentum = "rising";
    if (factors.engagement < 5 && factors.recency < 2) momentum = "falling";

    return {
      score: Math.round(finalScore),
      momentum,
      factors,
    };
  }

  /**
   * Update trending keywords from data (handles multiple formats)
   */
  private updateTrendingKeywords(trends: unknown[]): void {
    this.trendingKeywords.clear();

    for (const trend of trends) {
      // Handle various data formats safely
      let keyword: string | undefined;

      if (typeof trend === "string") {
        keyword = trend;
      } else if (trend && typeof trend === "object") {
        const obj = trend as Record<string, unknown>;
        keyword = (obj.keyword || obj.title || obj.name || obj.query) as
          | string
          | undefined;
      }

      if (keyword && typeof keyword === "string" && keyword.length > 0) {
        this.trendingKeywords.add(keyword.toLowerCase());
      }
    }
  }

  /**
   * Get current trending keywords
   */
  getTrendingKeywords(): string[] {
    return Array.from(this.trendingKeywords);
  }
}

export const AlgoScoreEngine = new AlgoScoreEngineClass();
