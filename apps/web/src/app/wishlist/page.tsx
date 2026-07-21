/**
 * Wishlist Page — Saved items for later
 * 
 * WHAT IT DOES:
 *   - Shows products the user saved by clicking the heart icon
 *   - Each item shows image, name, price, category
 *   - User can remove items from wishlist
 *   - User can move items directly to cart
 *   - Empty state shows when no items are saved
 * 
 * DATA STORAGE:
 *   - Wishlist stored in localStorage as JSON array
 *   - Key: "wishlist"
 *   - Format: [{ id, name, price, image, category }]
 *   - Updates trigger re-render via state
 * 
 * HOW IT CONNECTS:
 *   - Heart icon in navbar links here
 *   - ProductCard has a heart button that adds/removes from wishlist
 *   - Cart page reads from localStorage("cart") — separate from wishlist
 * 
 * LAYOUT:
 *   - Header: "My Wishlist" + item count
 *   - Grid: 2 cols mobile, 3 cols tablet, 4 cols desktop
 *   - Each card: image + info + "Move to Cart" button + remove button
 *   - Empty state: illustration + "Browse Parts" CTA
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { HeartIcon } from '@heroicons/react/24/solid'

/**
 * WishlistItem type — what each saved item looks like.
 * Stored in localStorage, so all fields must be serializable.
 */
interface WishlistItem {
  id: number        // Product ID — used for links and cart matching
  name: string      // Product name — displayed on card
  price: number     // Price in dollars — shown with $ prefix
  image: string     // Image URL — displayed as card thumbnail
  category: string  // Category name — shown as badge/tag
}

export default function WishlistPage() {
  // ─── State ───
  // items: the current wishlist array from localStorage
  // loaded: prevents flash of empty state before localStorage is read
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loaded, setLoaded] = useState(false)

  /**
   * LOAD WISHLIST FROM LOCALSTORAGE
   * 
   * Runs once on mount. Reads the JSON array from localStorage.
   * Sets loaded=true so we can distinguish "not yet loaded" from "empty".
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wishlist')
      if (saved) {
        setItems(JSON.parse(saved))
      }
    } catch {
      // If JSON is corrupted, treat as empty
      setItems([])
    }
    setLoaded(true)
  }, [])

  /**
   * SAVE WISHLIST TO LOCALSTORAGE
   * 
   * Whenever items change, write the updated array back to localStorage.
   * This keeps the wishlist persistent across page refreshes.
   */
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('wishlist', JSON.stringify(items))
    }
  }, [items, loaded])

  /**
   * REMOVE FROM WISHLIST
   * 
   * Filters out the item with the given ID.
   * Uses functional setState to avoid stale closure issues.
   */
  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  /**
   * MOVE TO CART
   * 
   * 1. Adds the item to localStorage("cart") with qty: 1
   * 2. Removes it from wishlist
   * 3. Dispatches "cart-updated" event so navbar badge updates
   */
  const moveToCart = (item: WishlistItem) => {
    try {
      // Read existing cart
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')

      // Check if item already in cart — if so, increase qty
      const existing = cart.find((c: any) => c.id === item.id)
      if (existing) {
        existing.qty = (existing.qty || 1) + 1
      } else {
        // Add new item with quantity 1
        cart.push({ ...item, qty: 1 })
      }

      // Save updated cart
      localStorage.setItem('cart', JSON.stringify(cart))

      // Notify navbar to update cart count
      window.dispatchEvent(new Event('cart-updated'))

      // Remove from wishlist
      removeItem(item.id)
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }

  // ─── LOADING STATE ───
  // Show nothing while localStorage is being read (prevents flash)
  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ─── EMPTY STATE ───
  // Shown when wishlist has no items
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          {/* Empty state icon — broken heart */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
            <HeartIcon className="w-10 h-10 text-[var(--color-text-muted)]" />
          </div>

          {/* Empty state heading */}
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Your wishlist is empty
          </h1>

          {/* Empty state description */}
          <p className="text-[var(--color-text-dim)] text-sm mb-6">
            Save parts you like by tapping the heart icon. They&apos;ll appear here.
          </p>

          {/* CTA button — goes to search/browse page */}
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
          >
            Browse Parts
          </Link>
        </div>
      </div>
    )
  }

  // ─── MAIN WISHLIST GRID ───
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* ─── Page Header ─── */}
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          My Wishlist
        </h1>
        {/* Item count — pluralized */}
        <p className="text-[var(--color-text-dim)] text-sm mt-1">
          {items.length} {items.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {/* ─── Wishlist Grid ─── 
       * Responsive columns:
       *   - Mobile: 1 column (full width cards)
       *   - Small: 2 columns
       *   - Tablet: 3 columns
       *   - Desktop: 4 columns
       */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="card group relative overflow-hidden"
          >
            {/* ─── Product Image ─── */}
            <Link href={`/products/${item.id}`} className="block">
              <div className="aspect-square bg-[var(--color-surface)] relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Category badge — top-left corner */}
                <span className="absolute top-3 left-3 badge">
                  {item.category}
                </span>
              </div>
            </Link>

            {/* ─── Card Info ─── */}
            <div className="p-4">
              {/* Product name — linked to detail page */}
              <Link href={`/products/${item.id}`}>
                <h3 className="font-semibold text-sm mb-1 hover:text-[var(--color-accent)] transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {item.name}
                </h3>
              </Link>

              {/* Price — lime accent color */}
              <p className="text-[var(--color-accent)] font-bold text-lg mb-4">
                ${item.price.toFixed(2)}
              </p>

              {/* ─── Action Buttons ─── */}
              <div className="flex gap-2">
                {/* Move to Cart — adds item to cart and removes from wishlist */}
                <button
                  onClick={() => moveToCart(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
                >
                  <ShoppingCartIcon className="w-4 h-4" />
                  Move to Cart
                </button>

                {/* Remove — deletes from wishlist only */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-red-400 hover:border-red-400/50 transition-colors"
                  aria-label={`Remove ${item.name} from wishlist`}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
