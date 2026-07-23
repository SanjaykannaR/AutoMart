/**
 * Checkout Page — Delivery details + Stripe payment
 *
 * Layout (desktop):
 *   ┌─────────────────────────────────────────────────────┐
 *   │  Step Indicator: 01 Delivery -> 02 Payment -> 03 Done│
 *   ├─────────────────────────┬─────────────────────────┤
 *   │  Left: Delivery Form    │  Right: Order Summary    │
 *   │  - Address textarea     │  - Item list             │
 *   │  - Phone input          │  - Subtotal + delivery   │
 *   │  - Note input           │  - Total (lime)          │
 *   │                         │  - Pay with Card CTA     │
 *   └─────────────────────────┴─────────────────────────┘
 *
 * Flow:
 *   1. User fills delivery details
 *   2. Clicks "Pay with Card"
 *   3. Order created (status: pending)
 *   4. Stripe Checkout Session created
 *   5. User redirected to Stripe-hosted payment page
 *   6. After payment → redirected to /checkout/success
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { ScrollReveal } from '@/components/ScrollReveal'
import { MapPinIcon, PhoneIcon, CreditCardIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { Suspense } from 'react'

interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  image?: string
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const [items, setItems] = useState<CartItem[]>([])
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)

  // Check if user returned from cancelled payment
  useEffect(() => {
    if (searchParams.get('cancelled') === 'true') {
      showToast('Payment was cancelled. Your order was not placed.', 'info')
    }
  }, [searchParams, showToast])

  // Load cart from localStorage
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    if (cart.length === 0) router.push('/cart')
    setItems(cart)
  }, [router])

  const total = items.reduce((sum: number, item: any) => sum + item.price * item.qty, 0)

  /**
   * Handle checkout — creates order + Stripe session, then redirects.
   */
  const handleCheckout = async () => {
    setPlacing(true)
    try {
      const token = localStorage.getItem('token')

      // Step 1: Create order (status: pending)
      const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ items, address, phone, note, total }),
      })

      if (!orderRes.ok) {
        const err = await orderRes.json()
        throw new Error(err.message || 'Failed to create order')
      }

      const order = await orderRes.json()

      // Step 2: Create Stripe Checkout Session
      const paymentRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map(i => ({ name: i.name, price: i.price, qty: i.qty, image: i.image })),
          orderId: order.id,
          total,
          address,
          phone,
        }),
      })

      if (!paymentRes.ok) {
        const err = await paymentRes.json()
        throw new Error(err.message || 'Failed to create payment session')
      }

      const { url } = await paymentRes.json()

      // Step 3: Clear cart and redirect to Stripe
      localStorage.removeItem('cart')
      window.dispatchEvent(new Event('cart-updated'))

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (err: any) {
      showToast(err.message || 'Checkout failed. Please try again.', 'error')
      setPlacing(false)
    }
  }

  return (
    <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ScrollReveal variant="text">
        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-8"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Checkout
        </h1>
      </ScrollReveal>

      {/* Step indicator */}
      <ScrollReveal variant="pop">
        <div className="flex items-center gap-2 mb-10">
          {[
            { num: '01', label: 'Delivery', active: true },
            { num: '02', label: 'Payment', active: false },
            { num: '03', label: 'Done', active: false },
          ].map((step, index) => (
            <div key={step.num} className="flex items-center gap-2">
              <span
                className={`text-xs font-bold ${
                  step.active
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-text-dim)] opacity-40'
                }`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {step.num}
              </span>
              <span className={`text-sm ${
                step.active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-dim)] opacity-40'
              }`}>
                {step.label}
              </span>
              {index < 2 && <div className="w-8 h-px bg-[var(--color-border)] mx-2" />}
            </div>
          ))}
        </div>
      </ScrollReveal>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* LEFT: Delivery Form */}
        <div className="lg:col-span-3">
          <ScrollReveal variant="slide-left">
            <div className="card p-6">
              <h2
                className="font-semibold mb-6 flex items-center gap-2"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                <MapPinIcon className="w-5 h-5 text-[var(--color-accent)]" />
                Delivery Details
              </h2>

              <div className="space-y-4">
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
            </div>
          </ScrollReveal>
        </div>

        {/* RIGHT: Order Summary + Pay Button */}
        <div className="lg:col-span-2">
          <ScrollReveal variant="slide-right" delay={0.1}>
            <div className="card p-6 sticky top-24">
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
                      {item.name} <span className="opacity-50">&times;{item.qty}</span>
                    </span>
                    <span className="font-medium shrink-0">${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

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

              <div className="glass-divider" />

              {/* Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg glow-text">${total.toFixed(2)}</span>
              </div>

              {/* Pay with Card button */}
              <button
                onClick={handleCheckout}
                disabled={placing || !address || !phone}
                className="glass-button w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {placing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Redirecting to Stripe...
                  </>
                ) : (
                  <>
                    <CreditCardIcon className="w-5 h-5" />
                    Pay with Card — ${total.toFixed(2)}
                  </>
                )}
              </button>

              {/* Security badges */}
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[var(--color-text-dim)]">
                <span className="flex items-center gap-1">
                  <LockClosedIcon className="w-3 h-3" />
                  SSL Encrypted
                </span>
                <span>Powered by Stripe</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="skeleton h-8 w-48 mb-8" />
        <div className="skeleton h-6 w-64 mb-10" />
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3"><div className="skeleton h-80 rounded-xl" /></div>
          <div className="lg:col-span-2"><div className="skeleton h-80 rounded-xl" /></div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
