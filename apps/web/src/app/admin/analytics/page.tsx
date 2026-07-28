/**
 * Admin Analytics Page — Revenue, orders, users, and product insights.
 *
 * Layout:
 *   ┌──────────────┬──────────────┬──────────────┬──────────────┐
 *   │ Total Revenue│ Total Orders │ Avg Order    │ Total Users  │
 *   ├──────────────┴──────────────┴──────────────┴──────────────┤
 *   │ Revenue Trend (area chart)                                │
 *   ├──────────────────────────────┬────────────────────────────┤
 *   │ Orders by Status (pie)       │ Top Products (bar chart)   │
 *   ├──────────────────────────────┼────────────────────────────┤
 *   │ User Registrations (bar)     │ Products by Category (pie) │
 *   └──────────────────────────────┴────────────────────────────┘
 */
'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/lib/admin-auth'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Colors for charts — matches the AutoMart design system */
const COLORS = {
  accent: '#39FF14',    // neon lime
  coral: '#FF523B',     // coral red
  blue: '#38B6FF',      // sky blue
  warning: '#FFA726',   // amber
  success: '#66BB6A',   // green
  purple: '#AB47BC',    // purple
  pink: '#EC407A',      // pink
  teal: '#26A69A',      // teal
  gold: '#FFD54F',      // gold
  grey: '#78909C',      // grey
}

const PIE_COLORS = [COLORS.accent, COLORS.blue, COLORS.warning, COLORS.coral, COLORS.purple, COLORS.pink, COLORS.teal, COLORS.success, COLORS.gold, COLORS.grey]

/** Format INR currency */
function formatINR(n: number): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

/** Format date for chart display (Jul 26) */
function formatDate(d: string): string {
  const date = new Date(d + 'T00:00:00')
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

/** Custom tooltip for charts with INR formatting */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl text-sm">
      <p className="text-[var(--color-text-dim)] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.name === 'revenue' ? formatINR(p.value) : p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { token } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Order analytics state
  const [revenueByDay, setRevenueByDay] = useState<any[]>([])
  const [byStatus, setByStatus] = useState<Record<string, number>>({})
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [avgOrderValue, setAvgOrderValue] = useState(0)

  // User analytics state
  const [registrationsByDay, setRegistrationsByDay] = useState<any[]>([])
  const [usersByRole, setUsersByRole] = useState<Record<string, number>>({})
  const [totalUsers, setTotalUsers] = useState(0)

  // Product analytics state
  const [categoryDistribution, setCategoryDistribution] = useState<Record<string, number>>({})

  const days = 30

  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    Promise.allSettled([
      // Order analytics
      fetch(`${API}/api/orders/analytics?days=${days}`, { headers })
        .then(r => r.json())
        .then(data => {
          if (data.revenueByDay) setRevenueByDay(data.revenueByDay.map((d: any) => ({ ...d, date: formatDate(d.date) })))
          if (data.byStatus) setByStatus(data.byStatus)
          if (data.topProducts) setTopProducts(data.topProducts)
          setTotalRevenue(data.totalRevenue || 0)
          setTotalOrders(data.totalOrders || 0)
          setAvgOrderValue(data.avgOrderValue || 0)
        })
        .catch(() => {}),

      // User analytics
      fetch(`${API}/api/auth/admin/analytics?days=${days}`, { headers })
        .then(r => r.json())
        .then(data => {
          if (data.registrationsByDay) setRegistrationsByDay(data.registrationsByDay.map((d: any) => ({ ...d, date: formatDate(d.date) })))
          if (data.byRole) setUsersByRole(data.byRole)
          setTotalUsers(data.totalUsers || 0)
        })
        .catch(() => {}),

      // Product stats (category distribution)
      fetch(`${API}/api/products/stats`, { headers })
        .then(r => r.json())
        .then(data => {
          if (data.byCategory) setCategoryDistribution(data.byCategory)
        })
        .catch(() => {}),
    ]).then(() => setLoading(false))
  }, [token])

  // ─── Chart data transforms ───
  const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }))
  const roleData = Object.entries(usersByRole).map(([name, value]) => ({ name, value }))
  const categoryData = Object.entries(categoryDistribution).map(([name, value]) => ({ name, value: value || 0 }))

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-alt)] mb-3" />
              <div className="w-20 h-8 bg-[var(--color-surface-alt)] rounded mb-1" />
              <div className="w-24 h-4 bg-[var(--color-surface-alt)] rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse">
              <div className="w-32 h-6 bg-[var(--color-surface-alt)] rounded mb-4" />
              <div className="w-full h-48 bg-[var(--color-surface-alt)] rounded" />
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

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue',
            value: formatINR(totalRevenue),
            color: COLORS.accent,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            ),
          },
          {
            label: 'Total Orders',
            value: totalOrders.toLocaleString(),
            color: COLORS.blue,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ),
          },
          {
            label: 'Avg Order Value',
            value: formatINR(avgOrderValue),
            color: COLORS.warning,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            label: 'Total Users',
            value: totalUsers.toLocaleString(),
            color: COLORS.purple,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            ),
          },
        ].map(card => (
          <div key={card.label} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: `color-mix(in srgb, ${card.color} 15%, transparent)` }}
            >
              <span style={{ color: card.color }}>{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {card.value}
            </p>
            <p className="text-sm text-[var(--color-text-dim)] mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Revenue Trend (full width) ─── */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Revenue Trend (Last {days} Days)
        </h2>
        {revenueByDay.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueByDay}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke={COLORS.accent} fill="url(#revenueGrad)" strokeWidth={2} name="revenue" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-[var(--color-text-dim)] text-center py-12">No order data yet</p>
        )}
      </div>

      {/* ─── Order Trends + Status ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders per Day (bar chart) */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Orders per Day
          </h2>
          {revenueByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#888', fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="orders" fill={COLORS.blue} radius={[4, 4, 0, 0]} name="orders" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--color-text-dim)] text-center py-12">No order data yet</p>
          )}
        </div>

        {/* Status Breakdown (pie) */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Order Status
          </h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--color-text-dim)] text-center py-12">No orders yet</p>
          )}
        </div>
      </div>

      {/* ─── Top Products + User Registrations ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Revenue (horizontal bar) */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Top Products by Revenue
          </h2>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" fill={COLORS.accent} radius={[0, 4, 4, 0]} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--color-text-dim)] text-center py-12">No product data yet</p>
          )}
        </div>

        {/* User Registrations (bar chart) */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            User Registrations
          </h2>
          {registrationsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={registrationsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#888', fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill={COLORS.purple} radius={[4, 4, 0, 0]} name="users" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--color-text-dim)] text-center py-12">No user data yet</p>
          )}
        </div>
      </div>

      {/* ─── Role Distribution + Category Distribution ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role (pie) */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Users by Role
          </h2>
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--color-text-dim)] text-center py-12">No user data yet</p>
          )}
        </div>

        {/* Products by Category (pie) */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Products by Category
          </h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--color-text-dim)] text-center py-12">No product data yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
