/**
 * Admin Banners Page — CRUD management for homepage hero banners.
 * 
 * Features:
 *   - List all banners with order, headline, badge, active status
 *   - Create new banner via modal form
 *   - Edit existing banner via modal form
 *   - Delete with confirmation dialog
 *   - Reorder via up/down arrows
 *   - Toggle active/inactive status
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '@/lib/admin-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Shape of a banner object from the API */
interface Banner {
  id: string
  headline: string
  subtitle: string
  badge: string
  cta: string
  link: string
  gradient: string
  image: string
  accent: string
  isActive: boolean
  order: number
  createdAt?: string
}

/** Default form state for creating a new banner */
const EMPTY_FORM: Omit<Banner, 'id' | 'createdAt'> = {
  headline: '',
  subtitle: '',
  badge: '',
  cta: '',
  link: '/',
  gradient: 'from-gray-900 via-gray-800 to-gray-900',
  image: '',
  accent: '#39FF14',
  isActive: true,
  order: 0,
}

export default function AdminBannersPage() {
  const { token } = useAdminAuth()

  // ─── State ───
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Banner | null>(null)

  // ─── Fetch banners from API ───
  const fetchBanners = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/api/auth/admin/banners`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch banners')
      const data = await res.json()
      setBanners(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchBanners() }, [fetchBanners])

  // ─── Open create modal ───
  const openCreate = () => {
    setEditingBanner(null)
    setForm({ ...EMPTY_FORM, order: banners.length })
    setShowModal(true)
  }

  // ─── Open edit modal ───
  const openEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setForm({
      headline: banner.headline,
      subtitle: banner.subtitle,
      badge: banner.badge,
      cta: banner.cta,
      link: banner.link,
      gradient: banner.gradient,
      image: banner.image,
      accent: banner.accent,
      isActive: banner.isActive,
      order: banner.order,
    })
    setShowModal(true)
  }

  // ─── Save banner (create or update) ───
  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const url = editingBanner
        ? `${API}/api/auth/admin/banners/${editingBanner.id}`
        : `${API}/api/auth/admin/banners`
      const method = editingBanner ? 'PATCH' : 'POST'

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
        throw new Error(data.message || 'Failed to save banner')
      }

      setShowModal(false)
      await fetchBanners()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete banner ───
  const handleDelete = async (banner: Banner) => {
    try {
      const res = await fetch(`${API}/api/auth/admin/banners/${banner.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete banner')
      setDeleteConfirm(null)
      await fetchBanners()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ─── Toggle active status ───
  const toggleActive = async (banner: Banner) => {
    try {
      await fetch(`${API}/api/auth/admin/banners/${banner.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !banner.isActive }),
      })
      await fetchBanners()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ─── Reorder banner (move up or down) ───
  const reorderBanner = async (banner: Banner, direction: 'up' | 'down') => {
    const idx = banners.findIndex(b => b.id === banner.id)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= banners.length) return

    // Swap order values
    const newBanners = [...banners]
    const tempOrder = newBanners[idx].order
    newBanners[idx] = { ...newBanners[idx], order: newBanners[swapIdx].order }
    newBanners[swapIdx] = { ...newBanners[swapIdx], order: tempOrder }

    try {
      await fetch(`${API}/api/auth/admin/banners/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: newBanners.map(b => ({ id: b.id, order: b.order })),
        }),
      })
      await fetchBanners()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-40 h-8 bg-[var(--color-surface)] rounded animate-pulse" />
          <div className="w-32 h-10 bg-[var(--color-surface)] rounded animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--color-surface-alt)] rounded" />
              <div className="flex-1">
                <div className="w-48 h-4 bg-[var(--color-surface-alt)] rounded mb-2" />
                <div className="w-32 h-3 bg-[var(--color-surface-alt)] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Ads Banners
        </h1>
        <button onClick={openCreate} className="glass-button px-4 py-2 text-sm">
          + Create Banner
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* ─── Banner List ─── */}
      {banners.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 text-center">
          <p className="text-[var(--color-text-dim)]">No banners yet. Create your first banner to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`bg-[var(--color-surface)] border rounded-2xl p-4 transition-all ${
                banner.isActive ? 'border-[var(--color-border)]' : 'border-[var(--color-border)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Order number + reorder arrows */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    onClick={() => reorderBanner(banner, 'up')}
                    disabled={index === 0}
                    className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <span className="text-xs font-mono text-[var(--color-text-dim)]">{banner.order}</span>
                  <button
                    onClick={() => reorderBanner(banner, 'down')}
                    disabled={index === banners.length - 1}
                    className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Banner preview thumbnail */}
                <div
                  className="w-16 h-10 rounded-lg overflow-hidden shrink-0 border border-[var(--color-border)]"
                  style={{ background: banner.image ? `url(${banner.image}) center/cover` : banner.gradient }}
                />

                {/* Banner info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{banner.headline}</p>
                  <p className="text-xs text-[var(--color-text-dim)] truncate">{banner.subtitle}</p>
                </div>

                {/* Badge */}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] shrink-0">
                  {banner.badge}
                </span>

                {/* Active toggle */}
                <button
                  onClick={() => toggleActive(banner)}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                    banner.isActive ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface-alt)]'
                  }`}
                  title={banner.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    banner.isActive ? 'left-5' : 'left-0.5'
                  }`} />
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(banner)}
                    className="p-2 text-[var(--color-text-dim)] hover:text-[var(--color-blue)] hover:bg-[var(--color-blue)]/10 rounded-lg transition-colors"
                    title="Edit banner"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(banner)}
                    className="p-2 text-[var(--color-text-dim)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-colors"
                    title="Delete banner"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Create/Edit Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {editingBanner ? 'Edit Banner' : 'Create Banner'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal form */}
            <div className="p-6 space-y-4">
              {/* Headline */}
              <div>
                <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Headline *</label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={e => setForm({ ...form, headline: e.target.value })}
                  className="glass-input"
                  placeholder="Premium Brake Pads"
                  required
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Subtitle *</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={e => setForm({ ...form, subtitle: e.target.value })}
                  className="glass-input"
                  placeholder="OEM-quality stopping power"
                  required
                />
              </div>

              {/* Badge + CTA in same row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Badge Text *</label>
                  <input
                    type="text"
                    value={form.badge}
                    onChange={e => setForm({ ...form, badge: e.target.value })}
                    className="glass-input"
                    placeholder="NEW ARRIVAL"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">CTA Text *</label>
                  <input
                    type="text"
                    value={form.cta}
                    onChange={e => setForm({ ...form, cta: e.target.value })}
                    className="glass-input"
                    placeholder="Shop Now"
                    required
                  />
                </div>
              </div>

              {/* Link */}
              <div>
                <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Link URL *</label>
                <input
                  type="text"
                  value={form.link}
                  onChange={e => setForm({ ...form, link: e.target.value })}
                  className="glass-input"
                  placeholder="/products/..."
                  required
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Image URL *</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={e => setForm({ ...form, image: e.target.value })}
                  className="glass-input"
                  placeholder="https://..."
                  required
                />
                {/* Image preview */}
                {form.image && (
                  <div className="mt-2 w-full h-24 rounded-lg overflow-hidden border border-[var(--color-border)]">
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Gradient + Accent in same row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Gradient Class</label>
                  <input
                    type="text"
                    value={form.gradient}
                    onChange={e => setForm({ ...form, gradient: e.target.value })}
                    className="glass-input"
                    placeholder="from-gray-900 via-gray-800 to-gray-900"
                  />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Accent Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.accent}
                      onChange={e => setForm({ ...form, accent: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-[var(--color-border)] cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={form.accent}
                      onChange={e => setForm({ ...form, accent: e.target.value })}
                      className="glass-input flex-1"
                      placeholder="#39FF14"
                    />
                  </div>
                </div>
              </div>

              {/* Order + Active toggle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    className="glass-input"
                    min={0}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setForm({ ...form, isActive: !form.isActive })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        form.isActive ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface-alt)]'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                        form.isActive ? 'left-5' : 'left-0.5'
                      }`} />
                    </div>
                    <span className="text-sm text-[var(--color-text-dim)]">
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--color-border)]">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.headline || !form.subtitle || !form.badge || !form.cta || !form.image}
                className="glass-button px-6 py-2 text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
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
              Delete Banner
            </h3>
            <p className="text-sm text-[var(--color-text-dim)] mb-6">
              Are you sure you want to delete &ldquo;{deleteConfirm.headline}&rdquo;? This action cannot be undone.
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
