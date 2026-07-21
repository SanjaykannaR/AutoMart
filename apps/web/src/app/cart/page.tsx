/**
 * Cart Page — Shopping cart with item management
 * 
 * Layout:
 *   ┌─────────────────────────────┬────────────────────┐
 *   │  Cart Items List            │  Order Summary      │
 *   │  - Product image + details  │  - Subtotal         │
 *   │  - Quantity controls        │  - Delivery (free)  │
 *   │  - Price + remove button    │  - Total (lime)     │
 *   │                             │  - Checkout CTA     │
 *   └─────────────────────────────┴────────────────────┘
 * 
 * Cart behavior:
 *   - Reads from localStorage
 *   - Quantity +/- with min 1
 *   - Remove item with confirmation
 *   - Updates Navbar cart count via 'cart-updated' event
 *   - Empty state with CTA to browse parts
 *   - Hydration-safe with mounted flag
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/Toast'
import { motion } from 'framer-motion'

interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  imageUrl: string
  category?: string
}

export default function CartPage() {
  const { showToast } = useToast()
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  /** Load cart from localStorage on mount */
  useEffect(() => {
    setMounted(true)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setItems(cart)
  }, [])

  /**
   * Update item quantity by delta (+1 or -1).
   * Minimum quantity is 1. Syncs to localStorage and Navbar.
   */
  const updateQty = (id: string, delta: number) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item,
    )
    setItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    window.dispatchEvent(new Event('cart-updated'))
  }

  /** Remove item from cart with toast notification */
  const removeItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id)
    setItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    window.dispatchEvent(new Event('cart-updated'))
    showToast('Item removed from cart', 'info')
  }

  /** Calculate cart total */
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)

  /** Avoid hydration mismatch — localStorage is only available client-side */
  if (!mounted) return null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page heading */}
      <h1
        className="text-2xl sm:text-3xl font-extrabold mb-8"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        Shopping Cart
      </h1>

      {items.length === 0 ? (
        /* ─── Empty State ─── */
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
            <span className="text-3xl">🛒</span>
          </div>
          <p className="text-[var(--color-text-dim)] mb-6">Your cart is empty</p>
          <Link href="/search" className="glass-button px-8 py-3">
            Browse Parts
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ═══════════════════════════════════════════════════════
              Cart Items List (takes 2/3 width on desktop)
              ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="card p-4 flex items-center gap-4">
                  {/* Product thumbnail */}
                  <Link href={`/products/${item.id}`} className="shrink-0">
                    <div className="w-20 h-20 rounded-lg bg-[var(--color-bg)] overflow-hidden">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&h=200&fit=crop&q=80'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.id}`}
                      className="font-medium text-sm hover:text-[var(--color-accent)] transition-colors line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    {item.category && (
                      <p className="text-xs text-[var(--color-text-dim)] mt-0.5">{item.category}</p>
                    )}
                    <p className="text-sm glow-text font-semibold mt-1">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-0">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-8 h-8 rounded-l-lg border border-[var(--color-border)] flex items-center justify-center
                                 hover:bg-[var(--color-surface-alt)] transition-colors text-sm"
                    >
                      −
                    </button>
                    <span className="w-10 h-8 flex items-center justify-center border-y border-[var(--color-border)] text-sm font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-8 h-8 rounded-r-lg border border-[var(--color-border)] flex items-center justify-center
                                 hover:bg-[var(--color-surface-alt)] transition-colors text-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* Line total */}
                  <p className="text-sm font-semibold w-20 text-right hidden sm:block">
                    ${(item.price * item.qty).toFixed(2)}
                  </p>

                  {/* Remove button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)] transition-colors p-1"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════
              Order Summary Sidebar (takes 1/3 width on desktop)
              ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3
                className="font-semibold mb-4"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Order Summary
              </h3>

              {/* Item count */}
              <p className="text-sm text-[var(--color-text-dim)] mb-4">
                {items.length} {items.length === 1 ? 'item' : 'items'} in cart
              </p>

              {/* Summary rows */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-dim)]">Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-dim)]">Delivery</span>
                  <span className="text-[var(--color-accent)]">Free</span>
                </div>
              </div>

              {/* Divider */}
              <div className="glass-divider" />

              {/* Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg glow-text">${total.toFixed(2)}</span>
              </div>

              {/* Checkout button */}
              <Link href="/checkout" className="glass-button w-full text-center block py-3">
                Proceed to Checkout
              </Link>

              {/* Continue shopping link */}
              <Link
                href="/search"
                className="block text-center text-sm text-[var(--color-text-dim)] hover:text-[var(--color-accent)] mt-4 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
