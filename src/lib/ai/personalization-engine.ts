/**
 * ALGO AI Personalization Engine
 *
 * Learns user preferences to deliver personalized content recommendations:
 * - Tracks content interactions (views, likes, saves)
 * - Builds user interest profile
 * - Scores content relevance per user
 * - Generates personalized daily briefings
 */

export interface UserInteraction {
  contentId: string;
  contentType: "video" | "news" | "trend" | "movie" | "music";
  category: string;
  action: "view" | "like" | "save" | "share" | "skip";
  timestamp: string;
  duration?: number; // seconds spent
  viralScore?: number;
}

export interface UserInterestProfile {
  userId: string;
  categories: Record<string, number>; // category -> interest score (0-100)
  contentTypes: Record<string, number>; // type -> preference (0-100)
  peakHours: number[]; // hours when user is most active
  avgSessionDuration: number;
  preferredViralThreshold: number; // minimum viral score they engage with
  totalInteractions: number;
  lastUpdated: string;
}

export interface PersonalizedRecommendation {
  contentId: string;
  title: string;
  category: string;
  relevanceScore: number; // 0-100
  reason: string; // "Based on your interest in Tech"
  viralScore: number;
}

const PROFILE_KEY = "algo_user_interest_profile";
const INTERACTIONS_KEY = "algo_user_interactions";
const MAX_STORED_INTERACTIONS = 500;

/**
 * Get stored interactions
 */
function getStoredInteractions(): UserInteraction[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(INTERACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save interaction to storage
 */
export function trackInteraction(
  interaction: Omit<UserInteraction, "timestamp">,
): void {
  if (typeof window === "undefined") return;

  const interactions = getStoredInteractions();
  const newInteraction: UserInteraction = {
    ...interaction,
    timestamp: new Date().toISOString(),
  };

  interactions.push(newInteraction);

  // Keep only recent interactions
  const trimmed = interactions.slice(-MAX_STORED_INTERACTIONS);
  localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(trimmed));

  // Update profile
  updateProfile(trimmed);
}

/**
 * Calculate interest scores from interactions
 */
function calculateInterestScores(
  interactions: UserInteraction[],
): Record<string, number> {
  const scores: Record<string, number> = {};
  const counts: Record<string, number> = {};

  // Weight actions differently
  const actionWeights: Record<string, number> = {
    view: 1,
    like: 3,
    save: 5,
    share: 7,
    skip: -2,
  };

  // Decay factor for older interactions (exponential decay over 30 days)
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const interaction of interactions) {
    const age = (now - new Date(interaction.timestamp).getTime()) / dayMs;
    const decay = Math.exp(-age / 30); // 30-day half-life
    const weight = (actionWeights[interaction.action] || 1) * decay;

    const category = interaction.category.toLowerCase();
    scores[category] = (scores[category] || 0) + weight;
    counts[category] = (counts[category] || 0) + 1;
  }

  // Normalize to 0-100 scale
  const maxScore = Math.max(...Object.values(scores), 1);
  const normalized: Record<string, number> = {};

  for (const [category, score] of Object.entries(scores)) {
    normalized[category] = Math.round((score / maxScore) * 100);
  }

  return normalized;
}

/**
 * Calculate content type preferences
 */
function calculateTypePreferences(
  interactions: UserInteraction[],
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const interaction of interactions) {
    if (interaction.action !== "skip") {
      counts[interaction.contentType] =
        (counts[interaction.contentType] || 0) + 1;
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 1);
  const prefs: Record<string, number> = {};

  for (const [type, count] of Object.entries(counts)) {
    prefs[type] = Math.round((count / total) * 100);
  }

  return prefs;
}

/**
 * Calculate peak activity hours
 */
