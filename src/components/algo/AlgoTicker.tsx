'use client'

import { useEffect, useState, useMemo } from 'react'
import { useLiveTrends } from '@/hooks/useAlgoData'

interface AlgoTickerProps {
  items?: string[]
}

export function AlgoTicker({ items: propItems }: AlgoTickerProps) {
  const [time, setTime] = useState('')
  const { trends } = useLiveTrends()

  // Extract items from trends or use props
  const items = useMemo(() => {
    if (propItems && propItems.length > 0) return propItems
    if (trends.length > 0) {
      return trends.slice(0, 10).map((t: { title?: string; keyword?: string; name?: string }) => 
        t.title || t.keyword || t.name || 'Tendance'
      )
    }
    return ['Intelligence Artificielle', 'Euro 2026', 'iPhone 17', 'Netflix', 'SpaceX', 'Taylor Swift']
  }, [propItems, trends])

  useEffect(() => {
    // Update time
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  if (items.length === 0) {
    return null
  }

  return (
    <div 
      className="h-7 overflow-hidden flex items-center sticky top-0 z-[201]"
      style={{ 
        background: 'rgba(123,97,255,0.08)',
        borderBottom: '1px solid rgba(123,97,255,0.15)'
      }}
    >
      {/* Trending indicator - honest label */}
      <div 
        className="px-3 mr-3 flex-shrink-0"
        style={{ borderRight: '1px solid rgba(123,97,255,0.3)' }}
      >
        <span 
          className="text-[9px] font-black tracking-[0.15em] uppercase"
          style={{ color: '#F59E0B' }}
        >
          <span className="animate-[live-dot_2s_ease-in-out_infinite] inline-block">●</span> TENDANCES
        </span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden">
        <div 
          className="flex gap-8 whitespace-nowrap animate-[ticker_30s_linear_infinite]"
        >
          {[...items, ...items].map((item, i) => (
            <span 
              key={i} 
              className="text-[11px] font-medium"
              style={{ color: 'rgba(240,240,248,0.5)' }}
            >
              <span style={{ color: '#7B61FF', marginRight: 6 }}>#{(i % items.length) + 1}</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Time */}
      <div 
        className="px-3 flex-shrink-0 text-[9px]"
        style={{ color: 'rgba(240,240,248,0.3)' }}
      >
        {time}
      </div>
    </div>
  )
}
