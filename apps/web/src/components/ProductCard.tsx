/**
 * ProductCard — Dark industrial product card with wishlist + cart buttons
 * 
 * Layout:
 *   ┌──────────────────┐
 *   │  [♡] [🛒] [Image] │  ← Heart + Cart icons top-right
 *   │  [Category Badge] │  ← Lime badge, top-left
 *   ├──────────────────┤
 *   │  Brand (dim)      │
 *   │  Product Name     │  ← Truncated to 2 lines
 *   │  $Price (lime)    │  ← Glowing lime text
 *   └──────────────────┘
 * 
 * Interaction:
 *   - Hover: card lifts, border glows lime, image scales
 *   - Heart icon: add/remove from wishlist
 *   - Cart icon: add to cart with qty 1
 *   - Entire card links to product detail page
 * 
 * Data:
 *   - Wishlist: localStorage key "wishlist"
 *   - Cart: localStorage key "cart"
 *   - Both dispatch events for navbar badge updates
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

  /**
   * CHECK WISHLIST on mount
   */
  useEffect(() => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setIsWishlisted(wishlist.some((item: any) => item.id === Number(product.id)))
    } catch {
      setIsWishlisted(false)
    }
    setLoaded(true)
  }, [product.id])

  /**
   * TOGGLE WISHLIST — add/remove from saved items
   */
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

  /**
   * ADD TO CART — add item with qty 1
   * Shows "Added!" feedback for 1.5 seconds
   */
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

      // Show feedback
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 1500)
    } catch {}
  }

  return (
    <Link href={`/products/${product.id}`}>
      {/* Card wrapper */}
      <div className="card overflow-hidden group cursor-pointer h-full">
        {/* Image container — SQUARE aspect ratio */}
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

          {/* ─── ACTION BUTTONS — top-right ─── 
           * Stack vertically: Heart on top, Cart below
           * Both buttons prevent card navigation on click
           */}
          {loaded && (
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              {/* Wishlist heart button */}
              <button
                onClick={toggleWishlist}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
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

              {/* Cart add button */}
              <button
                onClick={addToCart}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  addedToCart
                    ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
                    : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
                }`}
                aria-label="Add to cart"
              >
                <ShoppingCartIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* "Added!" toast — appears briefly after adding to cart */}
          {addedToCart && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-medium animate-bounce">
              Added to cart!
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="p-4">
          <p className="text-xs text-[var(--color-text-dim)] mb-1">{product.brand}</p>
          <h3 className="text-sm font-medium mb-2 line-clamp-2 text-[var(--color-text)]">
            {product.name}
          </h3>
          <p className="text-lg font-bold glow-text">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </div>
    </Link>
  )
}
