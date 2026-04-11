/**
 * ALGO Event Bus - The Neural Network
 * 
 * A publish-subscribe system that connects every part of ALGO.
 * Events propagate instantly to all subscribers simultaneously.
 * No component can miss an event - late subscribers get the latest state.
 */

// Event types that flow through ALGO's nervous system
export type AlgoEventType =
  // Data update events
  | 'data:news:updated'
  | 'data:youtube:updated'
  | 'data:tmdb:updated'
  | 'data:lastfm:updated'
  | 'data:trends:updated'
  | 'data:scores:updated'
  | 'data:all:updated'
  // Scope and language events
  | 'scope:changed'
  | 'language:changed'
  // User events
  | 'user:authenticated'
  | 'user:signedout'
  | 'watchlist:updated'
  | 'favorites:updated'
  // Signal events - breaking news, viral content, early signals
  | 'signal:breaking'
  | 'signal:exploding'
  | 'signal:early'
  | 'score:weights'
  // System events
  | 'system:online'
  | 'system:offline'
  | 'system:error'
  | 'cache:invalidated'
  | 'orchestrator:tick'

// Event payload types
export interface AlgoEventPayload {
  'data:news:updated': { data: unknown[]; source: string; fetchedAt: string }
  'data:youtube:updated': { data: unknown[]; source: string; fetchedAt: string }
  'data:tmdb:updated': { data: unknown[]; source: string; fetchedAt: string }
  'data:lastfm:updated': { data: unknown[]; source: string; fetchedAt: string }
  'data:trends:updated': { data: unknown[]; source: string; fetchedAt: string }
  'data:scores:updated': { scores: Map<string, number>; changedIds: string[] }
  'data:all:updated': { sources: string[]; fetchedAt: string }
  'scope:changed': { oldScope: string; newScope: string; scopeName: string }
  'language:changed': { oldLang: string; newLang: string }
  'user:authenticated': { userId: string; email: string }
  'user:signedout': { userId: string }
  'watchlist:updated': { items: unknown[]; action: 'add' | 'remove' | 'sync' }
  'favorites:updated': { items: unknown[]; action: 'add' | 'remove' | 'sync' }
  'signal:breaking': { item: unknown; score: number; source: string }
  'signal:exploding': { item: unknown; previousScore: number; newScore: number }
  'signal:early': { item: unknown; detectedAt: string; source: string }
  'score:weights': { topic: string; overallScore: number; modelTelemetry: unknown }
  'system:online': { timestamp: string }
  'system:offline': { timestamp: string }
  'system:error': { error: string; source: string; recoverable: boolean }
  'cache:invalidated': { keys: string[]; reason: string }
  'orchestrator:tick': { timestamp: string; nextTicks: Record<string, number> }
}

type EventCallback<T extends AlgoEventType> = (payload: AlgoEventPayload[T]) => void
type AnyEventCallback = (event: AlgoEventType, payload: unknown) => void

interface EventSubscription {
  id: string
  callback: EventCallback<AlgoEventType>
  once: boolean
}

class AlgoEventBusClass {
  private subscribers: Map<AlgoEventType, EventSubscription[]> = new Map()
  private wildcardSubscribers: Array<{ id: string; callback: AnyEventCallback }> = []
  private lastEventState: Map<AlgoEventType, { payload: unknown; timestamp: number }> = new Map()
  private eventHistory: Array<{ event: AlgoEventType; timestamp: number }> = []
  private subscriptionCounter = 0
  
  // Metrics
  private metrics = {
    eventsPublished: 0,
    eventsDelivered: 0,
    subscriberCount: 0,
    lastEventTime: 0
  }

