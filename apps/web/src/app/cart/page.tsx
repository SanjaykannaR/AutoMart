'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GlassCard } from '@/components/GlassCard'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/Toast'

interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  imageUrl: string
}

export default function CartPage() {
  const { showToast } = useToast()
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setItems(cart)
  }, [])

  const updateQty = (id: string, delta: number) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item,
    )
    setItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const removeItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id)
    setItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    showToast('Item removed from cart', 'info')
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)

  if (!mounted) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--color-text-muted)] mb-4">Your cart is empty</p>
          <Link href="/search" className="glass-button px-6 py-2">
            Browse Parts
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <GlassCard key={item.id} className="flex items-center gap-4 p-4">
              <div className="w-20 h-20 rounded-xl bg-[var(--color-surface-light)] flex items-center justify-center shrink-0">
                <span className="text-2xl">🛞</span>
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.id}`} className="font-medium text-sm hover:text-[var(--color-accent)]">
                  {item.name}
                </Link>
                <p className="text-sm glow-text font-semibold mt-1">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-sm hover:bg-white/5"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.id, 1)}
                  className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-sm hover:bg-white/5"
                >
                  +
                </button>
              </div>
              <p className="text-sm font-medium w-20 text-right">
                ${(item.price * item.qty).toFixed(2)}
              </p>
              <button onClick={() => removeItem(item.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
                <TrashIcon className="w-5 h-5" />
              </button>
            </GlassCard>
          ))}

          <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[var(--color-text-secondary)]">Subtotal</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-[var(--color-text-secondary)]">Delivery</span>
              <span className="text-sm text-[var(--color-success)]">Free</span>
            </div>
            <div className="glass-divider" />
            <div className="flex justify-between items-center mb-6 text-lg">
              <span className="font-bold">Total</span>
              <span className="font-bold glow-text">${total.toFixed(2)}</span>
            </div>
            <Link href="/checkout" className="glass-button w-full text-center block">
              Proceed to Checkout
            </Link>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
