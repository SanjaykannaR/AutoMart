/**
 * Account/Profile Page — User settings and profile management
 * 
 * WHAT IT DOES:
 *   - Shows user profile info (name, email, phone)
 *   - Edit profile details
 *   - Manage saved addresses
 *   - Change password section
 *   - Logout button
 * 
 * DATA STORAGE:
 *   - User data stored in localStorage as "user" JSON object
 *   - Format: { name, email, phone, addresses: [{ label, address }] }
 *   - On first visit, shows default placeholder data
 * 
 * LAYOUT:
 *   - 2-column on desktop: left = profile card, right = settings tabs
 *   - Single column on mobile
 *   - Tabs: Profile | Addresses | Security
 * 
 * HOW IT CONNECTS:
 *   - Navbar "Sign In" changes to user avatar/name when logged in
 *   - Login page writes user data to localStorage
 *   - This page reads and updates it
 */
'use client'

import { useState, useEffect } from 'react'
import { UserIcon, MapPinIcon, ShieldCheckIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ScrollReveal } from '@/components/ScrollReveal'

/**
 * UserProfile type — what user data looks like in localStorage.
 */
interface UserProfile {
  name: string
  email: string
  phone: string
  addresses: Address[]
}

/**
 * Address type — a saved delivery address.
 * label: friendly name like "Home" or "Office"
 * address: full address string
 */
interface Address {
  id: number
  label: string
  address: string
}

/** Default profile shown when no data in localStorage */
const defaultProfile: UserProfile = {
  name: 'Guest User',
  email: 'guest@automart.com',
  phone: '',
  addresses: [],
}

/** Tab definitions — which sections the user can switch between */
const tabs = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'addresses', label: 'Addresses', icon: MapPinIcon },
  { id: 'security', label: 'Security', icon: ShieldCheckIcon },
]

export default function AccountPage() {
  // State
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [activeTab, setActiveTab] = useState('profile')
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(false) // Shows "Saved!" feedback

  // Profile form state — editable fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  /**
   * LOAD PROFILE FROM LOCALSTORAGE
   * Reads user data on mount. If not found, uses default placeholder.
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('user')
      if (saved) {
        const data = JSON.parse(saved)
        setProfile(data)
        setName(data.name || '')
        setEmail(data.email || '')
        setPhone(data.phone || '')
      } else {
        setName(defaultProfile.name)
        setEmail(defaultProfile.email)
      }
    } catch {
      setName(defaultProfile.name)
      setEmail(defaultProfile.email)
    }
    setLoaded(true)
  }, [])

  /** Save profile to localStorage */
  const saveProfile = () => {
    const updated = { ...profile, name, email, phone }
    setProfile(updated)
    localStorage.setItem('user', JSON.stringify(updated))
    window.dispatchEvent(new Event('user-updated'))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  /** Add a new address with default label */
  const addAddress = () => {
    const newAddress: Address = {
      id: Date.now(),
      label: 'New Address',
      address: 'Enter your address here...',
    }
    const updated = {
      ...profile,
      addresses: [...profile.addresses, newAddress],
    }
    setProfile(updated)
    localStorage.setItem('user', JSON.stringify(updated))
    window.dispatchEvent(new Event('user-updated'))
  }

  /** Remove address by ID */
  const removeAddress = (id: number) => {
    const updated = {
      ...profile,
      addresses: profile.addresses.filter((a) => a.id !== id),
    }
    setProfile(updated)
    localStorage.setItem('user', JSON.stringify(updated))
    window.dispatchEvent(new Event('user-updated'))
  }

  /** Update address text */
  const updateAddress = (id: number, text: string) => {
    const updated = {
      ...profile,
      addresses: profile.addresses.map((a) =>
        a.id === id ? { ...a, address: text } : a
      ),
    }
    setProfile(updated)
    localStorage.setItem('user', JSON.stringify(updated))
    window.dispatchEvent(new Event('user-updated'))
  }

  /** Change password (demo only — no real auth) */
  const changePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  /** Logout — clear localStorage and redirect */
  const logout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  // Loading state
  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-[2560px] mx-auto">
      {/* Page header — text animation */}
      <div className="mb-8">
        <ScrollReveal variant="text">
          <h1
            className="text-3xl font-extrabold"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            My Account
          </h1>
        </ScrollReveal>
        <ScrollReveal variant="fade" delay={0.05}>
          <p className="text-[var(--color-text-dim)] text-sm mt-1">
            Manage your profile and settings
          </p>
        </ScrollReveal>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* LEFT: Profile Summary Card — slide-left */}
        <ScrollReveal variant="slide-left">
          <div className="card p-6">
            {/* Avatar — circle with initial letter */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-[var(--color-accent)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* User name */}
            <h2 className="text-center font-bold text-lg mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {profile.name}
            </h2>

            {/* User email */}
            <p className="text-center text-sm text-[var(--color-text-dim)] mb-6">
              {profile.email}
            </p>

            {/* Tab navigation — vertical on desktop */}
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                      : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-white/[0.04]'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Logout button — danger style */}
            <button
              onClick={logout}
              className="w-full mt-6 px-4 py-3 rounded-lg text-sm font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </ScrollReveal>

        {/* RIGHT: Tab Content — slide-right with pop on tab switch */}
        <div className="space-y-6">

          {/* PROFILE TAB — edit name, email, phone */}
          {activeTab === 'profile' && (
            <ScrollReveal variant="slide-right">
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Profile Information
                </h3>

                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={saveProfile}
                    className="px-6 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
                  >
                    {saved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* ADDRESSES TAB — list of saved addresses */}
          {activeTab === 'addresses' && (
            <ScrollReveal variant="slide-right">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Saved Addresses
                  </h3>
                  <button
                    onClick={addAddress}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {profile.addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPinIcon className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-muted)]" />
                    <p className="text-sm text-[var(--color-text-dim)]">
                      No saved addresses yet. Add one for faster checkout.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profile.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="flex items-start gap-3 p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]"
                      >
                        <MapPinIcon className="w-5 h-5 text-[var(--color-accent)] mt-0.5 shrink-0" />

                        <div className="flex-1">
                          <input
                            type="text"
                            value={addr.label}
                            onChange={(e) => {
                              const updated = {
                                ...profile,
                                addresses: profile.addresses.map((a) =>
                                  a.id === addr.id ? { ...a, label: e.target.value } : a
                                ),
                              }
                              setProfile(updated)
                              localStorage.setItem('user', JSON.stringify(updated))
                              window.dispatchEvent(new Event('user-updated'))
                            }}
                            className="block text-sm font-medium bg-transparent border-none outline-none text-[var(--color-text)] mb-1 w-full"
                          />
                          <input
                            type="text"
                            value={addr.address}
                            onChange={(e) => updateAddress(addr.id, e.target.value)}
                            className="block text-xs text-[var(--color-text-dim)] bg-transparent border-none outline-none w-full"
                          />
                        </div>

                        <button
                          onClick={() => removeAddress(addr.id)}
                          className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                          aria-label="Remove address"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}

          {/* SECURITY TAB — change password */}
          {activeTab === 'security' && (
            <ScrollReveal variant="slide-right">
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Change Password
                </h3>

                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={changePassword}
                    className="px-6 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
                  >
                    {saved ? 'Password Changed!' : 'Update Password'}
                  </button>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </div>
  )
}
