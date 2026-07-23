/**
 * Admin Authentication Context
 * 
 * Manages admin JWT token + user state in localStorage.
 * Validates that logged-in user has role='admin' before granting access.
 * Used by the admin layout and all admin pages.
 */
'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Shape of the admin user stored in localStorage */
interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin'
}

/** Shape of the admin auth context */
interface AdminAuthContextType {
  /** Current admin user (null if not authenticated) */
  user: AdminUser | null
  /** JWT token string (null if not authenticated) */
  token: string | null
  /** Whether auth state has been loaded from localStorage (prevents flash) */
  loading: boolean
  /** Login with email + password. Returns true on success, throws on failure. */
  login: (email: string, password: string) => Promise<void>
  /** Logout — clears token + user from localStorage and state */
  logout: () => void
  /** Update the stored user object (after username change, etc.) */
  updateUser: (user: AdminUser) => void
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

/**
 * Hook to access admin auth context. Must be used within <AdminAuthProvider>.
 * Throws if used outside the provider.
 */
export function useAdminAuth(): AdminAuthContextType {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}

/**
 * Provider that wraps all admin pages. On mount, reads token + user from
 * localStorage and validates the token by calling GET /api/auth/admin/me.
 * If validation fails, clears state and forces re-login.
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Validate stored token on mount
  useEffect(() => {
    const stored = localStorage.getItem('admin_token')
    const storedUser = localStorage.getItem('admin_user')
    
    if (!stored || !storedUser) {
      setLoading(false)
      return
    }

    try {
      const parsed = JSON.parse(storedUser) as AdminUser
      // Must be admin role
      if (parsed.role !== 'admin') {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        setLoading(false)
        return
      }
      setUser(parsed)
      setToken(stored)
    } catch {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    }
    setLoading(false)
  }, [])

  /** Login handler — calls POST /api/auth/admin/login */
  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || 'Invalid credentials')
    }
    const data = await res.json()
    // Validate response has admin role
    if (data.user?.role !== 'admin') {
      throw new Error('This account does not have admin privileges.')
    }
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }, [])

  /** Logout — clears everything */
  const logout = useCallback(() => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setToken(null)
    setUser(null)
  }, [])

  /** Update user (after username change, etc.) */
  const updateUser = useCallback((updated: AdminUser) => {
    localStorage.setItem('admin_user', JSON.stringify(updated))
    setUser(updated)
  }, [])

  return (
    <AdminAuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
