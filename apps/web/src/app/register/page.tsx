/**
 * Register Page — Redirects to login page
 * 
 * Registration now happens through the OAuth-first flow:
 *   Login → Profile Setup → OTP Verify → Home
 * 
 * This page exists for backwards compatibility (old links/bookmarks).
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/login')
  }, [router])
  return null
}
