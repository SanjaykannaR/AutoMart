/**
 * FeaturedCarousel — Horizontal product slider below the hero
 *
 * All images are verified working Unsplash URLs (tested with curl).
 * Uses CSS scroll-snap for smooth horizontal scrolling on mobile.
 * Uses ScrollReveal for staggered card entrance animations.
 */
'use client' // Next.js client component directive

import Link from 'next/link' // Next.js client-side navigation
import { ProductCard } from '@/components/ProductCard' // Reusable product card
import { ScrollReveal } from '@/components/ScrollReveal' // Reusable scroll animation wrapper

/**
 * Featured products — all Unsplash image URLs verified as 200 OK.
 * Each shows a real automotive part photo.
 */
const featuredProducts = [
  {
    id: 'feat-1', // Unique ID for React key
    name: 'Ceramic Brake Pads', // Product name
    category: 'Brake System', // Category for badge
    brand: 'Bosch', // Brand name
    price: 45.99, // Price in dollars
    imageUrl: 'https://images.unsplash.com/photo-1696494561079-ddabcbb308e8?w=400&h=400&fit=crop&q=80', // Brake pads photo
  },
  {
    id: 'feat-2', // Unique ID
    name: 'Performance Exhaust Muffler', // Product name
    category: 'Exhaust', // Category
    brand: 'Akrapovic', // Brand
    price: 289.00, // Price
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop&q=80', // Engine parts photo
  },
  {
    id: 'feat-3', // Unique ID
    name: 'LED Headlight Conversion Kit', // Product name
    category: 'Electrical', // Category
    brand: 'Philips', // Brand
    price: 124.50, // Price
    imageUrl: 'https://images.unsplash.com/photo-1696494561430-de087dd0bd69?w=400&h=400&fit=crop&q=80', // Brake disc photo
  },
  {
    id: 'feat-4', // Unique ID
    name: 'Sport Suspension Shocks', // Product name
    category: 'Suspension', // Category
    brand: 'Bilstein', // Brand
    price: 199.99, // Price
    imageUrl: 'https://images.unsplash.com/photo-1662074050260-1e015d6cd8c4?w=400&h=400&fit=crop&q=80', // Car engine parts photo
  },
  {
    id: 'feat-5', // Unique ID
    name: 'Synthetic Engine Oil 5W-30', // Product name
    category: 'Engine Parts', // Category
    brand: 'Mobil 1', // Brand
    price: 34.99, // Price
    imageUrl: 'https://images.unsplash.com/photo-1739488754789-5a2e85ee6a79?w=400&h=400&fit=crop&q=80', // F4 race car engine parts
  },
  {
    id: 'feat-6', // Unique ID
    name: 'Sport Clutch Kit', // Product name
    category: 'Transmission', // Category
    brand: 'Exedy', // Brand
    price: 175.00, // Price
    imageUrl: 'https://images.unsplash.com/photo-1759419281480-bacc913c9606?w=400&h=400&fit=crop&q=80', // Catalytic converters photo
  },
]

/**
 * FeaturedCarousel Component
 * Displays a horizontal scrolling row of featured product cards.
 * Each card staggers in with a fade-up animation on scroll.
 */
export function FeaturedCarousel() {
  return (
    <section className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Section header — text animates on scroll */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <ScrollReveal variant="fade">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-accent)] block mb-2">
              01 — Featured
            </span>
          </ScrollReveal>
          <ScrollReveal variant="text" delay={0.05}>
            <h2
              className="text-2xl sm:text-3xl font-bold"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Featured Parts
            </h2>
          </ScrollReveal>
        </div>
        {/* "View All" link — fades in */}
        <ScrollReveal variant="fade" delay={0.1}>
          <Link
            href="/search"
            className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-accent)] transition-colors"
          >
            View All →
          </Link>
        </ScrollReveal>
      </div>

      {/* Product grid — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide
                      md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible md:pb-0">
        {featuredProducts.map((product, index) => (
          <ScrollReveal
            key={product.id}
            variant="card"
            delay={index * 0.08} // Stagger each card by 80ms
            className="snap-start shrink-0 w-[200px] md:w-auto"
          >
            <ProductCard product={product} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
