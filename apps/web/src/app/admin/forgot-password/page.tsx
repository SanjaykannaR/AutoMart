/**
 * Admin Forgot Password Page
 * 
 * Sends a 6-digit reset code to the admin's email.
 * Uses POST /api/auth/admin/forgot-password endpoint.
 * After submitting, redirects to /admin/reset-password with email in state.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function AdminForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  /** Submit forgot password request */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send reset code')
      }

      setSuccess(data.message || 'If an admin account exists with that email, a reset code has been sent.')
      
      // Redirect to reset page after 2 seconds
      setTimeout(() => {
        router.push(`/admin/reset-password?email=${encodeURIComponent(email)}`)
      }, 2000)
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
            Reset Admin Password
          </h2>
          <p className="text-sm text-[var(--color-text-dim)] mb-6">
            Enter your admin email to receive a 6-digit reset code
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
            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Admin Email</label>
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

            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full py-3 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
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
