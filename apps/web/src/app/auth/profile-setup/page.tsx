'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useToast } from '@/components/Toast'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const AVATAR_PRESETS = ['👤', '🧑', '👨', '👩', '🧔', '🧑‍🔧', '🏎️', '🏍️', '🔧', '⚡', '🛻', '🚗']

const COUNTRIES = [
  { code: '+1', flag: '🇺🇸', label: 'US' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
  { code: '+91', flag: '🇮🇳', label: 'IN' },
  { code: '+971', flag: '🇦🇪', label: 'UAE' },
  { code: '+966', flag: '🇸🇦', label: 'SA' },
  { code: '+61', flag: '🇦🇺', label: 'AU' },
  { code: '+49', flag: '🇩🇪', label: 'DE' },
  { code: '+81', flag: '🇯🇵', label: 'JP' },
]

export default function ProfileSetupPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [address, setAddress] = useState('')
  const [avatar, setAvatar] = useState('👤')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [authToken, setAuthToken] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (!token) {
      router.push('/login')
      return
    }
    setAuthToken(token)
    if (user) {
      const userData = JSON.parse(user)
      setEmail(userData.email || '')
      setName(userData.name || '')
      setAvatar(userData.avatar || '👤')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !address.trim()) {
      showToast('Please fill in all required fields', 'error')
      return
    }
    if (phone.length < 6) {
      showToast('Please enter a valid phone number', 'error')
      return
    }

    setLoading(true)
    const fullPhone = `${countryCode}${phone}`

    try {
      // Save profile to backend
      const profileRes = await fetch(`${API}/api/auth/profile/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: fullPhone,
          address: address.trim(),
          avatar,
        }),
      })
      if (!profileRes.ok) {
        const data = await profileRes.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to save profile')
      }
      const profileData = await profileRes.json()

      // Update local storage with profile data
      localStorage.setItem('user', JSON.stringify(profileData.user))
      window.dispatchEvent(new Event('user-updated'))

      // Send OTP to the phone number
      const otpRes = await fetch(`${API}/api/auth/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ phone: fullPhone }),
      })
      if (!otpRes.ok) {
        const data = await otpRes.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to send OTP')
      }
      const otpData = await otpRes.json()

      showToast(`OTP sent to ${fullPhone}${otpData.devCode ? ` — Code: ${otpData.devCode}` : ''}`, 'success')
      localStorage.setItem('otpPhone', fullPhone)
      router.push('/auth/verify-phone')
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0]

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-blue)]/10 border border-[var(--color-accent)]/20 mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Complete Your Profile
          </h1>
          <p className="text-sm text-[var(--color-text-dim)]">
            Tell us a bit about yourself to personalize your experience
          </p>
        </div>

        {/* Avatar Picker */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-blue)]/10 border-2 border-[var(--color-accent)]/40 flex items-center justify-center text-4xl hover:border-[var(--color-accent)]/60 transition-all duration-200 hover:shadow-[0_0_20px_rgba(57,255,20,0.15)]"
            >
              {avatar}
            </button>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-bg)] text-xs cursor-pointer hover:scale-110 transition-transform">
              ✏️
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-dim)] mt-2">Tap to change avatar</p>

          {/* Avatar grid */}
          {showAvatarPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] grid grid-cols-6 gap-2"
            >
              {AVATAR_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { setAvatar(emoji); setShowAvatarPicker(false) }}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl hover:bg-[var(--color-surface-alt)] transition-all ${
                    avatar === emoji ? 'bg-[var(--color-accent-dim)] ring-1 ring-[var(--color-accent)]/40' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input"
              placeholder="Your full name"
              required
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="glass-input opacity-60 cursor-not-allowed"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Phone Number *</label>
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
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-sm text-[var(--color-text-dim)] block mb-1.5">Delivery Address *</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="glass-input min-h-[80px] resize-none"
              placeholder="Street, City, State, ZIP"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="glass-button w-full py-3 mt-2"
          >
            {loading ? 'Saving...' : 'Continue →'}
          </button>
        </form>

        {/* Skip */}
        <p className="text-sm text-[var(--color-text-dim)] text-center mt-4">
          <button onClick={() => router.push('/')} className="text-[var(--color-accent)] hover:underline">
            Skip for now
          </button>
        </p>
      </motion.div>
    </div>
  )
}
