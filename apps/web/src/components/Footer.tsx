/**
 * Footer — Site-wide footer with page links
 * 
 * Sections:
 *   - Brand + tagline
 *   - Shop (Browse Parts, My Orders, Cart)
 *   - Account (Login, Register)
 *   - Support (Contact, FAQ — placeholder links)
 *   - Social icons (placeholder)
 *   - Copyright
 */
import Link from 'next/link'

const footerLinks = {
  shop: [
    { href: '/search', label: 'Browse Parts' },
    { href: '/orders', label: 'My Orders' },
    { href: '/cart', label: 'Cart' },
  ],
  account: [
    { href: '/login', label: 'Sign In' },
    { href: '/register', label: 'Create Account' },
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span className="text-[var(--color-accent)]">Auto</span>
              <span className="text-[var(--color-text)]">Mart</span>
            </Link>
            <p className="mt-3 text-sm text-[var(--color-text-dim)] leading-relaxed max-w-xs">
              Spare parts delivered in 30 minutes. Quality parts for cars and bikes.
            </p>
          </div>

          {/* Shop */}
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

          {/* Account */}
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

          {/* Support */}
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

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            &copy; {new Date().getFullYear()} AutoMart. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* Social icons — simple text links */}
            <a href="#" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">Twitter</a>
            <a href="#" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">Instagram</a>
            <a href="#" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
