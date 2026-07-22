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
 *   - Each cart item slides in with staggered animation
 *   - Order summary slides in from right
 */
'use client' // Next.js client component directive

import { useState, useEffect } from 'react' // React hooks for state and effects
import Link from 'next/link' // Next.js client-side navigation
import { TrashIcon } from '@heroicons/react/24/outline' // Trash/delete icon
import { useToast } from '@/components/Toast' // Toast notification context
import { ScrollReveal } from '@/components/ScrollReveal' // Reusable scroll animation wrapper

/**
 * CartItem type — what each item in the cart looks like.
 * Stored in localStorage, so all fields must be serializable.
 */
interface CartItem {
  id: string // Product ID — used for matching and links
  name: string // Product name — displayed on card
  price: number // Price per unit in dollars
  qty: number // Quantity in cart
  imageUrl: string // Product image URL
  category?: string // Optional category name
}

/**
 * CartPage Component
 * Displays cart items with quantity controls and order summary.
 */
export default function CartPage() {
  const { showToast } = useToast() // Toast notification function
  const [items, setItems] = useState<CartItem[]>([]) // Cart items array
  const [mounted, setMounted] = useState(false) // Hydration flag

  /** Load cart from localStorage on mount */
  useEffect(() => {
    setMounted(true) // Mark as mounted for hydration safety
    const cart = JSON.parse(localStorage.getItem('cart') || '[]') // Read cart
    setItems(cart) // Set cart items
  }, []) // Run once on mount

  /**
   * Update item quantity by delta (+1 or -1).
   * Minimum quantity is 1. Syncs to localStorage and Navbar.
   */
  const updateQty = (id: string, delta: number) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item, // Min qty = 1
    )
    setItems(updated) // Update state
    localStorage.setItem('cart', JSON.stringify(updated)) // Sync to localStorage
    window.dispatchEvent(new Event('cart-updated')) // Notify Navbar
  }

  /** Remove item from cart with toast notification */
  const removeItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id) // Filter out item
    setItems(updated) // Update state
    localStorage.setItem('cart', JSON.stringify(updated)) // Sync to localStorage
    window.dispatchEvent(new Event('cart-updated')) // Notify Navbar
    showToast('Item removed from cart', 'info') // Show toast
  }

  /** Calculate cart total */
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)

  /** Avoid hydration mismatch — localStorage is only available client-side */
  if (!mounted) return null // Render nothing during SSR

  return (
    <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page heading — text animation */}
      <ScrollReveal variant="text">
        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-8"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Shopping Cart
        </h1>
      </ScrollReveal>

      {items.length === 0 ? (
        /* ─── Empty State ─── — pop animation for the icon */
        <ScrollReveal variant="pop">
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
              <span className="text-3xl">&#x1F6D2;</span> {/* Cart emoji */}
            </div>
            <p className="text-[var(--color-text-dim)] mb-6">Your cart is empty</p>
            <Link href="/search" className="glass-button px-8 py-3">
              Browse Parts
            </Link>
          </div>
        </ScrollReveal>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ═══════════════════════════════════════════════════════
              Cart Items List (takes 2/3 width on desktop)
              Each item slides up with staggered animation
              ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, index) => (
              <ScrollReveal key={item.id} variant="card" delay={index * 0.05}>
                <div className="card p-4 flex items-center gap-4">
                  {/* Product thumbnail — links to detail page */}
                  <Link href={`/products/${item.id}`} className="shrink-0">
                    <div className="w-20 h-20 rounded-lg bg-[var(--color-bg)] overflow-hidden">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=200&h=200&fit=crop&q=80'}
                        alt={item.name} // Alt text for accessibility
                        className="w-full h-full object-cover" // Cover container
                      />
                    </div>
                  </Link>

                  {/* Product info — name, category, price */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.id}`}
                      className="font-medium text-sm hover:text-[var(--color-accent)] transition-colors line-clamp-1"
                    >
                      {item.name} {/* Product name — truncated */}
                    </Link>
                    {item.category && (
                      <p className="text-xs text-[var(--color-text-dim)] mt-0.5">{item.category}</p>
                    )}
                    <p className="text-sm glow-text font-semibold mt-1">
                      ${item.price.toFixed(2)} {/* Unit price in lime */}
                    </p>
                  </div>

                  {/* Quantity controls — minus, count, plus */}
                  <div className="flex items-center gap-0">
                    <button
                      onClick={() => updateQty(item.id, -1)} // Decrease qty
                      className="w-8 h-8 rounded-l-lg border border-[var(--color-border)] flex items-center justify-center
                                 hover:bg-[var(--color-surface-alt)] transition-colors text-sm"
                    >
                      &minus; {/* Minus sign */}
                    </button>
                    <span className="w-10 h-8 flex items-center justify-center border-y border-[var(--color-border)] text-sm font-medium">
                      {item.qty} {/* Current quantity */}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)} // Increase qty
                      className="w-8 h-8 rounded-r-lg border border-[var(--color-border)] flex items-center justify-center
                                 hover:bg-[var(--color-surface-alt)] transition-colors text-sm"
                    >
                      + {/* Plus sign */}
                    </button>
                  </div>

                  {/* Line total — price * qty */}
                  <p className="text-sm font-semibold w-20 text-right hidden sm:block">
                    ${(item.price * item.qty).toFixed(2)}
                  </p>

                  {/* Remove button — trash icon */}
                  <button
                    onClick={() => removeItem(item.id)} // Remove from cart
                    className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)] transition-colors p-1"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <TrashIcon className="w-4 h-4" /> {/* Trash icon */}
                  </button>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════
              Order Summary Sidebar (takes 1/3 width on desktop)
              Slides in from right
              ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-1">
            <ScrollReveal variant="slide-right">
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

                {/* Summary rows — subtotal + delivery */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-dim)]">Subtotal</span>
                    <span>${total.toFixed(2)}</span> {/* Subtotal amount */}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-dim)]">Delivery</span>
                    <span className="text-[var(--color-accent)]">Free</span> {/* Free delivery */}
                  </div>
                </div>

                {/* Divider line */}
                <div className="glass-divider" />

                {/* Total — large lime text */}
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg glow-text">${total.toFixed(2)}</span>
                </div>

                {/* Checkout button — full width coral pill */}
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
            </ScrollReveal>
          </div>
        </div>
      )}
    </div>
  )
}
