'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useToast } from '@/components/Toast'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function RegisterPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'individual' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Registration failed')
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.dispatchEvent(new Event('user-updated'))
      showToast('Account created! Let\'s complete your profile.', 'success')
      router.push('/auth/profile-setup')
    } catch (err: any) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh)] flex">
      {/* Left: Brand Panel (desktop) */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[var(--color-bg)]">
          <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-[var(--color-coral)] rounded-full opacity-[0.06] blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-[var(--color-accent)] rounded-full opacity-[0.04] blur-[100px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, var(--color-accent) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <div className="relative z-10 text-center px-12 max-w-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center mb-6">
              <img src="/logo/automart-logo.svg" alt="AutoMart" className="w-20 h-20" />
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span className="text-[var(--color-accent)]">Auto</span>
              <span className="text-[var(--color-text)]">Mart</span>
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[var(--color-text-dim)] text-lg mb-12"
          >
            Join thousands of mechanics and car owners who get parts delivered fast.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-4 text-left max-w-xs mx-auto"
          >
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
          </motion.div>
        </div>
      </div>

      {/* Right: Register Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center mb-3">
              <img src="/logo/automart-logo.svg" alt="AutoMart" className="w-14 h-14" />
            </div>
            <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span className="text-[var(--color-accent)]">Auto</span>Mart
            </h1>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Create Account
          </h2>
          <p className="text-sm text-[var(--color-text-dim)] mb-8">
            Join AutoMart and get parts delivered in 30 minutes
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)] text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input"
                placeholder="Your full name"
                required
              />
            </div>

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

            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pr-10"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
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

            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input"
                placeholder="Re-enter password"
                required
              />
            </div>

            {password && (
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      password.length >= level * 3
                        ? level <= 1 ? 'bg-[var(--color-danger)]'
                        : level <= 2 ? 'bg-[var(--color-warning)]'
                        : 'bg-[var(--color-success)]'
                        : 'bg-[var(--color-border)]'
                    }`}
                  />
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full py-3 mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

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
