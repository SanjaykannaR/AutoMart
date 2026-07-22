'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useToast } from '@/components/Toast'

const OTP_LENGTH = 6
const RESEND_SECONDS = 30

export default function VerifyPhonePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const [canResend, setCanResend] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [phone, setPhone] = useState('')

  useEffect(() => {
    const pending = localStorage.getItem('pendingUser')
    const otpPhone = localStorage.getItem('otpPhone')
    if (!pending || !otpPhone) {
      router.push('/login')
      return
    }
    setPhone(otpPhone)
  }, [router])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Auto-advance on input
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)
    setError('')

    // Auto-advance
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-verify when all filled
    if (newDigits.every(d => d !== '')) {
      setTimeout(() => verifyOTP(newDigits.join('')), 200)
    }
  }

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (pasted) {
      const newDigits = pasted.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH)
      setDigits(newDigits)
      // Focus last filled
      const lastFilled = Math.min(pasted.length, OTP_LENGTH) - 1
      if (lastFilled >= 0) {
        inputRefs.current[lastFilled]?.focus()
      }
      // Auto-verify if complete
      if (pasted.length === OTP_LENGTH) {
        setTimeout(() => verifyOTP(pasted), 200)
      }
    }
  }

  const verifyOTP = useCallback(async (otp: string) => {
    const stored = localStorage.getItem('otpCode')
    if (otp === stored) {
      setLoading(true)
      // OTP verified — complete registration
      const pending = JSON.parse(localStorage.getItem('pendingUser') || '{}')
      localStorage.setItem('user', JSON.stringify({
        email: pending.email,
        name: pending.name,
        phone: pending.phone,
        address: pending.address,
        avatar: pending.avatar || '👤',
        phoneVerified: true,
        authProvider: pending.authProvider || 'email',
      }))
      localStorage.setItem('token', `token_${Date.now()}`)
      localStorage.removeItem('pendingUser')
      localStorage.removeItem('otpCode')
      localStorage.removeItem('otpPhone')
      window.dispatchEvent(new Event('user-updated'))
      showToast('Phone verified! Welcome to AutoMart 🎉', 'success')
      router.push('/')
    } else {
      setError('Invalid OTP. Please try again.')
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    }
  }, [router, showToast])

  const handleResend = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    localStorage.setItem('otpCode', otp)
    setCountdown(RESEND_SECONDS)
    setCanResend(false)
    setDigits(Array(OTP_LENGTH).fill(''))
    setError('')
    inputRefs.current[0]?.focus()
    showToast(`New OTP sent — Code: ${otp}`, 'success')
  }

  const maskPhone = (p: string) => {
    if (p.length < 6) return p
    return p.slice(0, -4).replace(/./g, '•') + p.slice(-4)
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
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-blue)]/10 border border-[var(--color-accent)]/20 mb-6"
        >
          <span className="text-4xl">📱</span>
        </motion.div>

        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Verify Your Phone
        </h1>
        <p className="text-sm text-[var(--color-text-dim)] mb-8">
          We sent a 6-digit code to<br />
          <span className="text-[var(--color-text)] font-medium">{maskPhone(phone)}</span>
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

        {/* Verify button */}
        <button
          onClick={() => verifyOTP(digits.join(''))}
          disabled={loading || digits.some(d => !d)}
          className="glass-button w-full py-3 mb-4 disabled:opacity-40"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        {/* Resend */}
        <p className="text-sm text-[var(--color-text-dim)]">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-[var(--color-accent)] hover:underline font-medium"
            >
              Resend Code
            </button>
          ) : (
            <span>Resend code in <span className="text-[var(--color-text)] font-medium">{countdown}s</span></span>
          )}
        </p>

        {/* Back */}
        <p className="text-sm text-[var(--color-text-dim)] mt-6">
          <button onClick={() => router.push('/auth/profile-setup')} className="text-[var(--color-accent)] hover:underline">
            ← Back to profile
          </button>
        </p>
      </motion.div>
    </div>
  )
}
