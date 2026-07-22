/**
 * Navbar — Centered menu with icons + text labels
 * 
 * Features:
 *   - Camera icon → search by image (file picker for auto part photo)
 *   - Microphone icon → search by voice (Web Speech API)
 *   - Settings as a nav menu item (like other pages, has its own /settings route)
 *   - Active tab uses trending pill/capsule background style
 *   - Search bar glows with rotating gradient border on focus
 *   - Notification bell with unread badge + dropdown panel
 *   - Glass circle buttons for wishlist + cart
 * 
 * Layout:
 *   [Logo] ——— [🏠 Home] [📁 Categories] [🔧 Browse] [📦 Orders] [⚙️ Settings] [🔍 🔎 _search_ 🎤 📷] ——— [🔔] [♡] [🛒]
 * 
 * Notifications:
 *   - Bell icon with unread count badge
 *   - Dropdown panel with notification list (order, promo, system, stock types)
 *   - Click to mark as read + navigate (if link exists)
 *   - "Mark all read" + "Clear all" actions
 *   - Data persisted in localStorage
 *   - Seeded with sample notifications on first visit
 */
'use client'

// ─── React + Next.js imports ───
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// ─── Heroicons imports ───
import {
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  Cog6ToothIcon,
  HomeIcon,
  Squares2X2Icon,
  WrenchIcon,
  ClipboardDocumentListIcon,
  CameraIcon,
  MicrophoneIcon,
  XMarkIcon,
  BellIcon,
  CheckIcon,
  TrashIcon,
  ShoppingBagIcon,
  TagIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Cog8ToothIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'

// ─── Solid icons ───
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

// ─── Preset avatar emojis — users pick one during profile setup ───
const presetAvatars = [
  '👤', '🧑', '👨', '👩', '🧔', '👱', '🧑‍🔧', '👨‍🔧', '👩‍🔧', '🏎️', '🏍️', '🔧',
]

// ─── Notification type definition ───
interface Notification {
  id: string
  type: 'order' | 'promo' | 'system' | 'stock'
  title: string
  message: string
  time: string // ISO date string
  read: boolean
  link?: string // optional navigation target
}

// ─── Type-specific icon + color config ───
const notifConfig: Record<string, { icon: typeof BellIcon; color: string; bg: string }> = {
  order: { icon: ShoppingBagIcon, color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent)]/15' },
  promo: { icon: TagIcon, color: 'text-[var(--color-coral)]', bg: 'bg-[var(--color-coral)]/15' },
  system: { icon: InformationCircleIcon, color: 'text-[var(--color-blue)]', bg: 'bg-[var(--color-blue)]/15' },
  stock: { icon: ArrowPathIcon, color: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning)]/15' },
}

// ─── Sample notifications seeded on first visit ───
const sampleNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'promo',
    title: 'Flash Sale: 30% Off Brakes',
    message: 'Premium brake pads and rotors are now 30% off. Limited time only!',
    time: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    read: false,
    link: '/search?category=brakes',
  },
  {
    id: 'n2',
    type: 'system',
    title: 'Welcome to AutoMart',
    message: 'Your account is set up. Start browsing thousands of auto parts.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
  },
  {
    id: 'n3',
    type: 'stock',
    title: 'Back in Stock: LED Headlights',
    message: 'The LED Headlight Kit you wished for is back in stock!',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    link: '/search?q=LED+headlight',
  },
]

// ─── Navigation link definitions ───
const navLinks = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/categories', label: 'Categories', icon: Squares2X2Icon },
  { href: '/search', label: 'Browse Parts', icon: WrenchIcon },
  { href: '/orders', label: 'My Orders', icon: ClipboardDocumentListIcon },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
]

