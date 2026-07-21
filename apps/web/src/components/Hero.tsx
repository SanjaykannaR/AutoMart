/**
 * Hero — 3D Carousel Product Showcase
 * 
 * Animation Concept (from your reference):
 *   - 3 product cards arranged in a carousel/coverflow layout
 *   - CENTER card: full size, in front, main focus
 *   - LEFT/RIGHT cards: smaller, rotated, behind the center
 *   - On HOVER over a side card → it smoothly slides to center
 *   - The old center card slides to the side
 *   - Creates a "background comes to front" effect
 * 
 * How it works:
 *   - activeIndex state tracks which product is centered (0, 1, or 2)
 *   - On hover over a side card → setActiveIndex(hoveredIndex)
 *   - Framer-motion `layout` prop animates position changes smoothly
 *   - CSS perspective creates 3D depth effect
 *   - Each card has different scale, rotation, and z-index based on position
 * 
 * Layout:
 *   LEFT (behind)  ←  CENTER (front)  →  RIGHT (behind)
 *   scale: 0.8       scale: 1.0          scale: 0.8
 *   rotate: 15deg     rotate: 0deg        rotate: -15deg
 *   x: -120px         x: 0                x: 120px
 *   z: -1             z: 10               z: -1
 */
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { SearchBar } from '@/components/SearchBar'

/**
 * Product items for the carousel.
 * Verified Unsplash auto parts images.
 */
const carouselProducts = [
  {
    id: 1,
    name: 'Ceramic Brake Pads',
    category: 'Brake System',
    price: '$45.99',
    image: 'https://images.unsplash.com/photo-1696494561079-ddabcbb308e8?w=600&h=600&fit=crop&q=80',
  },
  {
    id: 2,
    name: 'Engine Components',
    category: 'Engine Parts',
    price: '$189.00',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=600&fit=crop&q=80',
  },
  {
    id: 3,
    name: 'Exhaust System',
    category: 'Exhaust',
    price: '$289.00',
    image: 'https://images.unsplash.com/photo-1759419281480-bacc913c9606?w=600&h=600&fit=crop&q=80',
  },
]

/** Smooth easing curve */
const ease = [0.16, 1, 0.3, 1] as const

interface HeroProps {
  onSearch: (query: string) => void
}

