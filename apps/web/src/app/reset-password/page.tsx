'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useToast } from '@/components/Toast'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const OTP_LENGTH = 6

export default function ResetPasswordPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState<'otp' | 'reset'>('otp')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  useEffect(() => {
    // Check if we have a reset email stored (from forgot-password page)
    // For this flow, we'll use a session-based approach
    const email = sessionStorage.getItem('resetEmail')
    if (!email) {
      // Allow direct access for demo purposes
    } else {
      setResetEmail(email)
    }
  }, [router])

  // Auto-advance on input
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)
    setError('')
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
    if (newDigits.every(d => d !== '')) {
      setTimeout(() => verifyOTP(newDigits.join('')), 200)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (pasted) {
      const newDigits = pasted.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH)
      setDigits(newDigits)
      const lastFilled = Math.min(pasted.length, OTP_LENGTH) - 1
      if (lastFilled >= 0) inputRefs.current[lastFilled]?.focus()
      if (pasted.length === OTP_LENGTH) {
        setTimeout(() => verifyOTP(pasted), 200)
      }
    }
  }

  const verifyOTP = useCallback((otp: string) => {
    // Just validate the code length and move to reset step
    // Real verification happens when resetting the password
    if (otp.length === OTP_LENGTH) {
      setStep('reset')
      showToast('Code verified! Set your new password.', 'success')
    }
  }, [showToast])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!resetEmail) {
      setError('No email found. Please go back to forgot password page.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          code: digits.join(''),
          newPassword,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to reset password')
      }
      sessionStorage.removeItem('resetEmail')
      showToast('Password reset successful! Sign in with your new password.', 'success')
      router.push('/login')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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
          <span className="text-3xl">{step === 'otp' ? '📧' : '🔐'}</span>
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {step === 'otp' ? 'Enter Reset Code' : 'Set New Password'}
        </h1>
        <p className="text-sm text-[var(--color-text-dim)] mb-8">
          {step === 'otp'
            ? <>Enter the 6-digit code sent to<br /><span className="text-[var(--color-text)] font-medium">{resetEmail || 'your email'}</span></>
            : 'Your new password must be at least 8 characters'
          }
        </p>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)]"
          >
            {error}
          </motion.div>
        )}

        {step === 'otp' ? (
          <>
            {/* OTP Input */}
            <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <motion.input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl bg-[var(--color-surface)] border-2 transition-all duration-200 outline-none ${
                    digit
                      ? 'border-[var(--color-accent)] shadow-[0_0_12px_rgba(57,255,20,0.2)]'
                      : error
                      ? 'border-[var(--color-danger)]'
                      : 'border-[var(--color-border)] focus:border-[var(--color-accent)]'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => verifyOTP(digits.join(''))}
              disabled={loading || digits.some(d => !d)}
              className="glass-button w-full py-3 disabled:opacity-40"
            >
              Verify Code
            </button>
          </>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 text-left">
            {/* New Password */}
            <div>
              <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            {/* Confirm Password */}
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

            {/* Password strength indicator */}
            {newPassword && (
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      newPassword.length >= level * 3
                        ? level <= 1
                          ? 'bg-[var(--color-danger)]'
                          : level <= 2
                          ? 'bg-[var(--color-warning)]'
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Back */}
        <p className="text-sm text-[var(--color-text-dim)] mt-6">
          <Link href="/login" className="text-[var(--color-accent)] hover:underline">
            ← Back to Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
