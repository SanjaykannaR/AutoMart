/**
 * Navbar — Fixed top navigation bar
 * 
 * Layout:
 *   Desktop: [Logo] ——— [Nav Links] ——— [Cart Icon + Badge] [Sign In]
 *   Mobile:  [Logo] ———————————— [Cart] [Hamburger → Drawer]
 * 
 * Design:
 *   - Full-width dark surface bar (not floating glass pill)
 *   - Bottom border for separation
 *   - Active link gets lime accent underline
 *   - Cart icon shows item count badge in lime
 *   - Mobile: slide-in drawer from right side
 * 
 * Cart count: read from localStorage on mount + on storage events
 * so it updates when items are added/removed from other tabs.
 */
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Bars3Icon, XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'

/** Navigation links — rendered in desktop nav and mobile drawer */
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Browse Parts' },
  { href: '/orders', label: 'My Orders' },
]

export function Navbar() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  /**
   * Read cart count from localStorage.
   * Called on mount and whenever localStorage changes
   * (e.g. when user adds item from product page).
   */
  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const count = cart.reduce((sum: number, item: any) => sum + (item.qty || 1), 0)
      setCartCount(count)
    } catch {
      setCartCount(0)
    }
  }

  /** Read cart on mount and listen for storage changes */
  useEffect(() => {
    updateCartCount()
    // Listen for cart changes from other components
    const handler = () => updateCartCount()
    window.addEventListener('storage', handler)
    // Custom event for same-tab cart updates
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

  return (
    <>
      {/* ─── Main Navbar Bar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo — lime accent on "Auto", white on "Mart" */}
            <Link href="/" className="flex items-center gap-1 shrink-0">
              <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <span className="text-[var(--color-accent)]">Auto</span>
                <span className="text-[var(--color-text)]">Mart</span>
              </span>
            </Link>

            {/* Desktop Navigation — centered links */}
            <div className="hidden md:flex items-center gap-1">
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
                  {/* Active indicator — lime underline */}
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[var(--color-accent)] rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            {/* Right side — Cart + Auth */}
            <div className="flex items-center gap-2">
              {/* Cart icon with item count badge */}
              <Link
                href="/cart"
                className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-colors"
                aria-label={`Shopping cart with ${cartCount} items`}
              >
                <ShoppingCartIcon className="w-5 h-5 text-[var(--color-text-dim)]" />
                {/* Badge — only shown when cart has items */}
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-[10px] font-bold px-1">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Sign In button — desktop only */}
              <Link
                href="/login"
                className="hidden md:inline-flex glass-button text-sm px-5 py-2"
              >
                Sign In
              </Link>

              {/* Hamburger menu — mobile only */}
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

      {/* ─── Mobile Drawer (slide-in from right) ─── */}
      {drawerOpen && (
        <>
          {/* Backdrop — darkens the page content */}
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer panel — slides in from right */}
          <div className="fixed top-0 right-0 bottom-0 z-[70] w-72 bg-[var(--color-surface)] border-l border-[var(--color-border)] md:hidden flex flex-col">
            {/* Drawer header with close button */}
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

            {/* Navigation links — stacked vertically */}
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

            {/* Drawer footer — Sign In button */}
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