export function Hero({ onSearch }: HeroProps) {
  /** Which product is currently in the center (0, 1, or 2) */
  const [activeIndex, setActiveIndex] = useState(1)

  /**
   * Get position styles for each card based on its relative position to active.
   * -1 = left, 0 = center, 1 = right
   */
  const getCardStyle = (index: number) => {
    const offset = index - activeIndex
    // Wrap offset for circular feel (-1, 0, 1)
    const wrapped = offset === -2 ? 1 : offset === 2 ? -1 : offset

    if (wrapped === 0) {
      // CENTER — full size, front, no rotation
      return {
        x: 0,
        scale: 1,
        rotateY: 0,
        z: 10,
        opacity: 1,
        zIndex: 10,
      }
    } else if (wrapped === -1) {
      // LEFT — smaller, behind, rotated right
      return {
        x: -180,
        scale: 0.78,
        rotateY: 25,
        z: -1,
        opacity: 0.8,
        zIndex: 5,
      }
    } else {
      // RIGHT — smaller, behind, rotated left
      return {
        x: 180,
        scale: 0.78,
        rotateY: -25,
        z: -1,
        opacity: 0.8,
        zIndex: 5,
      }
    }
  }

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* ─── Background Glow ─── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--color-accent)] rounded-full opacity-[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-[var(--color-blue)] rounded-full opacity-[0.03] blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 items-center">

          {/* ═══════════════════════════════════════════════════════
              LEFT PANEL: Text + Search + CTA
              ═══════════════════════════════════════════════════════ */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease }}
              className="mb-4"
            >
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-text-dim)]">
                AutoMart — Spare Parts Marketplace
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              <span className="text-[var(--color-text)]">Get </span>
              <span className="text-[var(--color-accent)]">Auto Parts</span>
              <br />
              <span className="text-[var(--color-text)]">in </span>
              <span className="text-[var(--color-accent)]">30</span>
              <span className="text-[var(--color-text)]"> Minutes</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease }}
              className="text-[var(--color-text-dim)] text-base sm:text-lg mb-8 max-w-lg mx-auto lg:mx-0"
            >
              Find any car or bike spare part. Your mechanic delivers in 30 minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45, ease }}
              className="mb-6 max-w-xl mx-auto lg:mx-0"
            >
              <SearchBar onSearch={onSearch} placeholder="Search by part name, brand, or vehicle..." />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55, ease }}
              className="flex flex-wrap gap-3 justify-center lg:justify-start"
            >
              <Link href="/search" className="glass-button text-sm px-8 py-3">
                Browse All Parts
              </Link>
              <Link href="/register" className="glass-button-outline text-sm px-8 py-3">
                Create Account
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7, ease }}
              className="flex gap-8 mt-10 justify-center lg:justify-start"
            >
              {[
                { value: '10K+', label: 'Parts' },
                { value: '30min', label: 'Delivery' },
                { value: '24/7', label: 'Support' },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <p className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--color-text-dim)]">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              RIGHT PANEL: 3D Carousel Product Showcase
              Products arranged in a coverflow layout.
              Hover a side card → it slides to center.
              ═══════════════════════════════════════════════════════ */}
          <div className="relative flex items-center justify-center min-h-[420px] lg:min-h-[520px]">
            {/* Glow behind center product */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full bg-[var(--color-accent)] opacity-[0.05] blur-[80px] hero-glow" />
            </div>

            {/* Carousel container with 3D perspective */}
            <div
              className="relative w-full max-w-lg h-[380px]"
              style={{ perspective: '1200px' }}
            >
              {carouselProducts.map((product, index) => {
                const style = getCardStyle(index)
                const isCenter = index === activeIndex

                return (
                  <motion.div
                    key={product.id}
                    /**
                     * ANIMATION: When activeIndex changes, framer-motion
                     * smoothly animates x, scale, rotateY, opacity to new values.
                     * This creates the "background comes to front" effect.
                     */
                    animate={{
                      x: style.x,
                      scale: style.scale,
                      rotateY: style.rotateY,
                      opacity: style.opacity,
                    }}
                    transition={{
                      duration: 0.6,
                      ease: [0.32, 0.72, 0, 1], // smooth deceleration
                    }}
                    /**
                     * HOVER: When user hovers a side card, set it as active.
                     * This triggers the animate transition above.
                     */
                    onMouseEnter={() => setActiveIndex(index)}
                    className="absolute top-0 left-1/2 -translate-x-1/2 cursor-pointer"
                    style={{
                      zIndex: style.zIndex,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Product card */}
                    <div
                      className={`w-56 sm:w-64 rounded-2xl overflow-hidden transition-shadow duration-500 ${
                        isCenter
                          ? 'shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-[var(--color-accent)]/20'
                          : 'shadow-[0_10px_30px_rgba(0,0,0,0.3)]'
                      }`}
                    >
                      {/* Product image */}
                      <div className="aspect-square bg-[var(--color-surface)] relative overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        {/* Category badge — only on center card */}
                        {isCenter && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="absolute top-3 left-3"
                          >
                            <span className="badge">{product.category}</span>
                          </motion.div>
                        )}
                      </div>

                      {/* Info panel — only visible on center card */}
                      <AnimatePresence>
                        {isCenter && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[var(--color-surface)] px-5 py-4"
                          >
                            <p className="text-xs text-[var(--color-text-dim)] mb-1">{product.category}</p>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                {product.name}
                              </h3>
                              <span className="text-lg font-bold glow-text">{product.price}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Dot indicators below carousel */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {carouselProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? 'bg-[var(--color-accent)] w-6'
                      : 'bg-[var(--color-border)] hover:bg-[var(--color-text-dim)]'
                  }`}
                  aria-label={`View ${carouselProducts[index].name}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
