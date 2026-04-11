import { describe, it, expect, vi } from 'vitest'
import { detectLogAnomalies } from '@/core/observability/anomalies'
import { clearLogs, addLog, getCriticalErrors, getErrorLogs, getLogs, subscribeObservabilityLogs } from '@/core/observability/logStore'
import { computeObservabilityMetrics } from '@/core/observability/metrics'

describe('observability logStore', () => {
  it('addLog / getLogs / clearLogs', () => {
    clearLogs()
    addLog({ layer: 'system', type: 'info', message: 'boot' })
    expect(getLogs().length).toBe(1)
    clearLogs()
    expect(getLogs().length).toBe(0)
  })

  it('getCriticalErrors filtre critical', () => {
    clearLogs()
    addLog({ layer: 'api', type: 'error', message: 'x' })
    addLog({ layer: 'api', type: 'critical', message: 'y' })
    expect(getCriticalErrors().map((l) => l.message)).toContain('y')
    expect(getErrorLogs().length).toBeGreaterThanOrEqual(2)
  })

  it('subscribeObservabilityLogs notifie', () => {
    clearLogs()
    const spy = vi.fn()
    const unsub = subscribeObservabilityLogs(spy)
    addLog({ layer: 'ui', type: 'info', message: 'ping' })
    expect(spy).toHaveBeenCalled()
    unsub()
  })

  it('computeObservabilityMetrics et detectLogAnomalies', () => {
    clearLogs()
    const now = Date.now()
    for (let i = 0; i < 4; i++) {
      addLog({
        layer: 'api',
        type: 'error',
        message: `e${i}`,
        timestamp: now - i * 1000,
      })
    }
    const logs = getLogs()
    const m = computeObservabilityMetrics(logs, 60_000)
    expect(m.totalInWindow).toBeGreaterThanOrEqual(4)
    const anomalies = detectLogAnomalies(logs, 60_000)
    expect(anomalies.some((a) => a.code === 'error_elevated' || a.code === 'error_burst')).toBe(true)
  })
})
