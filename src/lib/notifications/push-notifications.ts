// Push Notification System for ALGO
// Handles browser notifications and in-app alerts

export interface AlgoNotification {
  id: string
  type: 'buzz_alert' | 'trend_explosion' | 'star_rising' | 'personalized' | 'breaking_news'
  title: string
  body: string
  icon?: string
  data?: {
    trendId?: string
    keyword?: string
    score?: number
    url?: string
  }
  timestamp: number
  read: boolean
}

// Check if notifications are supported
export function areNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!areNotificationsSupported()) {
    return 'denied'
  }
  
  const permission = await Notification.requestPermission()
  
  if (permission === 'granted') {
    // Register service worker for push notifications
    await registerServiceWorker()
  }
  
  return permission
}

// Check current permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!areNotificationsSupported()) {
    return 'unsupported'
  }
  return Notification.permission
}

// Register service worker
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return registration
  } catch (error) {
    console.error('[ALGO] Service worker registration failed:', error)
    return null
  }
}

// Show a browser notification
export async function showBrowserNotification(notification: AlgoNotification): Promise<boolean> {
  if (getNotificationPermission() !== 'granted') {
    return false
  }
  
  try {
    const registration = await navigator.serviceWorker.ready
    
    await registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/icon-192.png',
      badge: '/badge-72.png',
      tag: notification.id,
      data: notification.data,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'view', title: 'Voir' },
        { action: 'dismiss', title: 'Ignorer' }
      ]
    })
    
    return true
  } catch (error) {
    // Fallback to basic Notification API
    try {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icon-192.png',
        tag: notification.id
      })
      return true
    } catch {
      console.error('[ALGO] Notification failed:', error)
      return false
    }
  }
}

// Notification types with templates
export function createBuzzAlert(keyword: string, score: number, velocity: number): AlgoNotification {
  return {
    id: `buzz-${keyword}-${Date.now()}`,
    type: 'buzz_alert',
    title: '🔥 Buzz Alert!',
    body: `"${keyword}" explose avec un score de ${score} et ${Math.round(velocity)}/h de velocite`,
    data: { keyword, score, url: `/trends?q=${encodeURIComponent(keyword)}` },
    timestamp: Date.now(),
    read: false
  }
}

export function createTrendExplosion(keyword: string, tier: string, platforms: string[]): AlgoNotification {
  return {
    id: `explosion-${keyword}-${Date.now()}`,
    type: 'trend_explosion',
    title: `⚡ TIER ${tier} - ${keyword}`,
    body: `Ce signal explose sur ${platforms.join(', ')}. Action recommandee: POST NOW`,
    data: { keyword, url: `/trends?q=${encodeURIComponent(keyword)}` },
    timestamp: Date.now(),
    read: false
  }
}

export function createStarRisingAlert(starName: string, category: string, growth: number): AlgoNotification {
  return {
    id: `star-${starName}-${Date.now()}`,
    type: 'star_rising',
    title: '⭐ Rising Star',
    body: `${starName} (${category}) explose avec +${growth}% de croissance en 24h`,
    data: { url: `/rising-stars?star=${encodeURIComponent(starName)}` },
    timestamp: Date.now(),
    read: false
  }
}

export function createPersonalizedAlert(keyword: string, reason: string): AlgoNotification {
  return {
    id: `personalized-${keyword}-${Date.now()}`,
    type: 'personalized',
    title: '🎯 Pour toi',
    body: `"${keyword}" ${reason}`,
    data: { keyword, url: `/trends?q=${encodeURIComponent(keyword)}` },
    timestamp: Date.now(),
    read: false
  }
}

export function createBreakingNewsAlert(headline: string, importance: number): AlgoNotification {
  return {
    id: `news-${Date.now()}`,
    type: 'breaking_news',
    title: '📰 Breaking',
    body: headline,
    data: { score: importance, url: '/news' },
    timestamp: Date.now(),
    read: false
  }
}

// Local storage for notification history
const NOTIFICATION_STORAGE_KEY = 'algo_notifications'
const MAX_STORED_NOTIFICATIONS = 100

export function getStoredNotifications(): AlgoNotification[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function storeNotification(notification: AlgoNotification): void {
  if (typeof window === 'undefined') return
  
  try {
    const notifications = getStoredNotifications()
    notifications.unshift(notification)
    
    // Keep only the most recent notifications
    const trimmed = notifications.slice(0, MAX_STORED_NOTIFICATIONS)
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error('[ALGO] Failed to store notification:', error)
  }
}

export function markNotificationRead(id: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const notifications = getStoredNotifications()
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    )
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('[ALGO] Failed to mark notification as read:', error)
  }
}

export function clearAllNotifications(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(NOTIFICATION_STORAGE_KEY)
}

export function getUnreadCount(): number {
  return getStoredNotifications().filter(n => !n.read).length
}
