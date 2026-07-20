'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/GlassCard'
import Link from 'next/link'
import { useToast } from '@/components/Toast'

const roles = [
  { value: 'mechanic', label: 'Mechanic' },
  { value: 'individual', label: 'Individual' },
  { value: 'shop', label: 'Shop Owner' },
]

export default function RegisterPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'individual' })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Registration failed')
      const data = await res.json()
      localStorage.setItem('token', data.token)
      showToast('Account created! Welcome to AutoMart.', 'success')
      router.push('/')
    } catch (err: any) {
      setError(err.message)
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <GlassCard className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-sm text-[var(--color-text-muted)] text-center mb-8">
          Join AutoMart and get parts delivered in 30 mins
        </p>

        {error && <p className="text-sm text-[var(--color-danger)] mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="glass-input"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="glass-input"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Password</label>
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
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] block mb-1">I am a</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="glass-input"
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value} className="bg-[var(--color-surface)]">
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="glass-button w-full">
            Create Account
          </button>
        </form>

        <p className="text-sm text-[var(--color-text-muted)] text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--color-accent)] hover:underline">
            Sign In
          </Link>
        </p>
      </GlassCard>
    </div>
  )
}
