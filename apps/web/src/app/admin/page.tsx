/**
 * Admin Dashboard Page
 * 
 * Shows overview stats: products, users, orders, banners count.
 * Fetches data from multiple services in parallel on mount.
 * Displays stat cards, recent users, and quick action links.
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/lib/admin-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Shape of a stat card displayed on the dashboard */
interface StatCard {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
  href: string
}

/** Shape of a user returned from the admin users API */
interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function AdminDashboardPage() {
  const { token } = useAdminAuth()

  // ─── State for dashboard data ───
  const [productCount, setProductCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const [bannerCount, setBannerCount] = useState(0)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ─── Fetch all dashboard data in parallel on mount ───
  useEffect(() => {
    if (!token) return

    const headers = { Authorization: `Bearer ${token}` }

    Promise.allSettled([
      // Fetch products count
      fetch(`${API}/api/products`, { headers })
        .then(r => r.json())
        .then(data => { setProductCount(Array.isArray(data) ? data.length : 0) })
        .catch(() => {}),

      // Fetch users (first page with limit 5 for recent)
      fetch(`${API}/api/auth/admin/users?limit=5`, { headers })
        .then(r => r.json())
        .then(data => {
          setUserCount(data.pagination?.total || 0)
          setRecentUsers(data.users || [])
        })
        .catch(() => {}),

      // Fetch banners count
      fetch(`${API}/api/auth/admin/banners`, { headers })
        .then(r => r.json())
        .then(data => { setBannerCount(Array.isArray(data) ? data.length : 0) })
        .catch(() => {}),
    ]).then(() => setLoading(false))
  }, [token])

  // ─── Stat cards configuration ───
  const stats: StatCard[] = [
    {
      label: 'Products',
      value: productCount,
      href: '/admin/products',
      color: 'var(--color-accent)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: 'Users',
      value: userCount,
      href: '/admin/users',
      color: 'var(--color-blue)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
    {
      label: 'Banners',
      value: bannerCount,
      href: '/admin/banners',
      color: 'var(--color-coral)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Inventory',
      value: '—',
      href: '/admin/inventory',
      color: 'var(--color-warning)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
    },
  ]

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-alt)] mb-3" />
              <div className="w-16 h-8 bg-[var(--color-surface-alt)] rounded mb-1" />
              <div className="w-20 h-4 bg-[var(--color-surface-alt)] rounded" />
            </div>
          ))}
        </div>
        {/* Recent users skeleton */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse">
          <div className="w-40 h-6 bg-[var(--color-surface-alt)] rounded mb-4" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 py-3 border-b border-[var(--color-border)]">
              <div className="w-8 h-8 rounded-full bg-[var(--color-surface-alt)]" />
              <div className="flex-1">
                <div className="w-32 h-4 bg-[var(--color-surface-alt)] rounded mb-1" />
                <div className="w-48 h-3 bg-[var(--color-surface-alt)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* ─── Stat Cards Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-all duration-200 group"
          >
            {/* Icon with colored background */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)` }}
            >
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            {/* Stat value */}
            <p className="text-3xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {stat.value}
            </p>
            {/* Stat label */}
            <p className="text-sm text-[var(--color-text-dim)] mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* ─── Recent Users + Quick Actions ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users table */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Recent Users
            </h2>
            <Link href="/admin/users" className="text-sm text-[var(--color-accent)] hover:underline">
              View All
            </Link>
          </div>

          {recentUsers.length === 0 ? (
            <p className="text-sm text-[var(--color-text-dim)] py-8 text-center">No users found</p>
          ) : (
            <div className="space-y-0">
              {recentUsers.map((u, i) => (
                <div key={u.id} className={`flex items-center gap-3 py-3 ${i < recentUsers.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}>
                  {/* Avatar circle */}
                  <div className="w-9 h-9 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center text-[var(--color-accent)] font-medium text-sm shrink-0">
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">{u.name}</p>
                    <p className="text-xs text-[var(--color-text-dim)] truncate">{u.email}</p>
                  </div>
                  {/* Role badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    u.role === 'admin' ? 'bg-[var(--color-coral)]/15 text-[var(--color-coral)]' :
                    u.role === 'shop' ? 'bg-[var(--color-blue)]/15 text-[var(--color-blue)]' :
                    u.role === 'mechanic' ? 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]' :
                    'bg-[var(--color-text-dim)]/15 text-[var(--color-text-dim)]'
                  }`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Quick Actions
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Manage Banners', href: '/admin/banners', color: 'var(--color-coral)' },
              { label: 'View Products', href: '/admin/products', color: 'var(--color-accent)' },
              { label: 'View Orders', href: '/admin/orders', color: 'var(--color-blue)' },
              { label: 'Check Inventory', href: '/admin/inventory', color: 'var(--color-warning)' },
              { label: 'Manage Users', href: '/admin/users', color: 'var(--color-text-dim)' },
              { label: 'Admin Settings', href: '/admin/settings', color: 'var(--color-text-dim)' },
            ].map(action => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-all duration-200 group"
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: action.color }} />
                <span className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                  {action.label}
                </span>
                <svg className="w-4 h-4 text-[var(--color-text-dim)] ml-auto group-hover:text-[var(--color-accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
