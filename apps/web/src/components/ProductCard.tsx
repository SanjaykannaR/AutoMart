/**
 * ProductCard — Glassmorphism card with circular cart button
 * 
 * Layout:
 *   ┌──────────────────┐
 *   │  [♡]  [Image]    │  ← Heart overlay (top-right)
 *   │  [Category]      │
 *   ├──────────────────┤
 *   │  Brand           │
 *   │  Product Name    │
 *   │  $Price    [🛒]  │  ← Circular glass cart button
 *   └──────────────────┘
 * 
 * Style:
 *   - Glass effect: translucent bg + backdrop blur
 *   - Cart button: circular glass icon (not full-width text)
 *   - Heart button: circular glass overlay on image
 *   - Square image (aspect-ratio 1/1)
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface Product {
  id: string
  name: string
  category: string
  price: number
  imageUrl: string
  brand: string
}

export function ProductCard({ product }: { product: Product }) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setIsWishlisted(wishlist.some((item: any) => item.id === Number(product.id)))
    } catch { setIsWishlisted(false) }
    setLoaded(true)
  }, [product.id])

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      if (isWishlisted) {
        localStorage.setItem('wishlist', JSON.stringify(wishlist.filter((item: any) => item.id !== Number(product.id))))
        setIsWishlisted(false)
      } else {
        wishlist.push({ id: Number(product.id), name: product.name, price: product.price, image: product.imageUrl, category: product.category })
        localStorage.setItem('wishlist', JSON.stringify(wishlist))
        setIsWishlisted(true)
      }
      window.dispatchEvent(new Event('wishlist-updated'))
    } catch {}
  }

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const existing = cart.find((c: any) => c.id === Number(product.id))
      if (existing) {
        existing.qty = (existing.qty || 1) + 1
      } else {
        cart.push({ id: Number(product.id), name: product.name, price: product.price, image: product.imageUrl, category: product.category, qty: 1 })
      }
      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cart-updated'))
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 1500)
    } catch {}
  }

  return (
    <Link href={`/products/${product.id}`}>
      <div className="card overflow-hidden group cursor-pointer h-full flex flex-col">
        {/* ─── SQUARE IMAGE ─── */}
        <div className="aspect-square bg-white/[0.02] relative overflow-hidden">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop&q=80'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Category badge — glass style */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[var(--color-accent)]/15 backdrop-blur-md border border-[var(--color-accent)]/20 text-[var(--color-accent)]">
              {product.category}
            </span>
          </div>

          {/* Heart button — glass circle overlay */}
          {loaded && (
            <button
              onClick={toggleWishlist}
              className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                isWishlisted
                  ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/30 text-[var(--color-accent)]'
                  : 'bg-black/30 border-white/10 text-white/70 hover:bg-black/50 hover:text-white'
              }`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isWishlisted ? <HeartSolidIcon className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* ─── CONTENT ─── */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs text-[var(--color-text-dim)] mb-1">{product.brand}</p>
          <h3 className="text-sm font-medium mb-2 line-clamp-2 text-[var(--color-text)]">
            {product.name}
          </h3>

          {/* Price + Cart button row */}
          <div className="mt-auto flex items-center justify-between">
            <p className="text-lg font-bold glow-text">
              ${product.price.toFixed(2)}
            </p>

            {/* ─── CART BUTTON — Circular glass ─── */}
            <button
              onClick={addToCart}
              className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all shrink-0 ${
                addedToCart
                  ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/30 text-[var(--color-accent)] scale-110'
                  : 'bg-white/[0.06] border-white/[0.08] text-[var(--color-text-dim)] hover:bg-[var(--color-accent)]/10 hover:border-[var(--color-accent)]/20 hover:text-[var(--color-accent)]'
              }`}
              aria-label="Add to cart"
            >
              <ShoppingCartIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
