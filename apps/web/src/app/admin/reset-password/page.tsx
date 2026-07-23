/**
 * Admin Reset Password Page
 * 
 * Verifies the 6-digit reset code and sets a new password.
 * Uses POST /api/auth/admin/reset-password endpoint.
 * Reads email from URL search params (passed from forgot-password page).
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function AdminResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailFromUrl)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Pre-fill email from URL params
  useEffect(() => {
    if (emailFromUrl) setEmail(emailFromUrl)
  }, [emailFromUrl])

  /** Submit reset password request */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password')
      }

      setSuccess(data.message || 'Password reset successfully!')
      
      // Redirect to admin login after 2 seconds
      setTimeout(() => router.push('/admin/login'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[var(--color-accent)] rounded-full opacity-[0.04] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/admin/login" className="inline-flex items-center justify-center mb-4">
            <img src="/logo/automart-logo.svg" alt="AutoMart" className="w-14 h-14" />
          </Link>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="text-[var(--color-accent)]">Auto</span>
            <span className="text-[var(--color-text)]">Mart</span>
          </h1>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Set New Password
          </h2>
          <p className="text-sm text-[var(--color-text-dim)] mb-6">
            Enter the 6-digit code from your email and your new password
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-sm text-[var(--color-success)]">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input"
                placeholder="admin@automart.com"
                required
              />
            </div>

            {/* Reset code */}
            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Reset Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="glass-input text-center text-xl tracking-[0.3em] font-mono"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            {/* New password */}
            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="glass-input pr-10"
                  placeholder="Min. 8 characters"
                  minLength={8}
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

            <button
              type="submit"
              disabled={loading || code.length < 6 || newPassword.length < 8}
              className="glass-button w-full py-3 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>

        {/* Back to login */}
        <p className="text-sm text-[var(--color-text-dim)] text-center mt-6">
          <Link href="/admin/login" className="text-[var(--color-accent)] hover:underline font-medium">
            &larr; Back to Admin Login
          </Link>
        </p>
      </div>
    </div>
  )
}
