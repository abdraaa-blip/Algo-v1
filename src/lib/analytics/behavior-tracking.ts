'use client'

// User Behavior Tracking for ALGO
// Tracks interactions to improve recommendations and detect trending content

export interface UserEvent {
  type: string
  data: Record<string, unknown>
  timestamp: number
  sessionId: string
}

export interface ContentInteraction {
  contentId: string
  contentType: 'trend' | 'video' | 'news' | 'star'
  action: 'view' | 'click' | 'share' | 'save' | 'like' | 'comment' | 'dwell'
  duration?: number // Time spent in ms
  position?: number // Position in list
  source?: string // Where did they come from
}

const STORAGE_KEY = 'algo_user_events'
const SESSION_KEY = 'algo_session_id'
const MAX_STORED_EVENTS = 500
const SYNC_INTERVAL = 30000 // 30 seconds

let sessionId: string | null = null
let eventQueue: UserEvent[] = []
let syncTimer: ReturnType<typeof setTimeout> | null = null

// Initialize tracking
export function initTracking() {
  if (typeof window === 'undefined') return

  sessionId = getOrCreateSessionId()
  loadStoredEvents()
  startSyncTimer()

  // Track page visibility
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      syncEvents()
    }
  })

  // Sync before page unload
  window.addEventListener('beforeunload', () => {
    syncEvents()
  })
}

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function loadStoredEvents() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      eventQueue = JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load stored events:', error)
    eventQueue = []
  }
}

function saveEvents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventQueue.slice(-MAX_STORED_EVENTS)))
  } catch (error) {
    console.error('Failed to save events:', error)
  }
}

function startSyncTimer() {
  if (syncTimer) clearInterval(syncTimer)
  syncTimer = setInterval(syncEvents, SYNC_INTERVAL)
}

// Sync events to server
async function syncEvents() {
  if (eventQueue.length === 0) return

  const eventsToSync = [...eventQueue]
  
  try {
    const response = await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: eventsToSync }),
    })

    if (response.ok) {
      // Remove synced events
      eventQueue = eventQueue.filter(e => !eventsToSync.includes(e))
      saveEvents()
    }
  } catch (error) {
    console.error('Failed to sync events:', error)
  }
}

// Track a user event
export function track(type: string, data: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return

  const event: UserEvent = {
    type,
    data: {
      ...data,
      url: window.location.pathname,
      referrer: document.referrer,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    },
    timestamp: Date.now(),
    sessionId: sessionId || 'unknown',
  }

  eventQueue.push(event)
  saveEvents()

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[ALGO Track]', type, data)
  }
}

// Track content interaction
export function trackContent(interaction: ContentInteraction) {
  track('content_interaction', interaction as unknown as Record<string, unknown>)
  
  // Update user preferences based on interaction
  updatePreferences(interaction)
}

// Track page view
export function trackPageView(page: string, properties: Record<string, unknown> = {}) {
  track('page_view', { page, ...properties })
}

// Track search
export function trackSearch(query: string, resultsCount: number, filters?: Record<string, unknown>) {
  track('search', { query, resultsCount, filters })
}

// Track error
export function trackError(error: Error, context?: Record<string, unknown>) {
  track('error', {
    message: error.message,
    stack: error.stack,
    ...context,
  })
}

// User preferences based on behavior
const PREFS_KEY = 'algo_user_preferences'

interface UserPreferences {
  topCategories: Record<string, number> // category -> score
  topPlatforms: Record<string, number>
  avgDwellTime: number
  contentCount: number
  lastUpdated: number
}

function updatePreferences(interaction: ContentInteraction) {
  try {
    const stored = localStorage.getItem(PREFS_KEY)
    const prefs: UserPreferences = stored ? JSON.parse(stored) : {
      topCategories: {},
      topPlatforms: {},
      avgDwellTime: 0,
      contentCount: 0,
      lastUpdated: Date.now(),
    }

    // Update content count
    prefs.contentCount++

    // Update dwell time average
    if (interaction.duration) {
      prefs.avgDwellTime = (prefs.avgDwellTime * (prefs.contentCount - 1) + interaction.duration) / prefs.contentCount
    }

    // Update category scores (decay old scores)
    const category = interaction.contentType
    const actionScore = getActionScore(interaction.action)
    prefs.topCategories[category] = (prefs.topCategories[category] || 0) * 0.95 + actionScore

    prefs.lastUpdated = Date.now()
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch (error) {
    console.error('Failed to update preferences:', error)
  }
}

function getActionScore(action: ContentInteraction['action']): number {
  const scores: Record<string, number> = {
    view: 1,
    click: 2,
    dwell: 3,
    like: 5,
    comment: 7,
    save: 8,
    share: 10,
  }
  return scores[action] || 1
}

// Get user preferences
export function getUserPreferences(): UserPreferences | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(PREFS_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Get top interests based on behavior
export function getTopInterests(limit = 5): string[] {
  const prefs = getUserPreferences()
  if (!prefs) return []

  return Object.entries(prefs.topCategories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([category]) => category)
}
