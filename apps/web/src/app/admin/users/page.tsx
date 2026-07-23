/**
 * Admin Users Page — manage user accounts and roles.
 * 
 * Features:
 *   - Paginated user list with search and role filter
 *   - Role badges color-coded by role
 *   - Change user role via dropdown
 *   - Delete user with confirmation
 *   - Self-protection: can't delete or change own role
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '@/lib/admin-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Valid user roles */
const ROLES = ['individual', 'mechanic', 'shop', 'admin'] as const

/** Role badge color mapping */
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-[var(--color-coral)]/15 text-[var(--color-coral)]',
  shop: 'bg-[var(--color-blue)]/15 text-[var(--color-blue)]',
  mechanic: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  individual: 'bg-[var(--color-text-dim)]/15 text-[var(--color-text-dim)]',
}

/** User shape from API */
interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  createdAt: string
}

export default function AdminUsersPage() {
  const { token, user: currentUser } = useAdminAuth()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)

  // ─── Fetch users with pagination ───
  const fetchUsers = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)

      const res = await fetch(`${API}/api/auth/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, page, search, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // ─── Reset page when filters change ───
  useEffect(() => { setPage(1) }, [search, roleFilter])

  // ─── Change user role ───
  const changeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`${API}/api/auth/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to change role')
      }
      await fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ─── Delete user ───
  const deleteUser = async (userId: string) => {
    try {
      const res = await fetch(`${API}/api/auth/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to delete user')
      }
      setDeleteConfirm(null)
      await fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ─── Format date ───
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="w-40 h-8 bg-[var(--color-surface)] rounded animate-pulse" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 animate-pulse">
            <div className="flex gap-4 items-center">
              <div className="w-9 h-9 rounded-full bg-[var(--color-surface-alt)]" />
              <div className="flex-1"><div className="w-32 h-4 bg-[var(--color-surface-alt)] rounded mb-1" /><div className="w-48 h-3 bg-[var(--color-surface-alt)] rounded" /></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>Users</h1>
        <span className="text-sm text-[var(--color-text-dim)]">{total} user{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)]">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="glass-input flex-1 text-sm"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="glass-input text-sm">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
      </div>

      {/* Users list */}
      {users.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 text-center text-[var(--color-text-dim)]">No users found</div>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_3fr_1fr_2fr_2fr] gap-4 px-6 py-3 border-b border-[var(--color-border)] text-xs text-[var(--color-text-dim)] font-medium uppercase tracking-wider">
            <span>User</span>
            <span>Email</span>
            <span>Role</span>
            <span>Joined</span>
            <span className="text-right">Actions</span>
          </div>

          {users.map(u => {
            const isSelf = currentUser?.id === u.id
            return (
              <div key={u.id} className="grid grid-cols-1 md:grid-cols-[2fr_3fr_1fr_2fr_2fr] gap-4 px-6 py-4 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-alt)] transition-colors items-center">
                {/* Name + avatar */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center text-[var(--color-accent)] font-medium text-sm shrink-0">
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">{u.name}</p>
                    {isSelf && <span className="text-[10px] text-[var(--color-accent)]">You</span>}
                  </div>
                </div>

                {/* Email */}
                <span className="text-sm text-[var(--color-text-dim)] truncate">{u.email}</span>

                {/* Role badge */}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize w-fit ${ROLE_COLORS[u.role] || ROLE_COLORS.individual}`}>
                  {u.role}
                </span>

                {/* Joined date */}
                <span className="text-xs text-[var(--color-text-dim)]">{formatDate(u.createdAt)}</span>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-end">
                  {/* Role change dropdown */}
                  {!isSelf && (
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                      className="text-xs bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-[var(--color-text-dim)] capitalize"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}

                  {/* Delete button */}
                  {!isSelf && (
                    <button
                      onClick={() => setDeleteConfirm(u)}
                      className="p-1.5 text-[var(--color-text-dim)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-40 transition-colors"
          >Previous</button>
          <span className="text-sm text-[var(--color-text-dim)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-40 transition-colors"
          >Next</button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Delete User</h3>
            <p className="text-sm text-[var(--color-text-dim)] mb-6">
              Are you sure you want to delete &ldquo;{deleteConfirm.name}&rdquo; ({deleteConfirm.email})? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors">Cancel</button>
              <button onClick={() => deleteUser(deleteConfirm.id)} className="px-4 py-2 text-sm rounded-lg bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/80 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
