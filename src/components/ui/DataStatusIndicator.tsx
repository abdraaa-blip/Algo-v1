'use client'

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppScope } from '@/types'
import { getDateLocaleForCountry, getScopeCountryCode, getTimeZoneForCountry } from '@/lib/geo/country-profile'
import {
  DataStatus,
  DATA_STATUS_CONFIG,
  STATUS_COLORS,
  calculateDataStatus,
  formatRelativeTimeFr,
  formatAbsoluteTime,
} from '@/lib/data-freshness'

function getShortTimeZoneLabel(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(new Date())
    return parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone
  } catch {
    return timeZone
  }
}

// =============================================================================
// DATA STATUS INDICATOR
// Unified component for displaying data freshness status across the app
// =============================================================================

interface DataStatusIndicatorProps {
  fetchedAt: Date | string | null
  scope?: AppScope
  source?: string
  hasAutoRefresh?: boolean
  refreshIntervalMs?: number
  onRefresh?: () => void
  isRefreshing?: boolean
  showTimestamp?: boolean
  showTimeZone?: boolean
  variant?: 'badge' | 'pill' | 'minimal' | 'full'
  className?: string
}

export function DataStatusIndicator({
  fetchedAt,
  scope,
  source,
  hasAutoRefresh = false,
  refreshIntervalMs = 0,
  onRefresh,
  isRefreshing = false,
  showTimestamp = true,
  showTimeZone = true,
  variant = 'pill',
  className,
}: DataStatusIndicatorProps) {
  const [status, setStatus] = useState<DataStatus>('loading')
  const [timeDisplay, setTimeDisplay] = useState('')

  const scopeCountryCode = scope ? getScopeCountryCode(scope) : null
  const localeCode = getDateLocaleForCountry(scopeCountryCode)
  const timeZone = getTimeZoneForCountry(scopeCountryCode)
  const timeZoneLabel = timeZone || 'UTC'
  const shortTimeZone = getShortTimeZoneLabel(timeZoneLabel)

  // Parse fetchedAt to Date if string
  const fetchedDate = useMemo(
    () => (fetchedAt ? (typeof fetchedAt === 'string' ? new Date(fetchedAt) : fetchedAt) : null),
    [fetchedAt]
  )

  // Update status and time display
  useEffect(() => {
    const update = () => {
      const newStatus = calculateDataStatus(fetchedDate, hasAutoRefresh, refreshIntervalMs)
      setStatus(newStatus)
      setTimeDisplay(formatRelativeTimeFr(fetchedDate, localeCode))
    }

    update()
    const interval = setInterval(update, 10000) // Update every 10s
    return () => clearInterval(interval)
  }, [fetchedDate, hasAutoRefresh, refreshIntervalMs, localeCode])

  // Override status if refreshing
  const displayStatus = isRefreshing ? 'loading' : status
  const config = DATA_STATUS_CONFIG[displayStatus]
  const colors = STATUS_COLORS[displayStatus]

  // Minimal variant - just a dot
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="relative flex h-2 w-2">
          {displayStatus === 'live' && (
            <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', colors.bg)} />
          )}
          <span className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            colors.bg,
            displayStatus === 'live' && 'animate-pulse'
          )} />
        </span>
      </div>
    )
  }

  // Badge variant - compact label
  if (variant === 'badge') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded border',
        colors.bgSubtle,
        colors.text,
        colors.border,
        className
      )}>
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          colors.bg,
          displayStatus === 'live' && 'animate-pulse'
        )} />
        {config.labelShort}
      </span>
    )
  }

  // Pill variant - with timestamp
  if (variant === 'pill') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full',
        'bg-[var(--color-card)] border border-[var(--color-border)]',
        className
      )}
      title={showTimeZone ? `Fuseau: ${timeZoneLabel}` : undefined}
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {displayStatus === 'live' && (
              <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', colors.bg)} />
            )}
            <span className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              colors.bg,
              displayStatus === 'live' && 'animate-pulse'
            )} />
          </span>
          <span className={cn('text-[10px] font-bold', colors.text)}>
            {config.labelShort}
          </span>
        </div>
        
        {showTimestamp && timeDisplay && (
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {timeDisplay}
          </span>
        )}
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-0.5 rounded hover:bg-[var(--color-card-hover)] transition-colors disabled:opacity-50"
            aria-label="Actualiser"
          >
            <RefreshCw 
              size={10} 
              className={cn('text-[var(--color-text-secondary)]', isRefreshing && 'animate-spin')} 
            />
          </button>
        )}
      </div>
    )
  }

  // Full variant - with all info
  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2 rounded-xl',
      'bg-[var(--color-card)] border border-[var(--color-border)]',
      className
    )}
    title={showTimeZone ? `Fuseau: ${timeZoneLabel}` : undefined}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          {displayStatus === 'live' && (
            <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', colors.bg)} />
          )}
          <span className={cn(
            'relative inline-flex rounded-full h-2.5 w-2.5',
            colors.bg,
            displayStatus === 'live' && 'animate-pulse'
          )} />
        </span>
        
        {displayStatus === 'live' && <Wifi size={14} className={colors.text} />}
        {displayStatus === 'error' && <WifiOff size={14} className={colors.text} />}
        {displayStatus === 'loading' && <RefreshCw size={14} className={cn(colors.text, 'animate-spin')} />}
        {(displayStatus === 'delayed' || displayStatus === 'static') && <Clock size={14} className={colors.text} />}
        
        <span className={cn('text-xs font-semibold', colors.text)}>
          {config.label}
        </span>
      </div>
      
      {showTimestamp && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
          <span>{timeDisplay}</span>
          {fetchedDate && (
            <span className="text-[var(--color-text-muted)]">({formatAbsoluteTime(fetchedDate, localeCode, timeZone)})</span>
          )}
          {showTimeZone && (
            <span className="text-[var(--color-text-muted)]">[{shortTimeZone}]</span>
          )}
        </div>
      )}
      
      {source && (
        <span className="text-[10px] text-[var(--color-text-muted)] px-1.5 py-0.5 rounded bg-[var(--color-card)]">
          {source}
        </span>
      )}
      
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            'p-1.5 rounded-lg',
            'bg-[var(--color-card)] border border-[var(--color-border)]',
            'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)]',
            'transition-all duration-150',
            'disabled:opacity-50'
          )}
          aria-label="Actualiser les données"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  )
}

