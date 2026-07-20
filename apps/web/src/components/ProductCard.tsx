'use client'

import Link from 'next/link'
import { GlassCard } from './GlassCard'

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
      <GlassCard className="p-0 overflow-hidden group cursor-pointer">
        <div className="aspect-square bg-[var(--color-surface-light)] relative overflow-hidden">
          <img
            src={product.imageUrl || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-3 left-3">
            <span className="text-[10px] uppercase tracking-wider bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white">
              {product.category}
            </span>
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">{product.brand}</p>
          <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
          <p className="text-lg font-bold glow-text">${product.price.toFixed(2)}</p>
        </div>
      </GlassCard>
    </Link>
  )
}
