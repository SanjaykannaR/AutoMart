/**
 * FeaturedCarousel — Horizontal product slider below the hero
 * 
 * Layout:
 *   - Section header with "Featured Parts" title + "View All" link
 *   - Horizontal scrolling row of product cards with CSS snap
 *   - Cards show: image, category badge, name, price in lime
 *   - Hover: card lifts with border glow
 * 
 * Scroll behavior:
 *   - CSS scroll-snap for smooth card alignment
 *   - Horizontal scroll on mobile, grid on desktop
 *   - No JS carousel library — uses native CSS scroll
 * 
 * Animation:
 *   - Cards fade in with staggered timing via framer-motion
 *   - Each card has a slight scale-up on hover
 */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'

/**
 * Featured products — auto parts images from Unsplash.
 * Each image is a real automotive part photo.
 */
const featuredProducts = [
  {
    id: 'feat-1',
    name: 'Ceramic Brake Pads',
    category: 'Brake System',
    brand: 'Bosch',
    price: 45.99,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'feat-2',
    name: 'Performance Exhaust Muffler',
    category: 'Exhaust',
    brand: 'Akrapovic',
    price: 289.00,
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'feat-3',
    name: 'LED Headlight Conversion Kit',
    category: 'Electrical',
    brand: 'Philips',
    price: 124.50,
    imageUrl: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'feat-4',
    name: 'Sport Suspension Shocks',
    category: 'Suspension',
    brand: 'Bilstein',
    price: 199.99,
    imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'feat-5',
    name: 'Synthetic Engine Oil 5W-30',
    category: 'Engine Parts',
    brand: 'Mobil 1',
    price: 34.99,
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'feat-6',
    name: 'Sport Clutch Kit',
    category: 'Transmission',
    brand: 'Exedy',
    price: 175.00,
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=400&fit=crop&q=80',
  },
]

export function FeaturedCarousel() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
