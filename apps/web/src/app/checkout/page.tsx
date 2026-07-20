'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/GlassCard'

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    if (cart.length === 0) router.push('/cart')
    setItems(cart)
  }, [])

  const total = items.reduce((sum: number, item: any) => sum + item.price * item.qty, 0)

  const placeOrder = async () => {
    setPlacing(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          address,
          phone,
          note,
          total,
        }),
      })
      const order = await res.json()
      localStorage.removeItem('cart')
      router.push(`/orders/${order.id}`)
    } catch {
      alert('Order failed. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <GlassCard className="p-6 space-y-4">
            <h2 className="font-semibold">Delivery Details</h2>
            <div>
              <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="glass-input resize-none"
                rows={3}
                placeholder="Street, building, landmark"
                required
              />
            </div>
            <div>
              <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="glass-input"
                placeholder="+1 234 567 890"
                required
              />
            </div>
            <div>
              <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="glass-input"
                placeholder="e.g. Ring the doorbell"
              />
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} <span className="text-[var(--color-text-muted)]">x{item.qty}</span>
                  </span>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="glass-divider" />
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--color-text-secondary)]">Delivery</span>
              <span className="text-[var(--color-success)]">Free</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="glow-text">${total.toFixed(2)}</span>
            </div>
          </GlassCard>

          <button
            onClick={placeOrder}
            disabled={placing || !address || !phone}
            className="glass-button w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placing ? 'Placing Order...' : 'Place Order — $' + total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  )
}
