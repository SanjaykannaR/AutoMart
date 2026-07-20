'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { ThemeToggle } from './ThemeToggle'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Browse Parts' },
  { href: '/orders', label: 'My Orders' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass mx-4 mt-3 px-6 py-3 flex items-center justify-between max-w-7xl mx-auto"
        style={{ borderRadius: '16px', maxWidth: 'calc(100% - 32px)', margin: '12px auto 0' }}
      >
        <Link href="/" className="text-xl font-bold glow-text">
          AutoMart
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          <Link href="/login" className="glass-button text-sm px-5 py-2">
            Sign In
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="glass mx-4 mt-2 px-6 py-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm text-[var(--color-text-secondary)] hover:text-white"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" className="glass-button text-sm px-5 py-2 mt-2 inline-block">
            Sign In
          </Link>
        </div>
      )}
    </nav>
  )
}
