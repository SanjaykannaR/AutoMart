/**
 * Checkout Page — Delivery details + order placement
 * 
 * Layout (desktop):
 *   ┌─────────────────────────────────────────────────────┐
 *   │  Step Indicator: 01 Delivery → 02 Review → 03 Done  │
 *   ├─────────────────────────┬─────────────────────────┤
 *   │  Left: Delivery Form    │  Right: Order Summary    │
 *   │  - Address textarea     │  - Item list             │
 *   │  - Phone input          │  - Subtotal + delivery   │
 *   │  - Note input           │  - Total (lime)          │
 *   │                         │  - Place Order CTA       │
 *   └─────────────────────────┴─────────────────────────┘
 * 
 * Layout (mobile):
 *   - Full-width stacked: form → summary → CTA
 * 
 * Flow:
 *   1. User fills delivery details
 *   2. Reviews order summary
 *   3. Clicks "Place Order"
 *   4. Order sent to API → clears cart → redirects to order detail
 * 
 * Validation:
 *   - Address and phone are required
 *   - Place Order button is disabled until both are filled
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { motion } from 'framer-motion'
import { MapPinIcon, PhoneIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'

interface CartItem {
  id: string
  name: string
  price: number
  qty: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [items, setItems] = useState<CartItem[]>([])
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)

  /** Load cart from localStorage on mount; redirect if empty */
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    if (cart.length === 0) router.push('/cart')
    setItems(cart)
  }, [])

  /** Calculate order total */
  const total = items.reduce((sum: number, item: any) => sum + item.price * item.qty, 0)

  /**
   * Place order via API.
   * On success: clears cart, shows toast, redirects to order detail.
   * On failure: shows error toast.
   */
  const placeOrder = async () => {
    setPlacing(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items, address, phone, note, total }),
      })
      const order = await res.json()
      localStorage.removeItem('cart')
      window.dispatchEvent(new Event('cart-updated'))
      showToast('Order placed successfully!', 'success')
      router.push(`/orders/${order.id}`)
    } catch {
      showToast('Order failed. Please try again.', 'error')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* ─── Page Heading ─── */}
      <h1
        className="text-2xl sm:text-3xl font-extrabold mb-8"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        Checkout
      </h1>

      {/* ─── Step Indicator ─── */}
      <div className="flex items-center gap-2 mb-10">
        {[
          { num: '01', label: 'Delivery' },
          { num: '02', label: 'Review' },
          { num: '03', label: 'Done' },
        ].map((step, index) => (
          <div key={step.num} className="flex items-center gap-2">
            <span
              className={`text-xs font-bold ${
                index === 0
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-dim)] opacity-40'
              }`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {step.num}
            </span>
            <span className={`text-sm ${
              index === 0 ? 'text-[var(--color-text)]' : 'text-[var(--color-text-dim)] opacity-40'
            }`}>
              {step.label}
            </span>
            {index < 2 && (
              <div className="w-8 h-px bg-[var(--color-border)] mx-2" />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* ═══════════════════════════════════════════════════════
            LEFT: Delivery Form (takes 3/5 width on desktop)
            ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="card p-6"
          >
            <h2
              className="font-semibold mb-6 flex items-center gap-2"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              <MapPinIcon className="w-5 h-5 text-[var(--color-accent)]" />
              Delivery Details
            </h2>

            <div className="space-y-4">
              {/* Address field */}
              <div>
                <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Address *</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="glass-input resize-none"
                  rows={3}
                  placeholder="Street, building, landmark"
                  required
                />
              </div>

              {/* Phone field */}
              <div>
                <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="glass-input"
                  placeholder="+1 234 567 890"
                  required
                />
              </div>

              {/* Note field (optional) */}
              <div>
                <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">
                  Note <span className="opacity-50">(optional)</span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="glass-input"
                  placeholder="e.g. Ring the doorbell"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            RIGHT: Order Summary (takes 2/5 width on desktop)
            ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="card p-6 sticky top-24"
          >
            <h2
              className="font-semibold mb-4"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Order Summary
            </h2>

            {/* Item list */}
            <div className="space-y-3 mb-4">
              {items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-dim)] truncate mr-4">
                    {item.name} <span className="opacity-50">×{item.qty}</span>
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

            {/* Place Order button */}
            <button
              onClick={placeOrder}
              disabled={placing || !address || !phone}
              className="glass-button w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {placing ? 'Placing Order...' : `Place Order — $${total.toFixed(2)}`}
            </button>

            {/* Security note */}
            <p className="text-xs text-[var(--color-text-dim)] text-center mt-4">
              🔒 Secure checkout. Your data is encrypted.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
