// ALGO Recommendation Engine
// Personalizes content based on user behavior and preferences

import type { RealTimeTrend } from "@/hooks/useRealTimeTrends";

// ─── User Preference Types ────────────────────────────────────────────────────

export interface UserPreferences {
  // Categories the user engages with
  categories: Record<string, number>; // category -> engagement score

  // Platforms the user prefers
  platforms: Record<string, number>; // platform -> engagement score

  // Keywords the user has interacted with
  keywords: string[];

  // Time of day activity patterns (0-23)
  activeHours: Record<number, number>;

  // Content types (video, news, trend, star)
  contentTypes: Record<string, number>;

  // Historical interactions
  viewedTrends: string[];
  savedTrends: string[];
  sharedTrends: string[];

  // User's geographic preference
  preferredCountries: string[];

  // Last updated
  lastUpdated: number;
}

// ─── Interaction Tracking ─────────────────────────────────────────────────────

export type InteractionType =
  | "view"
  | "click"
  | "save"
  | "share"
  | "like"
  | "comment"
  | "follow"
  | "dismiss";

export interface Interaction {
  type: InteractionType;
  trendKeyword?: string;
  category?: string;
  platform?: string;
  contentType?: string;
  timestamp: number;
}

const PREFERENCE_STORAGE_KEY = "algo_user_preferences";
const INTERACTION_DECAY_DAYS = 30; // How long interactions influence recommendations

// Weight multipliers for different interaction types
const INTERACTION_WEIGHTS: Record<InteractionType, number> = {
  view: 1,
  click: 2,
  save: 5,
  share: 4,
  like: 3,
  comment: 4,
  follow: 6,
  dismiss: -2,
};

// ─── Core Functions ───────────────────────────────────────────────────────────

