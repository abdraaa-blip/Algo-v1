'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Globe, MapPin } from 'lucide-react'
import { availableCountries, availableRegions, getCountryName, getRegionName } from '@/data/countries'
import type { AppScope } from '@/types'

interface ScopeSelectorProps {
  scope: AppScope
  onScopeChange: (scope: AppScope) => void
}

export function ScopeSelector({ scope, onScopeChange }: ScopeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Get current display info based on scope type
  const getCurrentDisplay = () => {
    if (scope.type === 'global') {
      return { flag: '🌐', name: 'Global' }
    }
    if (scope.type === 'region') {
      const region = availableRegions.find(r => r.code === scope.code)
      return { flag: region?.flag || '🌍', name: scope.name || region?.name.fr || 'Region' }
    }
    if (scope.type === 'country') {
      const country = availableCountries.find(c => c.code === scope.code)
      return { flag: country?.flag || '🏳️', name: scope.name || country?.name.fr || 'Pays' }
    }
    return { flag: '🌐', name: 'Global' }
  }
  
  const current = getCurrentDisplay()
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (newScope: AppScope) => {
    onScopeChange(newScope)
    setIsOpen(false)
  }

  const isActive = (type: string, code?: string) => {
    if (type === 'global') return scope.type === 'global'
    if (type === 'region') return scope.type === 'region' && scope.code === code
    if (type === 'country') return scope.type === 'country' && scope.code === code
    return false
  }
  
  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all min-h-[44px]"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(240,240,248,0.8)'
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-base">{current.flag}</span>
        <span className="hidden sm:inline text-xs">{current.name}</span>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 py-2 rounded-xl z-50 min-w-[220px] max-h-[400px] overflow-y-auto"
          style={{
            background: '#0d0d1a',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
          }}
          role="listbox"
        >
          {/* Global option */}
          <button
            onClick={() => handleSelect({ type: 'global' })}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/5 ${
              isActive('global') ? 'text-violet-400' : 'text-white/70'
            }`}
            role="option"
            aria-selected={isActive('global')}
          >
            <Globe size={16} />
            <span className="flex-1">Global</span>
            {isActive('global') && <Check size={14} className="text-violet-400" />}
          </button>

          {/* Regions */}
          <div className="border-t border-white/5 mt-1 pt-1">
            <p className="px-4 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={10} />
              Regions
            </p>
            {availableRegions.map(region => {
              const name = getRegionName(region, 'fr')
              const active = isActive('region', region.code)
              return (
                <button
                  key={region.code}
                  onClick={() => handleSelect({ type: 'region', code: region.code, name })}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/5 ${
                    active ? 'text-violet-400' : 'text-white/70'
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  <span className="text-base">{region.flag}</span>
                  <span className="flex-1">{name}</span>
                  {active && <Check size={14} className="text-violet-400" />}
                </button>
              )
            })}
          </div>

          {/* Countries */}
          <div className="border-t border-white/5 mt-1 pt-1">
            <p className="px-4 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-wider">
              Pays
            </p>
            {availableCountries.map(country => {
              const name = getCountryName(country, 'fr')
              const active = isActive('country', country.code)
              return (
                <button
                  key={country.code}
                  onClick={() => handleSelect({ type: 'country', code: country.code, name })}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/5 ${
                    active ? 'text-violet-400' : 'text-white/70'
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  <span className="text-base">{country.flag}</span>
                  <span className="flex-1">{name}</span>
                  {active && <Check size={14} className="text-violet-400" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
