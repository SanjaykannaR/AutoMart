/**
 * LRUCache — Least Recently Used cache for recently viewed products
 *
 * DSA Implementation:
 *   - Uses a Map (which preserves insertion order in JS) for O(1) get/put
 *   - On get(): moves item to most recently used (delete + set)
 *   - On put(): evicts least recently used when capacity exceeded
 *   - Capacity default: 20 items
 *
 * Usage:
 *   const cache = new LRUCache<string, Product>(20)
 *   cache.put('1', product1)
 *   cache.get('1') // returns product1, now most recent
 *   cache.values() // returns all items in MRU → LRU order
 *
 * Persistence:
 *   - save() / load() methods for localStorage persistence
 *   - Key: "recently-viewed-products"
 */

export class LRUCache<K, V> {
  private capacity: number
  private cache: Map<K, V>

  constructor(capacity: number = 20) {
    this.capacity = capacity
    this.cache = new Map()
  }

  /** Get item by key — moves it to most recently used */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined
    const value = this.cache.get(key)!
    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  /** Put item — evicts LRU if at capacity */
  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.capacity) {
      // Evict least recently used (first item in Map)
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, value)
  }

  /** Check if key exists */
  has(key: K): boolean {
    return this.cache.has(key)
  }

  /** Get all values in MRU → LRU order */
  values(): V[] {
    return Array.from(this.cache.values()).reverse()
  }

  /** Get all keys in MRU → LRU order */
  keys(): K[] {
    return Array.from(this.cache.keys()).reverse()
  }

  /** Current size */
  get size(): number {
    return this.cache.size
  }

  /** Clear all items */
  clear(): void {
    this.cache.clear()
  }

  /** Serialize to JSON for localStorage */
  toJSON(): Array<[K, V]> {
    return Array.from(this.cache.entries())
  }

  /** Restore from serialized JSON */
  static fromJSON<K, V>(data: Array<[K, V]>, capacity: number = 20): LRUCache<K, V> {
    const cache = new LRUCache<K, V>(capacity)
    for (const [key, value] of data) {
      cache.put(key, value)
    }
    return cache
  }
}

// ─── Product-specific helpers ───

export interface RecentlyViewedProduct {
  id: string
  name: string
  price: number
  imageUrl: string
  category: string
  brand: string
}

const STORAGE_KEY = 'recently-viewed-products'
const MAX_RECENT = 10

/** Load recently viewed products from localStorage */
export function loadRecentlyViewed(): RecentlyViewedProduct[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const parsed = JSON.parse(data) as Array<[string, RecentlyViewedProduct]>
    const cache = LRUCache.fromJSON<string, RecentlyViewedProduct>(parsed, MAX_RECENT)
    return cache.values()
  } catch {
    return []
  }
}

/** Add a product to recently viewed (updates localStorage) */
export function addToRecentlyViewed(product: RecentlyViewedProduct): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    let cache: LRUCache<string, RecentlyViewedProduct>

    if (data) {
      const parsed = JSON.parse(data) as Array<[string, RecentlyViewedProduct]>
      cache = LRUCache.fromJSON(parsed, MAX_RECENT)
    } else {
      cache = new LRUCache<string, RecentlyViewedProduct>(MAX_RECENT)
    }

    cache.put(product.id, product)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache.toJSON()))
  } catch {
    // Ignore localStorage errors
  }
}
