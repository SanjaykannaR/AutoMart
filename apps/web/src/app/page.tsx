/**
 * Home Page — AutoMart Landing
 *
 * Sections (top to bottom):
 *   1. Hero — full-width banner carousel with auto-slide ads
 *   2. Featured Carousel — horizontal product slider
 *   3. Categories Grid — 2x3 grid of part categories with icons
 *   4. How It Works — 3-step process with numbered indices
 *   5. Trust Bar — stats and delivery promise
 *   6. CTA — final call-to-action to start browsing
 *
 * All sections use ScrollReveal for element-based scroll animations.
 * Categories link to /search?category=<name>.
 * Search results display inline below the hero.
 */
'use client' // Next.js client component directive

import { useState } from 'react' // React state hook
import { SearchBar } from '@/components/SearchBar' // Reusable search bar component
import { ProductCard } from '@/components/ProductCard' // Product card component
import { Hero } from '@/components/Hero' // Hero banner carousel section
import { FeaturedCarousel } from '@/components/FeaturedCarousel' // Featured products carousel
import { ScrollReveal } from '@/components/ScrollReveal' // Reusable scroll animation wrapper
import { motion } from 'framer-motion' // Framer Motion for non-ScrollReveal animations
import Link from 'next/link' // Next.js client-side navigation
import {
  StopIcon, CogIcon, WrenchIcon, BoltIcon, Cog6ToothIcon, FireIcon, // Category icons
  MagnifyingGlassIcon, ClipboardDocumentCheckIcon, TruckIcon, // How It Works icons
  CubeIcon, ClockIcon, UsersIcon, PhoneIcon // Trust bar stats icons
} from '@heroicons/react/24/outline'

/**
 * Category data — with Heroicons for glass circle style.
 * Each category links to /search?category=<name>.
 */
const categories = [
  { name: 'Brake System', icon: StopIcon, count: 142, color: '#EF4444' }, // Red — brakes
  { name: 'Engine Parts', icon: CogIcon, count: 238, color: '#F59E0B' }, // Amber — engine
  { name: 'Suspension', icon: WrenchIcon, count: 95, color: '#38B6FF' }, // Blue — suspension
  { name: 'Electrical', icon: BoltIcon, count: 187, color: '#39FF14' }, // Lime — electrical
  { name: 'Transmission', icon: Cog6ToothIcon, count: 76, color: '#8B5CF6' }, // Purple — transmission
  { name: 'Exhaust', icon: FireIcon, count: 54, color: '#FF523B' }, // Coral — exhaust
]

/**
 * How It Works steps — with icons for glass circle style.
 * Each step shows a numbered process (01, 02, 03).
 */
const steps = [
  {
    num: '01', // Step number — large decorative index
    title: 'Search Your Part', // Step title
    desc: 'Enter your part name, brand, or vehicle model. Our AI finds the exact match.', // Step description
    icon: MagnifyingGlassIcon, // Search/magnifier icon
  },
  {
    num: '02', // Step number
    title: 'Place Your Order', // Step title
    desc: 'Confirm your part, add delivery details, and check out in seconds.', // Step description
    icon: ClipboardDocumentCheckIcon, // Clipboard/order icon
  },
  {
    num: '03', // Step number
    title: 'Get It in 30 Mins', // Step title
    desc: 'Your mechanic picks and delivers the part to your doorstep in 30 minutes.', // Step description
    icon: TruckIcon, // Delivery truck icon
  },
]

/**
 * Trust stats — with icons for glass circle style.
 * Displayed in a 4-column grid on desktop.
 */
const stats = [
  { value: '10,000+', label: 'Parts Available', icon: CubeIcon }, // Total parts count
  { value: '30 min', label: 'Avg. Delivery', icon: ClockIcon }, // Average delivery time
  { value: '50,000+', label: 'Orders Delivered', icon: UsersIcon }, // Total orders
  { value: '24/7', label: 'Customer Support', icon: PhoneIcon }, // Support availability
]

/**
 * HomePage Component — Main landing page
 */
