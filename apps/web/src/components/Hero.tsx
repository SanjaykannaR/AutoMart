/**
 * Hero — Split-screen hero section for the home page
 * 
 * Layout (desktop):
 *   ┌─────────────────────────┬─────────────────────────┐
 *   │  Left: Text + CTA       │  Right: Product Showcase │
 *   │  - Headline (Outfit)    │  - Floating product img  │
 *   │  - Subtitle             │  - Background glow       │
 *   │  - Search bar           │  - Animated entrance     │
 *   │  - CTA button           │                          │
 *   └─────────────────────────┴─────────────────────────┘
 * 
 * Animation (adapted from reference):
 *   - Headline slides up with staggered timing
 *   - Product image scales from 0.8 → 1.0 with slight rotation
 *   - Background glow pulses subtly
 *   - All transitions use cubic-bezier(0.16, 1, 0.3, 1) for smooth deceleration
 *   - Duration: 500-700ms per element
 *   - animate prop is always set to visible state (no whileInView needed for hero)
 * 
 * Product showcase:
 *   - Uses Unsplash auto parts images (reliable, high quality)
 *   - Three product cards stacked with depth effect
 *   - Main card has a floating label with price
 */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { SearchBar } from '@/components/SearchBar'

/**
 * Hero product showcase items — displayed in the right panel.
 * Uses Unsplash auto parts images for reliable, relevant visuals.
 */
const showcaseProducts = [
  {
    name: 'Ceramic Brake Pads',
    category: 'Brake System',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=600&fit=crop&q=80',
  },
  {
    name: 'Performance Exhaust',
    category: 'Exhaust',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=600&fit=crop&q=80',
  },
  {
    name: 'LED Headlight Kit',
    category: 'Electrical',
    image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=600&h=600&fit=crop&q=80',
  },
]

/** Smooth easing curve — fast start, gentle deceleration */
const ease = [0.16, 1, 0.3, 1] as const

interface HeroProps {
  onSearch: (query: string) => void
}

export function Hero({ onSearch }: HeroProps) {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* ─── Background Glow — subtle radial gradient behind the hero ─── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--color-accent)] rounded-full opacity-[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-[var(--color-blue)] rounded-full opacity-[0.03] blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* ─── Left Panel: Text + Search + CTA ─── */}
          <div className="text-center lg:text-left">

            {/* Eyebrow text — small uppercase label */}
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

            {/* Main headline — bold Outfit font, lime accent on key words */}
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

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease }}
              className="text-[var(--color-text-dim)] text-base sm:text-lg mb-8 max-w-lg mx-auto lg:mx-0"
            >
              Find any car or bike spare part. Your mechanic delivers in 30 minutes.
            </motion.p>

            {/* Search bar — integrated into hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45, ease }}
              className="mb-6 max-w-xl mx-auto lg:mx-0"
            >
              <SearchBar onSearch={onSearch} placeholder="Search by part name, brand, or vehicle..." />
            </motion.div>

            {/* CTA buttons */}
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

            {/* Trust indicators — small stats below CTA */}
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
              ].map((stat, i) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <p
                    className="text-lg font-bold text-[var(--color-text)]"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--color-text-dim)]">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ─── Right Panel: Product Showcase ─── */}
          <div className="relative flex items-center justify-center min-h-[400px] lg:min-h-[500px]">

            {/* Glow ring behind the product — pulsing glow animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-[var(--color-accent)] opacity-[0.06] blur-[60px] hero-glow" />
            </motion.div>

            {/* Product showcase — stacked images with staggered entrance + floating effect */}
            <div className="relative w-full max-w-sm">

              {/* Main product — largest, front-most, floating animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease }}
                className="relative z-10 hero-float"
              >
                <div className="card p-2 rounded-2xl overflow-hidden">
                  <img
                    src={showcaseProducts[0].image}
                    alt={showcaseProducts[0].name}
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                </div>
                {/* Floating label on the product card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8, ease }}
                  className="absolute -bottom-3 left-4 right-4 card px-4 py-3 flex items-center justify-between rounded-xl"
                >
                  <div>
                    <p className="text-xs text-[var(--color-text-dim)]">{showcaseProducts[0].category}</p>
                    <p className="text-sm font-semibold">{showcaseProducts[0].name}</p>
                  </div>
                  <span className="badge">$45.99</span>
                </motion.div>
              </motion.div>

              {/* Secondary product — smaller, behind and to the right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6, x: 60 }}
                animate={{ opacity: 0.85, scale: 0.85, x: 35 }}
                transition={{ duration: 0.8, delay: 0.4, ease }}
                className="absolute -top-4 -right-4 sm:-right-8 z-0 w-32 sm:w-40"
              >
                <div className="card p-1.5 rounded-xl overflow-hidden">
                  <img
                    src={showcaseProducts[1].image}
                    alt={showcaseProducts[1].name}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                </div>
              </motion.div>

              {/* Tertiary product — smaller, behind and to the left */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, x: -50 }}
                animate={{ opacity: 0.7, scale: 0.75, x: -25 }}
                transition={{ duration: 0.8, delay: 0.5, ease }}
                className="absolute top-8 -left-4 sm:-left-8 z-0 w-28 sm:w-32"
              >
                <div className="card p-1.5 rounded-xl overflow-hidden">
                  <img
                    src={showcaseProducts[2].image}
                    alt={showcaseProducts[2].name}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
