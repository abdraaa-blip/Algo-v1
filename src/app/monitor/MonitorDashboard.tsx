'use client'

import { useState, useEffect } from 'react'
import { Activity, Database, Radio, Shield, Zap, Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useAlgoMetrics, useAutonomyMetrics } from '@/hooks/useAlgoSystem'
import { cn } from '@/lib/utils'

/**
 * Developer-only monitoring dashboard
 * Shows real-time status of all ALGO systems
 */
export function MonitorDashboard() {
  const metrics = useAlgoMetrics()
  const autonomy = useAutonomyMetrics()
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [opsAlerts, setOpsAlerts] = useState<Array<{
    id: string
    domain: 'autonomy' | 'learning' | 'resilience'
    severity: 'low' | 'medium' | 'high'
    message: string
  }>>([])
  const [circuitSummary, setCircuitSummary] = useState<{
    total: number
    open: string[]
  }>({ total: 0, open: [] })

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const updateOps = async () => {
      try {
        const res = await fetch('/api/intelligence/ops-alerts', { cache: 'no-store' })
        const json = await res.json() as {
          success: boolean
          alerts?: Array<{
            id: string
            domain: 'autonomy' | 'learning' | 'resilience'
            severity: 'low' | 'medium' | 'high'
            message: string
          }>
          resilience?: { totalCircuits: number; openCircuits: string[] }
        }
        if (json.success) {
          setOpsAlerts(Array.isArray(json.alerts) ? json.alerts : [])
          setCircuitSummary({
            total: json.resilience?.totalCircuits || 0,
            open: Array.isArray(json.resilience?.openCircuits) ? json.resilience!.openCircuits : [],
          })
        }
      } catch {
        // silent
      }
    }
    void updateOps()
    const interval = setInterval(() => void updateOps(), 10000)
    return () => clearInterval(interval)
  }, [])

  if (!metrics) {
    return (
      <div className="min-h-screen bg-[#030014] text-white flex items-center justify-center">
        <div className="animate-pulse">Initializing ALGO Monitor...</div>
      </div>
    )
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
  }

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${hours}h ${minutes}m ${seconds}s`
  }

  return (
    <div className="min-h-screen bg-[#030014] text-white p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-violet-400" size={32} />
            <div>
              <h1 className="text-2xl font-black">ALGO Monitor</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">System Nervous Dashboard</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--color-text-muted)]">Last Update</div>
            <div className="font-mono text-sm">{lastUpdate.toLocaleTimeString()}</div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Orchestrator Status */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-yellow-400" size={20} />
            <h2 className="font-bold">Orchestrator</h2>
            <div className={cn(
              'ml-auto size-3 rounded-full',
              metrics.orchestrator.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            )} />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Uptime</span>
              <span className="font-mono">{formatUptime(metrics.orchestrator.uptime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Total Fetches</span>
              <span className="font-mono">{metrics.orchestrator.totalFetches}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Success Rate</span>
              <span className={cn(
                'font-mono',
                metrics.orchestrator.totalFetches > 0 && 
                metrics.orchestrator.successfulFetches / metrics.orchestrator.totalFetches > 0.9 
                  ? 'text-green-400' : 'text-yellow-400'
              )}>
                {metrics.orchestrator.totalFetches > 0 
                  ? `${Math.round(metrics.orchestrator.successfulFetches / metrics.orchestrator.totalFetches * 100)}%`
                  : 'N/A'}
              </span>
            </div>
            
            {/* Next Ticks */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">Next Refresh</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(metrics.orchestrator.nextTicks).map(([source, ms]) => (
                  <div key={source} className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">{source}</span>
                    <span className="font-mono">{formatTime(ms as number)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cache Status */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Database className="text-blue-400" size={20} />
            <h2 className="font-bold">Cache</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Total Entries</span>
              <span className="font-mono">{metrics.cache.totalEntries}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Hit Rate</span>
              <span className={cn(
                'font-mono',
                metrics.cache.hitRate > 0.7 ? 'text-green-400' : 'text-yellow-400'
              )}>
                {Math.round(metrics.cache.hitRate * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Hits / Misses</span>
              <span className="font-mono">{metrics.cache.hits} / {metrics.cache.misses}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Stale Hits</span>
              <span className="font-mono text-yellow-400">{metrics.cache.staleHits}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Evictions</span>
              <span className="font-mono">{metrics.cache.evictions}</span>
            </div>
            
            {/* Entries per source */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">Entries by Source</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(metrics.cache.entriesPerSource).map(([source, count]) => (
                  <div key={source} className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">{source}</span>
                    <span className="font-mono">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Event Bus */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="text-purple-400" size={20} />
            <h2 className="font-bold">Event Bus</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Events Published</span>
              <span className="font-mono">{metrics.eventBus.eventsPublished}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Events Delivered</span>
              <span className="font-mono">{metrics.eventBus.eventsDelivered}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Subscribers</span>
              <span className="font-mono">{metrics.eventBus.subscriberCount}</span>
            </div>
            
            {/* Recent Events */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">Recent Events</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {metrics.eventBus.recentEvents.slice(-5).reverse().map((event, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-[var(--color-text-secondary)] truncate">{event.event}</span>
                    <span className="font-mono text-[var(--color-text-muted)]">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Coherence Guard */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-green-400" size={20} />
            <h2 className="font-bold">Coherence Guard</h2>
            <div className={cn(
              'ml-auto size-3 rounded-full',
              metrics.coherence.isRunning ? 'bg-green-500' : 'bg-red-500'
            )} />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Checks Performed</span>
              <span className="font-mono">{metrics.coherence.checksPerformed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Inconsistencies</span>
              <span className={cn(
                'font-mono',
                metrics.coherence.inconsistenciesDetected > 0 ? 'text-yellow-400' : 'text-green-400'
              )}>
                {metrics.coherence.inconsistenciesDetected}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Auto Fixes</span>
              <span className="font-mono">{metrics.coherence.autoFixes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Self Heals</span>
              <span className="font-mono">{metrics.coherence.selfHeals}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Tracked Components</span>
              <span className="font-mono">{metrics.coherence.trackedComponents}</span>
            </div>
            
            {/* Check Results */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">Check Status</div>
              <div className="space-y-1">
                {Object.entries(metrics.coherence.checks).map(([name, check]) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-secondary)]">{name}</span>
                    <div className={cn(
                      'size-2 rounded-full',
                      (check as { lastResult: string }).lastResult === 'pass' ? 'bg-green-500' :
                      (check as { lastResult: string }).lastResult === 'fail' ? 'bg-red-500' : 'bg-gray-500'
                    )} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Optimizer */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="text-cyan-400" size={20} />
            <h2 className="font-bold">Performance</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Prefetches</span>
              <span className="font-mono">{metrics.performance.prefetchesPerformed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Prefetch Hits</span>
              <span className="font-mono">{metrics.performance.prefetchHits}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Hit Rate</span>
              <span className={cn(
                'font-mono',
                metrics.performance.prefetchHitRate > 0.5 ? 'text-green-400' : 'text-[var(--color-text-secondary)]'
              )}>
                {Math.round(metrics.performance.prefetchHitRate * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Refresh Pauses</span>
              <span className="font-mono">{metrics.performance.adaptiveRefreshPauses}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Tracked Patterns</span>
              <span className="font-mono">{metrics.performance.trackedPatterns}</span>
            </div>
            
            {/* Connection Quality */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2 text-sm">
                {metrics.performance.connectionQuality.type === 'fast' ? (
                  <Wifi className="text-green-400" size={16} />
                ) : metrics.performance.connectionQuality.type === 'medium' ? (
                  <Wifi className="text-yellow-400" size={16} />
                ) : (
                  <WifiOff className="text-red-400" size={16} />
                )}
                <span className="text-[var(--color-text-secondary)]">Connection</span>
                <span className="ml-auto font-mono">
                  {metrics.performance.connectionQuality.effectiveType} 
                  ({metrics.performance.connectionQuality.type})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-orange-400" size={20} />
            <h2 className="font-bold">System Status</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'size-4 rounded-full',
                metrics.orchestrator.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              )} />
              <span>Orchestrator</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                'size-4 rounded-full',
                metrics.coherence.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              )} />
              <span>Coherence Guard</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-4 rounded-full bg-green-500 animate-pulse" />
              <span>Event Bus</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                'size-4 rounded-full',
                !metrics.performance.isInBackground ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              )} />
              <span>Performance Optimizer</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
            <div className="text-xs text-[var(--color-text-muted)] mb-2">Current Page</div>
            <div className="font-mono text-sm">{metrics.performance.currentPage}</div>
          </div>
        </div>

        {/* Autonomy Metrics */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-cyan-400" size={20} />
            <h2 className="font-bold">Autonomy</h2>
          </div>
          {!autonomy ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Loading autonomy telemetry...</p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Mode</span><span className="font-mono">{autonomy.mode}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Kill-switch</span><span className={autonomy.killSwitch ? 'text-rose-300 font-mono' : 'text-emerald-300 font-mono'}>{autonomy.killSwitch ? 'ON' : 'OFF'}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Auto Executed</span><span className="font-mono">{autonomy.counters.autoExecuted}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Approval Required</span><span className="font-mono">{autonomy.counters.approvalRequired}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Approval Denied</span><span className="font-mono">{autonomy.counters.approvalDenied}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Sim Runs</span><span className="font-mono">{autonomy.counters.simRuns}</span></div>
            </div>
          )}
        </div>

        {/* SRE Alerts */}
        <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] shadow-[var(--shadow-algo-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-amber-400" size={20} />
            <h2 className="font-bold">SRE Mode</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Circuit breakers</span>
              <span className="font-mono">{circuitSummary.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Open circuits</span>
              <span className={cn('font-mono', circuitSummary.open.length > 0 ? 'text-rose-300' : 'text-emerald-300')}>
                {circuitSummary.open.length}
              </span>
            </div>
            <div className="pt-2 border-t border-[var(--color-border)] space-y-1">
              {opsAlerts.length === 0 ? (
                <p className="text-xs text-emerald-300">No active ops alert</p>
              ) : (
                opsAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="text-xs">
                    <p
                      className={cn(
                        'font-semibold',
                        alert.severity === 'high' && 'text-rose-300',
                        alert.severity === 'medium' && 'text-amber-300',
                        alert.severity === 'low' && 'text-emerald-300'
                      )}
                    >
                      [{alert.domain}] {alert.severity}
                    </p>
                    <p className="text-[var(--color-text-secondary)]">{alert.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
        ALGO Nervous System Monitor - Development Only
      </footer>
    </div>
  )
}
