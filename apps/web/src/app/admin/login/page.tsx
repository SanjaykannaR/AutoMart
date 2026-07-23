/**
 * Admin Login Page — separate from customer login.
 * 
 * Features:
 *   - Email + password form (no OTP, no Google OAuth for admin)
 *   - Validates role=admin after login
 *   - Redirects to /admin on success
 *   - Link to admin forgot-password
 *   - Dark automotive theme, centered card layout
 *   - All form interactions have inline comments
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminAuthProvider, useAdminAuth } from '@/lib/admin-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Inner login form that uses admin auth context */
function LoginForm() {
  const router = useRouter()
  const { login } = useAdminAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /** Handle form submission — call admin login endpoint */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      router.push('/admin')
    } catch (err: any) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      {/* Background glow decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[var(--color-accent)] rounded-full opacity-[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[var(--color-coral)] rounded-full opacity-[0.03] blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/logo/automart-logo.svg" alt="AutoMart" className="w-14 h-14" />
          </div>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="text-[var(--color-accent)]">Auto</span>
            <span className="text-[var(--color-text)]">Mart</span>
          </h1>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/20">
            <svg className="w-3.5 h-3.5 text-[var(--color-coral)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs font-semibold text-[var(--color-coral)]">Admin Access</span>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Sign In to Admin Panel
          </h2>
          <p className="text-sm text-[var(--color-text-dim)] mb-6">
            Enter your admin credentials
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input"
                placeholder="admin@automart.com"
                required
                autoFocus
              />
            </div>

            {/* Password field */}
            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end">
              <Link href="/admin/forgot-password" className="text-sm text-[var(--color-blue)] hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full py-3 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </span>
              ) : (
                'Sign In to Admin Panel'
              )}
            </button>
          </form>
        </div>

        {/* Back to customer login */}
        <p className="text-sm text-[var(--color-text-dim)] text-center mt-6">
          Not an admin?{' '}
          <Link href="/login" className="text-[var(--color-accent)] hover:underline font-medium">
            Customer Login
          </Link>
        </p>
      </div>
    </div>
  )
}

/**
 * Admin Login Page — wraps login form with AdminAuthProvider.
 * The provider manages token state and validates role=admin.
 */
export default function AdminLoginPage() {
  return (
    <AdminAuthProvider>
      <LoginForm />
    </AdminAuthProvider>
  )
}
