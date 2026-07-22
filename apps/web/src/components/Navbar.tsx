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
} from '@heroicons/react/24/outline'

// ─── Solid icons ───
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

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

  // ─── Notification state ───
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifOpen, setNotifOpen] = useState(false)

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* ═══ LOGO ═══ */}
          <Link href="/" className="flex items-center gap-1 shrink-0">
            <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span className="text-[var(--color-accent)]">Auto</span>
              <span className="text-[var(--color-text)]">Mart</span>
            </span>
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
                  {isListening && (
                    <span className="absolute inset-0 -m-1 rounded-full border-2 border-[var(--color-coral)] animate-ping opacity-75" />
                  )}
                  {isListening && (
                    <span className="absolute inset-0 -m-1 rounded-full border border-[var(--color-coral)]/50 animate-pulse" />
                  )}
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    title={isListening ? 'Stop listening' : 'Search by voice'}
                    className={`relative w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                      isListening
                        ? 'bg-[var(--color-coral)]/25 text-[var(--color-coral)] shadow-[0_0_12px_rgba(255,82,59,0.4)]'
                        : 'hover:bg-white/[0.08] text-[var(--color-text-muted)] hover:text-[var(--color-text-dim)]'
                    }`}
                  >
                    {isListening ? (
                      <span className="flex items-end gap-[2px] h-3">
                        <span className="w-[2px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.5s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0s', height: '40%' }} />
                        <span className="w-[2px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.5s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.15s', height: '100%' }} />
                        <span className="w-[2px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.5s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.3s', height: '60%' }} />
                        <span className="w-[2px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.5s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.1s', height: '80%' }} />
                        <span className="w-[2px] bg-[var(--color-coral)] rounded-full animate-[soundBar_0.5s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.25s', height: '30%' }} />
                      </span>
                    ) : (
                      <MicrophoneIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
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

          {/* ═══ RIGHT: Notifications + Wishlist + Cart ═══ */}
          <div className="flex items-center gap-2 shrink-0">

            {/* ─── NOTIFICATION BELL ─── */}
            <div className="relative">
              <button
                ref={notifButtonRef}
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-[var(--color-blue)]/15 hover:border-[var(--color-blue)]/30 hover:shadow-[0_0_16px_rgba(56,182,255,0.15)] transition-all group/btn"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <BellIcon className={`w-[18px] h-[18px] transition-colors ${unreadCount > 0 ? 'text-[var(--color-accent)] group-hover/btn:text-[var(--color-blue)]' : 'text-[var(--color-text-dim)] group-hover/btn:text-[var(--color-blue)]'}`} />
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
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-[var(--color-coral)]/15 hover:border-[var(--color-coral)]/30 hover:shadow-[0_0_16px_rgba(255,82,59,0.15)] transition-all group/cart"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCartIcon className="w-[18px] h-[18px] text-[var(--color-text-dim)] group-hover/cart:text-[var(--color-coral)] transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-[10px] font-bold px-1">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
