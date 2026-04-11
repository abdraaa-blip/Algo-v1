'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, Sparkles } from 'lucide-react'
import { Achievement, RARITY_COLORS } from '@/lib/gamification/achievement-system'

interface AchievementUnlockProps {
  achievement: Achievement | null
  onClose: () => void
}

export function AchievementUnlock({ achievement, onClose }: AchievementUnlockProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [sparkleOffsets] = useState(() =>
    Array.from({ length: 20 }).map((_, index) => ({
      key: index,
      x: ((index * 37) % 300) - 150,
      y: ((index * 29) % 100) - 50,
      delay: (index % 5) * 0.1,
      repeatDelay: (index % 4) * 0.5,
    }))
  )
  
  useEffect(() => {
    if (!achievement) return undefined
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 500)
    }, 5000)
    return () => clearTimeout(timer)
  }, [achievement, onClose])
  
  if (!achievement) return null
  
  const colors = RARITY_COLORS[achievement.rarity]
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
        >
          <div className={`relative overflow-hidden rounded-2xl border-2 ${colors.border} ${colors.bg} backdrop-blur-xl p-4 shadow-2xl min-w-[320px]`}>
            {/* Sparkle effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {sparkleOffsets.map((sparkle) => (
                <motion.div
                  key={sparkle.key}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: sparkle.x,
                    y: sparkle.y
                  }}
                  transition={{
                    duration: 1.5,
                    delay: sparkle.delay,
                    repeat: Infinity,
                    repeatDelay: sparkle.repeatDelay
                  }}
                  className="absolute top-1/2 left-1/2"
                >
                  <Sparkles className={`w-3 h-3 ${colors.text}`} />
                </motion.div>
              ))}
            </div>
            
            {/* Content */}
            <div className="relative flex items-center gap-4">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                className={`w-16 h-16 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center text-3xl`}
              >
                {achievement.icon}
              </motion.div>
              
              {/* Text */}
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 mb-1"
                >
                  <Trophy className={`w-4 h-4 ${colors.text}`} />
                  <span className={`text-xs font-medium uppercase tracking-wider ${colors.text}`}>
                    Achievement Unlocked
                  </span>
                </motion.div>
                
                <motion.h3
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg font-bold text-white"
                >
                  {achievement.name}
                </motion.h3>
                
                <motion.p
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-zinc-400"
                >
                  {achievement.description}
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                  className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full ${colors.bg} border ${colors.border}`}
                >
                  <span className={`text-xs font-bold ${colors.text}`}>
                    +{achievement.xpReward} XP
                  </span>
                </motion.div>
              </div>
              
              {/* Close button */}
              <button
                onClick={() => {
                  setIsVisible(false)
                  setTimeout(onClose, 500)
                }}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
            
            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: 'linear' }}
              className={`absolute bottom-0 left-0 right-0 h-1 ${colors.text.replace('text-', 'bg-')} origin-left`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Achievement toast queue manager
export function AchievementToastManager() {
  const [queue, setQueue] = useState<Achievement[]>([])
  const [current, setCurrent] = useState<Achievement | null>(null)
  
  useEffect(() => {
    const handleAchievement = (event: Event) => {
      const customEvent = event as CustomEvent<Achievement>
      setQueue(prev => [...prev, customEvent.detail])
    }
    
    window.addEventListener('achievement-unlocked', handleAchievement)
    return () => window.removeEventListener('achievement-unlocked', handleAchievement)
  }, [])
  
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0])
      setQueue(prev => prev.slice(1))
    }
  }, [current, queue])
  
  return (
    <AchievementUnlock
      achievement={current}
      onClose={() => setCurrent(null)}
    />
  )
}

// Trigger achievement notification
export function triggerAchievementNotification(achievement: Achievement) {
  window.dispatchEvent(
    new CustomEvent('achievement-unlocked', { detail: achievement })
  )
}
