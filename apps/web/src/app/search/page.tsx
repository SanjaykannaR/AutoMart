/**
 * Search Page — Product browsing with filters
 *
 * Layout:
 *   ┌──────────┬────────────────────────────┐
 *   │ Filters  │  Product Grid              │
 *   │ (sidebar)│  (3 cols desktop, 2 tablet)│
 *   │          │                            │
 *   └──────────┴────────────────────────────┘
 *
 * Features:
 *   - Sidebar filters: category, brand, vehicle type, price range
 *   - Active filter chips with "x" to remove
 *   - Search bar at the top
 *   - Skeleton loading state
 *   - Empty state with CTA
 *   - All filter changes trigger API re-fetch
 *   - Products animate in with staggered card reveal
 *
 * Filter chips:
 *   When a filter is active, a lime-bordered chip appears above the grid
 *   showing the active filter with an "x" button to clear it.
 *
 * Mobile:
 *   - Filters collapse into a "Filters" button that opens a drawer
 *   - Product grid becomes 2 columns
 */
'use client' // Next.js client component directive

import { useState, useEffect, Suspense } from 'react' // React hooks + Suspense for async
import { useSearchParams, useRouter } from 'next/navigation' // Next.js routing hooks
import { SearchBar } from '@/components/SearchBar' // Reusable search bar component
import { ProductCard } from '@/components/ProductCard' // Reusable product card
import { ScrollReveal } from '@/components/ScrollReveal' // Reusable scroll animation wrapper
import { motion } from 'framer-motion' // Framer Motion for non-ScrollReveal animations
import { XMarkIcon, FunnelIcon, CameraIcon } from '@heroicons/react/24/outline' // Icon imports

/**
 * Category options for the filter dropdown.
 * Could be fetched from the API but hardcoded for the demo UI.
 */
const categoryOptions = [
  'Brake System', // Brake pads, rotors, calipers
  'Engine Parts', // Pistons, gaskets, oil filters
  'Suspension', // Shocks, struts, springs
  'Electrical', // Lights, batteries, alternators
  'Transmission', // Clutch kits, gearboxes
  'Exhaust', // Mufflers, catalytic converters
]

/**
 * SearchContent Component — the actual search page content.
 * Wrapped in Suspense for Next.js useSearchParams compatibility.
 */
