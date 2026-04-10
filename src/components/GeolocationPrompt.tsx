'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MapPin, Globe, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScope } from '@/hooks/useScope'
import { useGeolocation } from '@/hooks/useGeolocation'
import { cn } from '@/lib/utils'

const GEOLOC_PROMPT_KEY = 'algo_geoloc_prompted'
const GEOLOC_PREFERENCE_KEY = 'algo_geoloc_preference'

export function GeolocationPrompt() {
  const { setScope, isLoaded: scopeLoaded } = useScope()
  const { status, requestLocation, suggestedScope } = useGeolocation()
  
  const [showPrompt, setShowPrompt] = useState(false)
  const [showRefusedMessage, setShowRefusedMessage] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  
  const hasUpdatedScopeRef = useRef(false)
  
  useEffect(() => {
    if (!scopeLoaded) return
    
    const hasBeenPrompted = localStorage.getItem(GEOLOC_PROMPT_KEY)
    
    if (!hasBeenPrompted) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [scopeLoaded])
  
  useEffect(() => {
    if (hasUpdatedScopeRef.current) return
    
    if (status === 'granted') {
      hasUpdatedScopeRef.current = true
      if (suggestedScope) {
        setScope(suggestedScope)
      }
      localStorage.setItem(GEOLOC_PREFERENCE_KEY, 'granted')
      setShowPrompt(false)
      setIsRequesting(false)
    } else if (status === 'denied' || status === 'error') {
      hasUpdatedScopeRef.current = true
      setScope({ type: 'global' })
      localStorage.setItem(GEOLOC_PREFERENCE_KEY, 'denied')
      setShowPrompt(false)
      setIsRequesting(false)
      
      if (status === 'denied') {
        setShowRefusedMessage(true)
        setTimeout(() => setShowRefusedMessage(false), 5000)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])
  
  const handleAccept = useCallback(async () => {
    setIsRequesting(true)
    localStorage.setItem(GEOLOC_PROMPT_KEY, '1')
    await requestLocation()
  }, [requestLocation])
  
  const handleRefuse = useCallback(() => {
    localStorage.setItem(GEOLOC_PROMPT_KEY, '1')
    localStorage.setItem(GEOLOC_PREFERENCE_KEY, 'denied')
    setScope({ type: 'global' })
    setShowPrompt(false)
    setShowRefusedMessage(true)
    setTimeout(() => setShowRefusedMessage(false), 5000)
  }, [setScope])
  
  const handleClose = useCallback(() => {
    handleRefuse()
  }, [handleRefuse])

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                "relative w-full max-w-sm p-6 rounded-2xl",
                "bg-[#0d0d15] border border-white/10",
                "shadow-2xl shadow-violet-500/10"
              )}
            >
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Fermer"
              >
                <X size={20} aria-hidden="true" />
              </button>
              
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-violet-400" />
              </div>
              
              <h2 className="text-xl font-bold text-white text-center mb-2">
                Ou es-tu ?
              </h2>
              
              <p className="text-white/60 text-center text-sm mb-6 leading-relaxed">
                Pour te montrer les tendances de ta region
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleAccept}
                  disabled={isRequesting}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                    "bg-gradient-to-r from-violet-500 to-cyan-500",
                    "text-white font-semibold",
                    "hover:opacity-90 transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isRequesting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Detection...</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={18} />
                      <span>Detecter ma position</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleRefuse}
                  disabled={isRequesting}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                    "bg-white/5 hover:bg-white/10 border border-white/10",
                    "text-white/70 hover:text-white font-medium",
                    "transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <Globe size={18} />
                  <span>Rester sur Global</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showRefusedMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              "fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[90]",
              "px-4 py-2.5 rounded-xl",
              "bg-[#0d0d15]/95 border border-white/10",
              "shadow-xl shadow-black/20 backdrop-blur-sm",
              "flex items-center gap-2"
            )}
          >
            <Globe size={16} className="text-white/60 shrink-0" />
            <span className="text-white/70 text-sm">
              Mode Global active
            </span>
            <button
              onClick={() => setShowRefusedMessage(false)}
              className="p-2 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors ml-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
