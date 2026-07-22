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
 *
 * ANIMATION:
 *   - Page title fades up on scroll
 *   - Each wishlist card animates in with staggered card reveal
 *   - Empty state pops in with scale animation
 */
'use client' // Next.js client component directive

import { useState, useEffect } from 'react' // React hooks for state and effects
import Link from 'next/link' // Next.js client-side navigation
import { TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline' // Delete and cart icons
import { HeartIcon } from '@heroicons/react/24/solid' // Filled heart icon (for empty state)
import { ScrollReveal } from '@/components/ScrollReveal' // Reusable scroll animation wrapper
import { syncWishlist, saveWishlist, saveCart, type WishlistItem } from '@/lib/sync' // Backend sync utilities

/**
 * WishlistPage Component
 * Displays saved wishlist items with move-to-cart and remove actions.
 * Syncs with backend when user is logged in, localStorage when guest.
 */
export default function WishlistPage() {
  // State
  const [items, setItems] = useState<WishlistItem[]>([]) // Wishlist items array
  const [loaded, setLoaded] = useState(false) // Loaded flag for hydration safety

  /**
   * LOAD WISHLIST
   * If logged in: fetch from backend, merge with localStorage, persist both.
   * If guest: read from localStorage only.
   */
  useEffect(() => {
    syncWishlist().then((merged) => {
      setItems(merged)
      setLoaded(true)
    }).catch(() => {
      setLoaded(true)
    })
  }, []) // Run once on mount

  /**
   * SAVE WISHLIST
   * Whenever items change, save to localStorage + backend (if logged in).
   */
  useEffect(() => {
    if (loaded) { // Only save after initial load
      saveWishlist(items) // Saves to localStorage + PUT to backend
    }
  }, [items, loaded]) // Re-run when items or loaded change

  /**
   * REMOVE FROM WISHLIST
   * Filters out the item with the given ID.
   */
  const removeItem = (id: number | string) => {
    setItems((prev) => prev.filter((item) => item.id !== id)) // Filter out item
  }

  /**
   * MOVE TO CART
   * 1. Adds the item to localStorage("cart") with qty: 1
   * 2. Removes it from wishlist
   * 3. Dispatches "cart-updated" event so navbar badge updates
   */
  const moveToCart = (item: WishlistItem) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]') // Read existing cart
      const existing = cart.find((c: any) => c.id === item.id) // Check if already in cart
      if (existing) {
        existing.qty = (existing.qty || 1) + 1 // Increase quantity
      } else {
        cart.push({ ...item, qty: 1 }) // Add new item with quantity 1
      }
      saveCart(cart) // Save to localStorage + backend
      window.dispatchEvent(new Event('cart-updated')) // Notify navbar
      removeItem(item.id) // Remove from wishlist
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }

  // Loading state — show spinner while localStorage is being read
  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Empty state — pop animation for the heart icon
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <ScrollReveal variant="pop">
          <div className="text-center max-w-sm">
            {/* Empty state icon — heart */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
              <HeartIcon className="w-10 h-10 text-[var(--color-text-muted)]" />
            </div>

            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Your wishlist is empty
            </h1>

            <p className="text-[var(--color-text-dim)] text-sm mb-6">
              Save parts you like by tapping the heart icon. They&apos;ll appear here.
            </p>

            {/* CTA button — lime pill */}
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
            >
              Browse Parts
            </Link>
          </div>
        </ScrollReveal>
      </div>
    )
  }

  // Main wishlist grid — each card staggers in with card animation
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-[2560px] mx-auto">
      {/* Page header — text animation */}
      <div className="mb-8">
        <ScrollReveal variant="text">
          <h1
            className="text-3xl font-extrabold"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            My Wishlist
          </h1>
        </ScrollReveal>
        <ScrollReveal variant="fade" delay={0.05}>
          <p className="text-[var(--color-text-dim)] text-sm mt-1">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </p>
        </ScrollReveal>
      </div>

      {/* Wishlist grid — responsive 1-4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <ScrollReveal key={item.id} variant="card" delay={index * 0.06}>
            <div className="card group relative overflow-hidden">
              {/* Product image — links to detail page */}
              <Link href={`/products/${item.id}`} className="block">
                <div className="aspect-square bg-[var(--color-surface)] relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name} // Alt text for accessibility
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Category badge — top-left corner */}
                  <span className="absolute top-3 left-3 badge">
                    {item.category}
                  </span>
                </div>
              </Link>

              {/* Card info — name, price, action buttons */}
              <div className="p-4">
                <Link href={`/products/${item.id}`}>
                  <h3 className="font-semibold text-sm mb-1 hover:text-[var(--color-accent)] transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {item.name} {/* Product name — links to detail */}
                  </h3>
                </Link>

                {/* Price — lime accent color */}
                <p className="text-[var(--color-accent)] font-bold text-lg mb-4">
                  ${item.price.toFixed(2)}
                </p>

                {/* Action buttons — Move to Cart + Remove */}
                <div className="flex gap-2">
                  <button
                    onClick={() => moveToCart(item)} // Move to cart handler
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
                  >
                    <ShoppingCartIcon className="w-4 h-4" /> {/* Cart icon */}
                    Move to Cart
                  </button>

                  <button
                    onClick={() => removeItem(item.id)} // Remove from wishlist
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-red-400 hover:border-red-400/50 transition-colors"
                    aria-label={`Remove ${item.name} from wishlist`}
                  >
                    <TrashIcon className="w-4 h-4" /> {/* Trash icon */}
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  )
}
