'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useToast } from '@/components/Toast'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to send reset code')
      }
      const data = await res.json()
      setSent(true)
      sessionStorage.setItem('resetEmail', email)
      showToast(data.devCode ? `Reset code sent — Code: ${data.devCode}` : 'Reset code sent to your email', 'success')
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      const res = await fetch(`${API}/api/auth/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      showToast(data.devCode ? `New code sent — Code: ${data.devCode}` : 'New code sent to your email', 'success')
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md text-center"
      >
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-blue)]/20 to-[var(--color-accent)]/10 border border-[var(--color-blue)]/20 mb-6">
          <span className="text-3xl">🔑</span>
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {sent ? 'Check Your Email' : 'Forgot Password?'}
        </h1>
        <p className="text-sm text-[var(--color-text-dim)] mb-8">
          {sent
            ? <>We sent a 6-digit reset code to<br /><span className="text-[var(--color-text)] font-medium">{email}</span></>
            : 'Enter your email and we\'ll send you a code to reset your password'
          }
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
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

            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full py-3"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => router.push('/reset-password')}
              className="glass-button w-full py-3"
            >
              Enter Reset Code →
            </button>

            {/* Resend */}
            <p className="text-sm text-[var(--color-text-dim)]">
              Didn&apos;t receive it?{' '}
              <button
                onClick={handleResend}
                className="text-[var(--color-accent)] hover:underline font-medium"
              >
                Resend Code
              </button>
            </p>
          </div>
        )}

        {/* Back to login */}
        <p className="text-sm text-[var(--color-text-dim)] mt-6">
          <Link href="/login" className="text-[var(--color-accent)] hover:underline">
            ← Back to Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
