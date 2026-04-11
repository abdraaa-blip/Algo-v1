/**
 * ALGO Streak & Daily Rewards System
 *
 * Dopamine-driven engagement mechanics:
 * - Daily login streaks with exponential rewards
 * - Comeback bonuses for lapsed users
 * - Mystery rewards to create anticipation
 * - Achievement unlocks based on behavior
 */

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastVisit: string;
  totalVisits: number;
  xp: number;
  level: number;
  achievements: string[];
  dailyRewardsClaimed: string[];
  referralCode: string;
  referredBy?: string;
  referralCount: number;
}

export interface DailyReward {
  day: number;
  type: "xp" | "badge" | "feature" | "mystery";
  value: number | string;
  label: string;
  icon: string;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  requirement: {
    type: "streak" | "visits" | "referrals" | "content_viewed" | "predictions";
    value: number;
  };
  rarity: "common" | "rare" | "epic" | "legendary";
}

// XP required for each level (exponential growth)
export const LEVEL_XP_REQUIREMENTS = [
  0, // Level 1
  100, // Level 2
  250, // Level 3
  500, // Level 4
  1000, // Level 5
  2000, // Level 6
  4000, // Level 7
  7500, // Level 8
  12000, // Level 9
  20000, // Level 10 - "Algorithm Master"
];

export const LEVEL_NAMES = [
  "Debutant",
  "Observateur",
  "Analyste",
  "Detecteur",
  "Predicteur",
  "Stratege",
  "Expert",
  "Maitre",
  "Visionnaire",
  "Algorithm Master",
];

// Daily rewards cycle (7 days, then repeats with better rewards)
export const DAILY_REWARDS: DailyReward[] = [
  {
    day: 1,
    type: "xp",
    value: 50,
    label: "+50 XP",
    icon: "sparkles",
    claimed: false,
  },
  {
    day: 2,
    type: "xp",
    value: 75,
    label: "+75 XP",
    icon: "zap",
    claimed: false,
  },
  {
    day: 3,
    type: "badge",
    value: "early_bird",
    label: "Badge Early Bird",
    icon: "award",
    claimed: false,
  },
  {
    day: 4,
    type: "xp",
    value: 100,
    label: "+100 XP",
    icon: "flame",
    claimed: false,
  },
  {
    day: 5,
    type: "feature",
    value: "ai_insights",
    label: "AI Insights 24h",
    icon: "brain",
    claimed: false,
  },
  {
    day: 6,
    type: "xp",
    value: 150,
    label: "+150 XP",
    icon: "rocket",
    claimed: false,
  },
  {
    day: 7,
    type: "mystery",
    value: "mystery_box",
    label: "Coffre Mystere",
    icon: "gift",
    claimed: false,
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  {
    id: "streak_3",
    name: "Debut Prometteur",
    description: "3 jours consecutifs",
    icon: "flame",
    xpReward: 100,
    requirement: { type: "streak", value: 3 },
    rarity: "common",
  },
  {
    id: "streak_7",
    name: "Semaine Parfaite",
    description: "7 jours consecutifs",
    icon: "calendar",
    xpReward: 250,
    requirement: { type: "streak", value: 7 },
    rarity: "rare",
  },
  {
    id: "streak_30",
    name: "Mois Legendaire",
    description: "30 jours consecutifs",
    icon: "crown",
    xpReward: 1000,
    requirement: { type: "streak", value: 30 },
    rarity: "epic",
  },
  {
    id: "streak_100",
    name: "Centurion",
    description: "100 jours consecutifs",
    icon: "trophy",
    xpReward: 5000,
    requirement: { type: "streak", value: 100 },
    rarity: "legendary",
  },

  // Visit achievements
  {
    id: "visits_10",
    name: "Habitue",
    description: "10 visites totales",
    icon: "eye",
    xpReward: 50,
    requirement: { type: "visits", value: 10 },
    rarity: "common",
  },
  {
    id: "visits_50",
    name: "Fidele",
    description: "50 visites totales",
    icon: "heart",
    xpReward: 200,
    requirement: { type: "visits", value: 50 },
    rarity: "rare",
  },
  {
    id: "visits_500",
    name: "Addicted",
    description: "500 visites totales",
    icon: "zap",
    xpReward: 2000,
    requirement: { type: "visits", value: 500 },
    rarity: "legendary",
  },

  // Referral achievements
  {
    id: "referral_1",
    name: "Ambassadeur",
    description: "1 parrainage",
    icon: "users",
    xpReward: 200,
    requirement: { type: "referrals", value: 1 },
    rarity: "common",
  },
  {
    id: "referral_5",
    name: "Influenceur",
    description: "5 parrainages",
    icon: "megaphone",
    xpReward: 500,
    requirement: { type: "referrals", value: 5 },
    rarity: "rare",
  },
  {
    id: "referral_25",
    name: "Viral Master",
    description: "25 parrainages",
    icon: "star",
    xpReward: 2500,
    requirement: { type: "referrals", value: 25 },
    rarity: "legendary",
  },
];

/**
 * Calculate level from XP
 */
export function calculateLevel(xp: number): number {
  for (let i = LEVEL_XP_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP_REQUIREMENTS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Calculate XP progress to next level
 */
export function calculateLevelProgress(xp: number): {
  current: number;
  required: number;
  percentage: number;
} {
  const level = calculateLevel(xp);
  const currentLevelXP = LEVEL_XP_REQUIREMENTS[level - 1] || 0;
  const nextLevelXP =
    LEVEL_XP_REQUIREMENTS[level] ||
    LEVEL_XP_REQUIREMENTS[LEVEL_XP_REQUIREMENTS.length - 1];

  const current = xp - currentLevelXP;
  const required = nextLevelXP - currentLevelXP;
  const percentage = Math.min(100, Math.round((current / required) * 100));

  return { current, required, percentage };
}

/**
 * Check if streak is still valid (visited yesterday or today)
 */
export function isStreakValid(lastVisit: string): boolean {
  const last = new Date(lastVisit);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diffDays <= 1;
}

/**
 * Calculate comeback bonus for lapsed users
 */
export function calculateComebackBonus(daysMissed: number): number {
  if (daysMissed <= 1) return 0;
  if (daysMissed <= 3) return 25; // Small bonus
  if (daysMissed <= 7) return 50; // Medium bonus
  if (daysMissed <= 30) return 100; // Large bonus
  return 200; // Huge comeback bonus
}

/**
 * Get today's daily reward based on streak
 */
export function getTodayReward(streak: number): DailyReward {
  const dayIndex = (streak - 1) % DAILY_REWARDS.length;
  const multiplier = Math.floor((streak - 1) / DAILY_REWARDS.length) + 1;
  const baseReward = DAILY_REWARDS[dayIndex];

  // Increase XP rewards for longer streaks
  if (baseReward.type === "xp" && typeof baseReward.value === "number") {
    return {
      ...baseReward,
      value: baseReward.value * multiplier,
      label: `+${baseReward.value * multiplier} XP`,
    };
  }

  return baseReward;
}

/**
 * Check and unlock new achievements
 */
export function checkAchievements(userData: UserStreak): Achievement[] {
  const newAchievements: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (userData.achievements.includes(achievement.id)) continue;

    let unlocked = false;
    switch (achievement.requirement.type) {
      case "streak":
        unlocked = userData.currentStreak >= achievement.requirement.value;
        break;
      case "visits":
        unlocked = userData.totalVisits >= achievement.requirement.value;
        break;
      case "referrals":
        unlocked = userData.referralCount >= achievement.requirement.value;
        break;
    }

    if (unlocked) {
      newAchievements.push(achievement);
    }
  }

  return newAchievements;
}

/**
 * Generate unique referral code
 */
export function generateReferralCode(userId: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const hash = userId.slice(0, 4).toUpperCase();
  let code = "ALGO";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code + hash.slice(0, 2);
}

/**
 * Storage key for streak data
 */
const STREAK_STORAGE_KEY = "algo_user_streak";

/**
 * Get user streak from localStorage (for anonymous users)
 */
export function getLocalStreak(): UserStreak | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STREAK_STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Save user streak to localStorage
 */
export function saveLocalStreak(streak: UserStreak): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streak));
}

