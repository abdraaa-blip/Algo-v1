'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, Crown, TrendingUp, Flame, Star, ChevronRight } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  username: string
  avatar?: string
  xp: number
  level: number
  streak: number
  achievements: number
  change: number // rank change from yesterday
}

// Mock leaderboard data (in production, fetch from API)
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: 'TrendMaster', xp: 45000, level: 10, streak: 156, achievements: 24, change: 0 },
  { rank: 2, username: 'ViralHunter', xp: 38500, level: 9, streak: 89, achievements: 21, change: 2 },
  { rank: 3, username: 'AlgoKing', xp: 32000, level: 8, streak: 67, achievements: 19, change: -1 },
  { rank: 4, username: 'SignalSniper', xp: 28500, level: 8, streak: 45, achievements: 17, change: 1 },
  { rank: 5, username: 'TrendOracle', xp: 25000, level: 7, streak: 34, achievements: 15, change: -2 },
  { rank: 6, username: 'DataWizard', xp: 22000, level: 7, streak: 28, achievements: 14, change: 3 },
  { rank: 7, username: 'ViralVision', xp: 19500, level: 6, streak: 21, achievements: 12, change: 0 },
  { rank: 8, username: 'SpotterPro', xp: 17000, level: 6, streak: 18, achievements: 11, change: -1 },
  { rank: 9, username: 'TrendSeeker', xp: 15000, level: 5, streak: 14, achievements: 10, change: 4 },
  { rank: 10, username: 'AlgoNinja', xp: 13500, level: 5, streak: 12, achievements: 9, change: -2 },
]

interface LeaderboardProps {
  compact?: boolean
  showTopN?: number
}

export function Leaderboard({ compact = false, showTopN = 10 }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'allTime'>('weekly')
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Simulate API fetch
    setIsLoading(true)
    setTimeout(() => {
      setEntries(MOCK_LEADERBOARD.slice(0, showTopN))
      setIsLoading(false)
    }, 500)
  }, [timeframe, showTopN])
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-amber-400" />
      case 2: return <Medal className="w-5 h-5 text-zinc-400" />
      case 3: return <Medal className="w-5 h-5 text-amber-700" />
      default: return <span className="text-sm font-bold text-zinc-500">#{rank}</span>
    }
  }
  
  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-amber-900/30 to-amber-800/10 border-amber-500/30'
      case 2: return 'bg-gradient-to-r from-zinc-800/50 to-zinc-700/20 border-zinc-500/30'
      case 3: return 'bg-gradient-to-r from-amber-950/30 to-amber-900/10 border-amber-700/30'
      default: return 'bg-zinc-900/50 border-zinc-800/50'
    }
  }
  
  if (compact) {
    return (
      <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white">Leaderboard</h3>
          </div>
          <button className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="space-y-2">
          {entries.slice(0, 5).map((entry, index) => (
            <motion.div
              key={entry.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-2 rounded-lg ${getRankBg(entry.rank)} border`}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(entry.rank)}
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
                {entry.username.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{entry.username}</p>
                <p className="text-xs text-zinc-500">{entry.xp.toLocaleString()} XP</p>
              </div>
              {entry.change !== 0 && (
                <div className={`flex items-center gap-0.5 text-xs ${entry.change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <TrendingUp className={`w-3 h-3 ${entry.change < 0 ? 'rotate-180' : ''}`} />
                  {Math.abs(entry.change)}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Leaderboard</h2>
          </div>
        </div>
        
        {/* Timeframe tabs */}
        <div className="flex gap-2">
          {(['daily', 'weekly', 'allTime'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeframe === tf
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tf === 'daily' ? 'Today' : tf === 'weekly' ? 'This Week' : 'All Time'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Entries */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-zinc-800/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.username}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-4 p-3 rounded-xl ${getRankBg(entry.rank)} border transition-transform hover:scale-[1.02]`}
                >
                  {/* Rank */}
                  <div className="w-10 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-lg font-bold text-white">
                      {entry.username.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 border-2 border-violet-500 flex items-center justify-center text-[10px] font-bold text-white">
                      {entry.level}
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{entry.username}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {entry.xp.toLocaleString()} XP
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {entry.streak} days
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {entry.achievements}
                      </span>
                    </div>
                  </div>
                  
                  {/* Rank change */}
                  {entry.change !== 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      entry.change > 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      <TrendingUp className={`w-3 h-3 ${entry.change < 0 ? 'rotate-180' : ''}`} />
                      {Math.abs(entry.change)}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
