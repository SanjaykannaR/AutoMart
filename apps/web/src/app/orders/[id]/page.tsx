/**
 * Order Detail Page — Full order view with tracking timeline
 * 
 * Layout (desktop):
 *   ┌─────────────────────────────┬────────────────────┐
 *   │  Order Header + Timeline    │  Sidebar            │
 *   │  - Order ID + date          │  - Items list       │
 *   │  - Progress bar             │  - Delivery info    │
 *   │  - Status timeline (vertical)│  - Total            │
 *   │    with lime active steps   │                     │
 *   └─────────────────────────────┴────────────────────┘
 * 
 * Timeline:
 *   - Vertical timeline with 5 steps (pending → delivered)
 *   - Active step has lime circle + "In progress" label
 *   - Completed steps have lime fill
 *   - Future steps are dimmed
 *   - Current step pulses subtly
 * 
 * Progress bar:
 *   - Lime fill on dark track
 *   - Shows estimated time remaining
 *   - Animates as time passes
 * 
 * Data:
 *   - Fetches from /api/orders/:id with JWT token
 *   - Shows skeleton while loading
 *   - Elapsed timer updates every second for delivery estimate
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPinIcon, PhoneIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'

/** Order lifecycle steps — displayed as a vertical timeline */
const statusSteps = ['pending', 'confirmed', 'picked', 'shipped', 'delivered']

/** Human-readable labels for each status */
const statusLabels: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed by Seller',
  picked: 'Picked from Store',
  shipped: 'Out for Delivery',
  delivered: 'Delivered',
}

/** Icons for each status step */
const statusIcons: Record<string, string> = {
  pending: '📋',
  confirmed: '✅',
  picked: '📦',
  shipped: '🚚',
  delivered: '🎉',
}

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  items: { id: string; name: string; price: number; qty: number }[]
  address: string
  phone: string
  note: string
  estimatedDelivery: string
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [elapsed, setElapsed] = useState(0)

  /** Fetch order data from API */
  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setOrder)
      .catch(() => setOrder(null))
  }, [id])

  /** Elapsed timer — counts seconds since page load for delivery estimate */
  useEffect(() => {
    if (!order) return
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [order])

  /** Loading skeleton */
  if (!order) {
    return (
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="skeleton h-4 w-32 mb-8" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="card p-6">
              <div className="skeleton h-8 w-48 mb-4" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          </div>
          <div className="card p-6">
            <div className="skeleton h-4 w-24 mb-4" />
            <div className="skeleton h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  const currentIndex = statusSteps.indexOf(order.status)
  const minutes = Math.floor(elapsed / 60)
  const estimatedMinutes = 30
  const remaining = Math.max(0, estimatedMinutes - minutes)
  const progress = ((currentIndex + 1) / statusSteps.length) * 100

  return (
    <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* ─── Back Link ─── */}
      <Link
        href="/orders"
        className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-accent)] mb-6 inline-block transition-colors"
      >
        ← Back to Orders
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ═══════════════════════════════════════════════════════
            LEFT: Order Header + Timeline (takes 2/3)
            ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="card p-6"
          >
            {/* Order header — ID, date, total */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1
                  className="text-xl font-bold"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Order #{order.id.slice(0, 8)}
                </h1>
                <p className="text-sm text-[var(--color-text-dim)] mt-1">
                  {new Date(order.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold glow-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  ${order.total.toFixed(2)}
                </p>
                <p className="text-xs text-[var(--color-text-dim)]">{order.items.length} items</p>
              </div>
            </div>

            {/* Delivery progress bar */}
            <div className="card p-4 mb-8 bg-[var(--color-bg)]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[var(--color-text-dim)]">
                  {remaining > 0
                    ? `Estimated delivery in ${remaining} min`
                    : 'Should arrive any minute'}
                </p>
                <span className="badge">{order.status}</span>
              </div>
              <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-1000"
                  style={{ width: `${Math.min(100, (minutes / estimatedMinutes) * 100)}%` }}
                />
              </div>
            </div>

            {/* ─── Vertical Timeline ─── */}
            <div className="space-y-0">
              {statusSteps.map((step, i) => {
                const isComplete = i <= currentIndex
                const isCurrent = i === currentIndex

                return (
                  <div key={step} className="flex gap-4">
                    {/* Left column: circle + connector line */}
                    <div className="flex flex-col items-center">
                      {/* Status circle */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                          isComplete
                            ? 'bg-[var(--color-accent)]/15 border-2 border-[var(--color-accent)]'
                            : 'bg-[var(--color-surface)] border border-[var(--color-border)]'
                        } ${isCurrent ? 'animate-pulse' : ''}`}
                      >
                        {statusIcons[step]}
                      </div>
                      {/* Connector line (not on last step) */}
                      {i < statusSteps.length - 1 && (
                        <div
                          className={`w-0.5 h-8 transition-colors duration-300 ${
                            isComplete ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
                          }`}
                        />
                      )}
                    </div>

                    {/* Right column: label + status text */}
                    <div className={`pb-8 ${isComplete ? '' : 'opacity-30'}`}>
                      <p className="font-medium text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {statusLabels[step]}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-[var(--color-accent)] mt-1 font-medium">In progress</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            RIGHT: Sidebar — Items + Delivery Info
            ═══════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          {/* Items list */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="card p-5"
          >
            <h3
              className="font-semibold text-sm mb-4"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-dim)] truncate mr-4">
                    {item.name} <span className="opacity-50">×{item.qty}</span>
                  </span>
                  <span className="font-medium shrink-0">${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Delivery info */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="card p-5"
          >
            <h3
              className="font-semibold text-sm mb-4"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Delivery Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-4 h-4 text-[var(--color-accent)] mt-0.5 shrink-0" />
                <p className="text-sm text-[var(--color-text-dim)]">{order.address}</p>
              </div>
              <div className="flex items-center gap-3">
                <PhoneIcon className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                <p className="text-sm text-[var(--color-text-dim)]">{order.phone}</p>
              </div>
              {order.note && (
                <div className="flex items-center gap-3">
                  <ChatBubbleLeftIcon className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                  <p className="text-sm text-[var(--color-text-dim)]">{order.note}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Total */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="card p-5"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-text-dim)]">Total</span>
              <span className="text-xl font-bold glow-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ${order.total.toFixed(2)}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
