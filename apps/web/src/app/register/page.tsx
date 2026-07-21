/**
 * Register Page — Split-screen account creation
 * 
 * Layout (desktop):
 *   ┌─────────────────────────┬─────────────────────────┐
 *   │  Left: Brand Panel      │  Right: Register Form   │
 *   │  - Dark background      │  - Name input            │
 *   │  - AutoMart logo        │  - Email input           │
 *   │  - Tagline              │  - Password input        │
 *   │  - Feature highlights   │  - Role selector         │
 *   │                         │  - Create Account button │
 *   │                         │  - Sign In link          │
 *   └─────────────────────────┴─────────────────────────┘
 * 
 * Layout (mobile):
 *   - Full-width form with brand text above
 * 
 * Role options:
 *   - Mechanic: professional parts buyer
 *   - Individual: personal vehicle owner
 *   - Shop Owner: business/bulk buyer
 * 
 * Form behavior:
 *   - Posts to /api/auth/register
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

/** Role options — each maps to a backend enum value */
const roles = [
  { value: 'mechanic', label: 'Mechanic', desc: 'Professional parts buyer' },
  { value: 'individual', label: 'Individual', desc: 'Personal vehicle owner' },
  { value: 'shop', label: 'Shop Owner', desc: 'Business/bulk buyer' },
]

export default function RegisterPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'individual' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /** Handle form submission — create account via API */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Registration failed')
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      showToast('Account created! Welcome to AutoMart.', 'success')
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
          <div className="absolute top-1/4 right-1/3 w-80 h-80 bg-[var(--color-coral)] rounded-full opacity-[0.04] blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/4 w-60 h-60 bg-[var(--color-accent)] rounded-full opacity-[0.03] blur-[80px]" />
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
          <p className="text-[var(--color-text-dim)] text-lg max-w-sm mb-10">
            Join thousands of mechanics and car owners who get parts delivered fast.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4 text-left max-w-xs mx-auto">
            {[
              '10,000+ genuine parts',
              '30-minute delivery',
              'Verified sellers only',
              'Easy returns & support',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--color-accent-dim)] flex items-center justify-center shrink-0">
                  <span className="text-[var(--color-accent)] text-xs font-bold">✓</span>
                </div>
                <span className="text-sm text-[var(--color-text-dim)]">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL: Register Form
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
            Create Account
          </h2>
          <p className="text-sm text-[var(--color-text-dim)] mb-8">
            Join AutoMart and get parts delivered in 30 minutes
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)] text-center">
              {error}
            </div>
          )}

          {/* Registration form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field */}
            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="glass-input"
                placeholder="Your full name"
                required
              />
            </div>

            {/* Email field */}
            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="glass-input"
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>

            {/* Role selector — card-style radio buttons */}
            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-2">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: role.value })}
                    className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                      form.role === role.value
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-text-dim)]'
                    }`}
                  >
                    <span className={`text-xs font-medium block ${
                      form.role === role.value ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'
                    }`}>
                      {role.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full py-3 mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In link */}
          <p className="text-sm text-[var(--color-text-dim)] text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--color-accent)] hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
