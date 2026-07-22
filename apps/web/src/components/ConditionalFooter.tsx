'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './Footer'

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

export function ConditionalFooter() {
  const pathname = usePathname()
  const isAuthPage =
    AUTH_PATHS.includes(pathname) || pathname.startsWith('/auth/')
  if (isAuthPage) return null
  return <Footer />
}
