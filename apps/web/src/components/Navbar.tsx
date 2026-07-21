/**
 * Navbar — Fixed top navigation bar with scroll-triggered search
 * 
 * Layout:
 *   Desktop (home, top):    [Logo] ——— [Home] [Categories] [Browse] [Orders] [Account] ——— [♡] [🛒] [Sign In]
 *   Desktop (home, scroll): [Logo] ——— [🔍 Search Bar] ——— [♡] [🛒] [Sign In]
 *   Desktop (other pages):  [Logo] ——— [🔍 Search Bar] [🏠] [📁] [🔍] [📦] [👤] ——— [♡] [🛒] [Sign In]
 *   Mobile:                 [Logo] ———————————— [♡] [🛒] [☰]
 * 
 * Key behavior:
 *   - On HOME page top: full text nav links shown
 *   - On HOME page scrolled: search replaces nav links
 *   - On OTHER pages: search bar always visible, nav links become ICONS
 *   - Icons are small, circular, with tooltips
 *   - Heart (♡) + Cart (🛒) always visible on right
 * 
 * Screen size:
 *   - Max width: 2560px (ultra-wide laptop)
 */
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bars3Icon, XMarkIcon, ShoppingCartIcon, MagnifyingGlassIcon, HeartIcon,
  HomeIcon, Squares2X2Icon, MagnifyingGlassCircleIcon, ClipboardDocumentListIcon, UserIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

/** Navigation links — with icons for compact mode */
const navLinks = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/categories', label: 'Categories', icon: Squares2X2Icon },
  { href: '/search', label: 'Browse Parts', icon: MagnifyingGlassCircleIcon },
  { href: '/orders', label: 'My Orders', icon: ClipboardDocumentListIcon },
  { href: '/account', label: 'Account', icon: UserIcon },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const isHome = pathname === '/'

  /** Scroll listener — detect when user scrolls past hero */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /** Read cart count from localStorage */
  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const count = cart.reduce((sum: number, item: any) => sum + (item.qty || 1), 0)
      setCartCount(count)
    } catch {
      setCartCount(0)
    }
  }

  /** Read wishlist count from localStorage */
  const updateWishlistCount = () => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setWishlistCount(wishlist.length)
    } catch {
      setWishlistCount(0)
    }
  }

  /** Initialize counts and event listeners */
  useEffect(() => {
    updateCartCount()
    updateWishlistCount()

    const cartHandler = () => updateCartCount()
    window.addEventListener('storage', cartHandler)
    window.addEventListener('cart-updated', cartHandler)

    const wishlistHandler = () => updateWishlistCount()
    window.addEventListener('storage', wishlistHandler)
    window.addEventListener('wishlist-updated', wishlistHandler)

    return () => {
      window.removeEventListener('storage', cartHandler)
      window.removeEventListener('cart-updated', cartHandler)
      window.removeEventListener('storage', wishlistHandler)
      window.removeEventListener('wishlist-updated', wishlistHandler)
    }
  }, [])

  /** Check if a nav link is active */
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  /** Handle search submission */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  /**
   * Determine when to show search bar:
   *   - On home page: only after scrolling past hero (300px)
   *   - On all other pages: always visible
   */
  const showSearch = !isHome || scrolled

  /**
   * Determine when to show compact icon nav (instead of text nav):
   *   - When search bar is visible AND we're not on home page top
   *   - This keeps nav accessible even with search bar showing
   */
  const showIconNav = showSearch && !isHome

  return (
    <>
      {/* ═══ MAIN NAVBAR BAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">

            {/* ─── LOGO ─── */}
            <Link href="/" className="flex items-center gap-1 shrink-0">
              <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <span className="text-[var(--color-accent)]">Auto</span>
                <span className="text-[var(--color-text)]">Mart</span>
              </span>
            </Link>

            {/* ─── DESKTOP TEXT NAV LINKS ─── 
             * Only shown on HOME page when NOT scrolled
             * Full text labels for desktop
             */}
            <div className={`hidden lg:flex items-center gap-1 ${showSearch ? 'lg:hidden' : ''}`}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'text-[var(--color-text)]'
                      : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-white/[0.04]'
                  }`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[var(--color-accent)] rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            {/* ─── SEARCH BAR ─── 
             * Pill-shaped, slides in smoothly
             * On home: appears after scroll
             * On other pages: always visible
             */}
            <div
              className={`flex-1 max-w-md transition-all duration-500 ease-out ${
                showSearch
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 -translate-y-2 pointer-events-none'
              }`}
            >
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:shadow-[0_0_0_2px_var(--color-accent-dim)] transition-all">
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

            {/* ─── ICON NAV (compact mode for non-home pages) ─── 
             * When search bar is visible on non-home pages,
             * show nav links as small circular icons with tooltips
             * This saves space while keeping navigation accessible
             */}
            {showIconNav && (
              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      title={link.label}
                      className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                        isActive(link.href)
                          ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/10'
                          : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </Link>
                  )
                })}
              </div>
            )}

            {/* ─── RIGHT SIDE: Wishlist + Cart + Auth ─── */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">

              {/* Wishlist icon */}
              <Link
                href="/wishlist"
                className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-colors"
                aria-label={`Wishlist with ${wishlistCount} items`}
              >
                {wishlistCount > 0 ? (
                  <HeartSolidIcon className="w-5 h-5 text-[var(--color-accent)]" />
                ) : (
                  <HeartIcon className="w-5 h-5 text-[var(--color-text-dim)]" />
                )}
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-[10px] font-bold px-1">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart icon */}
              <Link
                href="/cart"
                className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-colors"
                aria-label={`Shopping cart with ${cartCount} items`}
              >
                <ShoppingCartIcon className="w-5 h-5 text-[var(--color-text-dim)]" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-[10px] font-bold px-1">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Sign In (desktop only) */}
              <Link
                href="/login"
                className="hidden md:inline-flex glass-button text-sm px-5 py-2"
              >
                Sign In
              </Link>

              {/* Hamburger (mobile only) */}
              <button
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-colors"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
              >
                <Bars3Icon className="w-5 h-5 text-[var(--color-text-dim)]" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ MOBILE DRAWER ═══ */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 z-[70] w-72 bg-[var(--color-surface)] border-l border-[var(--color-border)] md:hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <span className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <span className="text-[var(--color-accent)]">Auto</span>Mart
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-colors"
                aria-label="Close menu"
              >
                <XMarkIcon className="w-5 h-5 text-[var(--color-text-dim)]" />
              </button>
            </div>

            {/* Mobile search */}
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <form onSubmit={(e) => { handleSearch(e); setDrawerOpen(false) }}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <MagnifyingGlassIcon className="w-4 h-4 text-[var(--color-text-dim)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search parts..."
                    className="bg-transparent border-none outline-none flex-1 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
                  />
                </div>
              </form>
            </div>

            {/* Mobile nav links with icons */}
            <div className="flex-1 px-3 py-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive(link.href)
                        ? 'text-[var(--color-text)] bg-white/[0.04]'
                        : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-white/[0.02]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="px-3 pb-4">
              <Link
                href="/login"
                onClick={() => setDrawerOpen(false)}
                className="glass-button w-full text-center block text-sm py-3"
              >
                Sign In
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}
