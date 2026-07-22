/**
 * Categories Page — Browse parts by category
 *
 * WHAT IT DOES:
 *   - Shows all available part categories in a grid
 *   - Each category card has an image, name, and part count
 *   - Clicking a category navigates to /search?category=...
 *   - Categories are hardcoded (in production, fetched from API)
 *
 * LAYOUT:
 *   - 2 columns on mobile, 3 on tablet, 4 on desktop
 *   - Each card: full-bleed image + overlay name + count
 *
 * ANIMATION:
 *   - Page header fades up on scroll
 *   - Each category card scales in with staggered image variant
 *   - CTA section pops in at bottom
 */
'use client' // Next.js client component directive

import Link from 'next/link' // Next.js client-side navigation
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline' // Search icon
import { ScrollReveal } from '@/components/ScrollReveal' // Reusable scroll animation wrapper

/**
 * Category type — defines what each category looks like.
 */
interface Category {
  id: string // URL-friendly slug (used in search query)
  name: string // Display name
  image: string // Unsplash image URL
  count: number // Number of parts in this category
  description: string // Short description
}

/**
 * All categories — hardcoded for demo.
 * Images are from Unsplash (verified working URLs).
 */
const categories: Category[] = [
  {
    id: 'brakes', // URL slug
    name: 'Brakes', // Display name
    image: 'https://images.unsplash.com/photo-1696494561079-ddabcbb308e8?w=400&h=400&fit=crop&q=80', // Brake pads photo
    count: 245, // Part count
    description: 'Brake pads, rotors, calipers, and fluid',
  },
  {
    id: 'engine', // URL slug
    name: 'Engine', // Display name
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop&q=80', // Engine parts photo
    count: 189, // Part count
    description: 'Pistons, gaskets, belts, and filters',
  },
  {
    id: 'exhaust', // URL slug
    name: 'Exhaust', // Display name
    image: 'https://images.unsplash.com/photo-1759419281480-bacc913c9606?w=400&h=400&fit=crop&q=80', // Exhaust photo
    count: 132, // Part count
    description: 'Mufflers, catalytic converters, and pipes',
  },
  {
    id: 'electrical', // URL slug
    name: 'Electrical', // Display name
    image: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=400&h=400&fit=crop&q=80', // Auto parts/electrical photo
    count: 310, // Part count
    description: 'Batteries, alternators, starters, and wiring',
  },
  {
    id: 'suspension', // URL slug
    name: 'Suspension', // Display name
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=400&fit=crop&q=80', // Car photo
    count: 178, // Part count
    description: 'Shocks, struts, springs, and control arms',
  },
  {
    id: 'transmission', // URL slug
    name: 'Transmission', // Display name
    image: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=400&h=400&fit=crop&q=80', // Transmission/gear photo
    count: 156, // Part count
    description: 'Clutch kits, gears, and transmission fluid',
  },
  {
    id: 'cooling', // URL slug
    name: 'Cooling', // Display name
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=400&fit=crop&q=80', // Cooling system photo
    count: 98, // Part count
    description: 'Radiators, thermostats, and coolant hoses',
  },
  {
    id: 'body', // URL slug
    name: 'Body & Lights', // Display name
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop&q=80', // Car body photo
    count: 420, // Part count
    description: 'Bumpers, mirrors, headlights, and body panels',
  },
]

/**
 * CategoriesPage Component
 * Displays all categories in a responsive grid with scroll animations.
 */
export default function CategoriesPage() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-[2560px] mx-auto">
      {/* Page header — text animation */}
      <div className="mb-8">
        <ScrollReveal variant="text">
          <h1
            className="text-3xl font-extrabold"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Browse Categories
          </h1>
        </ScrollReveal>
        <ScrollReveal variant="fade" delay={0.05}>
          <p className="text-[var(--color-text-dim)] text-sm mt-1">
            Find parts by category — {categories.length} categories available
          </p>
        </ScrollReveal>
      </div>

      {/* Categories grid — each card uses image animation with stagger */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category, index) => (
          <ScrollReveal key={category.id} variant="image" delay={index * 0.06}>
            <Link
              href={`/search?category=${category.id}`}
              className="group relative aspect-square rounded-2xl overflow-hidden card block"
            >
              {/* Background image — zooms on hover */}
              <img
                src={category.image}
                alt={category.name} // Alt text for accessibility
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                draggable={false} // Prevent drag interference
              />

              {/* Dark gradient overlay — stronger at bottom for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Category info — positioned at bottom of card */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3
                  className="text-lg font-bold text-white mb-0.5"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {category.name}
                </h3>
                <p className="text-xs text-white/60">
                  {category.count} parts
                </p>
              </div>

              {/* Hover indicator — small search icon on hover */}
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <MagnifyingGlassIcon className="w-4 h-4 text-white" />
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>

      {/* CTA section — pop animation */}
      <div className="mt-12 text-center">
        <ScrollReveal variant="pop">
          <p className="text-[var(--color-text-dim)] text-sm mb-4">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            Search All Parts
          </Link>
        </ScrollReveal>
      </div>
    </div>
  )
}