/**
 * Initialize new user streak
 */
export function initializeStreak(userId: string): UserStreak {
  return {
    userId,
    currentStreak: 1,
    longestStreak: 1,
    lastVisit: new Date().toISOString(),
    totalVisits: 1,
    xp: 50, // Starting bonus
    level: 1,
    achievements: [],
    dailyRewardsClaimed: [],
    referralCode: generateReferralCode(userId),
    referralCount: 0,
  };
}

/**
 * Process daily visit and update streak
 */
export function processVisit(existing: UserStreak | null): {
  streak: UserStreak;
  isNewDay: boolean;
  rewardClaimed: DailyReward | null;
  newAchievements: Achievement[];
  comebackBonus: number;
  levelUp: boolean;
} {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // New user
  if (!existing) {
    const newStreak = initializeStreak(`anon_${Date.now()}`);
    return {
      streak: newStreak,
      isNewDay: true,
      rewardClaimed: getTodayReward(1),
      newAchievements: [],
      comebackBonus: 0,
      levelUp: false,
    };
  }

  const lastVisitDate = existing.lastVisit.split("T")[0];

  // Already visited today
  if (lastVisitDate === today) {
    return {
      streak: existing,
      isNewDay: false,
      rewardClaimed: null,
      newAchievements: [],
      comebackBonus: 0,
      levelUp: false,
    };
  }

  // Calculate days since last visit
  const last = new Date(existing.lastVisit);
  const diffDays = Math.floor(
    (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
  );

  let newStreak = existing.currentStreak;
  let comebackBonus = 0;

  if (diffDays === 1) {
    // Consecutive day - increase streak
    newStreak = existing.currentStreak + 1;
  } else if (diffDays > 1) {
    // Streak broken - reset but give comeback bonus
    comebackBonus = calculateComebackBonus(diffDays);
    newStreak = 1;
  }

  const oldLevel = existing.level;
  const reward = getTodayReward(newStreak);
  let xpGain = comebackBonus;

  if (reward.type === "xp" && typeof reward.value === "number") {
    xpGain += reward.value;
  }

  const newXP = existing.xp + xpGain;
  const newLevel = calculateLevel(newXP);

  const updatedStreak: UserStreak = {
    ...existing,
    currentStreak: newStreak,
    longestStreak: Math.max(existing.longestStreak, newStreak),
    lastVisit: now.toISOString(),
    totalVisits: existing.totalVisits + 1,
    xp: newXP,
    level: newLevel,
    dailyRewardsClaimed: [...existing.dailyRewardsClaimed, today],
  };

  const newAchievements = checkAchievements(updatedStreak);

  // Add XP from achievements
  for (const achievement of newAchievements) {
    updatedStreak.xp += achievement.xpReward;
    updatedStreak.achievements.push(achievement.id);
  }

  // Recalculate level after achievement XP
  updatedStreak.level = calculateLevel(updatedStreak.xp);

  return {
    streak: updatedStreak,
    isNewDay: true,
    rewardClaimed: { ...reward, claimed: true },
    newAchievements,
    comebackBonus,
    levelUp: updatedStreak.level > oldLevel,
  };
}
