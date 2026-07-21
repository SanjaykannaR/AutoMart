/**
 * Categories Page — Browse parts by category
 * 
 * WHAT IT DOES:
 *   - Shows all available part categories in a grid
 *   - Each category card has an image, name, and part count
 *   - Clicking a category navigates to /search?category=...
 *   - Categories are hardcoded (in production, fetched from API)
 * 
 * CATEGORIES:
 *   - Brakes: brake pads, rotors, calipers
 *   - Engine: pistons, gaskets, belts
 *   - Exhaust: mufflers, catalytic converters
 *   - Electrical: batteries, alternators, starters
 *   - Suspension: shocks, struts, springs
 *   - Transmission: clutch kits, gears, fluid
 *   - Cooling: radiators, thermostats, hoses
 *   - Body: bumpers, mirrors, lights
 * 
 * LAYOUT:
 *   - 2 columns on mobile
 *   - 3 columns on tablet
 *   - 4 columns on desktop
 *   - Each card: full-bleed image + overlay name + count
 * 
 * HOW IT CONNECTS:
 *   - Home page has a "Categories" section with a subset
 *   - This page shows ALL categories
 *   - Search page filters by category when coming from here
 */
'use client'

import Link from 'next/link'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

/**
 * Category type — defines what each category looks like.
 * 
 * id: URL-friendly slug (used in search query)
 * name: Display name
 * image: Unsplash image URL (verified working)
 * count: Number of parts in this category (approximate)
 * description: Short description for hover/tooltip
 */
interface Category {
  id: string
  name: string
  image: string
  count: number
  description: string
}

/**
 * All categories — hardcoded for demo.
 * In production, this would come from GET /api/categories.
 * Images are from Unsplash (verified working URLs).
 */
const categories: Category[] = [
  {
    id: 'brakes',
    name: 'Brakes',
    image: 'https://images.unsplash.com/photo-1696494561079-ddabcbb308e8?w=400&h=400&fit=crop&q=80',
    count: 245,
    description: 'Brake pads, rotors, calipers, and fluid',
  },
  {
    id: 'engine',
    name: 'Engine',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop&q=80',
    count: 189,
    description: 'Pistons, gaskets, belts, and filters',
  },
  {
    id: 'exhaust',
    name: 'Exhaust',
    image: 'https://images.unsplash.com/photo-1759419281480-bacc913c9606?w=400&h=400&fit=crop&q=80',
    count: 132,
    description: 'Mufflers, catalytic converters, and pipes',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop&q=80',
    count: 310,
    description: 'Batteries, alternators, starters, and wiring',
  },
  {
    id: 'suspension',
    name: 'Suspension',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=400&fit=crop&q=80',
    count: 178,
    description: 'Shocks, struts, springs, and control arms',
  },
  {
    id: 'transmission',
    name: 'Transmission',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=400&fit=crop&q=80',
    count: 156,
    description: 'Clutch kits, gears, and transmission fluid',
  },
  {
    id: 'cooling',
    name: 'Cooling',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=400&fit=crop&q=80',
    count: 98,
    description: 'Radiators, thermostats, and coolant hoses',
  },
  {
    id: 'body',
    name: 'Body & Lights',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop&q=80',
    count: 420,
    description: 'Bumpers, mirrors, headlights, and body panels',
  },
]

export default function CategoriesPage() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* ─── Page Header ─── */}
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Browse Categories
        </h1>
        <p className="text-[var(--color-text-dim)] text-sm mt-1">
          Find parts by category — {categories.length} categories available
        </p>
      </div>

      {/* ─── Categories Grid ─── 
       * Responsive columns:
       *   - Mobile: 2 columns (compact cards)
       *   - Tablet: 3 columns
       *   - Desktop: 4 columns (full width)
       * 
       * Each card:
       *   - Full-bleed background image
       *   - Dark gradient overlay at bottom
       *   - Category name + part count
       *   - Hover: image zooms, overlay brightens
       *   - Click: navigates to /search?category=<id>
       */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/search?category=${category.id}`}
            className="group relative aspect-square rounded-2xl overflow-hidden card"
          >
            {/* Background image — zooms on hover */}
            <img
              src={category.image}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              draggable={false}
            />

            {/* Dark gradient overlay — stronger at bottom for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Category info — positioned at bottom of card */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Category name */}
              <h3
                className="text-lg font-bold text-white mb-0.5"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {category.name}
              </h3>

              {/* Part count */}
              <p className="text-xs text-white/60">
                {category.count} parts
              </p>
            </div>

            {/* Hover indicator — small arrow on hover */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <MagnifyingGlassIcon className="w-4 h-4 text-white" />
            </div>
          </Link>
        ))}
      </div>

      {/* ─── CTA Section ─── 
       * Bottom section encouraging users to search
       * if they didn't find what they needed
       */}
      <div className="mt-12 text-center">
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
      </div>
    </div>
  )
}
