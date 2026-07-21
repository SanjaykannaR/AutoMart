/**
 * Navbar — Fixed top navigation bar with scroll-triggered search
 * 
 * Layout:
 *   Desktop: [Logo] ——— [Nav Links] ——— [Cart] [Sign In]
 *   After scroll: [Logo] ——— [🔍 Search Bar] ——— [Cart] [Sign In]
 *   Mobile:  [Logo] ———————————— [Cart] [Hamburger → Drawer]
 * 
 * Scroll behavior:
 *   - On home page: search bar appears in navbar after scrolling past hero (~300px)
 *   - On other pages: search bar always visible in navbar
 *   - Search bar slides up smoothly when entering
 *   - Clicking search navigates to /search?q=...
 * 
 * Cart count: read from localStorage + 'cart-updated' custom event
 */
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bars3Icon, XMarkIcon, ShoppingCartIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

/** Navigation links */
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Browse Parts' },
  { href: '/orders', label: 'My Orders' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  /** Check if we're on the home page */
  const isHome = pathname === '/'

  /**
   * Scroll listener — detect when user scrolls past hero.
   * On home page: show search bar after 300px scroll
   * On other pages: always show search bar
   */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Check initial scroll position
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

  useEffect(() => {
    updateCartCount()
    const handler = () => updateCartCount()
    window.addEventListener('storage', handler)
    window.addEventListener('cart-updated', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('cart-updated', handler)
    }
  }, [])

  /** Check if a nav link is currently active */
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  /** Handle search submission from navbar search bar */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  /** Show search bar: on non-home pages always, on home page only after scroll */
  const showSearch = !isHome || scrolled

  return (
    <>
      {/* ─── Main Navbar Bar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-1 shrink-0">
              <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <span className="text-[var(--color-accent)]">Auto</span>
                <span className="text-[var(--color-text)]">Mart</span>
              </span>
            </Link>

            {/* Desktop Nav Links — hidden when search is showing (to make room) */}
            <div className={`hidden md:flex items-center gap-1 transition-all duration-300 ${showSearch ? 'md:hidden' : ''}`}>
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

            {/* ─── Search Bar (appears on scroll) ─── */}
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

            {/* Right side — Cart + Auth */}
            <div className="flex items-center gap-2 shrink-0">
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

              <Link
                href="/login"
                className="hidden md:inline-flex glass-button text-sm px-5 py-2"
              >
                Sign In
              </Link>

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

      {/* ─── Mobile Drawer ─── */}
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

            {/* Mobile search bar in drawer */}
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

            <div className="flex-1 px-3 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'text-[var(--color-text)] bg-white/[0.04]'
                      : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-white/[0.02]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
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
