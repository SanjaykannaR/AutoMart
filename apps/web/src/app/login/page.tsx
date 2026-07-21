/**
 * Login Page — Split-screen authentication
 * 
 * Layout (desktop):
 *   ┌─────────────────────────┬─────────────────────────┐
 *   │  Left: Brand Panel      │  Right: Login Form      │
 *   │  - Dark background      │  - Email input           │
 *   │  - AutoMart logo        │  - Password input        │
 *   │  - Tagline              │  - Sign In button        │
 *   │  - Decorative glow      │  - Register link         │
 *   └─────────────────────────┴─────────────────────────┘
 * 
 * Layout (mobile):
 *   - Full-width form with brand text above
 *   - Brand panel hidden on mobile
 * 
 * Form behavior:
 *   - Posts to /api/auth/login
 *   - Stores JWT token in localStorage
 *   - Shows error messages inline
 *   - Redirects to home on success
 *   - Toast notification on success/error
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useToast } from '@/components/Toast'

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /** Handle form submission — authenticate via API */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Invalid credentials')
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      // Save user data for navbar Settings icon
      localStorage.setItem('user', JSON.stringify({ email, name: data.user?.name || email.split('@')[0] }))
      window.dispatchEvent(new Event('user-updated'))
      showToast('Welcome back!', 'success')
      router.push('/')
    } catch (err: any) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL: Brand / decorative (hidden on mobile)
          ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Dark background with subtle decorative glow */}
        <div className="absolute inset-0 bg-[var(--color-bg)]">
          <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-[var(--color-accent)] rounded-full opacity-[0.04] blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-[var(--color-blue)] rounded-full opacity-[0.03] blur-[80px]" />
        </div>

        {/* Brand content */}
        <div className="relative z-10 text-center px-12">
          <h1
            className="text-5xl font-extrabold mb-4"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            <span className="text-[var(--color-accent)]">Auto</span>
            <span className="text-[var(--color-text)]">Mart</span>
          </h1>
          <p className="text-[var(--color-text-dim)] text-lg max-w-sm">
            Get your auto parts delivered in 30 minutes.
          </p>
          <div className="flex gap-6 mt-10 justify-center">
            {[
              { value: '10K+', label: 'Parts' },
              { value: '30min', label: 'Delivery' },
              { value: '24/7', label: 'Support' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-bold text-[var(--color-accent)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {stat.value}
                </p>
                <p className="text-xs text-[var(--color-text-dim)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL: Login Form
          ═══════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile-only logo */}
          <div className="lg:hidden text-center mb-8">
            <h1
              className="text-3xl font-extrabold"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              <span className="text-[var(--color-accent)]">Auto</span>Mart
            </h1>
          </div>

          {/* Form heading */}
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Welcome Back
          </h2>
          <p className="text-sm text-[var(--color-text-dim)] mb-8">
            Sign in to your AutoMart account
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)] text-center">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password field */}
            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full py-3 mt-2"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Register link */}
          <p className="text-sm text-[var(--color-text-dim)] text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[var(--color-accent)] hover:underline font-medium">
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
