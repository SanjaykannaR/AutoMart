'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/Toast'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const OTP_LENGTH = 6
const OTP_RESEND_SECONDS = 30

const COUNTRIES = [
  { code: '+1', flag: '\u{1F1FA}\u{1F1F8}', label: 'US' },
  { code: '+44', flag: '\u{1F1EC}\u{1F1E7}', label: 'UK' },
  { code: '+91', flag: '\u{1F1EE}\u{1F1F3}', label: 'IN' },
  { code: '+971', flag: '\u{1F1E6}\u{1F1EA}', label: 'UAE' },
  { code: '+966', flag: '\u{1F1F8}\u{1F1E6}', label: 'SA' },
  { code: '+61', flag: '\u{1F1E6}\u{1F1FA}', label: 'AU' },
]

type LoginMode = 'email' | 'phone'

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()

  // ─── Shared state ───
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginMode, setLoginMode] = useState<LoginMode>('email')

  // ─── Email/password state ───
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // ─── OTP state ───
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [otpCountdown, setOtpCountdown] = useState(OTP_RESEND_SECONDS)
  const [canResend, setCanResend] = useState(false)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // ─── FedCM error suppression ───
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      if (event.message?.includes('FedCM') || event.message?.includes('AbortError')) {
        event.preventDefault()
      }
    }
    window.addEventListener('error', handler)
    return () => window.removeEventListener('error', handler)
  }, [])

  // ─── OTP countdown timer ───
  useEffect(() => {
    if (!otpSent) return
    if (otpCountdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [otpCountdown, otpSent])

  const fullPhone = `${countryCode}${phone}`
  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[2]

  // ─── Google OAuth ───
  const googleLogin = useGoogleLogin({
    onSuccess: (credentialResponse: any) => handleGoogleSuccess(credentialResponse),
    onError: () => showToast('Google sign-in was cancelled or failed', 'error'),
  })

  // ─── Email/password login ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Invalid credentials')
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
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

  // ─── Google OAuth success ───
  const handleGoogleSuccess = async (response: any) => {
    try {
      setLoading(true)
      setError('')
      const token = response.access_token || response.credential
      const res = await fetch(`${API}/api/auth/oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', providerToken: token }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Google login failed')
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.dispatchEvent(new Event('user-updated'))
      if (data.isNewUser) {
        showToast('Signed in with Google. Complete your profile.', 'success')
        router.push('/auth/profile-setup')
      } else {
        showToast(`Welcome back, ${data.user.name}!`, 'success')
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ─── Apple OAuth (simulated) ───
  const handleAppleLogin = async () => {
    try {
      setLoading(true)
      setError('')
      const providerToken = `apple_token_${Date.now()}`
      const res = await fetch(`${API}/api/auth/oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'apple', providerToken }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Apple login failed')
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.dispatchEvent(new Event('user-updated'))
      if (data.isNewUser) {
        showToast('Signed in with Apple. Complete your profile.', 'success')
        router.push('/auth/profile-setup')
      } else {
        showToast(`Welcome back, ${data.user.name}!`, 'success')
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ─── OTP: Send code ───
  const handleSendOtp = async () => {
    if (!phone.trim() || phone.length < 6) {
      setError('Please enter a valid phone number')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to send OTP')
      }
      setOtpSent(true)
      setOtpCountdown(OTP_RESEND_SECONDS)
      setCanResend(false)
      setOtpDigits(Array(OTP_LENGTH).fill(''))
      showToast('OTP sent! Check your phone.', 'success')
      // Focus first OTP input after render
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ─── OTP: Verify code ───
  const verifyOtp = useCallback(async (otp: string) => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code: otp }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Invalid OTP')
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.dispatchEvent(new Event('user-updated'))
      showToast('Phone verified! Welcome to AutoMart', 'success')
      router.push('/')
    } catch (err: any) {
      setError(err.message)
      showToast(err.message, 'error')
      // Reset OTP inputs on error
      setOtpDigits(Array(OTP_LENGTH).fill(''))
      otpInputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }, [fullPhone, router, showToast])

  // ─── OTP: Resend code ───
  const handleResendOtp = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/otp/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to resend OTP')
      }
      setOtpCountdown(OTP_RESEND_SECONDS)
      setCanResend(false)
      setOtpDigits(Array(OTP_LENGTH).fill(''))
      showToast('New OTP sent!', 'success')
      otpInputRefs.current[0]?.focus()
    } catch (err: any) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ─── OTP: Handle digit input ───
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)
    setError('')
    if (value && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus()
    }
    if (newDigits.every(d => d !== '')) {
      setTimeout(() => verifyOtp(newDigits.join('')), 200)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (pasted) {
      const newDigits = pasted.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH)
      setOtpDigits(newDigits)
      const lastFilled = Math.min(pasted.length, OTP_LENGTH) - 1
      if (lastFilled >= 0) otpInputRefs.current[lastFilled]?.focus()
      if (pasted.length === OTP_LENGTH) {
        setTimeout(() => verifyOtp(pasted), 200)
      }
    }
  }

  // ─── Reset OTP when switching modes ───
  const switchMode = (mode: LoginMode) => {
    setLoginMode(mode)
    setError('')
    setOtpSent(false)
    setOtpDigits(Array(OTP_LENGTH).fill(''))
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-[calc(100vh-64px)] flex">
        {/* Left: Brand Panel (desktop) */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0 bg-[var(--color-bg)]">
            <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[var(--color-accent)] rounded-full opacity-[0.06] blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[var(--color-blue)] rounded-full opacity-[0.04] blur-[100px]" />
            <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-[var(--color-coral)] rounded-full opacity-[0.03] blur-[80px]" />
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
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-blue)]/10 border border-[var(--color-accent)]/20 mb-6">
                <span className="text-4xl">{'\u{1F527}'}</span>
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
              Premium auto parts, delivered to your doorstep in 30 minutes.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex gap-8 justify-center"
            >
              {[
                { value: '10K+', label: 'Parts', icon: '\u2699\uFE0F' },
                { value: '30min', label: 'Delivery', icon: '\u{1F680}' },
                { value: '24/7', label: 'Support', icon: '\u{1F4AC}' },
              ].map((stat) => (
                <div key={stat.label} className="text-center group">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <p className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--color-text-dim)]">{stat.label}</p>
                </div>
              ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-12 p-4 rounded-xl bg-[var(--color-surface)]/60 border border-[var(--color-border)]/50"
            >
              <p className="text-sm text-[var(--color-text-dim)] italic mb-2">
                &ldquo;Got my brake pads in 25 minutes. Game changer for my garage.&rdquo;
              </p>
              <p className="text-xs text-[var(--color-accent)] font-medium">&mdash; Mike R., Mechanic</p>
            </motion.div>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="w-full lg:w-[55%] flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-blue)]/10 border border-[var(--color-accent)]/20 mb-3">
                <span className="text-2xl">{'\u{1F527}'}</span>
              </div>
              <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <span className="text-[var(--color-accent)]">Auto</span>Mart
              </h1>
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome Back
            </h2>
            <p className="text-sm text-[var(--color-text-dim)] mb-8">
              Sign in to your AutoMart account
            </p>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)] text-center">
                {error}
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-900 font-medium text-sm hover:bg-gray-100 transition-all duration-200 shadow-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={handleAppleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-900 font-medium text-sm hover:bg-gray-100 transition-all duration-200 shadow-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            {/* ─── Divider with Email/Phone tabs ─── */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-[var(--color-border)]" />
              <div className="flex gap-1 bg-[var(--color-surface)] rounded-lg p-0.5 border border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => switchMode('email')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                    loginMode === 'email'
                      ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                      : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] border border-transparent'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('phone')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                    loginMode === 'phone'
                      ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                      : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] border border-transparent'
                  }`}
                >
                  Phone
                </button>
              </div>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>

            {/* ─── Email/Password Form ─── */}
            <AnimatePresence mode="wait">
              {loginMode === 'email' ? (
                <motion.form
                  key="email-form"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
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
                        placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
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
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
                      <span className="text-[var(--color-text-dim)]">Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-[var(--color-accent)] hover:underline text-sm">
                      Forgot password?
                    </Link>
                  </div>
                  <button type="submit" disabled={loading} className="glass-button w-full py-3 mt-2">
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="phone-form"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {!otpSent ? (
                    <>
                      {/* Phone number input */}
                      <div>
                        <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Phone Number</label>
                        <div className="flex gap-2">
                          {/* Country code dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                              className="glass-input flex items-center gap-1.5 w-[88px] justify-center"
                            >
                              <span>{selectedCountry.flag}</span>
                              <span className="text-sm">{selectedCountry.code}</span>
                              <svg className="w-3 h-3 text-[var(--color-text-dim)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {showCountryDropdown && (
                              <div className="absolute top-full left-0 mt-1 w-36 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl z-50 py-1">
                                {COUNTRIES.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => { setCountryCode(c.code); setShowCountryDropdown(false) }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-surface-alt)] transition-colors"
                                  >
                                    <span>{c.flag}</span>
                                    <span className="text-[var(--color-text)]">{c.label}</span>
                                    <span className="text-[var(--color-text-dim)] ml-auto">{c.code}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            className="glass-input flex-1"
                            placeholder="98765 43210"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading || !phone.trim() || phone.length < 6}
                        className="glass-button w-full py-3 disabled:opacity-40"
                      >
                        {loading ? 'Sending...' : 'Send OTP'}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* OTP verification */}
                      <div className="text-center">
                        <p className="text-sm text-[var(--color-text-dim)] mb-1">
                          Code sent to
                        </p>
                        <p className="text-sm text-[var(--color-text)] font-medium">
                          {selectedCountry.flag} {fullPhone}
                        </p>
                      </div>
                      {/* OTP digits input */}
                      <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                        {otpDigits.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => { otpInputRefs.current[i] = el }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            className={`w-11 h-13 text-center text-xl font-bold rounded-xl bg-[var(--color-surface)] border-2 transition-all duration-200 outline-none ${
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
                        type="button"
                        onClick={() => verifyOtp(otpDigits.join(''))}
                        disabled={loading || otpDigits.some(d => !d)}
                        className="glass-button w-full py-3 disabled:opacity-40"
                      >
                        {loading ? 'Verifying...' : 'Verify'}
                      </button>
                      {/* Resend */}
                      <div className="text-center">
                        {canResend ? (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-sm text-[var(--color-accent)] hover:underline font-medium"
                          >
                            Resend Code
                          </button>
                        ) : (
                          <p className="text-sm text-[var(--color-text-dim)]">
                            Resend code in <span className="text-[var(--color-text)] font-medium">{otpCountdown}s</span>
                          </p>
                        )}
                      </div>
                      {/* Back to phone input */}
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpDigits(Array(OTP_LENGTH).fill('')); setError('') }}
                        className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors w-full text-center"
                      >
                        {'\u2190'} Change phone number
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

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
    </GoogleOAuthProvider>
  )
}
