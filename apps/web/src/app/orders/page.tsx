'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GlassCard } from '@/components/GlassCard'

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  items: { name: string; qty: number }[]
}

const statusSteps = ['pending', 'confirmed', 'picked', 'shipped', 'delivered']

const statusLabels: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  picked: 'Picked from Store',
  shipped: 'On the Way',
  delivered: 'Delivered',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => setOrders([]))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--color-text-muted)] mb-4">No orders yet</p>
          <Link href="/search" className="glass-button px-6 py-2">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <GlassCard className="p-5 cursor-pointer hover:bg-white/[0.07] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-lg font-bold glow-text">${order.total.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {statusSteps.map((step, i) => {
                      const currentIndex = statusSteps.indexOf(order.status)
                      const isComplete = i <= currentIndex
                      return (
                        <div
                          key={step}
                          className={`w-2 h-2 rounded-full ${
                            isComplete ? 'bg-[var(--color-accent)]' : 'bg-white/10'
                          }`}
                        />
                      )
                    })}
                  </div>
                  <span className="text-xs text-[var(--color-accent)]">
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