// =============================================================================
// SECTION HEADER WITH STATUS
// For page sections that show data freshness
// =============================================================================

interface SectionStatusHeaderProps {
  title: string
  subtitle?: string
  fetchedAt: Date | string | null
  source?: string
  hasAutoRefresh?: boolean
  refreshIntervalMs?: number
  onRefresh?: () => void
  isRefreshing?: boolean
  className?: string
  children?: React.ReactNode
}

export function SectionStatusHeader({
  title,
  subtitle,
  fetchedAt,
  source,
  hasAutoRefresh = false,
  refreshIntervalMs = 0,
  onRefresh,
  isRefreshing = false,
  className,
  children,
}: SectionStatusHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-4', className)}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white truncate">{title}</h2>
          <DataStatusIndicator
            fetchedAt={fetchedAt}
            source={source}
            hasAutoRefresh={hasAutoRefresh}
            refreshIntervalMs={refreshIntervalMs}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            variant="badge"
            showTimestamp={false}
          />
        </div>
        {subtitle && (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        {children}
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
              'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)]',
              'hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text-primary)]',
              'transition-all duration-150',
              'disabled:opacity-50'
            )}
            aria-label="Actualiser"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// INLINE STATUS TEXT
// For inline mentions of data freshness
// =============================================================================

interface InlineStatusProps {
  fetchedAt: Date | string | null
  scope?: AppScope
  prefix?: string
  className?: string
}

export function InlineStatus({ fetchedAt, scope, prefix = 'Mis a jour', className }: InlineStatusProps) {
  const [timeDisplay, setTimeDisplay] = useState('')
  const scopeCountryCode = scope ? getScopeCountryCode(scope) : null
  const localeCode = getDateLocaleForCountry(scopeCountryCode)
  
  const fetchedDate = useMemo(
    () => (fetchedAt ? (typeof fetchedAt === 'string' ? new Date(fetchedAt) : fetchedAt) : null),
    [fetchedAt]
  )

  useEffect(() => {
    const update = () => setTimeDisplay(formatRelativeTimeFr(fetchedDate, localeCode))
    update()
    const interval = setInterval(update, 10000)
    return () => clearInterval(interval)
  }, [fetchedDate, localeCode])

  if (!fetchedDate) return null

  return (
    <span className={cn('text-xs text-[var(--color-text-tertiary)]', className)}>
      {prefix} {timeDisplay.toLowerCase()}
    </span>
  )
}
