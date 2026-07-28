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

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAdminAuth } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Supabase client for Storage uploads (client-side, uses anon key) */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null
const PRODUCT_BUCKET = 'product-images'
const MAX_FILE_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Create form state ───
  const [form, setForm] = useState({
    name: '', description: '', brand: '', price: 0,
    categoryId: '', vehicleType: 'both' as string,
    stock: 0, imageUrl: '',
  })

  // ─── Open edit modal ───
  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      description: product.description,
      brand: product.brand,
      price: Number(product.price),
      categoryId: product.categoryId,
      vehicleType: product.vehicleType,
      stock: product.stock,
      imageUrl: product.imageUrl || '',
    })
    setShowCreate(true)
  }

  // ─── Open create modal ───
  const openCreate = () => {
    setEditingProduct(null)
    setForm({ name: '', description: '', brand: '', price: 0, categoryId: '', vehicleType: 'both', stock: 0, imageUrl: '' })
    setShowCreate(true)
  }

  // ─── Save product (create or update) ───
  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const url = editingProduct
        ? `${API}/api/products/${editingProduct.id}`
        : `${API}/api/products`
      const method = editingProduct ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || `Failed to ${editingProduct ? 'update' : 'create'} product`)
      }
      setShowCreate(false)
      setEditingProduct(null)
      setForm({ name: '', description: '', brand: '', price: 0, categoryId: '', vehicleType: 'both', stock: 0, imageUrl: '' })
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete product ───
  const handleDelete = async (product: Product) => {
    try {
      const res = await fetch(`${API}/api/products/${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to delete product')
      }
      setDeleteConfirm(null)
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ─── Upload product image to Supabase Storage ───
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!supabase) {
      setUploadError('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large (max 2 MB).')
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only PNG, JPEG, and WebP images allowed.')
      return
    }
    setUploading(true)
    setUploadError('')
    try {
      const ext = file.name.split('.').pop() || 'webp'
      const filename = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from(PRODUCT_BUCKET).upload(filename, file, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadErr) throw uploadErr
      const { data: urlData } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(filename)
      if (urlData?.publicUrl) {
        setForm({ ...form, imageUrl: urlData.publicUrl })
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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
        <div className="hidden md:grid grid-cols-[3fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-[var(--color-border)] text-xs text-[var(--color-text-dim)] font-medium uppercase tracking-wider">
          <span>Product</span>
          <span>Price</span>
          <span>Category</span>
          <span>Stock</span>
          <span>Vehicle</span>
          <span>Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-dim)]">
            No products found
          </div>
        ) : (
          filtered.map(product => (
            <div key={product.id} className="grid grid-cols-1 md:grid-cols-[3fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-alt)] transition-colors">
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
                <span className="text-sm font-semibold text-[var(--color-accent)]">₹{Number(product.price).toLocaleString('en-IN')}</span>
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

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(product)}
                  className="p-2 text-[var(--color-text-dim)] hover:text-[var(--color-blue)] hover:bg-[var(--color-blue)]/10 rounded-lg transition-colors"
                  title="Edit product"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteConfirm(product)}
                  className="p-2 text-[var(--color-text-dim)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-colors"
                  title="Delete product"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
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
                {editingProduct ? 'Edit Product' : 'Add Product'}
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
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Image</label>
                  <div className="flex gap-2">
                    <input type="url" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="glass-input flex-1" placeholder="https://..." />
                    <label className={`glass-button px-3 py-2 text-sm cursor-pointer shrink-0 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  {uploadError && <p className="text-xs text-[var(--color-danger)] mt-1">{uploadError}</p>}
                </div>
              </div>
              {form.imageUrl && (
                <div className="w-full h-32 rounded-lg overflow-hidden border border-[var(--color-border)]">
                  <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--color-border)]">
              <button onClick={() => { setShowCreate(false); setEditingProduct(null) }} className="px-4 py-2 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.description || !form.brand || !form.price || !form.categoryId}
                className="glass-button px-6 py-2 text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Delete Product
            </h3>
            <p className="text-sm text-[var(--color-text-dim)] mb-6">
              Are you sure you want to delete &ldquo;{deleteConfirm.name}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/80 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
