/**
 * Home Page — AutoMart Landing
 * 
 * Sections (top to bottom):
 *   1. Hero — split-screen with headline, search, product showcase
 *   2. Featured Carousel — horizontal product slider
 *   3. Categories Grid — 2×3 grid of part categories with icons
 *   4. How It Works — 3-step process with numbered indices
 *   5. Trust Bar — stats and delivery promise
 *   6. CTA — final call-to-action to start browsing
 * 
 * All sections use framer-motion for scroll-triggered animations.
 * Categories link to /search?category=<name>.
 * Search results display inline below the hero.
 */
'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { ProductCard } from '@/components/ProductCard'
import { Hero } from '@/components/Hero'
import { FeaturedCarousel } from '@/components/FeaturedCarousel'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  StopIcon, CogIcon, WrenchIcon, BoltIcon, Cog6ToothIcon, FireIcon,
  MagnifyingGlassIcon, ClipboardDocumentCheckIcon, TruckIcon,
  CubeIcon, ClockIcon, UserGroupIcon, HeadphonesIcon
} from '@heroicons/react/24/outline'

/**
 * Category data — with Heroicons for glass circle style.
 */
const categories = [
  { name: 'Brake System', icon: StopIcon, count: 142, color: '#EF4444' },
  { name: 'Engine Parts', icon: CogIcon, count: 238, color: '#F59E0B' },
  { name: 'Suspension', icon: WrenchIcon, count: 95, color: '#38B6FF' },
  { name: 'Electrical', icon: BoltIcon, count: 187, color: '#39FF14' },
  { name: 'Transmission', icon: Cog6ToothIcon, count: 76, color: '#8B5CF6' },
  { name: 'Exhaust', icon: FireIcon, count: 54, color: '#FF523B' },
]

/**
 * How It Works steps — with icons for glass circle style.
 */
const steps = [
  {
    num: '01',
    title: 'Search Your Part',
    desc: 'Enter your part name, brand, or vehicle model. Our AI finds the exact match.',
    icon: MagnifyingGlassIcon,
  },
  {
    num: '02',
    title: 'Place Your Order',
    desc: 'Confirm your part, add delivery details, and check out in seconds.',
    icon: ClipboardDocumentCheckIcon,
  },
  {
    num: '03',
    title: 'Get It in 30 Mins',
    desc: 'Your mechanic picks and delivers the part to your doorstep in 30 minutes.',
    icon: TruckIcon,
  },
]

/**
 * Trust stats — with icons for glass circle style.
 */
const stats = [
  { value: '10,000+', label: 'Parts Available', icon: CubeIcon },
  { value: '30 min', label: 'Avg. Delivery', icon: ClockIcon },
  { value: '50,000+', label: 'Orders Delivered', icon: UserGroupIcon },
  { value: '24/7', label: 'Customer Support', icon: HeadphonesIcon },
]

export default function HomePage() {
  const [results, setResults] = useState<any[]>([])
  const [searched, setSearched] = useState(false)

  /**
   * Handle search submissions from the Hero search bar.
   * Queries the search service API and displays results inline.
   */
  const handleSearch = (query: string) => {
    setSearched(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then(setResults)
      .catch(() => setResults([]))
  }

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: Hero
          Split-screen layout with headline + product showcase
          ═══════════════════════════════════════════════════════════ */}
      <Hero onSearch={handleSearch} />

      {/* Search results — shown inline below hero when user searches */}
      {searched && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-[2560px] mx-auto px-4 py-8 text-center"
        >
          <p className="text-[var(--color-text-dim)]">No parts found. Try a different search.</p>
        </motion.div>
      )}

      {results.length > 0 && (
        <section className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Search Results
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {results.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: Featured Carousel
          Horizontal product slider with snap scrolling
          ═══════════════════════════════════════════════════════════ */}
      <FeaturedCarousel />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: Browse by Category
          2×3 grid of category cards with icons and part counts
          ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section header with numbered index */}
        <div className="mb-10">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-accent)] block mb-2"
          >
            02 — Categories
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl sm:text-3xl font-bold"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Browse by Category
          </motion.h2>
        </div>

        {/* Category grid — 2 cols mobile, 3 tablet, 6 desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, index) => {
            const Icon = cat.icon
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Link href={`/search?category=${encodeURIComponent(cat.name)}`}>
                  <div className="card text-center py-8 px-4 cursor-pointer group hover:border-[var(--color-accent)]/30 transition-all duration-300">
                    {/* ─── GLASS CIRCLE ICON ─── 
                     * Circular with backdrop blur
                     * Outline icon style
                     * Color glow on hover
                     */}
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center bg-white/[0.06] backdrop-blur-md border border-white/[0.1] group-hover:border-white/[0.2] group-hover:bg-white/[0.1] transition-all duration-300 group-hover:scale-110">
                      <Icon className="w-6 h-6 text-[var(--color-text-dim)] group-hover:text-[var(--color-text)] transition-colors" />
                    </div>
                    {/* Category name */}
                    <p className="text-sm font-medium text-[var(--color-text)] mb-1">{cat.name}</p>
                    {/* Part count */}
                    <p className="text-xs text-[var(--color-text-dim)]">{cat.count} parts</p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4: How It Works
          3-step process with large numbered indices (01, 02, 03)
          ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section header */}
        <div className="mb-12">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-accent)] block mb-2"
          >
            03 — Process
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl sm:text-3xl font-bold"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            How It Works
          </motion.h2>
        </div>

        {/* Steps grid — 3 columns */}
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="card p-8 h-full">
                  {/* ─── GLASS CIRCLE ICON ─── */}
                  <div className="w-14 h-14 mb-5 rounded-full flex items-center justify-center bg-white/[0.06] backdrop-blur-md border border-white/[0.1]">
                    <Icon className="w-6 h-6 text-[var(--color-accent)]" />
                  </div>
                  {/* Large numbered index */}
                  <span
                    className="block text-5xl font-black text-[var(--color-accent)] opacity-20 mb-4"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {step.num}
                  </span>
                  {/* Step title */}
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {step.title}
                  </h3>
                  {/* Step description */}
                  <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5: Trust Bar — Stats and delivery promise
          ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="card p-8 sm:p-12"
        >
          {/* Stats grid — 2x2 on mobile, 4 columns on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  {/* ─── GLASS CIRCLE ICON ─── */}
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-white/[0.06] backdrop-blur-md border border-white/[0.1]">
                    <Icon className="w-5 h-5 text-[var(--color-accent)]" />
                  </div>
                  <p
                    className="text-2xl sm:text-3xl font-extrabold text-[var(--color-accent)] mb-1"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--color-text-dim)]">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6: CTA — Final call-to-action
          ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative card p-12 sm:p-16 text-center overflow-hidden"
        >
          {/* Background glow — decorative */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--color-accent)] rounded-full opacity-[0.04] blur-[80px]" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            <h2
              className="text-3xl sm:text-4xl font-extrabold mb-4"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Need a Part?{' '}
              <span className="text-[var(--color-accent)]">We Got You.</span>
            </h2>
            <p className="text-[var(--color-text-dim)] mb-8 max-w-md mx-auto">
              Search, order, and get your spare parts delivered in 30 minutes — not hours.
            </p>
            <Link href="/search" className="glass-button px-10 py-3 text-base">
              Start Browsing
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
