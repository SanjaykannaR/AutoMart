/**
 * Admin Products Page — manage the product catalog.
 * 
 * Features:
 *   - List all products with search, category, and vehicle type filters
 *   - Create new product via modal form
 *   - View product details
 *   - Stock level indicators (green/yellow/red)
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '@/lib/admin-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Shape of a product from the API */
interface Product {
  id: string
  name: string
  description: string
  brand: string
  price: number
  categoryId: string
  category?: { id: string; name: string }
  vehicleType: string
  compatibleVehicles: string[]
  stock: number
  imageUrl?: string
  slug: string
  createdAt: string
}

/** Shape of a category from the API */
interface Category {
  id: string
  name: string
}

export default function AdminProductsPage() {
  const { token } = useAdminAuth()

  // ─── State ───
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterVehicle, setFilterVehicle] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)

  // ─── Create form state ───
  const [form, setForm] = useState({
    name: '', description: '', brand: '', price: 0,
    categoryId: '', vehicleType: 'both' as string,
    stock: 0, imageUrl: '',
  })

  // ─── Fetch products and categories ───
  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [prodRes, catRes] = await Promise.all([
        fetch(`${API}/api/products`, { headers }),
        fetch(`${API}/api/products/categories`, { headers }),
      ])
      if (prodRes.ok) {
        const data = await prodRes.json()
        setProducts(Array.isArray(data) ? data : [])
      }
      if (catRes.ok) {
        const data = await catRes.json()
        setCategories(Array.isArray(data) ? data : [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Create product ───
  const handleCreate = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to create product')
      }
      setShowCreate(false)
      setForm({ name: '', description: '', brand: '', price: 0, categoryId: '', vehicleType: 'both', stock: 0, imageUrl: '' })
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Filter products client-side ───
  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCategory && p.categoryId !== filterCategory) return false
    if (filterVehicle && p.vehicleType !== filterVehicle && p.vehicleType !== 'both') return false
    return true
  })

  // ─── Stock level badge ───
  const stockBadge = (stock: number) => {
    if (stock === 0) return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-danger)]/15 text-[var(--color-danger)]">Out of Stock</span>
    if (stock <= 10) return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-warning)]/15 text-[var(--color-warning)]">Low ({stock})</span>
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">{stock}</span>
  }

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="w-40 h-8 bg-[var(--color-surface)] rounded animate-pulse" />
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-4 py-3 border-b border-[var(--color-border)]">
              <div className="w-12 h-12 bg-[var(--color-surface-alt)] rounded" />
              <div className="flex-1">
                <div className="w-48 h-4 bg-[var(--color-surface-alt)] rounded mb-2" />
                <div className="w-32 h-3 bg-[var(--color-surface-alt)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Products
        </h1>
        <button onClick={() => setShowCreate(true)} className="glass-button px-4 py-2 text-sm">
          + Add Product
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* ─── Filters ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or brand..."
          className="glass-input flex-1 text-sm"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="glass-input text-sm"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterVehicle}
          onChange={e => setFilterVehicle(e.target.value)}
          className="glass-input text-sm"
        >
          <option value="">All Vehicles</option>
          <option value="car">Car</option>
          <option value="bike">Bike</option>
        </select>
      </div>

      {/* ─── Products Table ─── */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[3fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-[var(--color-border)] text-xs text-[var(--color-text-dim)] font-medium uppercase tracking-wider">
          <span>Product</span>
          <span>Price</span>
          <span>Category</span>
          <span>Stock</span>
          <span>Vehicle</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-dim)]">
            No products found
          </div>
        ) : (
          filtered.map(product => (
            <div key={product.id} className="grid grid-cols-1 md:grid-cols-[3fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-alt)] transition-colors">
              {/* Product name + brand + thumbnail */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-alt)] overflow-hidden shrink-0 border border-[var(--color-border)]">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-dim)] text-xs">N/A</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{product.name}</p>
                  <p className="text-xs text-[var(--color-text-dim)] truncate">{product.brand}</p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center">
                <span className="text-sm font-semibold text-[var(--color-accent)]">${Number(product.price).toFixed(2)}</span>
              </div>

              {/* Category */}
              <div className="flex items-center">
                <span className="text-sm text-[var(--color-text-dim)]">{product.category?.name || '—'}</span>
              </div>

              {/* Stock */}
              <div className="flex items-center">
                {stockBadge(product.stock)}
              </div>

              {/* Vehicle type */}
              <div className="flex items-center">
                <span className="text-xs text-[var(--color-text-dim)] capitalize">{product.vehicleType}</span>
              </div>
            </div>
          ))
        )}

        {/* Product count */}
        <div className="px-6 py-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-dim)]">
          {filtered.length} product{filtered.length !== 1 ? 's' : ''} total
        </div>
      </div>

      {/* ─── Create Product Modal ─── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Add Product
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Product Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="glass-input" placeholder="Ceramic Brake Pads" required />
              </div>
              <div>
                <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Description *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="glass-input min-h-[80px]" placeholder="Premium ceramic brake pads..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Brand *</label>
                  <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="glass-input" placeholder="Bosch" required />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Price *</label>
                  <input type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="glass-input" placeholder="29.99" min={0} step={0.01} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Category *</label>
                  <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="glass-input" required>
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Vehicle Type</label>
                  <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })} className="glass-input">
                    <option value="both">Both</option>
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Initial Stock</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className="glass-input" min={0} />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Image URL</label>
                  <input type="url" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="glass-input" placeholder="https://..." />
                </div>
              </div>
              {form.imageUrl && (
                <div className="w-full h-32 rounded-lg overflow-hidden border border-[var(--color-border)]">
                  <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--color-border)]">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.name || !form.description || !form.brand || !form.price || !form.categoryId}
                className="glass-button px-6 py-2 text-sm disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
