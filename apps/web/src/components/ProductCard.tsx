/**
 * ProductCard — Dark industrial product card with wishlist toggle
 * 
 * Layout:
 *   ┌──────────────────┐
 *   │  [♡] [Product Image]  │  ← Heart icon top-right, image full-width
 *   │  [Category Badge] │  ← Lime badge, top-left
 *   ├──────────────────┤
 *   │  Brand (dim)      │
 *   │  Product Name     │  ← Truncated to 2 lines
 *   │  $Price (lime)    │  ← Glowing lime text
 *   └──────────────────┘
 * 
 * Interaction:
 *   - Hover: card lifts (translateY -2px), border glows lime
 *   - Image scales up slightly on hover
 *   - Heart icon: click to add/remove from wishlist
 *   - Heart filled (lime) when in wishlist, outline when not
 *   - Entire card links to product detail page
 * 
 * Wishlist:
 *   - Stored in localStorage as JSON array
 *   - Dispatches 'wishlist-updated' event so navbar badge updates
 *   - Each item: { id, name, price, image, category }
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HeartIcon } from '@heroicons/react/24/outline'
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
  // ─── Wishlist State ───
  // isWishlisted: whether this product is in the wishlist
  // loaded: prevents flash of heart icon before localStorage is read
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [loaded, setLoaded] = useState(false)

  /**
   * CHECK IF PRODUCT IS IN WISHLIST
   * 
   * Reads wishlist from localStorage on mount.
   * Sets isWishlisted=true if this product's ID is found.
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
   * TOGGLE WISHLIST
   * 
   * Adds or removes this product from the wishlist.
   * Dispatches 'wishlist-updated' event so navbar badge updates.
   * Uses stopPropagation to prevent navigating to product page.
   */
  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault() // Don't navigate to product page
    e.stopPropagation()

    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')

      if (isWishlisted) {
        // REMOVE: filter out this product
        const updated = wishlist.filter((item: any) => item.id !== Number(product.id))
        localStorage.setItem('wishlist', JSON.stringify(updated))
        setIsWishlisted(false)
      } else {
        // ADD: push this product to wishlist
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

      // Notify navbar to update wishlist count badge
      window.dispatchEvent(new Event('wishlist-updated'))
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }

  return (
    <Link href={`/products/${product.id}`}>
      {/* Card wrapper — dark surface with border, hover effects */}
      <div className="card overflow-hidden group cursor-pointer h-full">
        {/* Image container — aspect-square with overflow hidden for zoom effect */}
        <div className="aspect-square bg-[var(--color-bg)] relative overflow-hidden">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop&q=80'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* ─── CATEGORY BADGE ─── 
           * Lime accent, top-left corner
           * Shows product category
           */}
          <div className="absolute top-3 left-3">
            <span className="badge text-[10px]">
              {product.category}
            </span>
          </div>

          {/* ─── WISHLIST HEART BUTTON ─── 
           * Top-right corner
           * Outline heart when not wishlisted
           * Solid lime heart when wishlisted
           * Click toggles without navigating to product page
           */}
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

        {/* Content area */}
        <div className="p-4">
          {/* Brand — dimmed secondary text */}
          <p className="text-xs text-[var(--color-text-dim)] mb-1">{product.brand}</p>

          {/* Product name — truncated to 2 lines */}
          <h3 className="text-sm font-medium mb-2 line-clamp-2 text-[var(--color-text)]">
            {product.name}
          </h3>

          {/* Price — lime gradient text for emphasis */}
          <p className="text-lg font-bold glow-text">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </div>
    </Link>
  )
}