function SearchContent() {
  const searchParams = useSearchParams() // Read URL search params
  const router = useRouter() // Next.js router for navigation

  /** Products fetched from the API */
  const [products, setProducts] = useState<any[]>([])
  /** Loading state for skeleton UI */
  const [loading, setLoading] = useState(false)
  /** Mobile filter drawer open state */
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  /** Image search mode — shows uploaded image banner */
  const [imageSearch, setImageSearch] = useState<string | null>(null) // Image data URL or null
  const isImageMode = searchParams.get('mode') === 'image' // Check if URL has image mode

  /**
   * On mount, check if image search mode.
   * If so, read the stored image from sessionStorage.
   */
  useEffect(() => {
    if (isImageMode) { // If URL indicates image search mode
      const img = sessionStorage.getItem('imageSearch') // Read stored image
      if (img) {
        setImageSearch(img) // Set the image for display
      } else {
        router.replace('/search') // No image found — fall back to normal search
      }
    }
  }, [isImageMode, router]) // Re-run if mode or router changes

  /** Clear image search and return to normal search */
  const clearImageSearch = () => {
    sessionStorage.removeItem('imageSearch') // Remove stored image
    setImageSearch(null) // Clear display
    router.replace('/search') // Navigate to normal search
  }

  /** Filter state — initialized from URL search params */
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '', // Category from URL
    brand: '', // Brand text input
    minPrice: '', // Minimum price
    maxPrice: '', // Maximum price
    vehicleType: '', // Vehicle type (car/bike)
  })

  /** Count active filters for the badge number */
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  /**
   * Fetch products from the search service API with current filters.
   * Called on filter changes and search submissions.
   */
  const fetchProducts = async (query?: string) => {
    setLoading(true) // Show skeleton loading
    const params = new URLSearchParams() // Build query string
    if (query) params.set('q', query) // Search query
    if (filters.category) params.set('category', filters.category) // Category filter
    if (filters.brand) params.set('brand', filters.brand) // Brand filter
    if (filters.minPrice) params.set('minPrice', filters.minPrice) // Min price
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice) // Max price
    if (filters.vehicleType) params.set('vehicleType', filters.vehicleType) // Vehicle type

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?${params}`) // Fetch from API
      const data = await res.json() // Parse response
      setProducts(data) // Store products
    } catch {
      setProducts([]) // On error, empty results
    } finally {
      setLoading(false) // Hide skeleton
    }
  }

  /** Re-fetch when filters change */
  useEffect(() => {
    fetchProducts() // Fetch with current filters
  }, [filters]) // Re-run when filters change

  /** Handle search bar submissions */
  const handleSearch = (query: string) => {
    const params = new URLSearchParams({ q: query }) // Build search URL
    router.push(`/search?${params}`) // Navigate to search page
    fetchProducts(query) // Fetch results
  }

  /** Clear a single filter by key */
  const clearFilter = (key: keyof typeof filters) => {
    setFilters({ ...filters, [key]: '' }) // Set that filter to empty
  }

  /** Clear all filters */
  const clearAllFilters = () => {
    setFilters({ category: '', brand: '', minPrice: '', maxPrice: '', vehicleType: '' }) // Reset all
  }

  /**
   * Filter sidebar content — shared between desktop sidebar and mobile drawer.
   * Renders category dropdown, brand input, vehicle type, price range, and clear button.
   */
  const filterContent = (
    <div className="space-y-5">
      <h3 className="font-semibold text-sm text-[var(--color-text)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Filters
      </h3>

      {/* Category dropdown */}
      <div>
        <label className="text-xs text-[var(--color-text-dim)] block mb-2">Category</label>
        <select
          value={filters.category} // Controlled by state
          onChange={(e) => setFilters({ ...filters, category: e.target.value })} // Update on change
          className="glass-input text-sm"
        >
          <option value="">All Categories</option> {/* Default option */}
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat} className="bg-[var(--color-surface)]">
              {cat} {/* Category name */}
            </option>
          ))}
        </select>
      </div>

      {/* Brand text input */}
      <div>
        <label className="text-xs text-[var(--color-text-dim)] block mb-2">Brand</label>
        <input
          type="text"
          value={filters.brand} // Controlled by state
          onChange={(e) => setFilters({ ...filters, brand: e.target.value })} // Update on change
          className="glass-input text-sm"
          placeholder="e.g. Bosch, NGK" // Placeholder hint
        />
      </div>

      {/* Vehicle type dropdown */}
      <div>
        <label className="text-xs text-[var(--color-text-dim)] block mb-2">Vehicle Type</label>
        <select
          value={filters.vehicleType} // Controlled by state
          onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })} // Update on change
          className="glass-input text-sm"
        >
          <option value="">All</option> {/* Default: all vehicles */}
          <option value="car" className="bg-[var(--color-surface)]">Car</option> {/* Cars only */}
          <option value="bike" className="bg-[var(--color-surface)]">Bike</option> {/* Bikes only */}
        </select>
      </div>

      {/* Price range — min/max inputs */}
      <div>
        <label className="text-xs text-[var(--color-text-dim)] block mb-2">Price Range</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={filters.minPrice} // Controlled by state
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} // Update on change
            className="glass-input text-sm w-1/2"
            placeholder="Min" // Minimum price placeholder
          />
          <input
            type="number"
            value={filters.maxPrice} // Controlled by state
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} // Update on change
            className="glass-input text-sm w-1/2"
            placeholder="Max" // Maximum price placeholder
          />
        </div>
      </div>

      {/* Clear all filters button */}
      <button
        onClick={clearAllFilters} // Reset all filters
        className="glass-button-outline text-sm w-full"
      >
        Clear All Filters
      </button>
    </div>
  )

  return (
    <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search bar — animates in on page load */}
      <ScrollReveal variant="text">
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} placeholder="Search by part name, brand, or vehicle..." />
        </div>
      </ScrollReveal>

      {/* IMAGE SEARCH BANNER — shown when user uploaded an image */}
      {imageSearch && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} // Slide down + fade in
          animate={{ opacity: 1, y: 0 }} // Final state
          className="mb-6 flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08]"
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/[0.1] shrink-0">
            <img
              src={imageSearch} // Uploaded image thumbnail
              alt="Search reference" // Alt text for accessibility
              className="w-full h-full object-cover" // Cover the container
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <CameraIcon className="w-4 h-4 text-[var(--color-accent)]" /> {/* Camera icon */}
              <span className="text-sm font-semibold text-[var(--color-accent)]">Image Search</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              Showing results matching your uploaded photo
            </p>
          </div>
          <button
            onClick={clearImageSearch} // Clear image search
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/[0.08] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            title="Clear image search" // Tooltip
          >
            <XMarkIcon className="w-4 h-4" /> {/* X close icon */}
          </button>
        </motion.div>
      )}

      {/* Active filter chips — shown when filters are active */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.category && (
            <FilterChip label={filters.category} onRemove={() => clearFilter('category')} />
          )}
          {filters.brand && (
            <FilterChip label={`Brand: ${filters.brand}`} onRemove={() => clearFilter('brand')} />
          )}
          {filters.vehicleType && (
            <FilterChip label={filters.vehicleType} onRemove={() => clearFilter('vehicleType')} />
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <FilterChip
              label={`$${filters.minPrice || '0'} — $${filters.maxPrice || '\u221E'}`}
              onRemove={() => { setFilters({ ...filters, minPrice: '', maxPrice: '' }) }}
            />
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop Sidebar Filters — slides in from left */}
        <aside className="hidden lg:block w-64 shrink-0">
          <ScrollReveal variant="slide-left">
            <div className="card p-5 sticky top-24">
              {filterContent}
            </div>
          </ScrollReveal>
        </aside>

        {/* Mobile Filter Button — fixed at bottom center */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setMobileFiltersOpen(true)} // Open mobile filter drawer
            className="glass-button flex items-center gap-2 px-6 py-3 shadow-lg"
          >
            <FunnelIcon className="w-4 h-4" /> {/* Filter icon */}
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount} {/* Active filter count badge */}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Filter Drawer — slides in from right */}
        {mobileFiltersOpen && (
          <>
            {/* Backdrop overlay — closes drawer on click */}
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            {/* Drawer panel — slides in from right */}
            <div className="fixed top-0 right-0 bottom-0 z-[60] w-80 bg-[var(--color-surface)] border-l border-[var(--color-border)] p-6 overflow-y-auto lg:hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Filters</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)} // Close drawer
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.04]"
                >
                  <XMarkIcon className="w-5 h-5 text-[var(--color-text-dim)]" />
                </button>
              </div>
              {filterContent} {/* Same filter content as sidebar */}
            </div>
          </>
        )}

        {/* Product Grid — main content area */}
        <div className="flex-1">
          {loading ? (
            /* Skeleton loading state — 6 placeholder cards */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-0 overflow-hidden">
                  <div className="aspect-square skeleton" /> {/* Placeholder image */}
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-16 skeleton" /> {/* Placeholder brand */}
                    <div className="h-4 w-full skeleton" /> {/* Placeholder name */}
                    <div className="h-5 w-20 skeleton" /> {/* Placeholder price */}
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty state — no products found */
            <div className="text-center py-20">
              <p className="text-[var(--color-text-dim)] mb-4">No products found</p>
              <button onClick={clearAllFilters} className="glass-button-outline text-sm px-6 py-2">
                Clear Filters
              </button>
            </div>
          ) : (
            /* Product grid — responsive 2-3 columns with staggered card reveal */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((product: any, index: number) => (
                <ScrollReveal
                  key={product.id}
                  variant="card"
                  delay={Math.min(index * 0.05, 0.3)} // Stagger up to 300ms max
                >
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * FilterChip — small pill showing an active filter with an "x" to remove.
 * Lime-bordered to indicate it's an active filter.
 */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                     bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
      {label} {/* Filter label text */}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity" aria-label={`Remove ${label} filter`}>
        <XMarkIcon className="w-3.5 h-3.5" /> {/* X icon to remove filter */}
      </button>
    </span>
  )
}

/**
 * SearchPage — wraps SearchContent in Suspense for Next.js compatibility.
 */
export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
