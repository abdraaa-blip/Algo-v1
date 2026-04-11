/**
 * ALGO Achievement System
 * Comprehensive achievement tracking and unlocking
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category:
    | "discovery"
    | "engagement"
    | "social"
    | "streak"
    | "mastery"
    | "special";
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  xpReward: number;
  condition: AchievementCondition;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface AchievementCondition {
  type: "count" | "streak" | "score" | "time" | "special";
  metric: string;
  threshold: number;
}

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  // Discovery achievements
  {
    id: "first_trend",
    name: "Trend Spotter",
    description: "Discovered your first viral trend",
    icon: "🔍",
    category: "discovery",
    rarity: "common",
    xpReward: 50,
    condition: { type: "count", metric: "trends_viewed", threshold: 1 },
  },
  {
    id: "trend_hunter_10",
    name: "Trend Hunter",
    description: "Discovered 10 viral trends",
    icon: "🎯",
    category: "discovery",
    rarity: "rare",
    xpReward: 200,
    condition: { type: "count", metric: "trends_viewed", threshold: 10 },
  },
  {
    id: "trend_master_100",
    name: "Trend Master",
    description: "Discovered 100 viral trends",
    icon: "👑",
    category: "discovery",
    rarity: "epic",
    xpReward: 1000,
    condition: { type: "count", metric: "trends_viewed", threshold: 100 },
  },
  {
    id: "omniscient",
    name: "Omniscient",
    description: "Discovered 1000 viral trends",
    icon: "🌟",
    category: "discovery",
    rarity: "legendary",
    xpReward: 5000,
    condition: { type: "count", metric: "trends_viewed", threshold: 1000 },
  },

  // Engagement achievements
  {
    id: "first_save",
    name: "Collector",
    description: "Saved your first content to favorites",
    icon: "💾",
    category: "engagement",
    rarity: "common",
    xpReward: 30,
    condition: { type: "count", metric: "favorites_added", threshold: 1 },
  },
  {
    id: "curator_50",
    name: "Content Curator",
    description: "Saved 50 items to favorites",
    icon: "📚",
    category: "engagement",
    rarity: "rare",
    xpReward: 300,
    condition: { type: "count", metric: "favorites_added", threshold: 50 },
  },
  {
    id: "first_comment",
    name: "Voice Heard",
    description: "Left your first comment",
    icon: "💬",
    category: "engagement",
    rarity: "common",
    xpReward: 40,
    condition: { type: "count", metric: "comments_posted", threshold: 1 },
  },
  {
    id: "influencer",
    name: "Influencer",
    description: "Received 100 likes on your comments",
    icon: "⭐",
    category: "engagement",
    rarity: "epic",
    xpReward: 800,
    condition: {
      type: "count",
      metric: "comment_likes_received",
      threshold: 100,
    },
  },

  // Social achievements
  {
    id: "first_share",
    name: "Spreader",
    description: "Shared your first trend",
    icon: "📤",
    category: "social",
    rarity: "common",
    xpReward: 50,
    condition: { type: "count", metric: "shares", threshold: 1 },
  },
  {
    id: "viral_spreader",
    name: "Viral Spreader",
    description: "Shared 25 trends",
    icon: "🚀",
    category: "social",
    rarity: "rare",
    xpReward: 400,
    condition: { type: "count", metric: "shares", threshold: 25 },
  },
  {
    id: "super_spreader",
    name: "Super Spreader",
    description: "Shared 100 trends",
    icon: "💥",
    category: "social",
    rarity: "epic",
    xpReward: 1500,
    condition: { type: "count", metric: "shares", threshold: 100 },
  },

  // Streak achievements
  {
    id: "streak_3",
    name: "Getting Started",
    description: "Maintained a 3-day streak",
    icon: "🔥",
    category: "streak",
    rarity: "common",
    xpReward: 100,
    condition: { type: "streak", metric: "daily_visits", threshold: 3 },
  },
  {
    id: "streak_7",
    name: "Weekly Warrior",
    description: "Maintained a 7-day streak",
    icon: "⚡",
    category: "streak",
    rarity: "rare",
    xpReward: 300,
    condition: { type: "streak", metric: "daily_visits", threshold: 7 },
  },
  {
    id: "streak_30",
    name: "Monthly Legend",
    description: "Maintained a 30-day streak",
    icon: "🏆",
    category: "streak",
    rarity: "epic",
    xpReward: 2000,
    condition: { type: "streak", metric: "daily_visits", threshold: 30 },
  },
  {
    id: "streak_100",
    name: "Centurion",
    description: "Maintained a 100-day streak",
    icon: "💎",
    category: "streak",
    rarity: "legendary",
    xpReward: 10000,
    condition: { type: "streak", metric: "daily_visits", threshold: 100 },
  },
  {
    id: "streak_365",
    name: "Year One",
    description: "Maintained a 365-day streak",
    icon: "🌈",
    category: "streak",
    rarity: "mythic",
    xpReward: 50000,
    condition: { type: "streak", metric: "daily_visits", threshold: 365 },
  },

  // Mastery achievements
  {
    id: "prediction_ace",
    name: "Prediction Ace",
    description: "Made 10 correct trend predictions",
    icon: "🎰",
    category: "mastery",
    rarity: "rare",
    xpReward: 500,
    condition: { type: "count", metric: "correct_predictions", threshold: 10 },
  },
  {
    id: "oracle",
    name: "Oracle",
    description: "Made 50 correct trend predictions",
    icon: "🔮",
    category: "mastery",
    rarity: "epic",
    xpReward: 2500,
    condition: { type: "count", metric: "correct_predictions", threshold: 50 },
  },
  {
    id: "prophet",
    name: "Prophet",
    description: "Made 100 correct trend predictions",
    icon: "✨",
    category: "mastery",
    rarity: "legendary",
    xpReward: 8000,
    condition: { type: "count", metric: "correct_predictions", threshold: 100 },
  },

  // Special achievements
  {
    id: "early_adopter",
    name: "Early Adopter",
    description: "Joined ALGO in its first year",
    icon: "🌱",
    category: "special",
    rarity: "legendary",
    xpReward: 3000,
    condition: { type: "special", metric: "join_date", threshold: 2027 },
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Active between 2AM and 5AM",
    icon: "🦉",
    category: "special",
    rarity: "rare",
    xpReward: 150,
    condition: { type: "time", metric: "active_hour", threshold: 3 },
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Active between 5AM and 7AM",
    icon: "🐦",
    category: "special",
    rarity: "rare",
    xpReward: 150,
    condition: { type: "time", metric: "active_hour", threshold: 6 },
  },
  {
    id: "weekend_warrior",
    name: "Weekend Warrior",
    description: "Active for 10 consecutive weekends",
    icon: "🎉",
    category: "special",
    rarity: "epic",
    xpReward: 1000,
    condition: { type: "count", metric: "weekend_visits", threshold: 10 },
  },
];

// Rarity colors
export const RARITY_COLORS = {
  common: {
    bg: "bg-zinc-700",
    text: "text-zinc-300",
    border: "border-zinc-600",
  },
  rare: {
    bg: "bg-blue-900/50",
    text: "text-blue-400",
    border: "border-blue-500",
  },
  epic: {
    bg: "bg-purple-900/50",
    text: "text-purple-400",
    border: "border-purple-500",
  },
  legendary: {
    bg: "bg-amber-900/50",
    text: "text-amber-400",
    border: "border-amber-500",
  },
  mythic: {
    bg: "bg-rose-900/50",
    text: "text-rose-400",
    border: "border-rose-500",
  },
};

// Achievement manager
export class AchievementManager {
  private storageKey = "algo_achievements";
  private metricsKey = "algo_metrics";

  getUnlockedAchievements(): Achievement[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  getMetrics(): Record<string, number> {
    if (typeof window === "undefined") return {};
    const stored = localStorage.getItem(this.metricsKey);
    return stored ? JSON.parse(stored) : {};
  }

  updateMetric(metric: string, increment: number = 1): Achievement[] {
    if (typeof window === "undefined") return [];

    const metrics = this.getMetrics();
    metrics[metric] = (metrics[metric] || 0) + increment;
    localStorage.setItem(this.metricsKey, JSON.stringify(metrics));

    return this.checkAchievements(metrics);
  }

  setMetric(metric: string, value: number): Achievement[] {
    if (typeof window === "undefined") return [];

    const metrics = this.getMetrics();
    metrics[metric] = value;
    localStorage.setItem(this.metricsKey, JSON.stringify(metrics));

    return this.checkAchievements(metrics);
  }

  checkAchievements(metrics: Record<string, number>): Achievement[] {
    const unlocked = this.getUnlockedAchievements();
    const unlockedIds = new Set(unlocked.map((a) => a.id));
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.has(achievement.id)) continue;

      const { type, metric, threshold } = achievement.condition;
      const currentValue = metrics[metric] || 0;

      let isUnlocked = false;
      switch (type) {
        case "count":
        case "streak":
        case "score":
          isUnlocked = currentValue >= threshold;
          break;
        case "time":
          const currentHour = new Date().getHours();
          isUnlocked = Math.abs(currentHour - threshold) <= 1;
          break;
        case "special":
          if (metric === "join_date") {
            isUnlocked = new Date().getFullYear() < threshold;
          }
          break;
      }

      if (isUnlocked) {
        const unlockedAchievement = {
          ...achievement,
          unlockedAt: new Date().toISOString(),
        };
        newlyUnlocked.push(unlockedAchievement);
        unlocked.push(unlockedAchievement);
      }
    }

    if (newlyUnlocked.length > 0) {
      localStorage.setItem(this.storageKey, JSON.stringify(unlocked));
    }

    return newlyUnlocked;
  }

  getProgress(achievementId: string): {
    current: number;
    max: number;
    percentage: number;
  } {
    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!achievement) return { current: 0, max: 0, percentage: 0 };

    const metrics = this.getMetrics();
    const current = metrics[achievement.condition.metric] || 0;
    const max = achievement.condition.threshold;
    const percentage = Math.min(100, (current / max) * 100);

    return { current, max, percentage };
  }

  getTotalXP(): number {
    const unlocked = this.getUnlockedAchievements();
    return unlocked.reduce((sum, a) => sum + a.xpReward, 0);
  }

  getLevel(): {
    level: number;
    name: string;
    currentXP: number;
    nextLevelXP: number;
    progress: number;
  } {
    const totalXP = this.getTotalXP();

    const levels = [
      { level: 1, name: "Novice", xp: 0 },
      { level: 2, name: "Explorer", xp: 100 },
      { level: 3, name: "Tracker", xp: 300 },
      { level: 4, name: "Analyst", xp: 600 },
      { level: 5, name: "Expert", xp: 1000 },
      { level: 6, name: "Master", xp: 2000 },
      { level: 7, name: "Grandmaster", xp: 4000 },
      { level: 8, name: "Legend", xp: 8000 },
      { level: 9, name: "Mythic", xp: 15000 },
      { level: 10, name: "Algorithm", xp: 30000 },
    ];

    let currentLevel = levels[0];
    let nextLevel = levels[1];

    for (let i = 0; i < levels.length; i++) {
      if (totalXP >= levels[i].xp) {
        currentLevel = levels[i];
        nextLevel = levels[i + 1] || {
          level: 11,
          name: "Transcendent",
          xp: 50000,
        };
      }
    }

    const currentXP = totalXP - currentLevel.xp;
    const nextLevelXP = nextLevel.xp - currentLevel.xp;
    const progress = (currentXP / nextLevelXP) * 100;

    return {
      level: currentLevel.level,
      name: currentLevel.name,
      currentXP,
      nextLevelXP,
      progress,
    };
  }
}

export const achievementManager = new AchievementManager();
