'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { ConditionalFooter } from './ConditionalFooter'

/** Pages that should NOT show the navbar or top padding (auth flow) */
const AUTH_PAGES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/',
]

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = AUTH_PAGES.some(path => pathname.startsWith(path))

  return (
    <>
      {!isAuthPage && <Navbar />}
      <main className={`min-h-screen ${isAuthPage ? '' : 'pt-16'}`}>{children}</main>
      {!isAuthPage && <ConditionalFooter />}
    </>
  )
}
