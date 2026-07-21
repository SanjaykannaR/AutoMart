/**
 * Navbar — Centered menu with icons + text labels
 * 
 * Features:
 *   - Camera icon → search by image (file picker for auto part photo)
 *   - Microphone icon → search by voice (Web Speech API)
 *   - Settings gear visible when logged in (checks token OR user)
 *   - Active underline moves between links
 *   - Glass circle buttons for wishlist, cart, settings
 * 
 * Layout:
 *   [Logo] ——— [🏠 Home] [📁 Categories] [🔧 Browse] [📦 Orders] [🔍 🔎 _search_ 🎤 📷] ——— [♡] [🛒] [⚙️]
 */
'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ShoppingCartIcon, MagnifyingGlassIcon, HeartIcon, Cog6ToothIcon,
  HomeIcon, Squares2X2Icon, WrenchIcon, ClipboardDocumentListIcon,
  CameraIcon, MicrophoneIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

/** Nav links with icons */
const navLinks = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/categories', label: 'Categories', icon: Squares2X2Icon },
  { href: '/search', label: 'Browse Parts', icon: WrenchIcon },
  { href: '/orders', label: 'My Orders', icon: ClipboardDocumentListIcon },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isListening, setIsListening] = useState(false)

  /* ───────────────────────────────────────────────────────────────
   * LOGIN STATE DETECTION
   * 
   * Checks for 'user' OR 'token' in localStorage.
   * The 'token' fallback handles:
   *   - Users who logged in before 'user' key was added
   *   - Sessions restored from API token only
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

  // Re-check on every navigation (handles redirect after login)
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
   * 
   * Opens a file picker for camera/photo.
   * Converts the selected image to base64 and navigates to
   * the search page with the image data as a query param.
   * 
   * In production, you'd send this to a backend vision API
   * (e.g., Google Lens, Clarifai) for part identification.
   * ─────────────────────────────────────────────────────────────── */
  const handleImageSearch = () => {
    fileInputRef.current?.click()
  }

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB')
      return
    }

    // Convert to base64 and pass to search page
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      // Store in sessionStorage for the search page to pick up
      sessionStorage.setItem('imageSearch', base64)
      router.push('/search?mode=image')
    }
    reader.readAsDataURL(file)

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  /* ───────────────────────────────────────────────────────────────
   * SEARCH BY VOICE (Web Speech API)
   * 
   * Uses the browser's built-in speech recognition.
   * Supported in Chrome, Edge, Safari.
   * Falls back gracefully if not supported.
   * ─────────────────────────────────────────────────────────────── */
  const handleVoiceSearch = () => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Try Chrome or Edge.')
      return
    }

    // If already listening, stop
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
      // Auto-search after voice input
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

          {/* ─── LOGO ─── */}
          <Link href="/" className="flex items-center gap-1 shrink-0">
            <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span className="text-[var(--color-accent)]">Auto</span>
              <span className="text-[var(--color-text)]">Mart</span>
            </span>
          </Link>

          {/* ─── CENTER: Nav Links + Search Bar ─── */}
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
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--color-accent)] rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* ─── SEARCH BAR — glass with voice + camera ─── */}
            <form onSubmit={handleSearch} className="flex-1 max-w-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] focus-within:border-[var(--color-accent)]/40 focus-within:bg-white/[0.1] transition-all">
                {/* Search icon */}
                <MagnifyingGlassIcon className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />

                {/* Text input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search parts..."
                  className="bg-transparent border-none outline-none flex-1 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] min-w-0"
                />

                {/* Voice search button */}
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  title={isListening ? 'Stop listening' : 'Search by voice'}
                  className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                    isListening
                      ? 'bg-[var(--color-coral)]/20 text-[var(--color-coral)] animate-pulse'
                      : 'hover:bg-white/[0.08] text-[var(--color-text-muted)] hover:text-[var(--color-text-dim)]'
                  }`}
                >
                  <MicrophoneIcon className="w-3.5 h-3.5" />
                </button>

                {/* Image search button */}
                <button
                  type="button"
                  onClick={handleImageSearch}
                  title="Search by image"
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/[0.08] text-[var(--color-text-muted)] hover:text-[var(--color-text-dim)] transition-all"
                >
                  <CameraIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Hidden file input for image search */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelected}
              className="hidden"
            />
          </div>

          {/* ─── RIGHT: Wishlist + Cart + Auth ─── */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Wishlist — glass circle */}
            <Link
              href="/wishlist"
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.12] transition-all"
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              {wishlistCount > 0 ? (
                <HeartSolidIcon className="w-[18px] h-[18px] text-[var(--color-accent)]" />
              ) : (
                <HeartIcon className="w-[18px] h-[18px] text-[var(--color-text-dim)]" />
              )}
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-[10px] font-bold px-1">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart — glass circle */}
            <Link
              href="/cart"
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.12] transition-all"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCartIcon className="w-[18px] h-[18px] text-[var(--color-text-dim)]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-[10px] font-bold px-1">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Settings (logged in) or Sign In (not logged in) */}
            {isLoggedIn ? (
              <Link
                href="/account"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.12] transition-all"
                title="Settings"
              >
                <Cog6ToothIcon className="w-[18px] h-[18px] text-[var(--color-text-dim)]" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex px-5 py-2 rounded-full bg-[var(--color-coral)]/85 backdrop-blur-md text-white text-sm font-medium border border-[var(--color-coral)]/30 hover:bg-[var(--color-coral)] transition-colors shadow-[0_4px_16px_rgba(255,82,59,0.25)]"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
