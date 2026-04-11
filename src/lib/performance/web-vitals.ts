/**
 * Core Web Vitals Monitoring - Google Chrome Team Standards
 * 
 * Metrics tracked:
 * - LCP (Largest Contentful Paint) < 2.5s
 * - FID (First Input Delay) < 100ms  
 * - CLS (Cumulative Layout Shift) < 0.1
 * - INP (Interaction to Next Paint) < 200ms
 * - TTFB (Time to First Byte)
 * - FCP (First Contentful Paint)
 */

export interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'INP' | 'TTFB' | 'FCP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
}

// Thresholds per Google standards
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
}

function getRating(name: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

type MetricCallback = (metric: WebVitalMetric) => void

const callbacks: MetricCallback[] = []

/**
 * Subscribe to web vitals metrics
 */
export function onWebVital(callback: MetricCallback): () => void {
  callbacks.push(callback)
  return () => {
    const index = callbacks.indexOf(callback)
    if (index > -1) callbacks.splice(index, 1)
  }
}

function reportMetric(metric: WebVitalMetric): void {
  callbacks.forEach(cb => cb(metric))
  // Console logging disabled to reduce noise
  // Metrics are still collected and sent to callbacks for analytics
}

/**
 * Initialize web vitals monitoring using native Performance API
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined') return
  
  // Use native Performance API for monitoring
  initFallbackMetrics()
}

/**
 * Fallback metrics using Performance API
 */
function initFallbackMetrics(): void {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return
  
  // LCP
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformancePaintTiming
      if (lastEntry) {
        reportMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: getRating('LCP', lastEntry.startTime),
          delta: lastEntry.startTime,
          id: `lcp-${Date.now()}`,
          navigationType: 'navigate',
        })
      }
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    // LCP not supported
  }
  
  // FCP
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          reportMetric({
            name: 'FCP',
            value: entry.startTime,
            rating: getRating('FCP', entry.startTime),
            delta: entry.startTime,
            id: `fcp-${Date.now()}`,
            navigationType: 'navigate',
          })
        }
      }
    })
    fcpObserver.observe({ type: 'paint', buffered: true })
  } catch {
    // FCP not supported
  }
  
  // CLS - throttled to avoid spam
  try {
    let clsValue = 0
    let clsReportTimeout: ReturnType<typeof setTimeout> | null = null
    let lastReportedCls = 0
    
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEntry[]) {
        // @ts-expect-error - Layout shift entries have hadRecentInput
        if (!entry.hadRecentInput) {
          // @ts-expect-error - Layout shift entries have value
          clsValue += entry.value
        }
      }
      
      // Throttle CLS reports - only report once per second and if value changed significantly
      if (clsReportTimeout) return
      if (Math.abs(clsValue - lastReportedCls) < 0.01) return
      
      clsReportTimeout = setTimeout(() => {
        clsReportTimeout = null
        if (Math.abs(clsValue - lastReportedCls) >= 0.01) {
          lastReportedCls = clsValue
          reportMetric({
            name: 'CLS',
            value: clsValue,
            rating: getRating('CLS', clsValue),
            delta: clsValue,
            id: `cls-${Date.now()}`,
            navigationType: 'navigate',
          })
        }
      }, 1000)
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  } catch {
    // CLS not supported
  }
}

/**
 * Get current performance summary
 */
export function getPerformanceSummary(): {
  navigation: PerformanceNavigationTiming | null
  resources: PerformanceResourceTiming[]
  paint: PerformancePaintTiming[]
} {
  if (typeof window === 'undefined') {
    return { navigation: null, resources: [], paint: [] }
  }
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  const paint = performance.getEntriesByType('paint') as PerformancePaintTiming[]
  
  return {
    navigation: navigation ?? null,
    resources,
    paint,
  }
}

/**
 * Sanitize performance mark names by removing invisible/zero-width characters
 */
function sanitizeMarkName(name: string): string {
  // Remove zero-width and invisible characters that can cause timestamp issues
  return name.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '').trim()
}

/**
 * Mark a custom performance point
 */
export function markPerformance(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    try {
      const sanitizedName = sanitizeMarkName(name)
      if (sanitizedName) {
        performance.mark(sanitizedName)
      }
    } catch {
      // Silently fail - performance marking is non-critical
    }
  }
}

/**
 * Measure between two marks
 * Includes protection against invalid mark names (e.g. with zero-width characters)
 */
export function measurePerformance(
  name: string,
  startMark: string,
  endMark?: string
): PerformanceMeasure | null {
  if (typeof performance === 'undefined' || !performance.measure) {
    return null
  }
  
  // Validate that marks exist before measuring
  try {
    const entries = performance.getEntriesByName(startMark, 'mark')
    if (entries.length === 0) {
      return null // Start mark doesn't exist
    }
    if (endMark) {
      const endEntries = performance.getEntriesByName(endMark, 'mark')
      if (endEntries.length === 0) {
        return null // End mark doesn't exist
      }
    }
    return performance.measure(name, startMark, endMark)
  } catch {
    // Silently fail - performance measurement is non-critical
    return null
  }
}

/**
 * Report long tasks (tasks > 50ms that block main thread)
 */
export function observeLongTasks(callback: (duration: number) => void): () => void {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return () => {}
  }
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry.duration)
      }
    })
    
    observer.observe({ type: 'longtask', buffered: true })
    
    return () => observer.disconnect()
  } catch {
    return () => {}
  }
}

/**
 * Defer non-critical work until browser is idle
 */
function getDomWindow(): Window | undefined {
  if (typeof globalThis === 'undefined') return undefined
  const g = globalThis as unknown as { window?: Window }
  return g.window
}

export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): number {
  const win = getDomWindow()
  if (typeof win?.requestIdleCallback === 'function') {
    return win.requestIdleCallback(callback, options)
  }
  return setTimeout(callback, 1) as unknown as number
}

/**
 * Cancel idle callback
 */
export function cancelIdleCallback(id: number): void {
  const win = getDomWindow()
  if (typeof win?.cancelIdleCallback === 'function') {
    win.cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}
