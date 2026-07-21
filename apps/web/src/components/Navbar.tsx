/**
 * Navbar — Centered menu with icons + text labels
 * 
 * Fixes:
 *   - Settings icon: listens for 'user-updated' custom event (same tab)
 *   - Active underline: uses relative positioning on each link
 * 
 * Layout:
 *   [Logo] ——— [🏠 Home] [📁 Categories] [🔧 Browse] [📦 Orders] [🔍 Search] ——— [♡] [🛒] [⚙️]
 */
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ShoppingCartIcon, MagnifyingGlassIcon, HeartIcon, Cog6ToothIcon,
  HomeIcon, Squares2X2Icon, WrenchIcon, ClipboardDocumentListIcon
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
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  /**
   * CHECK LOGIN STATE
   * 
   * Reads 'user' from localStorage.
   * Listens for:
   *   - 'storage' event (cross-tab changes)
   *   - 'user-updated' custom event (same-tab login/register)
   *   - pathname change (navigation after login)
   */
  useEffect(() => {
    const checkLogin = () => {
      try {
        const user = localStorage.getItem('user')
        setIsLoggedIn(!!user && user !== 'null' && user !== '')
      } catch { setIsLoggedIn(false) }
    }
    checkLogin()

    // Cross-tab changes
    window.addEventListener('storage', checkLogin)
    // Same-tab login/register
    window.addEventListener('user-updated', checkLogin)

    return () => {
      window.removeEventListener('storage', checkLogin)
      window.removeEventListener('user-updated', checkLogin)
    }
  }, [])

  // Re-check login on navigation
  useEffect(() => {
    try {
      const user = localStorage.getItem('user')
      setIsLoggedIn(!!user && user !== 'null' && user !== '')
    } catch { setIsLoggedIn(false) }
  }, [pathname])

  /** Cart count */
  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartCount(cart.reduce((sum: number, item: any) => sum + (item.qty || 1), 0))
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

          {/* ─── CENTER: Nav Links (icon + text) + Search Bar ─── */}
          <div className="hidden md:flex items-center gap-5 flex-1 justify-center">
            {/* Nav links — icon + text, each has RELATIVE for underline */}
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
                    {/* Active underline — positioned relative to THIS link */}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[var(--color-accent)] rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Search bar — glass style */}
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
