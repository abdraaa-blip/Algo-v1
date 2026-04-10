'use client'

import { useState } from 'react'
import { 
  Zap, TrendingUp, Bell, Globe, ChevronRight, ChevronLeft,
  Sparkles, Video, Newspaper, Users, Check, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHaptic } from '@/hooks/useHaptic'
import { requestNotificationPermission } from '@/lib/notifications/push-notifications'

interface OnboardingFlowProps {
  onComplete: () => void
}

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to ALGO',
    subtitle: 'The viral radar that sees trends before they explode',
    icon: Zap,
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  {
    id: 'interests',
    title: 'What interests you?',
    subtitle: 'Select topics to personalize your feed',
    icon: Sparkles,
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'notifications',
    title: 'Stay Ahead',
    subtitle: 'Get notified when trends explode',
    icon: Bell,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'region',
    title: 'Your Region',
    subtitle: 'See trends relevant to your location',
    icon: Globe,
    gradient: 'from-emerald-500 to-teal-500',
  },
]

const INTERESTS = [
  { id: 'music', label: 'Music & Artists', icon: Sparkles },
  { id: 'comedy', label: 'Comedy & Memes', icon: Users },
  { id: 'tech', label: 'Tech & Innovation', icon: Zap },
  { id: 'sports', label: 'Sports', icon: TrendingUp },
  { id: 'gaming', label: 'Gaming', icon: Video },
  { id: 'news', label: 'News & Politics', icon: Newspaper },
  { id: 'fashion', label: 'Fashion & Beauty', icon: Sparkles },
  { id: 'food', label: 'Food & Lifestyle', icon: Users },
]

const REGIONS = [
  { id: 'US', label: 'United States', flag: '🇺🇸' },
  { id: 'FR', label: 'France', flag: '🇫🇷' },
  { id: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { id: 'DE', label: 'Germany', flag: '🇩🇪' },
  { id: 'ES', label: 'Spain', flag: '🇪🇸' },
  { id: 'BR', label: 'Brazil', flag: '🇧🇷' },
  { id: 'JP', label: 'Japan', flag: '🇯🇵' },
  { id: 'GLOBAL', label: 'Global', flag: '🌍' },
]

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedRegion, setSelectedRegion] = useState('US')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { trigger } = useHaptic()

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1
  const canProceed = 
    currentStep === 0 || 
    (currentStep === 1 && selectedInterests.length >= 2) ||
    currentStep === 2 ||
    (currentStep === 3 && selectedRegion)

  const handleNext = async () => {
    trigger('medium')
    
    if (isLast) {
      setIsLoading(true)
      
      // Save preferences
      try {
        localStorage.setItem('algo_onboarding_complete', 'true')
        localStorage.setItem('algo_interests', JSON.stringify(selectedInterests))
        localStorage.setItem('algo_region', selectedRegion)
        
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500))
        
        onComplete()
      } catch (error) {
        console.error('Failed to save preferences:', error)
        onComplete()
      }
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    trigger('light')
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  const toggleInterest = (id: string) => {
    trigger('light')
    setSelectedInterests(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleEnableNotifications = async () => {
    trigger('medium')
    const granted = await requestNotificationPermission()
    setNotificationsEnabled(granted)
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        {/* Icon */}
        <div className={cn(
          'size-24 rounded-3xl flex items-center justify-center mb-8',
          'bg-gradient-to-br', step.gradient, 'shadow-2xl',
          'animate-in zoom-in-50 duration-500'
        )}>
          <step.icon size={48} className="text-white" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white text-center mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {step.title}
        </h1>
        <p className="text-white/50 text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          {step.subtitle}
        </p>

        {/* Step content */}
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          {currentStep === 0 && (
            <div className="space-y-4 text-center">
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: TrendingUp, label: 'Real-time trends' },
                  { icon: Sparkles, label: 'AI predictions' },
                  { icon: Bell, label: 'Instant alerts' },
                ].map((feature, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <feature.icon size={24} className="mx-auto mb-2 text-violet-400" />
                    <span className="text-xs text-white/50">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {INTERESTS.map(interest => (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border transition-all',
                    selectedInterests.includes(interest.id)
                      ? 'bg-violet-500/15 border-violet-500/30 text-white'
                      : 'bg-white/3 border-white/5 text-white/60 hover:bg-white/5'
                  )}
                >
                  {selectedInterests.includes(interest.id) ? (
                    <Check size={18} className="text-violet-400" />
                  ) : (
                    <interest.icon size={18} />
                  )}
                  <span className="text-sm font-medium">{interest.label}</span>
                </button>
              ))}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <button
                onClick={handleEnableNotifications}
                disabled={notificationsEnabled}
                className={cn(
                  'w-full p-4 rounded-xl border transition-all flex items-center justify-center gap-3',
                  notificationsEnabled
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-violet-500/15 border-violet-500/30 text-white hover:bg-violet-500/20'
                )}
              >
                {notificationsEnabled ? (
                  <>
                    <Check size={20} />
                    <span className="font-medium">Notifications Enabled</span>
                  </>
                ) : (
                  <>
                    <Bell size={20} />
                    <span className="font-medium">Enable Notifications</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleNext}
                className="w-full text-center text-sm text-white/30 hover:text-white/50"
              >
                Skip for now
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
              {REGIONS.map(region => (
                <button
                  key={region.id}
                  onClick={() => {
                    trigger('light')
                    setSelectedRegion(region.id)
                  }}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border transition-all',
                    selectedRegion === region.id
                      ? 'bg-violet-500/15 border-violet-500/30 text-white'
                      : 'bg-white/3 border-white/5 text-white/60 hover:bg-white/5'
                  )}
                >
                  <span className="text-2xl">{region.flag}</span>
                  <span className="text-sm font-medium">{region.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-white/5">
        <div className="flex gap-4 max-w-md mx-auto">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={!canProceed || isLoading}
            className={cn(
              'flex-1 py-3 rounded-xl font-semibold transition-all',
              'flex items-center justify-center gap-2',
              canProceed
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {isLast ? 'Get Started' : 'Continue'}
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
        
        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'size-2 rounded-full transition-all',
                i === currentStep ? 'bg-violet-500 w-6' : 'bg-white/10'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
