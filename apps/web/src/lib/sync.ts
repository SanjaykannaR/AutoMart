/**
 * sync.ts — Backend sync for wishlist and cart
 *
 * Strategy:
 *   - On page mount (if logged in): fetch backend → merge with localStorage → save both
 *   - On mutation (add/remove/update): update localStorage + fire-and-forget PUT to backend
 *   - If not logged in: only localStorage (guest mode)
 *
 * Merge policy:
 *   - Backend is source of truth when logged in
 *   - LocalStorage items not in backend are appended (handles offline additions)
 *   - Deduplicates by item id
 */

import { authFetch } from './api'

/* ─── Types ─────────────────────────────────────────────────────────────────── */

export interface WishlistItem {
  id: number | string
  name: string
  price: number
  imageUrl?: string
  image?: string
  category: string
  brand?: string
}

export interface CartItem {
  id: number | string
  name: string
  price: number
  qty: number
  imageUrl: string
  category?: string
}

/* ─── Wishlist Sync ─────────────────────────────────────────────────────────── */

/**
 * Fetch wishlist from backend, merge with localStorage, persist both.
 * Returns the merged array.
 */
export async function syncWishlist(): Promise<WishlistItem[]> {
  // Read local
  let local: WishlistItem[] = []
  try {
    local = JSON.parse(localStorage.getItem('wishlist') || '[]')
  } catch { local = [] }

  // Fetch backend
  try {
    const res = await authFetch('/api/auth/users/me/wishlist')
    if (!res) return local // Not logged in

    const backend: WishlistItem[] = await res.json()

    // Merge: backend + local items not already in backend
    const backendIds = new Set(backend.map((b) => String(b.id)))
    const extras = local.filter((l) => !backendIds.has(String(l.id)))
    const merged = [...backend, ...extras]

    // Persist both sides
    localStorage.setItem('wishlist', JSON.stringify(merged))
    if (extras.length > 0) {
      // Push any offline additions to backend
      authFetch('/api/auth/users/me/wishlist', {
        method: 'PUT',
        body: JSON.stringify({ items: merged }),
      }).catch(() => {}) // fire-and-forget
    }

    return merged
  } catch {
    return local // Backend unreachable → keep local
  }
}

/**
 * Save wishlist to both localStorage and backend.
 */
export async function saveWishlist(items: WishlistItem[]): Promise<void> {
  localStorage.setItem('wishlist', JSON.stringify(items))
  // Fire-and-forget PUT to backend
  try {
    await authFetch('/api/auth/users/me/wishlist', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    })
  } catch { /* best effort */ }
}

/* ─── Cart Sync ─────────────────────────────────────────────────────────────── */

/**
 * Fetch cart from backend, merge with localStorage, persist both.
 * Returns the merged array.
 */
export async function syncCart(): Promise<CartItem[]> {
  // Read local
  let local: CartItem[] = []
  try {
    local = JSON.parse(localStorage.getItem('cart') || '[]')
  } catch { local = [] }

  // Fetch backend
  try {
    const res = await authFetch('/api/auth/users/me/cart')
    if (!res) return local // Not logged in

    const backend: CartItem[] = await res.json()

    // Merge: backend wins for shared ids (qty from backend), append unique local items
    const backendMap = new Map(backend.map((b) => [String(b.id), b]))
    const localExtras = local.filter((l) => !backendMap.has(String(l.id)))
    const merged = [...backend, ...localExtras]

    // Persist both sides
    localStorage.setItem('cart', JSON.stringify(merged))
    if (localExtras.length > 0) {
      authFetch('/api/auth/users/me/cart', {
        method: 'PUT',
        body: JSON.stringify({ items: merged }),
      }).catch(() => {}) // fire-and-forget
    }

    return merged
  } catch {
    return local // Backend unreachable → keep local
  }
}

/**
 * Save cart to both localStorage and backend.
 */
export async function saveCart(items: CartItem[]): Promise<void> {
  localStorage.setItem('cart', JSON.stringify(items))
  try {
    await authFetch('/api/auth/users/me/cart', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    })
  } catch { /* best effort */ }
}
