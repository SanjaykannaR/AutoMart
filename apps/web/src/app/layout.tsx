import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'AutoMart - Spare Parts in 30 Mins',
  description: 'Order car and bike spare parts. Delivered in 30 minutes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="aurora-bg" />
        <Navbar />
        <main className="min-h-screen pt-16">{children}</main>
      </body>
    </html>
  )
}
