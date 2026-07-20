'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/GlassCard'
import Link from 'next/link'
import { useToast } from '@/components/Toast'

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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
      showToast('Welcome back!', 'success')
      router.push('/')
    } catch (err: any) {
      setError(err.message)
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <GlassCard className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
        <p className="text-sm text-[var(--color-text-muted)] text-center mb-8">
          Sign in to your AutoMart account
        </p>

        {error && (
          <p className="text-sm text-[var(--color-danger)] mb-4 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Email</label>
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
            <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="glass-button w-full">
            Sign In
          </button>
        </form>

        <p className="text-sm text-[var(--color-text-muted)] text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[var(--color-accent)] hover:underline">
            Register
          </Link>
        </p>
      </GlassCard>
    </div>
  )
}
