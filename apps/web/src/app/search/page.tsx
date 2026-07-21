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
 *   - Active filter chips with "×" to remove
 *   - Search bar at the top
 *   - Skeleton loading state
 *   - Empty state with CTA
 *   - All filter changes trigger API re-fetch
 * 
 * Filter chips:
 *   When a filter is active, a lime-bordered chip appears above the grid
 *   showing the active filter with an "×" button to clear it.
 * 
 * Mobile:
 *   - Filters collapse into a "Filters" button that opens a drawer
 *   - Product grid becomes 2 columns
 */
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchBar } from '@/components/SearchBar'
import { ProductCard } from '@/components/ProductCard'
import { motion } from 'framer-motion'
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'

/**
 * Category options for the filter dropdown.
 * Could be fetched from the API but hardcoded for the demo UI.
 */
const categoryOptions = [
  'Brake System',
  'Engine Parts',
  'Suspension',
  'Electrical',
  'Transmission',
  'Exhaust',
]

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  /** Filter state — initialized from URL search params */
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    vehicleType: '',
  })

  /** Count active filters for the badge */
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  /**
   * Fetch products from the search service API with current filters.
   * Called on filter changes and search submissions.
   */
  const fetchProducts = async (query?: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (filters.category) params.set('category', filters.category)
    if (filters.brand) params.set('brand', filters.brand)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    if (filters.vehicleType) params.set('vehicleType', filters.vehicleType)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?${params}`)
      const data = await res.json()
      setProducts(data)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  /** Re-fetch when filters change */
  useEffect(() => {
    fetchProducts()
  }, [filters])

  /** Handle search bar submissions */
  const handleSearch = (query: string) => {
    const params = new URLSearchParams({ q: query })
    router.push(`/search?${params}`)
    fetchProducts(query)
  }

  /** Clear a single filter by key */
  const clearFilter = (key: keyof typeof filters) => {
    setFilters({ ...filters, [key]: '' })
  }

  /** Clear all filters */
  const clearAllFilters = () => {
    setFilters({ category: '', brand: '', minPrice: '', maxPrice: '', vehicleType: '' })
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
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="glass-input text-sm"
        >
          <option value="">All Categories</option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat} className="bg-[var(--color-surface)]">
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Brand text input */}
      <div>
        <label className="text-xs text-[var(--color-text-dim)] block mb-2">Brand</label>
        <input
          type="text"
          value={filters.brand}
          onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
          className="glass-input text-sm"
          placeholder="e.g. Bosch, NGK"
        />
      </div>

      {/* Vehicle type dropdown */}
      <div>
        <label className="text-xs text-[var(--color-text-dim)] block mb-2">Vehicle Type</label>
        <select
          value={filters.vehicleType}
          onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
          className="glass-input text-sm"
        >
          <option value="">All</option>
          <option value="car" className="bg-[var(--color-surface)]">Car</option>
          <option value="bike" className="bg-[var(--color-surface)]">Bike</option>
        </select>
      </div>

      {/* Price range — min/max inputs */}
      <div>
        <label className="text-xs text-[var(--color-text-dim)] block mb-2">Price Range</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="glass-input text-sm w-1/2"
            placeholder="Min"
          />
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="glass-input text-sm w-1/2"
            placeholder="Max"
          />
        </div>
      </div>

      {/* Clear all filters button */}
      <button
        onClick={clearAllFilters}
        className="glass-button-outline text-sm w-full"
      >
        Clear All Filters
      </button>
    </div>
  )

  return (
    <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ─── Search Bar ─── */}
      <div className="mb-8">
        <SearchBar onSearch={handleSearch} placeholder="Search by part name, brand, or vehicle..." />
      </div>

      {/* ─── Active Filter Chips ─── */}
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
              label={`$${filters.minPrice || '0'} — $${filters.maxPrice || '∞'}`}
              onRemove={() => { setFilters({ ...filters, minPrice: '', maxPrice: '' }) }}
            />
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* ─── Desktop Sidebar Filters ─── */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="card p-5 sticky top-24">
            {filterContent}
          </div>
        </aside>

        {/* ─── Mobile Filter Button ─── */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="glass-button flex items-center gap-2 px-6 py-3 shadow-lg"
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ─── Mobile Filter Drawer ─── */}
        {mobileFiltersOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="fixed top-0 right-0 bottom-0 z-[60] w-80 bg-[var(--color-surface)] border-l border-[var(--color-border)] p-6 overflow-y-auto lg:hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Filters</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.04]"
                >
                  <XMarkIcon className="w-5 h-5 text-[var(--color-text-dim)]" />
                </button>
              </div>
              {filterContent}
            </div>
          </>
        )}

        {/* ─── Product Grid ─── */}
        <div className="flex-1">
          {loading ? (
            /* Skeleton loading state — 6 placeholder cards */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-0 overflow-hidden">
                  <div className="aspect-square skeleton" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-16 skeleton" />
                    <div className="h-4 w-full skeleton" />
                    <div className="h-5 w-20 skeleton" />
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
            /* Product grid — responsive 2-3 columns */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((product: any, index: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: Math.min(index * 0.05, 0.3),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * FilterChip — small pill showing an active filter with an "×" to remove.
 * Lime-bordered to indicate it's an active filter.
 */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                     bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity" aria-label={`Remove ${label} filter`}>
        <XMarkIcon className="w-3.5 h-3.5" />
      </button>
    </span>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
