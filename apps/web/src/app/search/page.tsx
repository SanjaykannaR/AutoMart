'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchBar } from '@/components/SearchBar'
import { ProductCard } from '@/components/ProductCard'
import { GlassCard } from '@/components/GlassCard'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    vehicleType: '',
  })

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

  useEffect(() => {
    fetchProducts()
  }, [filters])

  const handleSearch = (query: string) => {
    const params = new URLSearchParams({ q: query })
    router.push(`/search?${params}`)
    fetchProducts(query)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <SearchBar onSearch={handleSearch} placeholder="Search by part name, brand, or vehicle..." />
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <GlassCard className="p-5 space-y-5">
            <h3 className="font-semibold text-sm">Filters</h3>

            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="glass-input text-sm"
              >
                <option value="">All Categories</option>
                <option value="Brake System">Brake System</option>
                <option value="Engine Parts">Engine Parts</option>
                <option value="Suspension">Suspension</option>
                <option value="Electrical">Electrical</option>
                <option value="Transmission">Transmission</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-2">Brand</label>
              <input
                type="text"
                value={filters.brand}
                onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                className="glass-input text-sm"
                placeholder="e.g. Bosch, NGK"
              />
            </div>

            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-2">Vehicle Type</label>
              <select
                value={filters.vehicleType}
                onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
                className="glass-input text-sm"
              >
                <option value="">All</option>
                <option value="car">Car</option>
                <option value="bike">Bike</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-2">Price Range</label>
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

            <button
              onClick={() => setFilters({ category: '', brand: '', minPrice: '', maxPrice: '', vehicleType: '' })}
              className="glass-button-outline text-sm w-full"
            >
              Clear Filters
            </button>
          </GlassCard>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-card p-0 overflow-hidden">
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
            <div className="text-center py-20">
              <p className="text-[var(--color-text-muted)]">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
