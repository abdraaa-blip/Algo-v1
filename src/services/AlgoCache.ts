/**
 * ALGO Cache - Multi-Layer Intelligent Cache
 *
 * Layer 1: Memory cache - instant access, session lifetime
 * Layer 2: IndexedDB - persists across sessions, survives browser restart
 * Layer 3: Stale-While-Revalidate - serve stale immediately, refresh in background
 */

import { AlgoEventBus } from "./AlgoEventBus";

// Cache configuration per data source
export const CACHE_CONFIG = {
  news: { ttl: 5 * 60 * 1000, maxAge: 24 * 60 * 60 * 1000 }, // 5 min TTL, 24h max
  youtube: { ttl: 30 * 60 * 1000, maxAge: 24 * 60 * 60 * 1000 }, // 30 min TTL
  tmdb: { ttl: 6 * 60 * 60 * 1000, maxAge: 48 * 60 * 60 * 1000 }, // 6h TTL
  lastfm: { ttl: 2 * 60 * 60 * 1000, maxAge: 24 * 60 * 60 * 1000 }, // 2h TTL
  trends: { ttl: 15 * 60 * 1000, maxAge: 24 * 60 * 60 * 1000 }, // 15 min TTL
  scores: { ttl: 10 * 60 * 1000, maxAge: 6 * 60 * 60 * 1000 }, // 10 min TTL
} as const;

export type CacheSource = keyof typeof CACHE_CONFIG;

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt: number;
  source: CacheSource;
  scope: string;
  version: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  staleHits: number;
  writes: number;
  evictions: number;
}

