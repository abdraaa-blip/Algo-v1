/**
 * ALGO Viral Challenge System
 * 
 * Creates shareable challenges that drive organic growth through:
 * - Social proof (leaderboards, comparisons)
 * - Competition (beat your friends)
 * - Time pressure (limited events)
 * - Achievement hunting (rare badges)
 */

export interface Challenge {
  id: string
  type: 'daily' | 'weekly' | 'event' | 'permanent'
  title: string
  description: string
  icon: string
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  xpReward: number
  badgeReward?: string
  requirements: ChallengeRequirement[]
  startDate?: Date
  endDate?: Date
  participantCount: number
  completionRate: number
}

export interface ChallengeRequirement {
  type: 'view' | 'like' | 'share' | 'comment' | 'streak' | 'discover' | 'predict'
  target: number
  current: number
}

export interface UserChallenge {
  challengeId: string
  progress: number
  completed: boolean
  completedAt?: Date
  rank?: number
}

// Daily Challenges - Refreshed every 24h
export const DAILY_CHALLENGES: Omit<Challenge, 'participantCount' | 'completionRate'>[] = [
  {
    id: 'trend-hunter',
    type: 'daily',
    title: 'Chasseur de tendances',
    description: 'Decouvre 5 sujets tendance avant qu\'ils ne deviennent viraux',
    icon: '🎯',
    difficulty: 'easy',
    xpReward: 50,
    requirements: [{ type: 'discover', target: 5, current: 0 }]
  },
  {
    id: 'social-butterfly',
    type: 'daily',
    title: 'Papillon social',
    description: 'Partage 3 contenus avec tes amis',
    icon: '🦋',
    difficulty: 'easy',
    xpReward: 75,
    requirements: [{ type: 'share', target: 3, current: 0 }]
  },
  {
    id: 'viral-predictor',
    type: 'daily',
    title: 'Voyant viral',
    description: 'Predit correctement quel contenu va devenir tendance',
    icon: '🔮',
    difficulty: 'medium',
    xpReward: 100,
    badgeReward: 'prophet',
    requirements: [{ type: 'predict', target: 1, current: 0 }]
  },
  {
    id: 'engagement-master',
    type: 'daily',
    title: 'Maitre de l\'engagement',
    description: 'Like et commente 10 contenus tendance',
    icon: '💬',
    difficulty: 'medium',
    xpReward: 100,
    requirements: [
      { type: 'like', target: 10, current: 0 },
      { type: 'comment', target: 5, current: 0 }
    ]
  }
]

// Weekly Challenges - Higher rewards
export const WEEKLY_CHALLENGES: Omit<Challenge, 'participantCount' | 'completionRate'>[] = [
  {
    id: 'streak-warrior',
    type: 'weekly',
    title: 'Streak Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    difficulty: 'hard',
    xpReward: 500,
    badgeReward: 'fire-keeper',
    requirements: [{ type: 'streak', target: 7, current: 0 }]
  },
  {
    id: 'trend-master',
    type: 'weekly',
    title: 'Trend Master',
    description: 'Be among first 100 to discover 10 trends',
    icon: '👑',
    difficulty: 'hard',
    xpReward: 750,
    badgeReward: 'trend-master',
    requirements: [{ type: 'discover', target: 10, current: 0 }]
  },
  {
    id: 'community-champion',
    type: 'weekly',
    title: 'Community Champion',
    description: 'Get 50 likes on your shares',
    icon: '🏆',
    difficulty: 'legendary',
    xpReward: 1000,
    badgeReward: 'community-champion',
    requirements: [{ type: 'like', target: 50, current: 0 }]
  }
]

// Limited Time Events
export const EVENT_CHALLENGES: Omit<Challenge, 'participantCount' | 'completionRate'>[] = [
  {
    id: 'april-madness',
    type: 'event',
    title: 'April Madness',
    description: 'Complete 30 challenges in April',
    icon: '🌸',
    difficulty: 'legendary',
    xpReward: 2000,
    badgeReward: 'april-legend',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-04-30'),
    requirements: [{ type: 'discover', target: 30, current: 0 }]
  }
]

/**
 * Generate shareable challenge result card
 */
export function generateShareableCard(challenge: Challenge, userRank: number, totalParticipants: number): {
  title: string
  text: string
  hashtags: string[]
} {
  const percentile = Math.round((1 - userRank / totalParticipants) * 100)
  
  return {
    title: `${challenge.icon} I completed "${challenge.title}" on ALGO!`,
    text: `I'm in the top ${percentile}% of ${totalParticipants.toLocaleString()} players! Can you beat my score? 🔥`,
    hashtags: ['ALGOChallenge', 'TrendHunter', 'ViralPrediction']
  }
}

/**
 * Calculate challenge difficulty multiplier
 */
export function getDifficultyMultiplier(difficulty: Challenge['difficulty']): number {
  const multipliers = {
    easy: 1,
    medium: 1.5,
    hard: 2,
    legendary: 3
  }
  return multipliers[difficulty]
}

/**
 * Get time remaining for challenge
 */
export function getChallengeTimeRemaining(challenge: Challenge): string {
  if (!challenge.endDate) return 'Permanent'
  
  const now = new Date()
  const end = new Date(challenge.endDate)
  const diff = end.getTime() - now.getTime()
  
  if (diff <= 0) return 'Ended'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h left`
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${minutes}m left`
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(requirements: ChallengeRequirement[]): number {
  const totalTarget = requirements.reduce((sum, r) => sum + r.target, 0)
  const totalCurrent = requirements.reduce((sum, r) => sum + Math.min(r.current, r.target), 0)
  return Math.round((totalCurrent / totalTarget) * 100)
}
