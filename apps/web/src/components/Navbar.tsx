/**
 * Navbar — Fixed top with centered menu + search bar
 * 
 * Layout (desktop):
 *   [Logo] ——— [Home] [Categories] [Browse] [Orders] [🔍 Search] ——— [♡] [🛒] [Sign In]
 *                 ↑ centered menu + search bar ↑
 * 
 * After scroll (search visible):
 *   [Logo] ——— [Home] [Categories] [Browse] [Orders] [🔍 Search] ——— [♡] [🛒] [Sign In]
 * 
 * Style:
 *   - Menu + search bar are CENTERED in navbar
 *   - Nav links stay as TEXT (not icons)
 *   - Search bar has glassmorphism (blur + translucent)
 *   - Logo on left, cart/auth on right
 * 
 * Login state:
 *   - Not logged in: Sign In button
 *   - Logged in: gear icon (Settings) replaces Sign In
 */
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCartIcon, MagnifyingGlassIcon, HeartIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

/** Nav links — shown as text in center */
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/categories', label: 'Categories' },
  { href: '/search', label: 'Browse Parts' },
  { href: '/orders', label: 'My Orders' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  /** Check login state */
  useEffect(() => {
    const checkLogin = () => {
      try {
        const user = localStorage.getItem('user')
        setIsLoggedIn(!!user && user !== 'null')
      } catch {
        setIsLoggedIn(false)
      }
    }
    checkLogin()
    window.addEventListener('storage', checkLogin)
    return () => window.removeEventListener('storage', checkLogin)
  }, [])

  /** Cart count */
  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const count = cart.reduce((sum: number, item: any) => sum + (item.qty || 1), 0)
      setCartCount(count)
    } catch { setCartCount(0) }
  }

  /** Wishlist count */
  const updateWishlistCount = () => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setWishlistCount(wishlist.length)
    } catch { setWishlistCount(0) }
  }

  /** Initialize listeners */
  useEffect(() => {
    updateCartCount()
    updateWishlistCount()

    const h1 = () => updateCartCount()
    const h2 = () => updateWishlistCount()
    window.addEventListener('storage', h1)
    window.addEventListener('cart-updated', h1)
    window.addEventListener('storage', h2)
    window.addEventListener('wishlist-updated', h2)
    return () => {
      window.removeEventListener('storage', h1)
      window.removeEventListener('cart-updated', h1)
      window.removeEventListener('storage', h2)
      window.removeEventListener('wishlist-updated', h2)
    }
  }, [])

  /** Active link check */
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  /** Search submission */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* ─── LOGO (left) ─── */}
          <Link href="/" className="flex items-center gap-1 shrink-0">
            <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span className="text-[var(--color-accent)]">Auto</span>
              <span className="text-[var(--color-text)]">Mart</span>
            </span>
          </Link>

          {/* ─── CENTER: Nav Links + Search Bar ─── 
           * All centered in the middle of the navbar
           * Nav links as text, search bar with glass effect
           */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            {/* Nav links — text labels */}
            <div className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive(link.href)
                      ? 'text-[var(--color-text)]'
                      : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[var(--color-accent)] rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            {/* Search bar — glassmorphism style */}
            <form onSubmit={handleSearch} className="flex-1 max-w-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] focus-within:border-[var(--color-accent)]/40 focus-within:bg-white/[0.1] transition-all">
                <MagnifyingGlassIcon className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search parts..."
                  className="bg-transparent border-none outline-none flex-1 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] w-full"
                />
              </div>
            </form>
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

            {/* Auth: Sign In or Settings gear */}
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
                className="hidden md:inline-flex px-5 py-2 rounded-full bg-[var(--color-coral)] text-white text-sm font-medium hover:bg-[var(--color-coral)]/90 transition-colors shadow-[0_4px_16px_rgba(255,82,59,0.3)]"
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