  /**
   * Subscribe to a specific event type
   * Late subscribers immediately receive the last known state
   */
  subscribe<T extends AlgoEventType>(
    eventType: T,
    callback: EventCallback<T>,
    options: { receiveLastState?: boolean; once?: boolean } = {}
  ): () => void {
    const { receiveLastState = true, once = false } = options
    const id = `sub_${++this.subscriptionCounter}`
    
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, [])
    }
    
    const subscribers = this.subscribers.get(eventType)
    if (subscribers) {
      subscribers.push({
        id,
        callback: callback as EventCallback<AlgoEventType>,
        once
      })
    }
    
    this.metrics.subscriberCount++
    
    // Deliver last known state to new subscriber
    if (receiveLastState) {
      const lastState = this.lastEventState.get(eventType)
      if (lastState) {
        try {
          callback(lastState.payload as AlgoEventPayload[T])
        } catch (error) {
          console.error(`[ALGO EventBus] Error delivering last state for ${eventType}:`, error)
        }
      }
    }
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(eventType)
      if (subs) {
        const index = subs.findIndex(s => s.id === id)
        if (index > -1) {
          subs.splice(index, 1)
          this.metrics.subscriberCount--
        }
      }
    }
  }

  /**
   * Subscribe to all events (wildcard)
   */
  subscribeAll(callback: AnyEventCallback): () => void {
    const id = `wild_${++this.subscriptionCounter}`
    this.wildcardSubscribers.push({ id, callback })
    
    return () => {
      const index = this.wildcardSubscribers.findIndex(s => s.id === id)
      if (index > -1) {
        this.wildcardSubscribers.splice(index, 1)
      }
    }
  }

  /**
   * Publish an event to all subscribers
   * Events are delivered synchronously for consistency
   */
  publish<T extends AlgoEventType>(eventType: T, payload: AlgoEventPayload[T]): void {
    const timestamp = Date.now()
    
    // Store last state for late subscribers
    this.lastEventState.set(eventType, { payload, timestamp })
    
    // Track event history (keep last 100 events)
    this.eventHistory.push({ event: eventType, timestamp })
    if (this.eventHistory.length > 100) {
      this.eventHistory.shift()
    }
    
    this.metrics.eventsPublished++
    this.metrics.lastEventTime = timestamp
    
    // Deliver to specific subscribers
    const subscribers = this.subscribers.get(eventType) || []
    const toRemove: string[] = []
    
    for (const sub of subscribers) {
      try {
        sub.callback(payload)
        this.metrics.eventsDelivered++
        if (sub.once) {
          toRemove.push(sub.id)
        }
      } catch (error) {
        console.error(`[ALGO EventBus] Error in subscriber for ${eventType}:`, error)
      }
    }
    
    // Remove one-time subscribers
    if (toRemove.length > 0) {
      const remaining = subscribers.filter(s => !toRemove.includes(s.id))
      this.subscribers.set(eventType, remaining)
      this.metrics.subscriberCount -= toRemove.length
    }
    
    // Deliver to wildcard subscribers
    for (const wild of this.wildcardSubscribers) {
      try {
        wild.callback(eventType, payload)
        this.metrics.eventsDelivered++
      } catch (error) {
        console.error(`[ALGO EventBus] Error in wildcard subscriber:`, error)
      }
    }
  }

  /**
   * Get the last known state for an event type
   */
  getLastState<T extends AlgoEventType>(eventType: T): AlgoEventPayload[T] | null {
    const state = this.lastEventState.get(eventType)
    return state ? (state.payload as AlgoEventPayload[T]) : null
  }

  /**
   * Get event metrics for monitoring
   */
  getMetrics() {
    return {
      ...this.metrics,
      eventTypes: Array.from(this.subscribers.keys()),
      recentEvents: this.eventHistory.slice(-20)
    }
  }

  /**
   * Clear all subscriptions (for testing/cleanup)
   */
  clear(): void {
    this.subscribers.clear()
    this.wildcardSubscribers = []
    this.lastEventState.clear()
    this.eventHistory = []
    this.metrics.subscriberCount = 0
  }
}

// Singleton instance
export const AlgoEventBus = new AlgoEventBusClass()

// React hook for subscribing to events
export function useAlgoEvent<T extends AlgoEventType>(
  eventType: T,
  callback: EventCallback<T>,
  _deps: React.DependencyList = []
) {
  void _deps
  // This will be implemented with useEffect in React components
  // The hook pattern ensures proper cleanup on unmount
}
