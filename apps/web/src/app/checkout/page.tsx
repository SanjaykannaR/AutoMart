/**
 * Checkout Page — Delivery details + order placement
 *
 * Layout (desktop):
 *   ┌─────────────────────────────────────────────────────┐
 *   │  Step Indicator: 01 Delivery -> 02 Review -> 03 Done │
 *   ├─────────────────────────┬─────────────────────────┤
 *   │  Left: Delivery Form    │  Right: Order Summary    │
 *   │  - Address textarea     │  - Item list             │
 *   │  - Phone input          │  - Subtotal + delivery   │
 *   │  - Note input           │  - Total (lime)          │
 *   │                         │  - Place Order CTA       │
 *   └─────────────────────────┴─────────────────────────┘
 *
 * Animation:
 *   - Page heading fades up on scroll
 *   - Step indicator pops in
 *   - Delivery form slides in from left
 *   - Order summary slides in from right
 *   - Each form section staggers in with card animation
 *
 * Flow:
 *   1. User fills delivery details
 *   2. Reviews order summary
 *   3. Clicks "Place Order"
 *   4. Order sent to API -> clears cart -> redirects to order detail
 *
 * Validation:
 *   - Address and phone are required
 *   - Place Order button is disabled until both are filled
 */
'use client' // Next.js client component directive

