/**
 * Text search using Fuse.js (fuzzy matching)
 *
 * HOW IT WORKS:
 * 1. Products are fetched from product-service and indexed in memory
 * 2. Fuse.js uses a weighted scoring system:
 *    - Bitap algorithm (modified Levenshtein distance) for character-level matching
 *    - Tokenization splits query into words
 *    - Each word is matched against indexed fields (name, brand, description)
 *    - Results are scored by: exact matches > prefix matches > fuzzy matches
 * 3. Typo tolerance: "brak" still matches "brake" via edit distance threshold
 *
 * DSA: Levenshtein distance, Bitap algorithm, Tokenization, TF (term frequency)
 */

import Fuse from 'fuse.js'

interface Product {
  id: string
  name: string
  description: string
  brand: string
  category: string
  categorySlug: string
  price: number
  vehicleType: string
  compatibleVehicles: string[]
  imageUrl: string | null
}

interface SearchOptions {
  query: string
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  vehicleType?: string
  limit?: number
}

let fuse: Fuse<Product> | null = null
let productCache: Product[] = []

export async function initSearchEngine() {
  try {
    const res = await fetch(`http://product-service:${process.env.PRODUCT_SERVICE_PORT || 3002}/products`)
    const products = await res.json() as any[]
    productCache = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      brand: p.brand,
      category: p.category.name,
      categorySlug: p.category.slug,
      price: p.price,
      vehicleType: p.vehicleType,
      compatibleVehicles: p.compatibleVehicles,
      imageUrl: p.imageUrl,
    }))

    fuse = new Fuse(productCache, {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'brand', weight: 0.3 },
        { name: 'description', weight: 0.2 },
        { name: 'category', weight: 0.1 },
      ],
      threshold: 0.4,
      distance: 100,
      includeScore: true,
      minMatchCharLength: 2,
    })

    console.log(`[Search] Indexed ${productCache.length} products`)
  } catch (err) {
    console.error('[Search] Failed to initialize search engine:', err)
  }
}

export function fuzzySearch(opts: SearchOptions): Product[] {
  if (!fuse) return []

  let results = opts.query
    ? fuse.search(opts.query).map((r) => r.item)
    : [...productCache]

  if (opts.category) {
    results = results.filter((p) => p.categorySlug === opts.category || p.category === opts.category)
  }
  if (opts.brand) {
    results = results.filter((p) => p.brand.toLowerCase().includes(opts.brand!.toLowerCase()))
  }
  if (opts.minPrice !== undefined) {
    results = results.filter((p) => p.price >= opts.minPrice!)
  }
  if (opts.maxPrice !== undefined) {
    results = results.filter((p) => p.price <= opts.maxPrice!)
  }
  if (opts.vehicleType) {
    results = results.filter((p) => p.vehicleType === opts.vehicleType || p.vehicleType === 'both')
  }

  return results.slice(0, opts.limit || 50)
}

export function autoComplete(query: string, limit = 8): string[] {
  if (!query || !fuse) return []
  const results = fuse.search(query, { limit })
  return [...new Set(results.map((r) => r.item.name))]
}
