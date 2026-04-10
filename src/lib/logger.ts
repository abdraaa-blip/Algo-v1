/**
 * ALGO Global Logger
 * Structured logging with levels, context, and error tracking
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: Error
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Minimum log level based on environment
const MIN_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

/**
 * Format log entry for console output
 */
function formatLog(entry: LogEntry): string {
  const prefix = `[ALGO ${entry.level.toUpperCase()}]`
  const timestamp = entry.timestamp
  let message = `${prefix} ${timestamp} - ${entry.message}`
  
  if (entry.context) {
    message += ` | ${JSON.stringify(entry.context)}`
  }
  
  return message
}

/**
 * Send log to remote logging service (in production)
 */
async function sendToRemote(entry: LogEntry): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return
  if (typeof window === 'undefined') return
  
  try {
    await fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...entry,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    })
  } catch {
    // Silent fail - don't break app for logging
  }
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
  if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LEVEL]) return

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error,
  }

  // Console output
  const formatted = formatLog(entry)
  switch (level) {
    case 'debug':
      console.debug(formatted)
      break
    case 'info':
      console.info(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'error':
      console.error(formatted, error)
      break
  }

  // Send errors to remote
  if (level === 'error') {
    sendToRemote(entry)
  }
}

/**
 * Logger API
 */
export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, error?: Error, context?: Record<string, unknown>) => log('error', message, context, error),
  
  /**
   * Create a child logger with preset context
   */
  child: (baseContext: Record<string, unknown>) => ({
    debug: (message: string, context?: Record<string, unknown>) => 
      log('debug', message, { ...baseContext, ...context }),
    info: (message: string, context?: Record<string, unknown>) => 
      log('info', message, { ...baseContext, ...context }),
    warn: (message: string, context?: Record<string, unknown>) => 
      log('warn', message, { ...baseContext, ...context }),
    error: (message: string, error?: Error, context?: Record<string, unknown>) => 
      log('error', message, { ...baseContext, ...context }, error),
  }),

  /**
   * Performance timing helper
   */
  time: (label: string) => {
    const start = performance.now()
    return {
      end: (context?: Record<string, unknown>) => {
        const duration = performance.now() - start
        log('debug', `${label} completed`, { ...context, duration: `${duration.toFixed(2)}ms` })
        return duration
      },
    }
  },
}

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason, {
      type: 'unhandledrejection',
    })
  })

  // Global errors
  window.addEventListener('error', (event) => {
    logger.error('Global error', event.error, {
      type: 'error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })
}
