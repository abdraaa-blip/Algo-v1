'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { 
  X, 
  Flame, 
  TrendingUp, 
  Bell,
  Zap,
  Star
} from 'lucide-react'
import { ViralScoreRing } from './ViralScoreRing'
import type { RealTimeTrend } from '@/hooks/useRealTimeTrends'
import {
  requestNotificationPermission,
  getNotificationPermission,
  showBrowserNotification,
  createBuzzAlert,
  storeNotification
} from '@/lib/notifications/push-notifications'

interface BuzzAlertProps {
  trend: RealTimeTrend
  onDismiss: () => void
  onView: (trend: RealTimeTrend) => void
}

export function BuzzAlert({ trend, onDismiss, onView }: BuzzAlertProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss()
    }, 300)
  }, [onDismiss])
  
  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto-dismiss after 10 seconds
    const dismissTimer = setTimeout(() => handleDismiss(), 10000)
    
    return () => {
      clearTimeout(showTimer)
      clearTimeout(dismissTimer)
    }
  }, [handleDismiss])
  
  const handleView = useCallback(() => {
    onView(trend)
    handleDismiss()
  }, [trend, onView, handleDismiss])
  
  return (
    <div
      className={cn(
        'fixed top-20 right-4 z-[9998] max-w-sm w-full',
        'transform transition-all duration-300 ease-out',
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-orange-500/10 via-[#0c0c14] to-[#0f0f1a]',
        'border border-orange-500/30',
        'shadow-xl shadow-orange-500/10',
        'p-4'
      )}>
        {/* Animated glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5 animate-pulse" />
        
        {/* Fire particles */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 animate-pulse" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-500/20">
                <Flame size={18} className="text-orange-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                    Buzz Alert
                  </span>
                  <span className="size-1.5 bg-orange-400 rounded-full animate-ping" />
                </div>
                <p className="text-[10px] text-white/40">Ce signal explose maintenant</p>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex items-center gap-3 mb-3">
            <ViralScoreRing value={trend.score.overall} size="md" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white truncate">{trend.keyword}</h3>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <TrendingUp size={12} className="text-green-400" />
                  {Math.round(trend.avgVelocity)}/h
                </span>
                <span>TIER {trend.score.tier}</span>
                <span>{trend.platforms.length} plateformes</span>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleView}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors"
            >
              <Zap size={14} />
              <span>Voir maintenant</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Notification Center Component ────────────────────────────────────────────

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
    setPermission(getNotificationPermission())
  }, [])
  
  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
  }
  
  if (!isMounted || !isOpen) return null
  
  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-start justify-end p-4 pt-20"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div 
        className={cn(
          'relative w-full max-w-md',
          'bg-gradient-to-br from-[#0c0c14] to-[#0f0f1a]',
          'border border-white/10 rounded-2xl shadow-2xl',
          'overflow-hidden',
          'animate-in slide-in-from-right duration-300'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-violet-400" />
            <h2 className="text-lg font-bold text-white">Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Permission Request */}
        {permission !== 'granted' && (
          <div className="p-4 m-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Bell size={18} className="text-violet-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Active les alertes
                </h3>
                <p className="text-xs text-white/60 mb-3">
                  Reçois une notification quand un buzz explose ou qu&apos;une trend correspond a tes interets.
                </p>
                <button
                  onClick={handleEnableNotifications}
                  disabled={permission === 'denied' || permission === 'unsupported'}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                    permission === 'denied' || permission === 'unsupported'
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-violet-500 hover:bg-violet-400 text-white'
                  )}
                >
                  {permission === 'denied' ? 'Notifications bloquees' : 
                   permission === 'unsupported' ? 'Non supporte' : 
                   'Activer les notifications'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Notification Settings */}
        <div className="p-4 space-y-3">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            Alertes configurees
          </h3>
          
          <NotificationSetting
            icon={Flame}
            title="Buzz Alerts"
            description="Quand un signal explose (Tier S)"
            defaultEnabled
          />
          
          <NotificationSetting
            icon={Star}
            title="Rising Stars"
            description="Quand un artiste/influenceur que tu suis explose"
            defaultEnabled
          />
          
          <NotificationSetting
            icon={TrendingUp}
            title="Trends personnalisees"
            description="Basees sur tes interets et habitudes"
            defaultEnabled
          />
          
          <NotificationSetting
            icon={Zap}
            title="POST NOW Opportunities"
            description="Quand c'est le moment parfait pour poster"
          />
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Notification Setting Component ───────────────────────────────────────────

interface NotificationSettingProps {
  icon: typeof Bell
  title: string
  description: string
  defaultEnabled?: boolean
}

function NotificationSetting({ icon: Icon, title, description, defaultEnabled = false }: NotificationSettingProps) {
  const [enabled, setEnabled] = useState(defaultEnabled)
  
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          enabled ? 'bg-violet-500/20' : 'bg-white/5'
        )}>
          <Icon size={16} className={enabled ? 'text-violet-400' : 'text-white/40'} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-[10px] text-white/40">{description}</p>
        </div>
      </div>
      
      <button
        onClick={() => setEnabled(!enabled)}
        className={cn(
          'relative w-10 h-6 rounded-full transition-colors',
          enabled ? 'bg-violet-500' : 'bg-white/10'
        )}
      >
        <div className={cn(
          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
          enabled ? 'left-5' : 'left-1'
        )} />
      </button>
    </div>
  )
}

// ─── Buzz Alert Manager Hook ──────────────────────────────────────────────────

export function useBuzzAlerts(trends: RealTimeTrend[], enabled: boolean = true) {
  const [alertQueue, setAlertQueue] = useState<RealTimeTrend[]>([])
  const [shownAlerts, setShownAlerts] = useState<Set<string>>(new Set())
  const [currentAlert, setCurrentAlert] = useState<RealTimeTrend | null>(null)
  
  // Check for new buzz-worthy trends
  useEffect(() => {
    if (!enabled) return
    
    const buzzWorthy = trends.filter(t => 
      t.score.tier === 'S' &&
      t.prediction.recommendedAction === 'post_now' &&
      !shownAlerts.has(t.keyword)
    )
    
    if (buzzWorthy.length > 0) {
      setAlertQueue(prev => [...prev, ...buzzWorthy])
      
      // Also send browser notification if permitted
      buzzWorthy.forEach(trend => {
        const notification = createBuzzAlert(trend.keyword, trend.score.overall, trend.avgVelocity)
        storeNotification(notification)
        showBrowserNotification(notification)
      })
    }
  }, [trends, enabled, shownAlerts])
  
  // Process alert queue
  useEffect(() => {
    if (!currentAlert && alertQueue.length > 0) {
      const [next, ...rest] = alertQueue
      setCurrentAlert(next)
      setAlertQueue(rest)
      setShownAlerts(prev => new Set([...prev, next.keyword]))
    }
  }, [alertQueue, currentAlert])
  
  const dismissAlert = useCallback(() => {
    setCurrentAlert(null)
  }, [])
  
  return {
    currentAlert,
    dismissAlert,
    alertCount: alertQueue.length
  }
}
