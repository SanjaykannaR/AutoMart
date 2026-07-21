/**
 * Root Layout — AutoMart App Shell
 * 
 * Wraps all pages with:
 *   - Navbar (fixed top navigation)
 *   - Toast notification system (context provider)
 *   - Decorative background glow (subtle radial gradients)
 * 
 * Font loading:
 *   - Outfit: loaded via Google Fonts in globals.css (headings)
 *   - Inter: system fallback (body text)
 * 
 * suppressHydrationWarning: needed because ThemeToggle used to add a class
 * to <html> — kept for forward compatibility.
 */
import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { ToastProvider } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'AutoMart - Spare Parts in 30 Mins',
  description: 'Order car and bike spare parts. Delivered in 30 minutes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {/* Decorative background — subtle lime/blue radial glows */}
        <div className="aurora-bg" />

        {/* ToastProvider: any component can call showToast() via context */}
        <ToastProvider>
          <Navbar />
          {/* pt-16 offsets for the fixed navbar height */}
          <main className="min-h-screen pt-16">{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}
