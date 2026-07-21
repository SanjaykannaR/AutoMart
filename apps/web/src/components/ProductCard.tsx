/**
 * ProductCard — Dark industrial product card
 * 
 * Layout:
 *   ┌──────────────────┐
 *   │  [Product Image]  │  ← Full-width, aspect-square
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
 *   - Entire card is a link to product detail page
 * 
 * Styling:
 *   - Dark charcoal surface (#1A1A1A)
 *   - Subtle border (#2A2A2A)
 *   - No glass blur — solid, industrial feel
 *   - Category badge uses lime accent
 *   - Price in lime gradient text
 */
'use client'

import Link from 'next/link'

interface Product {
  id: string
  name: string
  category: string
  price: number
  imageUrl: string
  brand: string
}

export function ProductCard({ product }: { product: Product }) {
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

          {/* Category badge — lime accent, top-left */}
          <div className="absolute top-3 left-3">
            <span className="badge text-[10px]">
              {product.category}
            </span>
          </div>
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
