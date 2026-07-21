/**
 * ProductCard — Product card with wishlist heart + cart button
 * 
 * Layout:
 *   ┌──────────────────┐
 *   │  [♡]  [Image]    │  ← Heart icon top-right overlay
 *   │  [Category]      │
 *   ├──────────────────┤
 *   │  Brand           │
 *   │  Product Name    │
 *   │  $Price          │
 *   │  [🛒 Add to Cart]│  ← Cart BUTTON in content area (visible!)
 *   └──────────────────┘
 * 
 * Why cart button is in content area:
 *   - Overlay buttons on images are hard to see on busy photos
 *   - Content area has solid dark background — button is always visible
 *   - Better UX: user sees price, then immediately sees "Add to Cart"
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

  /** Check wishlist on mount */
  useEffect(() => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setIsWishlisted(wishlist.some((item: any) => item.id === Number(product.id)))
    } catch {
      setIsWishlisted(false)
    }
    setLoaded(true)
  }, [product.id])

  /** Toggle wishlist — heart icon */
  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')

      if (isWishlisted) {
        const updated = wishlist.filter((item: any) => item.id !== Number(product.id))
        localStorage.setItem('wishlist', JSON.stringify(updated))
        setIsWishlisted(false)
      } else {
        wishlist.push({
          id: Number(product.id),
          name: product.name,
          price: product.price,
          image: product.imageUrl,
          category: product.category,
        })
        localStorage.setItem('wishlist', JSON.stringify(wishlist))
        setIsWishlisted(true)
      }

      window.dispatchEvent(new Event('wishlist-updated'))
    } catch {}
  }

  /** Add to cart — button in content area */
  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const existing = cart.find((c: any) => c.id === Number(product.id))

      if (existing) {
        existing.qty = (existing.qty || 1) + 1
      } else {
        cart.push({
          id: Number(product.id),
          name: product.name,
          price: product.price,
          image: product.imageUrl,
          category: product.category,
          qty: 1,
        })
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
        {/* ─── IMAGE AREA ─── 
         * Square image with category badge + heart overlay
         */}
        <div className="aspect-square bg-[var(--color-bg)] relative overflow-hidden">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop&q=80'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Category badge — top-left */}
          <div className="absolute top-3 left-3">
            <span className="badge text-[10px]">{product.category}</span>
          </div>

          {/* Heart button — top-right overlay */}
          {loaded && (
            <button
              onClick={toggleWishlist}
              className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isWishlisted
                  ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                  : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
              }`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isWishlisted ? (
                <HeartSolidIcon className="w-5 h-5" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* ─── CONTENT AREA ─── 
         * Solid dark background — always visible
         * Brand, name, price, then cart button
         */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs text-[var(--color-text-dim)] mb-1">{product.brand}</p>
          <h3 className="text-sm font-medium mb-2 line-clamp-2 text-[var(--color-text)]">
            {product.name}
          </h3>
          <p className="text-lg font-bold glow-text mb-3">
            ${product.price.toFixed(2)}
          </p>

          {/* ─── ADD TO CART BUTTON ─── 
           * Full-width button in content area
           * Gray background, lime accent on hover
           * Shows "Added ✓" feedback after click
           */}
          <button
            onClick={addToCart}
            className={`mt-auto w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
              addedToCart
                ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
                : 'bg-white/[0.06] text-[var(--color-text-dim)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] border border-[var(--color-border)]'
            }`}
          >
            <ShoppingCartIcon className="w-4 h-4" />
            {addedToCart ? 'Added ✓' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  )
}
