/**
 * Footer — Site-wide footer with all page links
 * 
 * WHAT IT DOES:
 *   - Shows links to all main pages
 *   - Organized into sections: Shop, Account, Support
 *   - Bottom bar with copyright and social links
 *   - Appears on every page (added to root layout)
 * 
 * SECTIONS:
 *   - Brand: AutoMart logo + tagline
 *   - Shop: Browse Parts, Categories, My Orders, Cart, Wishlist
 *   - Account: Sign In, Create Account, My Account
 *   - Support: Help Center, Contact Us, Privacy Policy
 *   - Bottom: Copyright + social links
 * 
 * DESIGN:
 *   - Dark surface background
 *   - Lime accent on hover
 *   - Responsive: 2 cols mobile, 4 cols desktop
 */
import Link from 'next/link'

/** Footer link sections — organized by category */
const footerLinks = {
  shop: [
    { href: '/search', label: 'Browse Parts' },
    { href: '/categories', label: 'Categories' },
    { href: '/orders', label: 'My Orders' },
    { href: '/cart', label: 'Cart' },
    { href: '/wishlist', label: 'Wishlist' },
  ],
  account: [
    { href: '/login', label: 'Sign In' },
    { href: '/register', label: 'Create Account' },
    { href: '/account', label: 'Settings' },
  ],
  support: [
    { href: '#', label: 'Help Center' },
    { href: '#', label: 'Contact Us' },
    { href: '#', label: 'Privacy Policy' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ─── Footer Grid ─── 
         * 4 columns on desktop
         * 2 columns on mobile
         * Each column: section heading + links
         */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* ─── BRAND COLUMN ─── 
           * Logo + tagline + brief description
           * Spans full width on mobile (col-span-2)
           */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <img src="/logo/automart-logo.svg" alt="AutoMart" className="h-8 w-8" />
              <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <span className="text-[var(--color-accent)]">Auto</span>
                <span className="text-[var(--color-text)]">Mart</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-[var(--color-text-dim)] leading-relaxed max-w-xs">
              Spare parts delivered in 30 minutes. Quality parts for cars and bikes.
            </p>
          </div>

          {/* ─── SHOP COLUMN ─── 
           * Links to browsing and shopping pages
           */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Shop
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── ACCOUNT COLUMN ─── 
           * Links to auth and profile pages
           */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Account
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.account.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── SUPPORT COLUMN ─── 
           * Help and legal links
           */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Support
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ─── BOTTOM BAR ─── 
         * Copyright on left, social links on right
         * Separated by a top border
         */}
        <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            &copy; {new Date().getFullYear()} AutoMart. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">Twitter</a>
            <a href="#" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">Instagram</a>
            <a href="#" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
