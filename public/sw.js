/**
 * ALGO Service Worker v2
 * Production-grade offline support, caching, and background sync
 */

const CACHE_VERSION = 'v2'
const STATIC_CACHE = `algo-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `algo-dynamic-${CACHE_VERSION}`
const API_CACHE = `algo-api-${CACHE_VERSION}`
const OFFLINE_URL = '/offline'

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
]

// API routes with cache config (TTL in seconds)
const API_CACHE_CONFIG = {
  '/api/live-trends': { ttl: 60, staleWhileRevalidate: true },
  '/api/live-news': { ttl: 120, staleWhileRevalidate: true },
  '/api/live-movies': { ttl: 300, staleWhileRevalidate: true },
  '/api/live-music': { ttl: 300, staleWhileRevalidate: true },
  '/api/live-videos': { ttl: 60, staleWhileRevalidate: true },
  '/api/live-stars': { ttl: 300, staleWhileRevalidate: true },
  '/api/youtube': { ttl: 120, staleWhileRevalidate: true },
}

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('algo-') && 
                   name !== STATIC_CACHE && 
                   name !== DYNAMIC_CACHE && 
                   name !== API_CACHE
          })
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - smart caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests
  if (request.method !== 'GET') return

  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // API requests - Stale while revalidate with TTL
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request, url))
    return
  }

  // Static assets - Cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Pages - Network first with cache fallback
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request))
  }
})

// Handle API requests with smart caching
async function handleApiRequest(request, url) {
  const cacheConfig = Object.entries(API_CACHE_CONFIG).find(([path]) => 
    url.pathname.startsWith(path)
  )?.[1]

  if (!cacheConfig) {
    // No cache config - just fetch
    return fetch(request)
  }

  const cache = await caches.open(API_CACHE)
  const cacheKey = request.url

  // Check cache first
  const cachedResponse = await cache.match(cacheKey)
  
  if (cachedResponse) {
    const cachedTime = cachedResponse.headers.get('sw-cached-at')
    const age = cachedTime ? (Date.now() - parseInt(cachedTime)) / 1000 : Infinity
    
    // If cache is fresh, return it
    if (age < cacheConfig.ttl) {
      // Background revalidate if stale-while-revalidate is enabled
      if (cacheConfig.staleWhileRevalidate && age > cacheConfig.ttl / 2) {
        fetchAndCache(request, cache, cacheKey)
      }
      return cachedResponse
    }
    
    // Cache is stale but we can use stale-while-revalidate
    if (cacheConfig.staleWhileRevalidate) {
      fetchAndCache(request, cache, cacheKey)
      return cachedResponse
    }
  }

  // No valid cache, fetch from network
  try {
    return await fetchAndCache(request, cache, cacheKey)
  } catch (error) {
    // Network failed, return stale cache if available
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline JSON
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'You are offline',
        cached: false 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Fetch and cache with timestamp
async function fetchAndCache(request, cache, cacheKey) {
  const response = await fetch(request)
  
  if (response.ok) {
    const responseToCache = response.clone()
    const headers = new Headers(responseToCache.headers)
    headers.set('sw-cached-at', Date.now().toString())
    
    const body = await responseToCache.blob()
    const cachedResponse = new Response(body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers
    })
    
    cache.put(cacheKey, cachedResponse)
  }
  
  return response
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    const cache = await caches.open(cacheName)
    cache.put(request, networkResponse.clone())
    return networkResponse
  } catch (error) {
    return new Response('Offline', { status: 503 })
  }
}

// Network first with cache fallback
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Navigation requests get offline page
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL)
    }
    
    return new Response('Offline', { status: 503 })
  }
}

// Check if request is for static asset
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|ico|avif)$/i.test(pathname)
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { data } = event
  
  if (data === 'SKIP_WAITING' || data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (data === 'CLEAR_CACHE' || data?.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.startsWith('algo-')) {
          caches.delete(name)
        }
      })
    })
  }
  
  if (data?.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    caches.open(DYNAMIC_CACHE).then((cache) => {
      cache.addAll(data.urls)
    })
  }
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncPendingRequests('/api/favorites'))
  }
  if (event.tag === 'sync-watchlist') {
    event.waitUntil(syncPendingRequests('/api/watchlist'))
  }
})

async function syncPendingRequests(apiPath) {
  const pendingCache = await caches.open('algo-pending')
  const requests = await pendingCache.keys()
  
  for (const request of requests) {
    if (request.url.includes(apiPath)) {
      try {
        const cachedData = await pendingCache.match(request)
        const body = await cachedData.text()
        
        await fetch(request.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body
        })
        
        await pendingCache.delete(request)
      } catch (error) {
        console.error(`[SW] Failed to sync ${apiPath}:`, error)
      }
    }
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  try {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'Nouvelle tendance detectee',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        timestamp: Date.now()
      },
      actions: [
        { action: 'open', title: 'Voir' },
        { action: 'dismiss', title: 'Ignorer' }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'ALGO', options)
    )
  } catch (error) {
    console.error('[SW] Push notification error:', error)
  }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'dismiss') return
  
  const url = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})
