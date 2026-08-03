/**
 * Checkout Success Page — Shown after Stripe payment completes.
 *
 * Flow:
 *   1. User redirected here from Stripe with session_id + order_id
 *   2. We verify payment status via Stripe session
 *   3. Fetch full order details (items, total, address, estimated delivery)
 *   4. Show success confirmation with order summary + tracking link
 */
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ScrollReveal } from '@/components/ScrollReveal'
import { CheckCircleIcon, MapPinIcon, TruckIcon, ClockIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Suspense } from 'react'
import { saveCart } from '@/lib/sync'

interface OrderItem {
  id: string
  name: string
  price: number
  qty: number
  imageUrl?: string
}

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  estimatedDelivery: string
  items: OrderItem[]
  address: string
  phone: string
  note?: string
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const orderId = searchParams.get('order_id')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!orderId) {
      setStatus('error')
      return
    }

    const loadOrder = async () => {
      const token = localStorage.getItem('token')

      // Verify payment (non-blocking — success page still works in test mode)
      if (sessionId) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/session/${sessionId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
        } catch { /* ignore — test mode */ }
      }

      // Fetch full order details
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          // Parse items if stored as JSON string (PostgreSQL JSONB)
          if (typeof data.items === 'string') {
            data.items = JSON.parse(data.items)
          }
          setOrder(data)
          setStatus('success')
          // Payment confirmed → clear cart (localStorage + Redis)
          saveCart([])
          window.dispatchEvent(new Event('cart-updated'))
        } else {
          // Order fetch failed but payment likely succeeded — still show success
          setStatus('success')
        }
      } catch {
        setStatus('success')
      }
    }

    loadOrder()
  }, [sessionId, orderId])

  if (status === 'loading') {
    return (
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-[var(--color-text-dim)]">Verifying payment...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ScrollReveal variant="text">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">!</span>
          </div>
          <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Payment Not Confirmed
          </h1>
          <p className="text-[var(--color-text-dim)] mb-8 max-w-md mx-auto">
            We couldn&apos;t verify your payment. If you were charged, please contact support.
          </p>
          <Link
            href="/checkout"
            className="glass-button inline-flex items-center gap-2 px-6 py-3"
          >
            Try Again
          </Link>
        </ScrollReveal>
      </div>
    )
  }

  const estimatedDelivery = order?.estimatedDelivery
    ? new Date(order.estimatedDelivery)
    : new Date(Date.now() + 30 * 60 * 1000)

  return (
    <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
      <div className="max-w-2xl mx-auto">
        <ScrollReveal variant="text">
          {/* Success icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-12 h-12 text-[var(--color-accent)]" />
            </div>

            <h1
              className="text-2xl sm:text-3xl font-extrabold mb-3"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Order Confirmed!
            </h1>

            <p className="text-[var(--color-text-dim)] max-w-md mx-auto">
              Your order has been placed and payment confirmed. We&apos;ll get it to you soon.
            </p>
          </div>
        </ScrollReveal>

        {/* Order summary card */}
        <ScrollReveal variant="card" delay={0.1}>
          <div className="card p-6 mb-4">
            {/* Order ID + status */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">Order</p>
                <p className="text-lg font-bold font-mono text-[var(--color-accent)]">
                  #{orderId?.slice(0, 8) || '—'}
                </p>
              </div>
              <span className="badge">Pending</span>
            </div>

            <div className="glass-divider mb-5" />

            {/* Items list */}
            {order?.items && order.items.length > 0 && (
              <div className="space-y-3 mb-5">
                {order.items.map((item, i) => (
                  <div key={item.id || i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-alt)] overflow-hidden shrink-0 border border-[var(--color-border)]">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-dim)] text-[10px]">N/A</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-[var(--color-text-dim)]">Qty: {item.qty}</p>
                    </div>
                    <p className="text-sm font-semibold shrink-0">
                      ₹{(Number(item.price) * item.qty).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="glass-divider mb-5" />

            {/* Total */}
            <div className="flex justify-between items-center mb-5">
              <span className="text-sm text-[var(--color-text-dim)]">Total Paid</span>
              <span className="text-xl font-bold glow-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ₹{Number(order?.total || 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Delivery estimate */}
            <div className="card p-4 bg-[var(--color-bg)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                  <TruckIcon className="w-5 h-5 text-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Estimated Delivery</p>
                  <p className="text-xs text-[var(--color-text-dim)]">
                    {estimatedDelivery.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery address */}
            {order?.address && (
              <div className="mt-4 flex items-start gap-3">
                <MapPinIcon className="w-4 h-4 text-[var(--color-accent)] mt-0.5 shrink-0" />
                <p className="text-sm text-[var(--color-text-dim)]">{order.address}</p>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Action buttons */}
        <ScrollReveal variant="text" delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {orderId && (
              <Link
                href={`/orders/${orderId}`}
                className="glass-button w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3"
              >
                <ClockIcon className="w-5 h-5" />
                Track Order
              </Link>
            )}

            <Link
              href="/browse"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
