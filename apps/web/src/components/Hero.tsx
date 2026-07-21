/**
 * Hero — 3D Carousel Product Showcase (Smooth Version)
 * 
 * Animation:
 *   - 3 products in coverflow layout
 *   - On hover → card slides to center SLOWLY and stops
 *   - Uses long duration (800ms) + ease-out for smooth deceleration
 *   - Card "parks" in center so user can see the image clearly
 *   - No price shown — just product name + "More" button
 * 
 * How it works:
 *   - activeIndex tracks which product is centered
 *   - getCardStyle returns position for each card
 *   - framer-motion animate transitions cards smoothly
 *   - CSS perspective creates 3D depth
 */
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { SearchBar } from '@/components/SearchBar'

/** Product items for the carousel — verified Unsplash images */
const carouselProducts = [
  {
    id: 1,
    name: 'Ceramic Brake Pads',
    category: 'Brake System',
    image: 'https://images.unsplash.com/photo-1696494561079-ddabcbb308e8?w=600&h=600&fit=crop&q=80',
    link: '/products/1',
  },
  {
    id: 2,
    name: 'Engine Components',
    category: 'Engine Parts',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=600&fit=crop&q=80',
    link: '/products/2',
  },
  {
    id: 3,
    name: 'Exhaust System',
    category: 'Exhaust',
    image: 'https://images.unsplash.com/photo-1759419281480-bacc913c9606?w=600&h=600&fit=crop&q=80',
    link: '/products/3',
  },
]

interface HeroProps {
  onSearch: (query: string) => void
}

export function Hero({ onSearch }: HeroProps) {
  const [activeIndex, setActiveIndex] = useState(1)

  /**
   * Position styles for each card based on distance from center.
   * -1 = left, 0 = center, 1 = right
   */
  const getCardStyle = (index: number) => {
    const offset = index - activeIndex
    const wrapped = offset === -2 ? 1 : offset === 2 ? -1 : offset

    if (wrapped === 0) {
      // CENTER — full size, front
      return { x: 0, scale: 1, rotateY: 0, z: 10, opacity: 1, zIndex: 10 }
    } else if (wrapped === -1) {
      // LEFT — smaller, behind, rotated
      return { x: -160, scale: 0.8, rotateY: 20, z: -1, opacity: 0.7, zIndex: 5 }
    } else {
      // RIGHT — smaller, behind, rotated
      return { x: 160, scale: 0.8, rotateY: -20, z: -1, opacity: 0.7, zIndex: 5 }
    }
  }

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--color-accent)] rounded-full opacity-[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-[var(--color-blue)] rounded-full opacity-[0.03] blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 items-center">

          {/* ─── LEFT: Text + Search ─── */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4"
            >
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-text-dim)]">
                AutoMart — Spare Parts Marketplace
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
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
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-[var(--color-text-dim)] text-base sm:text-lg mb-8 max-w-lg mx-auto lg:mx-0"
            >
              Find any car or bike spare part. Your mechanic delivers in 30 minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 max-w-xl mx-auto lg:mx-0"
            >
              <SearchBar onSearch={onSearch} placeholder="Search by part name, brand, or vehicle..." />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
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
              transition={{ duration: 0.5, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
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

          {/* ─── RIGHT: 3D Carousel ─── */}
          <div className="relative flex items-center justify-center min-h-[420px] lg:min-h-[520px]">
            {/* Glow behind center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full bg-[var(--color-accent)] opacity-[0.05] blur-[80px] hero-glow" />
            </div>

            {/* Carousel with 3D perspective */}
            <div
              className="relative w-full max-w-lg h-[400px]"
              style={{ perspective: '1200px' }}
            >
              {carouselProducts.map((product, index) => {
                const style = getCardStyle(index)
                const isCenter = index === activeIndex

                return (
                  <motion.div
                    key={product.id}
                    /**
                     * SLOW SMOOTH ANIMATION:
                     * - duration: 0.8s (800ms) — slow enough to follow
                     * - ease: [0.32, 0.72, 0, 1] — starts fast, decelerates smoothly, parks gently
                     * This makes the card "glide" into position and stop cleanly.
                     */
                    animate={{
                      x: style.x,
                      scale: style.scale,
                      rotateY: style.rotateY,
                      opacity: style.opacity,
                    }}
                    transition={{
                      duration: 0.8,
                      ease: [0.32, 0.72, 0, 1],
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className="absolute top-0 left-1/2 -translate-x-1/2 cursor-pointer"
                    style={{
                      zIndex: style.zIndex,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Product card */}
                    <div
                      className={`w-56 sm:w-64 rounded-2xl overflow-hidden transition-shadow duration-700 ${
                        isCenter
                          ? 'shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-[var(--color-accent)]/20'
                          : 'shadow-[0_10px_30px_rgba(0,0,0,0.3)]'
                      }`}
                    >
                      {/* Product image — full card, always visible */}
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
                            transition={{ delay: 0.4, duration: 0.4 }}
                            className="absolute top-3 left-3"
                          >
                            <span className="badge">{product.category}</span>
                          </motion.div>
                        )}

                        {/* Dark overlay on non-center cards */}
                        {!isCenter && (
                          <div className="absolute inset-0 bg-black/30" />
                        )}
                      </div>

                      {/* Info panel — name + More button, only on center card */}
                      <AnimatePresence>
                        {isCenter && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="bg-[var(--color-surface)] px-5 py-4 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs text-[var(--color-text-dim)] mb-0.5">{product.category}</p>
                              <h3 className="font-semibold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                {product.name}
                              </h3>
                            </div>
                            <Link
                              href={product.link}
                              className="text-xs font-medium px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent)]/90 transition-colors shrink-0"
                            >
                              More
                            </Link>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              {carouselProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === activeIndex
                      ? 'bg-[var(--color-accent)] w-6'
                      : 'bg-[var(--color-border)] w-1.5 hover:bg-[var(--color-text-dim)]'
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