function calculatePeakHours(interactions: UserInteraction[]): number[] {
  const hourCounts: Record<number, number> = {};

  for (const interaction of interactions) {
    const hour = new Date(interaction.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }

  // Find top 3 most active hours
  const sorted = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  return sorted;
}

/**
 * Calculate preferred viral threshold
 */
function calculateViralThreshold(interactions: UserInteraction[]): number {
  const scores = interactions
    .filter((i) => i.viralScore && i.action !== "skip")
    .map((i) => i.viralScore as number);

  if (scores.length === 0) return 70; // default

  // Return 25th percentile (user engages with content above this score)
  scores.sort((a, b) => a - b);
  const index = Math.floor(scores.length * 0.25);
  return scores[index];
}

/**
 * Update user profile from interactions
 */
function updateProfile(interactions: UserInteraction[]): UserInterestProfile {
  const profile: UserInterestProfile = {
    userId: "local",
    categories: calculateInterestScores(interactions),
    contentTypes: calculateTypePreferences(interactions),
    peakHours: calculatePeakHours(interactions),
    avgSessionDuration: 0,
    preferredViralThreshold: calculateViralThreshold(interactions),
    totalInteractions: interactions.length,
    lastUpdated: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  return profile;
}

/**
 * Get user interest profile
 */
export function getUserProfile(): UserInterestProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Score content relevance for user
 */
export function scoreContentRelevance(
  content: { category: string; contentType: string; viralScore: number },
  profile: UserInterestProfile | null,
): { score: number; reason: string } {
  if (!profile || profile.totalInteractions < 5) {
    // Not enough data, use viral score
    return { score: content.viralScore, reason: "Tendance populaire" };
  }

  const categoryScore =
    profile.categories[content.category.toLowerCase()] || 50;
  const typeScore = profile.contentTypes[content.contentType] || 50;

  // Weighted combination
  const relevance = Math.round(
    categoryScore * 0.5 + typeScore * 0.2 + content.viralScore * 0.3,
  );

  // Generate reason
  let reason = "Recommande pour toi";
  if (categoryScore >= 70) {
    reason = `Base sur ton interet pour ${content.category}`;
  } else if (content.viralScore >= 85) {
    reason = "Contenu viral en ce moment";
  }

  return { score: relevance, reason };
}

/**
 * Get top interest categories
 */
export function getTopInterests(
  profile: UserInterestProfile | null,
  limit = 5,
): string[] {
  if (!profile) return [];

  return Object.entries(profile.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category]) => category);
}

/**
 * Generate personalized greeting based on time and preferences
 */
export function getPersonalizedGreeting(profile: UserInterestProfile | null): {
  greeting: string;
  suggestion: string;
} {
  const hour = new Date().getHours();
  let greeting = "Bienvenue";

  if (hour >= 5 && hour < 12) greeting = "Bonjour";
  else if (hour >= 12 && hour < 18) greeting = "Bon apres-midi";
  else if (hour >= 18 && hour < 22) greeting = "Bonsoir";
  else greeting = "Bonne nuit";

  let suggestion = "Decouvre ce qui buzz en ce moment";

  if (profile && profile.totalInteractions >= 10) {
    const topInterests = getTopInterests(profile, 2);
    if (topInterests.length > 0) {
      suggestion = `Nouveautes en ${topInterests.join(" et ")}`;
    }
  }

  return { greeting, suggestion };
}

/**
 * Check if user is at their peak activity time
 */
export function isPeakActivityTime(
  profile: UserInterestProfile | null,
): boolean {
  if (!profile || profile.peakHours.length === 0) return false;
  const currentHour = new Date().getHours();
  return profile.peakHours.includes(currentHour);
}

/**
 * Get content recommendations sorted by relevance
 */
export function getPersonalizedContent<
  T extends { category: string; viralScore: number },
>(
  contents: T[],
  profile: UserInterestProfile | null,
  contentType: string,
): (T & { relevanceScore: number; relevanceReason: string })[] {
  return contents
    .map((content) => {
      const { score, reason } = scoreContentRelevance(
        { ...content, contentType },
        profile,
      );
      return {
        ...content,
        relevanceScore: score,
        relevanceReason: reason,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
