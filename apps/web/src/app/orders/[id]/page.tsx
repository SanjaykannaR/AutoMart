'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { GlassCard } from '@/components/GlassCard'

const statusSteps = ['pending', 'confirmed', 'picked', 'shipped', 'delivered']

const statusLabels: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed by Seller',
  picked: 'Picked from Store',
  shipped: 'Out for Delivery',
  delivered: 'Delivered',
}

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

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setOrder)
      .catch(() => setOrder(null))
  }, [id])

  useEffect(() => {
    if (!order) return
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [order])

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="skeleton h-8 w-48 mb-8" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    )
  }

  const currentIndex = statusSteps.indexOf(order.status)
  const minutes = Math.floor(elapsed / 60)
  const estimatedMinutes = 30
  const remaining = Math.max(0, estimatedMinutes - minutes)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/orders" className="text-sm text-[var(--color-text-muted)] hover:text-white mb-6 inline-block">
        &larr; Back to Orders
      </Link>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold">Order #{order.id.slice(0, 8)}</h1>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold glow-text">${order.total.toFixed(2)}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{order.items.length} items</p>
              </div>
            </div>

            <div className="glass p-4 mb-6 text-center">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">
                {remaining > 0 ? `Estimated delivery in ${remaining} min` : 'Should arrive any minute'}
              </p>
              <div className="w-full bg-white/5 rounded-full h-2 mt-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-purple)] transition-all"
                  style={{ width: `${Math.min(100, (minutes / estimatedMinutes) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-0">
              {statusSteps.map((step, i) => {
                const isComplete = i <= currentIndex
                const isCurrent = i === currentIndex
                return (
                  <div key={step} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          isComplete
                            ? 'bg-[var(--color-accent)]/20 border-2 border-[var(--color-accent)]'
                            : 'bg-white/5 border border-white/10'
                        } ${isCurrent ? 'animate-pulse' : ''}`}
                      >
                        {statusIcons[step]}
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div
                          className={`w-0.5 h-8 ${isComplete ? 'bg-[var(--color-accent)]' : 'bg-white/10'}`}
                        />
                      )}
                    </div>
                    <div className={`pb-8 ${isComplete ? '' : 'opacity-40'}`}>
                      <p className="font-medium text-sm">{statusLabels[step]}</p>
                      {isCurrent && (
                        <p className="text-xs text-[var(--color-accent)] mt-1">In progress</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="font-semibold text-sm mb-4">Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name}{' '}
                    <span className="text-[var(--color-text-muted)]">x{item.qty}</span>
                  </span>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="font-semibold text-sm mb-4">Delivery</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">{order.address}</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{order.phone}</p>
            {order.note && (
              <p className="text-xs text-[var(--color-text-muted)] mt-2">Note: {order.note}</p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