export default function HomePage() {
  /** Search results state — populated when user searches from Hero */
  const [results, setResults] = useState<any[]>([])
  /** Whether a search has been performed (shows empty state if no results) */
  const [searched, setSearched] = useState(false)

  /**
   * Handle search submissions from the Hero search bar.
   * Queries the search service API and displays results inline.
   */
  const handleSearch = (query: string) => {
    setSearched(true) // Mark as searched to show empty state if needed
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json()) // Parse JSON response
      .then(setResults) // Store results in state
      .catch(() => setResults([])) // On error, set empty results
  }

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: Hero
          Full-width banner carousel with auto-slide ads
          ═══════════════════════════════════════════════════════════ */}
      <Hero onSearch={handleSearch} />

      {/* Search results — shown inline below hero when user searches */}
      {searched && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} // Start transparent
          animate={{ opacity: 1 }} // Fade in
          className="max-w-[2560px] mx-auto px-4 py-8 text-center" // Centered container
        >
          <p className="text-[var(--color-text-dim)]">No parts found. Try a different search.</p>
        </motion.div>
      )}

      {results.length > 0 && (
        <section className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Section title — fades in on scroll */}
          <ScrollReveal variant="text">
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Search Results
            </h2>
          </ScrollReveal>
          {/* Product grid — each card staggers in */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {results.map((product: any, index: number) => (
              <ScrollReveal key={product.id} variant="card" delay={Math.min(index * 0.05, 0.3)}>
                <ProductCard product={product} />
              </ScrollReveal>
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
          2x3 grid of category cards with icons and part counts
          ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section header — text animation */}
        <div className="mb-10">
          <ScrollReveal variant="fade">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-accent)] block mb-2">
              02 — Categories
            </span>
          </ScrollReveal>
          <ScrollReveal variant="text" delay={0.05}>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Browse by Category
            </h2>
          </ScrollReveal>
        </div>

        {/* Category grid — each card staggers in with scale */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, index) => {
            const Icon = cat.icon // Current category's icon component
            return (
              <ScrollReveal key={cat.name} variant="card" delay={index * 0.06}>
                <Link href={`/search?category=${encodeURIComponent(cat.name)}`}>
                  <div className="card text-center py-8 px-4 cursor-pointer group hover:border-[var(--color-accent)]/30 transition-all duration-300">
                    {/* Glass circle icon — scales up on hover */}
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center bg-white/[0.06] backdrop-blur-md border border-white/[0.1] group-hover:border-white/[0.2] group-hover:bg-white/[0.1] transition-all duration-300 group-hover:scale-110">
                      <Icon className="w-6 h-6 text-[var(--color-text-dim)] group-hover:text-[var(--color-text)] transition-colors" />
                    </div>
                    {/* Category name */}
                    <p className="text-sm font-medium text-[var(--color-text)] mb-1">{cat.name}</p>
                    {/* Part count */}
                    <p className="text-xs text-[var(--color-text-dim)]">{cat.count} parts</p>
                  </div>
                </Link>
              </ScrollReveal>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4: How It Works
          3-step process with large numbered indices (01, 02, 03)
          ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section header — text animation */}
        <div className="mb-12">
          <ScrollReveal variant="fade">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-accent)] block mb-2">
              03 — Process
            </span>
          </ScrollReveal>
          <ScrollReveal variant="text" delay={0.05}>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              How It Works
            </h2>
          </ScrollReveal>
        </div>

        {/* Steps grid — 3 columns, each card staggers */}
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon // Current step's icon component
            return (
              <ScrollReveal key={step.num} variant="card" delay={index * 0.1}>
                <div className="card p-8 h-full">
                  {/* Glass circle icon */}
                  <div className="w-14 h-14 mb-5 rounded-full flex items-center justify-center bg-white/[0.06] backdrop-blur-md border border-white/[0.1]">
                    <Icon className="w-6 h-6 text-[var(--color-accent)]" />
                  </div>
                  {/* Large numbered index — decorative */}
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
              </ScrollReveal>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5: Trust Bar — Stats and delivery promise
          ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ScrollReveal variant="card">
          <div className="card p-8 sm:p-12">
            {/* Stats grid — 2x2 on mobile, 4 columns on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon // Current stat's icon component
                return (
                  <ScrollReveal key={stat.label} variant="pop" delay={index * 0.08}>
                    <div className="text-center">
                      {/* Glass circle icon */}
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-white/[0.06] backdrop-blur-md border border-white/[0.1]">
                        <Icon className="w-5 h-5 text-[var(--color-accent)]" />
                      </div>
                      {/* Stat value — large lime text */}
                      <p
                        className="text-2xl sm:text-3xl font-extrabold text-[var(--color-accent)] mb-1"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {stat.value}
                      </p>
                      {/* Stat label — small dim text */}
                      <p className="text-xs sm:text-sm text-[var(--color-text-dim)]">{stat.label}</p>
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6: CTA — Final call-to-action
          ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ScrollReveal variant="card">
          <div className="relative card p-12 sm:p-16 text-center overflow-hidden">
            {/* Background glow — decorative */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--color-accent)] rounded-full opacity-[0.04] blur-[80px]" />
            </div>

            {/* Content — each element animates separately */}
            <div className="relative z-10">
              <ScrollReveal variant="text">
                <h2
                  className="text-3xl sm:text-4xl font-extrabold mb-4"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Need a Part?{' '}
                  <span className="text-[var(--color-accent)]">We Got You.</span>
                </h2>
              </ScrollReveal>
              <ScrollReveal variant="text" delay={0.08}>
                <p className="text-[var(--color-text-dim)] mb-8 max-w-md mx-auto">
                  Search, order, and get your spare parts delivered in 30 minutes — not hours.
                </p>
              </ScrollReveal>
              <ScrollReveal variant="pop" delay={0.15}>
                <Link href="/search" className="glass-button px-10 py-3 text-base">
                  Start Browsing
                </Link>
              </ScrollReveal>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  )
}
