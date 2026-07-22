/**
 * Root Layout — AutoMart App Shell
 * 
 * Wraps all pages with:
 *   - Navbar (hidden on auth flow pages)
 *   - Toast notification system (context provider)
 *   - Google OAuth provider (for Google Sign-In)
 *   - Decorative background glow (subtle radial gradients)
 */
import type { Metadata } from 'next'
import './globals.css'
import { LayoutShell } from '@/components/LayoutShell'
import { ToastProvider } from '@/components/Toast'
import { GoogleOAuthProvider } from '@react-oauth/google'

export const metadata: Metadata = {
  title: 'AutoMart - Spare Parts in 30 Mins',
  description: 'Order car and bike spare parts. Delivered in 30 minutes.',
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="aurora-bg" />
        <ToastProvider>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <LayoutShell>{children}</LayoutShell>
          </GoogleOAuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
