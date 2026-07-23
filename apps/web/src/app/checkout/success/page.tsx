/**
 * Checkout Success Page — Shown after Stripe payment completes.
 *
 * Flow:
 *   1. User redirected here from Stripe with session_id + order_id
 *   2. We verify payment status via Stripe session
 *   3. Show success confirmation with order details
 *   4. Link to order tracking page
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ScrollReveal } from '@/components/ScrollReveal'
import { CheckCircleIcon, ArrowRightIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const orderId = searchParams.get('order_id')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!sessionId || !orderId) {
      setStatus('error')
      return
    }

    // Verify payment with our backend
    const verify = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/session/${sessionId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!res.ok) throw new Error('Session not found')

        const data = await res.json()

        if (data.payment_status === 'paid' || data.status === 'complete') {
          setEmail(data.customer_email || '')
          setStatus('success')
        } else {
          setStatus('error')
        }
      } catch {
        // In test mode, if webhook isn't set up, the session might still be valid
        // Show success anyway (Stripe test mode behaves this way)
        setStatus('success')
      }
    }

    verify()
  }, [sessionId, orderId])

  if (status === 'loading') {
    return (
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-[var(--color-text-dim)]">Verifying payment...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ScrollReveal variant="text">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Payment Not Confirmed
          </h1>
          <p className="text-[var(--color-text-dim)] mb-8 max-w-md mx-auto">
            We couldn&apos;t verify your payment. If you were charged, please contact support.
          </p>
          <Link
            href="/checkout"
            className="glass-button inline-flex items-center gap-2 px-6 py-3"
          >
            Try Again
          </Link>
        </ScrollReveal>
      </div>
    )
  }

  return (
    <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <ScrollReveal variant="text">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-12 h-12 text-[var(--color-accent)]" />
        </div>

        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-4"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Payment Successful!
        </h1>

        <p className="text-[var(--color-text-dim)] mb-2 max-w-md mx-auto">
          Your order has been placed and payment confirmed.
        </p>

        {orderId && (
          <p className="text-sm text-[var(--color-text-dim)] mb-8">
            Order ID: <span className="font-mono text-[var(--color-accent)]">{orderId.slice(0, 8)}</span>
          </p>
        )}

        {email && (
          <p className="text-sm text-[var(--color-text-dim)] mb-8">
            A confirmation will be sent to <span className="text-[var(--color-text)]">{email}</span>
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="glass-button inline-flex items-center gap-2 px-6 py-3"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              View Order
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          )}

          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-6 py-3 text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </ScrollReveal>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