export function Navbar() {
  // ─── Core hooks ───
  const pathname = usePathname()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const notifPanelRef = useRef<HTMLDivElement>(null)
  const notifButtonRef = useRef<HTMLButtonElement>(null)

  // ─── State declarations ───
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isListening, setIsListening] = useState(false)

  // ─── Mobile menu state ───
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ─── Notification state ───
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifOpen, setNotifOpen] = useState(false)

  // ─── Profile state ───
  const [userName, setUserName] = useState('')          // User's display name from localStorage
  const [userAvatar, setUserAvatar] = useState('👤')   // Selected emoji avatar (default: generic person)
  const [profileOpen, setProfileOpen] = useState(false) // Profile dropdown open/closed
  const profileRef = useRef<HTMLDivElement>(null)       // Ref for click-outside detection
  const profileBtnRef = useRef<HTMLButtonElement>(null) // Ref for click-outside detection

  // ─── Derived: unread count ───
  const unreadCount = notifications.filter((n) => !n.read).length

  /* ───────────────────────────────────────────────────────────────
   * NOTIFICATION HELPERS
   * ─────────────────────────────────────────────────────────────── */

  /** Load notifications from localStorage, seed samples on first visit */
  const loadNotifications = useCallback(() => {
    try {
      const stored = localStorage.getItem('notifications')
      if (stored) {
        setNotifications(JSON.parse(stored))
      } else {
        // First visit — seed sample notifications
        localStorage.setItem('notifications', JSON.stringify(sampleNotifications))
        setNotifications(sampleNotifications)
      }
    } catch {
      setNotifications([])
    }
  }, [])

  /** Save notifications array to localStorage */
  const saveNotifications = (notifs: Notification[]) => {
    setNotifications(notifs)
    localStorage.setItem('notifications', JSON.stringify(notifs))
  }

  /** Mark a single notification as read */
  const markAsRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
    saveNotifications(updated)
  }

  /** Mark all notifications as read */
  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }))
    saveNotifications(updated)
  }

  /** Remove a single notification by ID */
  const removeNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id)
    saveNotifications(updated)
  }

  /** Clear all notifications */
  const clearAll = () => {
    saveNotifications([])
  }

  /** Add a new notification (called from other parts of the app) */
  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      time: new Date().toISOString(),
      read: false,
    }
    const updated = [newNotif, ...notifications]
    saveNotifications(updated)
  }, [notifications])

  /** Handle notification click — mark read + navigate if link exists */
  const handleNotifClick = (notif: Notification) => {
    markAsRead(notif.id)
    if (notif.link) {
      router.push(notif.link)
    }
    setNotifOpen(false)
  }

  /** Format relative time (e.g. "5m ago", "2h ago", "1d ago") */
  const formatTime = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  // ─── Load notifications on mount ───
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // ─── Listen for notification events from other components ───
  useEffect(() => {
    const handleNewNotif = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail) {
        addNotification(detail)
      }
    }
    window.addEventListener('new-notification', handleNewNotif as EventListener)
    window.addEventListener('storage', loadNotifications)

    return () => {
      window.removeEventListener('new-notification', handleNewNotif as EventListener)
      window.removeEventListener('storage', loadNotifications)
    }
  }, [addNotification, loadNotifications])

  // ─── Click outside to close notification panel ───
  useEffect(() => {
    if (!notifOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        notifPanelRef.current &&
        !notifPanelRef.current.contains(e.target as Node) &&
        notifButtonRef.current &&
        !notifButtonRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  // ─── Click outside to close profile dropdown ───
  useEffect(() => {
    if (!profileOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node) &&
        profileBtnRef.current &&
        !profileBtnRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [profileOpen])

  // ─── Mobile drawer: Escape key + body scroll lock ───
  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden' // Lock body scroll

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = '' // Restore body scroll
    }
  }, [mobileMenuOpen])

  /** Save selected avatar to localStorage and update state */
  const selectAvatar = (emoji: string) => {
    setUserAvatar(emoji) // Update local state
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}') // Get existing user data
      user.avatar = emoji // Add/update avatar field
      localStorage.setItem('user', JSON.stringify(user)) // Persist
      window.dispatchEvent(new Event('user-updated')) // Notify other components
    } catch { /* ignore */ }
  }

  /** Logout — clear all user data and redirect */
  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setProfileOpen(false)
    window.location.href = '/' // Hard reload to clear all state
  }

  /* ───────────────────────────────────────────────────────────────
   * LOGIN STATE DETECTION
   * ─────────────────────────────────────────────────────────────── */
  const checkLogin = () => {
    try {
      const user = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      const loggedIn =
        (!!user && user !== 'null' && user !== '') ||
        (!!token && token !== 'null' && token !== '')
      setIsLoggedIn(loggedIn)

      // Load profile data when logged in
      if (loggedIn && user) {
        const userData = JSON.parse(user) // Parse stored user object
        setUserName(userData.name || userData.email?.split('@')[0] || 'User') // Name or fallback
        setUserAvatar(userData.avatar || '👤') // Saved avatar or default
      } else {
        setUserName('') // Clear when logged out
        setUserAvatar('👤')
      }
    } catch {
      setIsLoggedIn(false)
    }
  }

  useEffect(() => {
    checkLogin()
    window.addEventListener('storage', checkLogin)
    window.addEventListener('user-updated', checkLogin)
    return () => {
      window.removeEventListener('storage', checkLogin)
      window.removeEventListener('user-updated', checkLogin)
    }
  }, [])

  useEffect(() => {
    checkLogin()
  }, [pathname])

  /* ───────────────────────────────────────────────────────────────
   * CART + WISHLIST COUNTS
   * ─────────────────────────────────────────────────────────────── */
  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartCount(cart.reduce((sum: number, item: any) => sum + (item.qty || 1), 0))
    } catch { setCartCount(0) }
  }

  const updateWishlistCount = () => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setWishlistCount(wishlist.length)
    } catch { setWishlistCount(0) }
  }

  useEffect(() => {
    updateCartCount()
    updateWishlistCount()

    const h1 = () => updateCartCount()
    const h2 = () => updateWishlistCount()

    window.addEventListener('cart-updated', h1)
    window.addEventListener('wishlist-updated', h2)
    window.addEventListener('storage', h1)
    window.addEventListener('storage', h2)

    return () => {
      window.removeEventListener('cart-updated', h1)
      window.removeEventListener('wishlist-updated', h2)
      window.removeEventListener('storage', h1)
      window.removeEventListener('storage', h2)
    }
  }, [])

  /* ───────────────────────────────────────────────────────────────
   * ACTIVE LINK DETECTION
   * ─────────────────────────────────────────────────────────────── */
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  /* ───────────────────────────────────────────────────────────────
   * TEXT SEARCH
   * ─────────────────────────────────────────────────────────────── */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  /* ───────────────────────────────────────────────────────────────
   * SEARCH BY IMAGE
   * ─────────────────────────────────────────────────────────────── */
  const handleImageSearch = () => {
    fileInputRef.current?.click()
  }

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      sessionStorage.setItem('imageSearch', base64)
      router.push('/search?mode=image')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  /* ───────────────────────────────────────────────────────────────
   * SEARCH BY VOICE (Web Speech API)
   * ─────────────────────────────────────────────────────────────── */
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Try Chrome or Edge.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setSearchQuery(transcript)
      router.push(`/search?q=${encodeURIComponent(transcript)}`)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    setIsListening(true)
    recognition.start()
  }

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* ═══ LOGO ═══ */}
          <Link href="/" className="flex items-center shrink-0">
            <img src="/logo/automart-logo.svg" alt="AutoMart" className="h-9 w-9" />
          </Link>

          {/* ═══ CENTER: Nav Links + Search ═══ */}
          <div className="hidden md:flex items-center gap-5 flex-1 justify-center">

            {/* Nav links */}
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      active
                        ? 'text-[var(--color-text)]'
                        : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </span>
                    {active && (
                      <span className="absolute inset-0 -z-10 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 shadow-[0_0_12px_rgba(57,255,20,0.1)]" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Search bar */}
            <div className="search-glow-wrapper flex-1 max-w-sm">
              <form onSubmit={handleSearch} className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] focus-within:border-[var(--color-accent)]/40 focus-within:bg-white/[0.1] transition-all">
                <MagnifyingGlassIcon className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search parts..."
                  className="bg-transparent border-none outline-none flex-1 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] min-w-0"
                />
                {searchQuery.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/[0.1] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all"
                    title="Clear search"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                )}

                {/* Voice search */}
                <div className="relative shrink-0">
                  {/* Pulsing ring layers when listening */}
                  {isListening && (
                    <>
                      <span className="absolute inset-0 -m-2 rounded-full border-2 border-[var(--color-coral)] animate-[voice-ring_1.2s_ease-out_infinite] opacity-80" />
                      <span className="absolute inset-0 -m-3.5 rounded-full border border-[var(--color-coral)]/50 animate-[voice-ring_1.2s_ease-out_0.4s_infinite] opacity-50" />
                      <span className="absolute inset-0 -m-5 rounded-full border border-[var(--color-coral)]/30 animate-[voice-ring_1.2s_ease-out_0.8s_infinite] opacity-30" />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    title={isListening ? 'Stop listening' : 'Search by voice'}
                    className={`relative w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                      isListening
                        ? 'bg-[var(--color-coral)]/30 text-[var(--color-coral)] shadow-[0_0_20px_rgba(255,82,59,0.5)]'
                        : 'hover:bg-white/[0.08] text-[var(--color-text-muted)] hover:text-[var(--color-text-dim)]'
                    }`}
                  >
                    {isListening ? (
                      <span className="flex items-end gap-[2px] h-3.5">
                        <span className="w-[2.5px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.45s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0s', height: '35%' }} />
                        <span className="w-[2.5px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.45s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.12s', height: '100%' }} />
                        <span className="w-[2.5px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.45s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.24s', height: '55%' }} />
                        <span className="w-[2.5px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.45s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.08s', height: '80%' }} />
                        <span className="w-[2.5px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.45s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.18s', height: '45%' }} />
                        <span className="w-[2.5px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.45s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.3s', height: '70%' }} />
                      </span>
                    ) : (
                      <MicrophoneIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {/* "Listening..." text indicator */}
                  {isListening && (
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-[var(--color-coral)] whitespace-nowrap animate-pulse tracking-wide">
                      Listening...
                    </span>
                  )}
                </div>

                {/* Image search */}
                <button
                  type="button"
                  onClick={handleImageSearch}
                  title="Search by image"
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/[0.08] text-[var(--color-text-muted)] hover:text-[var(--color-text-dim)] transition-all"
                >
                  <CameraIcon className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelected}
              className="hidden"
            />
          </div>

          {/* ═══ RIGHT: Notifications + Wishlist + Cart + Hamburger + Profile ═══ */}
          <div className="flex items-center gap-2 shrink-0">

            {/* ─── NOTIFICATION BELL (hidden on mobile — accessible via hamburger menu) ─── */}
            <div className="relative hidden md:block">
              <button
                ref={notifButtonRef}
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-[var(--color-accent)]/15 hover:border-[var(--color-accent)]/30 hover:shadow-[0_0_16px_rgba(57,255,20,0.12)] transition-all group/nb"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <BellIcon className={`w-[18px] h-[18px] transition-colors ${unreadCount > 0 ? 'text-[var(--color-accent)] group-hover/nb:text-[var(--color-accent)]' : 'text-[var(--color-text-dim)] group-hover/nb:text-[var(--color-accent)]'}`} />
                {/* Unread badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-[10px] font-bold px-1 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* ─── NOTIFICATION DROPDOWN PANEL ─── */}
              {notifOpen && (
                <div
                  ref={notifPanelRef}
                  className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] rounded-2xl bg-[var(--color-surface)] border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden z-50 notif-panel"
                >
                  {/* Panel header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <h3
                      className="text-sm font-bold text-[var(--color-text)]"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-2 text-[10px] font-semibold text-[var(--color-accent)] bg-[var(--color-accent)]/15 px-1.5 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="flex items-center gap-1 text-[11px] text-[var(--color-text-dim)] hover:text-[var(--color-accent)] transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
                          title="Mark all as read"
                        >
                          <CheckIcon className="w-3 h-3" />
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAll}
                          className="flex items-center gap-1 text-[11px] text-[var(--color-text-dim)] hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
                          title="Clear all notifications"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notification list */}
                  <div className="overflow-y-auto max-h-[400px] divide-y divide-white/[0.04]">
                    {notifications.length === 0 ? (
                      /* Empty state */
                      <div className="py-12 text-center">
                        <BellIcon className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-muted)] opacity-40" />
                        <p className="text-sm text-[var(--color-text-dim)]">No notifications yet</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">We&apos;ll let you know when something happens</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const cfg = notifConfig[notif.type] || notifConfig.system
                        const TypeIcon = cfg.icon
                        return (
                          <div
                            key={notif.id}
                            className={`group relative px-4 py-3 flex items-start gap-3 transition-colors hover:bg-white/[0.04] ${
                              !notif.read ? 'bg-white/[0.02]' : ''
                            }`}
                          >
                            {/* Clickable area — marks as read + navigates */}
                            <button
                              onClick={() => handleNotifClick(notif)}
                              className="flex items-start gap-3 flex-1 min-w-0 text-left"
                            >
                              {/* Type icon */}
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                                <TypeIcon className={`w-4 h-4 ${cfg.color}`} />
                              </div>
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold text-[var(--color-text)]' : 'text-[var(--color-text-dim)]'}`}>
                                    {notif.title}
                                  </p>
                                  {!notif.read && (
                                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0 mt-1.5" />
                                  )}
                                </div>
                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-[var(--color-text-muted)] mt-1 opacity-60">
                                  {formatTime(notif.time)}
                                </p>
                              </div>
                            </button>

                            {/* Delete button — appears on hover, stops propagation */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeNotification(notif.id)
                              }}
                              className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/[0.1] text-[var(--color-text-muted)] hover:text-red-400 transition-all"
                              title="Remove notification"
                            >
                              <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ─── WISHLIST ─── */}
            <Link
              href="/wishlist"
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-[var(--color-wine)]/15 hover:border-[var(--color-wine)]/30 hover:shadow-[0_0_16px_rgba(194,58,92,0.15)] transition-all group/wl"
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              {wishlistCount > 0 ? (
                <HeartSolidIcon className="w-[18px] h-[18px] text-[var(--color-accent)] group-hover/wl:text-[var(--color-wine)] transition-colors" />
              ) : (
                <HeartIcon className="w-[18px] h-[18px] text-[var(--color-text-dim)] group-hover/wl:text-[var(--color-wine)] transition-colors" />
              )}
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-[10px] font-bold px-1">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* ─── CART ─── */}
            <Link
              href="/cart"
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-[var(--color-gold)]/15 hover:border-[var(--color-gold)]/30 hover:shadow-[0_0_16px_rgba(232,168,56,0.15)] transition-all group/cart"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCartIcon className="w-[18px] h-[18px] text-[var(--color-text-dim)] group-hover/cart:text-[var(--color-gold)] transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-[10px] font-bold px-1">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* ─── HAMBURGER MENU (mobile only) ─── */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-white/[0.1] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-all"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>

            {/* ═══════════════════════════════════════════════════════
                PROFILE SECTION — Sign In button OR Profile Avatar
                - NOT logged in → coral "Sign In" pill button
                - Logged in → circular avatar with gradient border ring
                  (visually distinct from the 3 glass-circle icons)
                ═══════════════════════════════════════════════════════ */}
            {isLoggedIn ? (
              /* ─── LOGGED IN: Profile Avatar with dropdown ─── */
              <div className="relative" ref={profileRef}>
                <button
                  ref={profileBtnRef}
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-blue)]/20 border-2 border-[var(--color-accent)]/40 hover:border-[var(--color-accent)]/70 hover:shadow-[0_0_20px_rgba(57,255,20,0.2)] transition-all text-xl"
                  /* Gradient bg + accent border = visually distinct from plain glass circles */
                  title={userName || 'Profile'}
                  aria-label="Open profile menu"
                >
                  {userAvatar} {/* Emoji avatar */}
                </button>

                {/* ─── PROFILE DROPDOWN ─── */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[var(--color-surface)] border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden z-50">
                    {/* Profile header — avatar + name */}
                    <div className="px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-[var(--color-accent)]/5 to-[var(--color-blue)]/5">
                      <div className="flex items-center gap-3">
                        {/* Large avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-accent)]/25 to-[var(--color-blue)]/25 border-2 border-[var(--color-accent)]/30 flex items-center justify-center text-2xl">
                          {userAvatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{userName || 'User'}</p>
                          <p className="text-xs text-[var(--color-text-muted)] truncate">AutoMart Member</p>
                        </div>
                      </div>

                      {/* Preset avatar picker — choose a different emoji */}
                      <div className="mt-3">
                        <p className="text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">Choose Avatar</p>
                        <div className="flex flex-wrap gap-1.5">
                          {presetAvatars.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => selectAvatar(emoji)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg text-base transition-all ${
                                userAvatar === emoji
                                  ? 'bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/40 scale-110' // SELECTED: highlighted
                                  : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]' // UNSELECTED: subtle
                              }`}
                              title={`Set avatar to ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Menu links */}
                    <div className="py-2">
                      <Link
                        href="/account"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-5 py-2.5 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-white/[0.04] transition-colors"
                      >
                        <UserIcon className="w-4 h-4" />
                        My Account
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-5 py-2.5 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-white/[0.04] transition-colors"
                      >
                        <Cog8ToothIcon className="w-4 h-4" />
                        Settings
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-white/[0.06] py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ─── NOT LOGGED IN: Sign In pill button ─── */
              <Link
                href="/login"
                className="hidden md:inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[var(--color-coral)]/85 backdrop-blur-md text-white text-sm font-medium border border-[var(--color-coral)]/30 hover:bg-[var(--color-coral)] hover:shadow-[0_4px_16px_rgba(255,82,59,0.3)] transition-all"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>

    {/* ═══ MOBILE DRAWER — OUTSIDE <nav> so z-index is not trapped ═══ */}
    {mobileMenuOpen && (
      <div className="fixed inset-0 z-[9999] md:hidden">
        {/* Backdrop — solid black, no blur */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setMobileMenuOpen(false)}
        />
        {/* Panel — solid opaque dark background */}
        <div
          className="absolute inset-y-0 left-0 w-[300px] max-w-[85vw] flex flex-col"
          style={{
            backgroundColor: '#111111',
            borderRight: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '4px 0 40px rgba(0,0,0,0.9)',
            animation: 'slide-in-left 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
              <img src="/logo/automart-logo.svg" alt="AutoMart" className="h-8 w-8" />
              <span className="text-base font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F0F0' }}>AutoMart</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ccc' }}
              aria-label="Close menu"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                  setSearchQuery('')
                  setMobileMenuOpen(false)
                }
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <MagnifyingGlassIcon className="w-4 h-4 shrink-0" style={{ color: '#666' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search parts..."
                className="bg-transparent border-none outline-none flex-1 text-sm"
                style={{ color: '#F0F0F0' }}
              />
            </form>
          </div>

          {/* Nav links */}
          <div className="flex-1 overflow-y-auto py-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 mx-3 px-4 py-3.5 rounded-xl text-sm font-medium"
                  style={{
                    color: active ? '#F0F0F0' : '#999',
                    backgroundColor: active ? 'rgba(57,255,20,0.12)' : 'transparent',
                    border: active ? '1px solid rgba(57,255,20,0.25)' : '1px solid transparent',
                  }}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              )
            })}

            {/* Divider */}
            <div className="mx-5 my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

            {/* Extra links */}
            <Link
              href="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 mx-3 px-4 py-3.5 rounded-xl text-sm font-medium"
              style={{ color: '#999' }}
            >
              <HeartIcon className="w-5 h-5" />
              Wishlist
              {wishlistCount > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(57,255,20,0.15)', color: '#39FF14' }}>{wishlistCount}</span>
              )}
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 mx-3 px-4 py-3.5 rounded-xl text-sm font-medium"
              style={{ color: '#999' }}
            >
              <ShoppingCartIcon className="w-5 h-5" />
              Cart
              {cartCount > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(57,255,20,0.15)', color: '#39FF14' }}>{cartCount}</span>
              )}
            </Link>
          </div>

          {/* Bottom — Profile / Sign In */}
          <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: 'rgba(57,255,20,0.15)', border: '2px solid rgba(57,255,20,0.3)' }}>
                  {userAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: '#F0F0F0' }}>{userName || 'User'}</p>
                  <p className="text-xs" style={{ color: '#666' }}>AutoMart Member</p>
                </div>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                  className="w-9 h-9 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
                  title="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: 'rgba(255,82,59,0.9)', color: '#fff' }}
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}
