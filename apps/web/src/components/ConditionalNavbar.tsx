'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'

/** Pages that should NOT show the navbar (auth flow) */
const HIDE_NAVBAR_ON = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/',
]

export function ConditionalNavbar() {
  const pathname = usePathname()
  const hideNavbar = HIDE_NAVBAR_ON.some(path => pathname.startsWith(path))

  if (hideNavbar) return null
  return <Navbar />
}
