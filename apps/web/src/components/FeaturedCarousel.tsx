/**
 * FeaturedCarousel — Horizontal product slider below the hero
 * 
 * All images are verified working Unsplash URLs (tested with curl).
 * Uses CSS scroll-snap for smooth horizontal scrolling on mobile.
 */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'

/**
 * Featured products — all Unsplash image URLs verified as 200 OK.
 * Each shows a real automotive part photo.
 */
const featuredProducts = [
  {
    id: 'feat-1',
    name: 'Ceramic Brake Pads',
    category: 'Brake System',
    brand: 'Bosch',
    price: 45.99,
    // Brake pads close-up on vehicle
    imageUrl: 'https://images.unsplash.com/photo-1696494561079-ddabcbb308e8?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'feat-2',
    name: 'Performance Exhaust Muffler',
    category: 'Exhaust',
    brand: 'Akrapovic',
    price: 289.00,
    // Engine close-up (gray and black)
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'feat-3',
    name: 'LED Headlight Conversion Kit',
    category: 'Electrical',
    brand: 'Philips',
    price: 124.50,
    // Brake disc close-up on vehicle
    imageUrl: 'https://images.unsplash.com/photo-1696494561430-de087dd0bd69?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'feat-4',
    name: 'Sport Suspension Shocks',
    category: 'Suspension',
    brand: 'Bilstein',
    price: 199.99,
    // Car engine parts close-up
    imageUrl: 'https://images.unsplash.com/photo-1662074050260-1e015d6cd8c4?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'feat-5',
    name: 'Synthetic Engine Oil 5W-30',
    category: 'Engine Parts',
    brand: 'Mobil 1',
    price: 34.99,
    // F4 race car engine parts
    imageUrl: 'https://images.unsplash.com/photo-1739488754789-5a2e85ee6a79?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'feat-6',
    name: 'Sport Clutch Kit',
    category: 'Transmission',
    brand: 'Exedy',
    price: 175.00,
    // Catalytic converters and exhaust parts
    imageUrl: 'https://images.unsplash.com/photo-1759419281480-bacc913c9606?w=400&h=400&fit=crop&q=80',
  },
]

export function FeaturedCarousel() {
  return (
    <section className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* ─── Section Header ─── */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-accent)] block mb-2"
          >
            01 — Featured
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl sm:text-3xl font-bold"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Featured Parts
          </motion.h2>
        </div>
        <Link
          href="/search"
          className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-accent)] transition-colors"
        >
          View All →
        </Link>
      </div>

      {/* ─── Product Grid — horizontal scroll on mobile, grid on desktop ─── */}
      <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide
                      md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible md:pb-0">
        {featuredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: index * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="snap-start shrink-0 w-[200px] md:w-auto"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