export function getStoredPreferences(): UserPreferences {
  if (typeof window === "undefined") return createEmptyPreferences();

  try {
    const stored = localStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (!stored) return createEmptyPreferences();

    const prefs = JSON.parse(stored) as UserPreferences;

    // Decay old preferences
    return applyTimeDecay(prefs);
  } catch {
    return createEmptyPreferences();
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;

  try {
    prefs.lastUpdated = Date.now();
    localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error("[ALGO] Failed to save preferences:", error);
  }
}

function createEmptyPreferences(): UserPreferences {
  return {
    categories: {},
    platforms: {},
    keywords: [],
    activeHours: {},
    contentTypes: {},
    viewedTrends: [],
    savedTrends: [],
    sharedTrends: [],
    preferredCountries: [],
    lastUpdated: Date.now(),
  };
}

// Apply time decay to preference scores
function applyTimeDecay(prefs: UserPreferences): UserPreferences {
  const now = Date.now();
  const daysSinceUpdate = (now - prefs.lastUpdated) / (1000 * 60 * 60 * 24);
  const decayFactor = Math.max(0, 1 - daysSinceUpdate / INTERACTION_DECAY_DAYS);

  if (decayFactor < 1) {
    // Apply decay to all scores
    Object.keys(prefs.categories).forEach((key) => {
      prefs.categories[key] *= decayFactor;
    });
    Object.keys(prefs.platforms).forEach((key) => {
      prefs.platforms[key] *= decayFactor;
    });
    Object.keys(prefs.contentTypes).forEach((key) => {
      prefs.contentTypes[key] *= decayFactor;
    });
  }

  return prefs;
}

// ─── Track Interaction ────────────────────────────────────────────────────────

export function trackInteraction(interaction: Interaction): void {
  const prefs = getStoredPreferences();
  const weight = INTERACTION_WEIGHTS[interaction.type];

  // Update category preference
  if (interaction.category) {
    prefs.categories[interaction.category] =
      (prefs.categories[interaction.category] || 0) + weight;
  }

  // Update platform preference
  if (interaction.platform) {
    prefs.platforms[interaction.platform] =
      (prefs.platforms[interaction.platform] || 0) + weight;
  }

  // Update content type preference
  if (interaction.contentType) {
    prefs.contentTypes[interaction.contentType] =
      (prefs.contentTypes[interaction.contentType] || 0) + weight;
  }

  // Track keyword
  if (
    interaction.trendKeyword &&
    !prefs.keywords.includes(interaction.trendKeyword)
  ) {
    prefs.keywords.unshift(interaction.trendKeyword);
    prefs.keywords = prefs.keywords.slice(0, 200); // Keep max 200 keywords
  }

  // Track active hours
  const hour = new Date().getHours();
  prefs.activeHours[hour] = (prefs.activeHours[hour] || 0) + 1;

  // Track specific interactions
  if (interaction.trendKeyword) {
    if (
      interaction.type === "view" &&
      !prefs.viewedTrends.includes(interaction.trendKeyword)
    ) {
      prefs.viewedTrends.unshift(interaction.trendKeyword);
      prefs.viewedTrends = prefs.viewedTrends.slice(0, 500);
    }
    if (
      interaction.type === "save" &&
      !prefs.savedTrends.includes(interaction.trendKeyword)
    ) {
      prefs.savedTrends.unshift(interaction.trendKeyword);
    }
    if (
      interaction.type === "share" &&
      !prefs.sharedTrends.includes(interaction.trendKeyword)
    ) {
      prefs.sharedTrends.unshift(interaction.trendKeyword);
    }
  }

  savePreferences(prefs);
}

// ─── Calculate Relevance Score ────────────────────────────────────────────────

export interface RelevanceScore {
  total: number;
  breakdown: {
    categoryMatch: number;
    platformMatch: number;
    keywordSimilarity: number;
    timingBonus: number;
    noveltyBonus: number;
  };
}

export function calculateRelevanceScore(
  trend: RealTimeTrend,
  prefs: UserPreferences,
): RelevanceScore {
  let categoryMatch = 0;
  let platformMatch = 0;
  let keywordSimilarity = 0;
  let timingBonus = 0;
  let noveltyBonus = 0;

  // Platform match
  trend.platforms.forEach((platform) => {
    platformMatch += prefs.platforms[platform] || 0;
  });
  platformMatch = Math.min(platformMatch / 10, 30); // Max 30 points

  // Keyword similarity (check if trend keyword is similar to past interests)
  const trendWords = trend.keyword.toLowerCase().split(/\s+/);
  const userWords = new Set(prefs.keywords.map((k) => k.toLowerCase()));
  trendWords.forEach((word) => {
    if (
      userWords.has(word) ||
      prefs.keywords.some((k) => k.toLowerCase().includes(word))
    ) {
      keywordSimilarity += 10;
    }
  });
  keywordSimilarity = Math.min(keywordSimilarity, 30); // Max 30 points

  // Timing bonus (is user active at this hour?)
  const currentHour = new Date().getHours();
  const hourActivity = prefs.activeHours[currentHour] || 0;
  const maxActivity = Math.max(...Object.values(prefs.activeHours), 1);
  timingBonus = (hourActivity / maxActivity) * 10; // Max 10 points

  // Novelty bonus (new trends the user hasn't seen)
  if (!prefs.viewedTrends.includes(trend.keyword)) {
    noveltyBonus = 20; // Max 20 points
  }

  // Content type match (assuming trend type from platforms)
  const trendType =
    trend.platforms.includes("youtube") || trend.platforms.includes("tiktok")
      ? "video"
      : trend.platforms.includes("reddit") || trend.platforms.includes("x")
        ? "discussion"
        : "general";
  categoryMatch = (prefs.contentTypes[trendType] || 0) / 5;
  categoryMatch = Math.min(categoryMatch, 10); // Max 10 points

  const total =
    categoryMatch +
    platformMatch +
    keywordSimilarity +
    timingBonus +
    noveltyBonus;

  return {
    total: Math.min(total, 100), // Cap at 100
    breakdown: {
      categoryMatch,
      platformMatch,
      keywordSimilarity,
      timingBonus,
      noveltyBonus,
    },
  };
}

// ─── Rank Trends by Relevance ─────────────────────────────────────────────────

export interface RankedTrend {
  trend: RealTimeTrend;
  relevance: RelevanceScore;
  combinedScore: number;
}

export function rankTrendsByRelevance(trends: RealTimeTrend[]): RankedTrend[] {
  const prefs = getStoredPreferences();

  const ranked = trends.map((trend) => {
    const relevance = calculateRelevanceScore(trend, prefs);

    // Combine viral score with relevance (70% viral, 30% relevance)
    const combinedScore = trend.score.overall * 0.7 + relevance.total * 0.3;

    return { trend, relevance, combinedScore };
  });

  // Sort by combined score
  return ranked.sort((a, b) => b.combinedScore - a.combinedScore);
}

// ─── Get Personalized Recommendations ─────────────────────────────────────────

export interface PersonalizedRecommendation {
  trend: RealTimeTrend;
  reason: string;
  matchType: "platform" | "keyword" | "category" | "trending" | "new";
}

export function getPersonalizedRecommendations(
  trends: RealTimeTrend[],
  limit: number = 5,
): PersonalizedRecommendation[] {
  const prefs = getStoredPreferences();
  const recommendations: PersonalizedRecommendation[] = [];

  // Get top platforms and keywords
  const topPlatforms = Object.entries(prefs.platforms)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([p]) => p);

  const topKeywords = prefs.keywords.slice(0, 10);

  trends.forEach((trend) => {
    // Already viewed? Skip for personalized but can still appear in main feed
    if (prefs.viewedTrends.includes(trend.keyword)) return;

    // Platform match
    const matchingPlatforms = trend.platforms.filter((p) =>
      topPlatforms.includes(p),
    );
    if (matchingPlatforms.length > 0) {
      recommendations.push({
        trend,
        reason: `Populaire sur ${matchingPlatforms.join(", ")} que tu suis`,
        matchType: "platform",
      });
      return;
    }

    // Keyword similarity
    const trendWords = trend.keyword.toLowerCase().split(/\s+/);
    const matchingKeywords = topKeywords.filter((k) =>
      trendWords.some(
        (w) => k.toLowerCase().includes(w) || w.includes(k.toLowerCase()),
      ),
    );
    if (matchingKeywords.length > 0) {
      recommendations.push({
        trend,
        reason: `Similaire a "${matchingKeywords[0]}" que tu as suivi`,
        matchType: "keyword",
      });
      return;
    }

    // High viral score + never seen = trending pick
    if (trend.score.overall > 75 && trend.score.tier === "S") {
      recommendations.push({
        trend,
        reason: "Signal Tier S que tu n'as pas encore vu",
        matchType: "trending",
      });
      return;
    }
  });

  // Sort by trend score and return top N
  return recommendations
    .sort((a, b) => b.trend.score.overall - a.trend.score.overall)
    .slice(0, limit);
}

// ─── Export User Data ─────────────────────────────────────────────────────────

export function exportUserPreferences(): string {
  const prefs = getStoredPreferences();
  return JSON.stringify(prefs, null, 2);
}

export function clearUserPreferences(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFERENCE_STORAGE_KEY);
}
