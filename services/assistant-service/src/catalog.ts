/**
 * Product catalog cache — mirrors search-service's re-index approach.
 *
 * Fetches the full product list from product-service (svc()-style URL resolution:
 * prefer *_SERVICE_URL env var, fall back to Docker DNS), keeps an in-memory copy
 * with a 5-minute TTL, and refreshes on demand. Used by both the embedding worker
 * and the hybrid retriever (avoids N network calls per chat message).
 */

export interface CatalogProduct {
  id: string
  name: string
  slug: string
  description: string
  brand: string
  price: number
  imageUrl: string | null
  category: string
  categorySlug: string
  vehicleType: string
  compatibleVehicles: string[]
  stock: number
  updatedAt: string
}

let cache: CatalogProduct[] = []
let cacheTime = 0
const TTL_MS = 5 * 60 * 1000

/** svc()-style URL: prefer env var, fall back to Docker DNS (mirrors api-gateway). */
function productServiceUrl(): string {
  if (process.env.PRODUCT_SERVICE_URL) return process.env.PRODUCT_SERVICE_URL
  return `http://product-service:${process.env.PRODUCT_SERVICE_PORT || 3002}`
}

/** Parse the product-service payload into our catalog shape. */
function parseProduct(p: any): CatalogProduct {
  const cat = p.category
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    brand: p.brand,
    price: Number(p.price),
    imageUrl: p.imageUrl || null,
    category: typeof cat === 'string' ? cat : (cat?.name || ''),
    categorySlug: typeof cat === 'string' ? cat : (cat?.slug || ''),
    vehicleType: p.vehicleType || 'both',
    compatibleVehicles: Array.isArray(p.compatibleVehicles) ? p.compatibleVehicles : [],
    stock: Number(p.stock ?? 0),
    updatedAt: p.updatedAt || '',
  }
}

/** Fetch + normalize the product catalog. Returns [] on failure (never throws). */
export async function refreshCatalog(): Promise<CatalogProduct[]> {
  try {
    const res = await fetch(`${productServiceUrl()}/products`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`product-service returned ${res.status}`)
    const data = await res.json()
    cache = Array.isArray(data) ? data.map(parseProduct) : []
    cacheTime = Date.now()
    console.log(`[Assistant] Catalog refreshed: ${cache.length} products`)
  } catch (err: any) {
    console.warn(`[Assistant] Catalog refresh failed: ${err.message}`)
  }
  return cache
}

/** Get the catalog, refreshing if the TTL expired or cache is empty. */
export async function getCatalog(force = false): Promise<CatalogProduct[]> {
  if (force || cache.length === 0 || Date.now() - cacheTime > TTL_MS) {
    await refreshCatalog()
  }
  return cache
}

/** Get products by ids, preserving the given order. */
export function getProductsByIds(ids: string[]): CatalogProduct[] {
  const byId = new Map(cache.map((p) => [p.id, p]))
  return ids.map((id) => byId.get(id)).filter((p): p is CatalogProduct => !!p)
}

export function catalogSize(): number {
  return cache.length
}
