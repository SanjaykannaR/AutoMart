/**
 * Orders Page — List of user's past orders
 * 
 * Layout:
 *   - Page heading "My Orders"
 *   - List of order cards, each showing:
 *     - Order ID (truncated) + date
 *     - Total price in lime
 *     - Status progress bar (lime fill on dark track)
 *     - Status label
 *   - Each card links to /orders/:id
 * 
 * Empty state:
 *   - "No orders yet" message with CTA to start shopping
 * 
 * Data:
 *   - Fetches from /api/orders with JWT token
 *   - Shows skeleton while loading
 *   - Falls back to empty array on error
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '@/components/ScrollReveal'

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  items: { name: string; qty: number }[]
}

/** Order lifecycle steps — each step represents a stage in delivery */
const statusSteps = ['pending', 'confirmed', 'picked', 'shipped', 'delivered']

/** Human-readable labels for each status */
const statusLabels: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  picked: 'Picked from Store',
  shipped: 'On the Way',
  delivered: 'Delivered',
}

/** Status badge color mapping */
const statusColors: Record<string, string> = {
  pending: 'bg-[var(--color-text-dim)]',
  confirmed: 'bg-[var(--color-blue)]',
  picked: 'bg-[var(--color-warning)]',
  shipped: 'bg-[var(--color-coral)]',
  delivered: 'bg-[var(--color-accent)]',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  /** Fetch orders from API on mount */
  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page heading — text animation */}
      <ScrollReveal variant="text">
        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-8"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          My Orders
        </h1>
      </ScrollReveal>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="flex justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 skeleton" />
                  <div className="h-3 w-20 skeleton" />
                </div>
                <div className="h-6 w-16 skeleton" />
              </div>
              <div className="h-2 w-full skeleton" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && orders.length === 0 && (
        <ScrollReveal variant="pop">
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
              <span className="text-3xl">📦</span>
            </div>
            <p className="text-[var(--color-text-dim)] mb-6">No orders yet</p>
            <Link href="/search" className="glass-button px-8 py-3">
              Start Shopping
            </Link>
          </div>
        </ScrollReveal>
      )}

      {/* Orders list — each card staggered with card animation */}
      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order, index) => {
            const currentIndex = statusSteps.indexOf(order.status)
            const progress = ((currentIndex + 1) / statusSteps.length) * 100

            return (
              <ScrollReveal key={order.id} variant="card" delay={index * 0.05}>
                <Link href={`/orders/${order.id}`}>
                  <div className="card p-5 cursor-pointer group hover:border-[var(--color-accent)]/20 transition-all duration-300">
                    {/* Order header — ID, date, total */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold group-hover:text-[var(--color-accent)] transition-colors">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-[var(--color-text-dim)] mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <p className="text-lg font-bold glow-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        ${order.total.toFixed(2)}
                      </p>
                    </div>

                    {/* Progress bar — lime fill on dark track */}
                    <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5 mb-2">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Status dots + label */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {statusSteps.map((step, i) => (
                          <div
                            key={step}
                            className={`w-1.5 h-1.5 rounded-full ${
                              i <= currentIndex ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-[var(--color-accent)]">
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            )
          })}
        </div>
      )}
    </div>
  )
}
