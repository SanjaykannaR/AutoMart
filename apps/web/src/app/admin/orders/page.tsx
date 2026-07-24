/**
 * Admin Orders Page — view and manage all orders.
 * 
 * Features:
 *   - List all orders with status filter
 *   - View order details in expandable panel
 *   - Update order status (state machine: pending→confirmed→picked→shipped→delivered)
 *   - Status badges color-coded by state
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '@/lib/admin-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Valid order statuses */
const STATUSES = ['pending', 'confirmed', 'picked', 'shipped', 'delivered', 'cancelled'] as const

/** Status color mapping for badges */
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-[var(--color-text-dim)]/15 text-[var(--color-text-dim)]',
  confirmed: 'bg-[var(--color-blue)]/15 text-[var(--color-blue)]',
  picked: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  shipped: 'bg-purple-500/15 text-purple-400',
  delivered: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
  cancelled: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]',
}

/** Order item shape */
interface OrderItem {
  id: string
  name: string
  price: number
  qty: number
}

/** Order shape from the API */
interface Order {
  id: string
  userId: string
  items: string | OrderItem[]
  total: number
  address: string
  phone: string
  note?: string
  status: string
  estimatedDelivery: string
  deliveredAt?: string
  createdAt: string
}

export default function AdminOrdersPage() {
  const { token } = useAdminAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // ─── Fetch orders ───
  const fetchOrders = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ─── Update order status ───
  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    try {
      const res = await fetch(`${API}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to update status')
      }
      await fetchOrders()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdatingStatus(null)
    }
  }

  // ─── Parse order items (handles both JSON string and parsed array) ───
  const parseItems = (items: string | OrderItem[]): OrderItem[] => {
    if (typeof items === 'string') {
      try { return JSON.parse(items) } catch { return [] }
    }
    return items
  }

  // ─── Filter orders ───
  const filtered = orders.filter(o => !filterStatus || o.status === filterStatus)

  // ─── Format date ───
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="w-40 h-8 bg-[var(--color-surface)] rounded animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 animate-pulse">
            <div className="flex gap-4"><div className="w-24 h-4 bg-[var(--color-surface-alt)] rounded" /></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>Orders</h1>
        <span className="text-sm text-[var(--color-text-dim)]">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)]">{error}</div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${!filterStatus ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'}`}
        >All</button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-xs rounded-lg border capitalize transition-colors ${filterStatus === s ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'}`}
          >{s}</button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 text-center text-[var(--color-text-dim)]">
          No orders found
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const items = parseItems(order.items)
            const isExpanded = expandedOrder === order.id
            return (
              <div key={order.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
                {/* Order row */}
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[var(--color-surface-alt)] transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  {/* Expand arrow */}
                  <svg className={`w-4 h-4 text-[var(--color-text-dim)] transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>

                  {/* Order ID */}
                  <span className="text-xs font-mono text-[var(--color-text-dim)] w-20 shrink-0">#{order.id.slice(0, 8)}</span>

                  {/* Date */}
                  <span className="text-xs text-[var(--color-text-dim)] w-24 shrink-0 hidden sm:block">{formatDate(order.createdAt)}</span>

                  {/* Items count */}
                  <span className="text-xs text-[var(--color-text-dim)] w-16 shrink-0">{items.length} item{items.length !== 1 ? 's' : ''}</span>

                  {/* Total */}
                  <span className="text-sm font-semibold text-[var(--color-accent)] w-20 shrink-0">${Number(order.total).toFixed(2)}</span>

                  {/* Status badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                    {order.status}
                  </span>

                  {/* Expand indicator */}
                  <svg className={`w-4 h-4 text-[var(--color-text-dim)] ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="px-6 pb-4 border-t border-[var(--color-border)] pt-4 space-y-4">
                    {/* Items list */}
                    <div>
                      <h4 className="text-xs font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-2">Items</h4>
                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-[var(--color-text)]">{item.name} × {item.qty}</span>
                            <span className="text-[var(--color-accent)]">${(item.price * item.qty).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1">Delivery Address</h4>
                        <p className="text-sm text-[var(--color-text)]">{order.address}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1">Phone</h4>
                        <p className="text-sm text-[var(--color-text)]">{order.phone}</p>
                      </div>
                      {order.note && (
                        <div className="sm:col-span-2">
                          <h4 className="text-xs font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1">Note</h4>
                          <p className="text-sm text-[var(--color-text-dim)]">{order.note}</p>
                        </div>
                      )}
                    </div>

                    {/* Status update */}
                    <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-border)]">
                      <span className="text-xs text-[var(--color-text-dim)]">Update status:</span>
                      <div className="flex gap-2 flex-wrap">
                        {STATUSES.map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(order.id, s)}
                            disabled={updatingStatus === order.id || order.status === s}
                            className={`px-3 py-1 text-xs rounded-lg border capitalize transition-colors disabled:opacity-40 ${
                              order.status === s
                                ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-accent)]'
                                : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]/30'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