class AlgoCacheClass {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private dbName = "ALGO_Cache_v1";
  private storeName = "cache_entries";
  private db: IDBDatabase | null = null;
  private dbReady: Promise<boolean>;
  private version = 1;

  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    writes: 0,
    evictions: 0,
  };

  constructor() {
    this.dbReady = this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB for persistent storage
   */
  private async initIndexedDB(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, 1);

        request.onerror = () => {
          console.warn(
            "[ALGO Cache] IndexedDB not available, using memory only",
          );
          resolve(false);
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.cleanupOldEntries();
          resolve(true);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, {
              keyPath: "key",
            });
            store.createIndex("expiresAt", "expiresAt", { unique: false });
            store.createIndex("source", "source", { unique: false });
          }
        };
      } catch {
        console.warn("[ALGO Cache] IndexedDB initialization failed");
        resolve(false);
      }
    });
  }

  /**
   * Generate cache key from source and scope
   */
  private getKey(source: CacheSource, scope: string): string {
    return `${source}:${scope}`;
  }

  /**
   * Get data from cache (memory first, then IndexedDB)
   * Returns { data, isStale, isCached }
   */
  async get<T>(
    source: CacheSource,
    scope: string,
  ): Promise<{
    data: T | null;
    isStale: boolean;
    isCached: boolean;
    age: number;
  }> {
    const key = this.getKey(source, scope);
    const now = Date.now();

    // Layer 1: Check memory cache first
    const memEntry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (memEntry) {
      const isStale = now > memEntry.expiresAt;
      const age = now - memEntry.timestamp;

      if (isStale) {
        this.metrics.staleHits++;
      } else {
        this.metrics.hits++;
      }

      return { data: memEntry.data, isStale, isCached: true, age };
    }

    // Layer 2: Check IndexedDB
    const dbEntry = await this.getFromIndexedDB<T>(key);
    if (dbEntry) {
      // Populate memory cache from IndexedDB
      this.memoryCache.set(key, dbEntry);

      const isStale = now > dbEntry.expiresAt;
      const age = now - dbEntry.timestamp;

      if (isStale) {
        this.metrics.staleHits++;
      } else {
        this.metrics.hits++;
      }

      return { data: dbEntry.data, isStale, isCached: true, age };
    }

    this.metrics.misses++;
    return { data: null, isStale: false, isCached: false, age: 0 };
  }

  /**
   * Store data in both memory and IndexedDB
   */
  async set<T>(source: CacheSource, scope: string, data: T): Promise<void> {
    const key = this.getKey(source, scope);
    const now = Date.now();
    const config = CACHE_CONFIG[source];

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + config.ttl,
      source,
      scope,
      version: this.version,
    };

    // Layer 1: Store in memory
    this.memoryCache.set(key, entry);

    // Layer 2: Store in IndexedDB
    await this.setToIndexedDB(key, entry);

    this.metrics.writes++;
  }

  /**
   * Invalidate cache for a source and scope
   */
  async invalidate(source: CacheSource, scope?: string): Promise<void> {
    const keysToRemove: string[] = [];

    for (const [key] of this.memoryCache) {
      if (key.startsWith(`${source}:`)) {
        if (!scope || key === this.getKey(source, scope)) {
          keysToRemove.push(key);
        }
      }
    }

    for (const key of keysToRemove) {
      this.memoryCache.delete(key);
      await this.removeFromIndexedDB(key);
      this.metrics.evictions++;
    }

    AlgoEventBus.publish("cache:invalidated", {
      keys: keysToRemove,
      reason: `Invalidation requested for ${source}${scope ? `:${scope}` : ""}`,
    });
  }

  /**
   * Invalidate all cache for a scope (when scope changes)
   */
  async invalidateScope(scope: string): Promise<void> {
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.memoryCache) {
      if (entry.scope === scope) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      this.memoryCache.delete(key);
      await this.removeFromIndexedDB(key);
      this.metrics.evictions++;
    }
  }

  /**
   * Get fresh data indicator for UI
   */
  getDataFreshness(
    source: CacheSource,
    scope: string,
  ): "fresh" | "stale" | "old" | "unknown" {
    const key = this.getKey(source, scope);
    const entry = this.memoryCache.get(key);

    if (!entry) return "unknown";

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age < 15 * 60 * 1000) return "fresh"; // Under 15 minutes
    if (age < 60 * 60 * 1000) return "stale"; // Under 1 hour
    return "old"; // Over 1 hour
  }

  /**
   * Get cache metrics for monitoring
   */
  getMetrics() {
    const entriesPerSource: Record<string, number> = {};

    for (const [, entry] of this.memoryCache) {
      entriesPerSource[entry.source] =
        (entriesPerSource[entry.source] || 0) + 1;
    }

    return {
      ...this.metrics,
      hitRate:
        this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0,
      totalEntries: this.memoryCache.size,
      entriesPerSource,
    };
  }

  // IndexedDB helpers
  private async getFromIndexedDB<T>(
    key: string,
  ): Promise<CacheEntry<T> | null> {
    await this.dbReady;
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        if (!this.db) {
          resolve(null);
          return;
        }
        const tx = this.db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          if (result && result.entry) {
            // Check max age
            const config = CACHE_CONFIG[result.entry.source as CacheSource];
            const age = Date.now() - result.entry.timestamp;
            if (age < config.maxAge) {
              resolve(result.entry);
              return;
            }
          }
          resolve(null);
        };

        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private async setToIndexedDB(key: string, entry: CacheEntry): Promise<void> {
    await this.dbReady;
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        if (!this.db) {
          resolve();
          return;
        }
        const tx = this.db.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);
        store.put({ key, entry });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    await this.dbReady;
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        if (!this.db) {
          resolve();
          return;
        }
        const tx = this.db.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);
        store.delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  private async cleanupOldEntries(): Promise<void> {
    await this.dbReady;
    if (!this.db) return;

    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    try {
      const tx = this.db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const index = store.index("expiresAt");
      const range = IDBKeyRange.upperBound(cutoff);

      index.openCursor(range).onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          this.metrics.evictions++;
          cursor.continue();
        }
      };
    } catch {
      // Cleanup failed, will try again later
    }
  }
}

// Singleton instance
export const AlgoCache = new AlgoCacheClass();
