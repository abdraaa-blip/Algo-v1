'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Gift, Star, Zap, Trophy, X, ChevronRight } from 'lucide-react'
import {
  processVisit,
  getLocalStreak,
  saveLocalStreak,
  calculateLevelProgress,
  LEVEL_NAMES,
  type UserStreak,
  type DailyReward,
  type Achievement
} from '@/lib/gamification/streak-system'

interface StreakBannerProps {
  onClose?: () => void
  compact?: boolean
}

export function StreakBanner({ onClose, compact = false }: StreakBannerProps) {
  const [streak, setStreak] = useState<UserStreak | null>(null)
  const [showReward, setShowReward] = useState(false)
  const [reward, setReward] = useState<DailyReward | null>(null)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [comebackBonus, setComebackBonus] = useState(0)
  const [levelUp, setLevelUp] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [celebrationParticles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      initialX: ((i * 37) % 300) - 150,
      animateY: -100 - ((i * 17) % 100),
      animateX: ((i * 53) % 300) - 150,
      delay: i * 0.1,
      color: ['#FF6B00', '#FF4D6D', '#7B61FF', '#00FFB2'][i % 4],
    }))
  )

  useEffect(() => {
    const existing = getLocalStreak()
    const result = processVisit(existing)
    
    setStreak(result.streak)
    saveLocalStreak(result.streak)
    
    if (result.isNewDay && result.rewardClaimed) {
      setReward(result.rewardClaimed)
      setShowReward(true)
      setNewAchievements(result.newAchievements)
      setComebackBonus(result.comebackBonus)
      setLevelUp(result.levelUp)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    setShowReward(false)
    onClose?.()
  }

  if (!streak || dismissed) return null

  const levelProgress = calculateLevelProgress(streak.xp)
  const levelName = LEVEL_NAMES[streak.level - 1] || 'Debutant'

  // Compact version for navbar
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/5 transition-colors"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={() => setShowReward(true)}
      >
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-bold text-white">{streak.currentStreak}</span>
        <div className="w-px h-3 bg-white/10" />
        <span className="text-xs text-white/50">Niv. {streak.level}</span>
      </motion.div>
    )
  }

  return (
    <>
      {/* Main Streak Display */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(255,107,0,0.15) 0%, rgba(255,77,109,0.1) 100%)',
          border: '1px solid rgba(255,107,0,0.3)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Streak Fire */}
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF4D6D 100%)' }}
              >
                <Flame className="w-6 h-6 text-white" />
              </motion.div>
              <span className="absolute -bottom-1 -right-1 text-lg font-black text-white drop-shadow-lg">
                {streak.currentStreak}
              </span>
            </div>

            {/* Streak Info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">
                  {streak.currentStreak} jour{streak.currentStreak > 1 ? 's' : ''} de suite
                </span>
                {streak.currentStreak >= 7 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500/20 text-orange-400">
                    En feu
                  </span>
                )}
              </div>
              <p className="text-sm text-white/50">
                Record: {streak.longestStreak} jours | {streak.totalVisits} visites
              </p>
            </div>
          </div>

          {/* Level Badge */}
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Star className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-bold text-violet-400">{levelName}</span>
            </div>
            <div className="mt-1 w-32 h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress.percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7B61FF, #9F7AEA)' }}
              />
            </div>
            <p className="text-xs text-white/30 mt-0.5">
              {streak.xp} / {levelProgress.current + levelProgress.required} XP
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/40" />
        </button>
      </motion.div>

      {/* Reward Modal */}
      <AnimatePresence>
        {showReward && reward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-3xl p-6 text-center overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {/* Celebration particles */}
              <div className="absolute inset-0 pointer-events-none">
                {celebrationParticles.map((particle) => (
                  <motion.div
                    key={particle.id}
                    initial={{ opacity: 0, y: 0, x: particle.initialX }}
                    animate={{
                      opacity: [0, 1, 0],
                      y: [0, particle.animateY],
                      x: particle.animateX
                    }}
                    transition={{ duration: 2, delay: particle.delay, repeat: Infinity }}
                    className="absolute bottom-0 w-2 h-2 rounded-full"
                    style={{
                      left: '50%',
                      background: particle.color
                    }}
                  />
                ))}
              </div>

              {/* Streak Count */}
              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="relative inline-flex items-center justify-center w-24 h-24 mb-4"
              >
                <div
                  className="absolute inset-0 rounded-full animate-pulse"
                  style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF4D6D 100%)', opacity: 0.3 }}
                />
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF4D6D 100%)' }}
                >
                  <Flame className="w-10 h-10 text-white" />
                </div>
                <span className="absolute -bottom-2 -right-2 text-3xl font-black text-white drop-shadow-lg">
                  {streak.currentStreak}
                </span>
              </motion.div>

              <h2 className="text-2xl font-black text-white mb-2">
                {comebackBonus > 0 ? 'Bon retour!' : `${streak.currentStreak} jour${streak.currentStreak > 1 ? 's' : ''} de suite!`}
              </h2>

              {comebackBonus > 0 && (
                <p className="text-emerald-400 font-bold mb-2">
                  +{comebackBonus} XP bonus de retour
                </p>
              )}

              {/* Reward Display */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="my-6 p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <p className="text-sm text-white/50 mb-2">Recompense du jour {(streak.currentStreak - 1) % 7 + 1}/7</p>
                <div className="flex items-center justify-center gap-3">
                  {reward.type === 'xp' && <Zap className="w-8 h-8 text-yellow-400" />}
                  {reward.type === 'badge' && <Trophy className="w-8 h-8 text-violet-400" />}
                  {reward.type === 'mystery' && <Gift className="w-8 h-8 text-pink-400" />}
                  {reward.type === 'feature' && <Star className="w-8 h-8 text-emerald-400" />}
                  <span className="text-xl font-bold text-white">{reward.label}</span>
                </div>
              </motion.div>

              {/* Level Up */}
              {levelUp && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-4 p-3 rounded-xl bg-violet-500/20 border border-violet-500/30"
                >
                  <p className="text-violet-400 font-bold">
                    Niveau {streak.level} atteint: {levelName}!
                  </p>
                </motion.div>
              )}

              {/* New Achievements */}
              {newAchievements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mb-4"
                >
                  {newAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-2 p-2 rounded-lg mb-2"
                      style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)' }}
                    >
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm text-white">{achievement.name}</span>
                      <span className="text-xs text-yellow-400">+{achievement.xpReward} XP</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDismiss}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #9F7AEA 100%)' }}
              >
                Continuer
                <ChevronRight className="w-5 h-5" />
              </motion.button>

              <p className="text-xs text-white/30 mt-3">
                Reviens demain pour garder ta serie
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
