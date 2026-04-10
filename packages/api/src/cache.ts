const TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.data as T
  }

  set<T>(key: string, data: T, ttlMs: number = TTL_MS): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs })
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

// Attach to globalThis so Next.js hot-reloads don't reset the cache in dev.
const g = globalThis as typeof globalThis & { _scoremateCache?: InMemoryCache }
if (!g._scoremateCache) g._scoremateCache = new InMemoryCache()
export const cache = g._scoremateCache