import { useState, useEffect } from 'react' // React hooks for state and effects
import { useRouter } from 'next/navigation' // Next.js router for redirect
import { useToast } from '@/components/Toast' // Toast notification context
import { ScrollReveal } from '@/components/ScrollReveal' // Reusable scroll animation wrapper
import { MapPinIcon, PhoneIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline' // Form icons

/**
 * CartItem type — what each item in the order looks like.
 */
interface CartItem {
  id: string // Product ID
  name: string // Product name
  price: number // Price per unit
  qty: number // Quantity ordered
}

/**
 * CheckoutPage Component
 * Handles delivery form, order review, and order placement.
 */
export default function CheckoutPage() {
  const router = useRouter() // Next.js router
  const { showToast } = useToast() // Toast notification function

  /** Cart items loaded from localStorage */
  const [items, setItems] = useState<CartItem[]>([])
  /** Form fields */
  const [address, setAddress] = useState('') // Delivery address
  const [phone, setPhone] = useState('') // Phone number
  const [note, setNote] = useState('') // Optional delivery note
  /** Order placement loading state */
  const [placing, setPlacing] = useState(false)

  /** Load cart from localStorage on mount; redirect if empty */
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]') // Read cart
    if (cart.length === 0) router.push('/cart') // Redirect to cart if empty
    setItems(cart) // Set items for display
  }, []) // Run once on mount

  /** Calculate order total */
  const total = items.reduce((sum: number, item: any) => sum + item.price * item.qty, 0)

  /**
   * Place order via API.
   * On success: clears cart, shows toast, redirects to order detail.
   * On failure: shows error toast.
   */
  const placeOrder = async () => {
    setPlacing(true) // Show loading state
    try {
      const token = localStorage.getItem('token') // Get auth token
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        method: 'POST', // Create new order
        headers: {
          'Content-Type': 'application/json', // JSON body
          Authorization: `Bearer ${token}`, // Auth token
        },
        body: JSON.stringify({ items, address, phone, note, total }), // Order data
      })
      const order = await res.json() // Parse order response
      localStorage.removeItem('cart') // Clear cart
      window.dispatchEvent(new Event('cart-updated')) // Notify Navbar
      // Dispatch order confirmation notification
      window.dispatchEvent(new CustomEvent('new-notification', {
        detail: {
          type: 'order' as const,
          title: 'Order Confirmed!',
          message: `Your order #${order.id?.slice(0, 8) || ''} has been placed. Total: $${total.toFixed(2)}`,
          link: `/orders/${order.id}`,
        },
      }))
      showToast('Order placed successfully!', 'success') // Success toast
      router.push(`/orders/${order.id}`) // Redirect to order detail
    } catch {
      showToast('Order failed. Please try again.', 'error') // Error toast
    } finally {
      setPlacing(false) // Hide loading state
    }
  }

  return (
    <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page heading — text animation */}
      <ScrollReveal variant="text">
        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-8"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Checkout
        </h1>
      </ScrollReveal>

      {/* Step indicator — pop animation */}
      <ScrollReveal variant="pop">
        <div className="flex items-center gap-2 mb-10">
          {[
            { num: '01', label: 'Delivery' }, // Step 1 — active
            { num: '02', label: 'Review' }, // Step 2 — inactive
            { num: '03', label: 'Done' }, // Step 3 — inactive
          ].map((step, index) => (
            <div key={step.num} className="flex items-center gap-2">
              <span
                className={`text-xs font-bold ${
                  index === 0
                    ? 'text-[var(--color-accent)]' // Active step — lime
                    : 'text-[var(--color-text-dim)] opacity-40' // Inactive — dimmed
                }`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {step.num} {/* Step number */}
              </span>
              <span className={`text-sm ${
                index === 0 ? 'text-[var(--color-text)]' : 'text-[var(--color-text-dim)] opacity-40'
              }`}>
                {step.label} {/* Step label */}
              </span>
              {index < 2 && (
                // Divider line between steps
                <div className="w-8 h-px bg-[var(--color-border)] mx-2" />
              )}
            </div>
          ))}
        </div>
      </ScrollReveal>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* ═══════════════════════════════════════════════════════
            LEFT: Delivery Form (takes 3/5 width on desktop)
            Slides in from left with staggered card sections
            ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-3">
          <ScrollReveal variant="slide-left">
            <div className="card p-6">
              <h2
                className="font-semibold mb-6 flex items-center gap-2"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                <MapPinIcon className="w-5 h-5 text-[var(--color-accent)]" /> {/* Map pin icon */}
                Delivery Details
              </h2>

              <div className="space-y-4">
                {/* Address field — required */}
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Address *</label>
                  <textarea
                    value={address} // Controlled by state
                    onChange={(e) => setAddress(e.target.value)} // Update on change
                    className="glass-input resize-none" // Glass style, not resizable
                    rows={3} // 3 rows tall
                    placeholder="Street, building, landmark" // Placeholder hint
                    required // HTML required validation
                  />
                </div>

                {/* Phone field — required */}
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Phone *</label>
                  <input
                    type="tel" // Telephone input type
                    value={phone} // Controlled by state
                    onChange={(e) => setPhone(e.target.value)} // Update on change
                    className="glass-input"
                    placeholder="+1 234 567 890" // Placeholder hint
                    required // HTML required validation
                  />
                </div>

                {/* Note field — optional */}
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">
                    Note <span className="opacity-50">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={note} // Controlled by state
                    onChange={(e) => setNote(e.target.value)} // Update on change
                    className="glass-input"
                    placeholder="e.g. Ring the doorbell" // Placeholder hint
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* ═══════════════════════════════════════════════════════
            RIGHT: Order Summary (takes 2/5 width on desktop)
            Slides in from right
            ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2">
          <ScrollReveal variant="slide-right" delay={0.1}>
            <div className="card p-6 sticky top-24">
              <h2
                className="font-semibold mb-4"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Order Summary
              </h2>

              {/* Item list — each item as a row */}
              <div className="space-y-3 mb-4">
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-dim)] truncate mr-4">
                      {item.name} <span className="opacity-50">&times;{item.qty}</span> {/* Name x qty */}
                    </span>
                    <span className="font-medium shrink-0">${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="glass-divider" />

              {/* Subtotal + delivery */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-dim)]">Subtotal</span>
                  <span>${total.toFixed(2)}</span> {/* Subtotal amount */}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-dim)]">Delivery</span>
                  <span className="text-[var(--color-accent)]">Free</span> {/* Free delivery */}
                </div>
              </div>

              {/* Divider */}
              <div className="glass-divider" />

              {/* Total — large lime text */}
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg glow-text">${total.toFixed(2)}</span>
              </div>

              {/* Place Order button — full width coral pill */}
              <button
                onClick={placeOrder} // Place order handler
                disabled={placing || !address || !phone} // Disable if loading or missing required fields
                className="glass-button w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {placing ? 'Placing Order...' : `Place Order — $${total.toFixed(2)}`} {/* Dynamic label */}
              </button>

              {/* Security note */}
              <p className="text-xs text-[var(--color-text-dim)] text-center mt-4">
                &#x1F512; Secure checkout. Your data is encrypted.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
