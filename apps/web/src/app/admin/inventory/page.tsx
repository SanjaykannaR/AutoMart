/**
 * Admin Inventory Page — view stock levels across all products.
 * 
 * Fetches products first, then queries inventory for each product.
 * Shows stock status, reserved counts, and low-stock alerts.
 * Since there's no list-all inventory endpoint, we batch per-product lookups.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '@/lib/admin-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Inventory record for a single product */
interface InventoryItem {
  productId: string
  productName: string
  quantity: number
  reserved: number
  available: number
}

export default function AdminInventoryPage() {
  const { token } = useAdminAuth()

  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'in-stock' | 'low' | 'out'>('all')
  const [search, setSearch] = useState('')

  // ─── Fetch products + inventory in parallel ───
  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const headers = { Authorization: `Bearer ${token}` }

      // Step 1: Fetch all products
      const prodRes = await fetch(`${API}/api/products`, { headers })
      if (!prodRes.ok) throw new Error('Failed to fetch products')
      const products = await prodRes.json()

      // Step 2: Fetch inventory for each product in parallel
      const inventoryResults = await Promise.allSettled(
        products.map(async (p: any) => {
          const invRes = await fetch(`${API}/api/inventory/${p.id}`, { headers })
          if (!invRes.ok) {
            // Product has no inventory record — treat as 0 stock
            return {
              productId: p.id,
              productName: p.name,
              quantity: 0,
              reserved: 0,
              available: 0,
            }
          }
          const inv = await invRes.json()
          return {
            productId: p.id,
            productName: p.name,
            quantity: inv.quantity || 0,
            reserved: inv.reserved || 0,
            available: inv.available || 0,
          }
        })
      )

      // Collect successful results
      const inventoryItems = inventoryResults
        .filter((r): r is PromiseFulfilledResult<InventoryItem> => r.status === 'fulfilled')
        .map(r => r.value)

      setItems(inventoryItems)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Filter items ───
  const filtered = items.filter(item => {
    if (search && !item.productName.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'in-stock' && item.quantity <= 0) return false
    if (filter === 'low' && (item.quantity <= 0 || item.quantity > 10)) return false
    if (filter === 'out' && item.quantity > 0) return false
    return true
  })

  // ─── Summary stats ───
  const totalProducts = items.length
  const inStock = items.filter(i => i.quantity > 0).length
  const lowStock = items.filter(i => i.quantity > 0 && i.quantity <= 10).length
  const outOfStock = items.filter(i => i.quantity === 0).length

  // ─── Stock status badge ───
  const stockBadge = (item: InventoryItem) => {
    if (item.quantity === 0) return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-danger)]/15 text-[var(--color-danger)]">Out of Stock</span>
    if (item.quantity <= 10) return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-warning)]/15 text-[var(--color-warning)]">Low Stock</span>
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">In Stock</span>
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="w-40 h-8 bg-[var(--color-surface)] rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse">
              <div className="w-16 h-8 bg-[var(--color-surface-alt)] rounded mb-2" />
              <div className="w-20 h-4 bg-[var(--color-surface-alt)] rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>Inventory</h1>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)]">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: totalProducts, color: 'var(--color-text)' },
          { label: 'In Stock', value: inStock, color: 'var(--color-success)' },
          { label: 'Low Stock', value: lowStock, color: 'var(--color-warning)' },
          { label: 'Out of Stock', value: outOfStock, color: 'var(--color-danger)' },
        ].map(stat => (
          <div key={stat.label} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
            <p className="text-2xl font-bold" style={{ color: stat.color, fontFamily: 'Outfit, sans-serif' }}>{stat.value}</p>
            <p className="text-xs text-[var(--color-text-dim)] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="glass-input flex-1 text-sm"
        />
        <div className="flex gap-2">
          {(['all', 'in-stock', 'low', 'out'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-lg border capitalize transition-colors ${
                filter === f
                  ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
              }`}
            >
              {f === 'all' ? 'All' : f === 'in-stock' ? 'In Stock' : f === 'low' ? 'Low' : 'Out'}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[3fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-[var(--color-border)] text-xs text-[var(--color-text-dim)] font-medium uppercase tracking-wider">
          <span>Product</span>
          <span>Total Stock</span>
          <span>Reserved</span>
          <span>Available</span>
          <span>Status</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-dim)]">No inventory records found</div>
        ) : (
          filtered.map(item => (
            <div key={item.productId} className="grid grid-cols-1 md:grid-cols-[3fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-alt)] transition-colors">
              <span className="text-sm text-[var(--color-text)] truncate">{item.productName}</span>
              <span className="text-sm text-[var(--color-text)]">{item.quantity}</span>
              <span className="text-sm text-[var(--color-warning)]">{item.reserved}</span>
              <span className="text-sm text-[var(--color-accent)]">{item.available}</span>
              <div>{stockBadge(item)}</div>
            </div>
          ))
        )}
        <div className="px-6 py-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-dim)]">
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
