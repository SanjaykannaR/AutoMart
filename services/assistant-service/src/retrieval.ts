/**
 * Hybrid retrieval: lexical (search-service Fuse.js + TF-IDF) ⊕ semantic
 * (MiniLM → pgvector kNN), merged with Reciprocal Rank Fusion (RRF).
 *
 * RRF: score(d) = Σ 1/(k + rank)  — a classic rank-only merge that needs no
 * score calibration between heterogeneous systems.
 *
 * Degrades gracefully:
 *   - search-service down  → semantic-only
 *   - pgvector/table down  → lexical-only
 *   - both down            → empty (never throws)
 */
import { embedText } from './embedding'
import { semanticSearch as pgvectorSemanticSearch } from './pgvector'
import { getCatalog, getProductsByIds, type CatalogProduct } from './catalog'

const RRF_K = 60
const TOP_N = 6

/** Best-effort parse of a price ceiling from free text, e.g. "under ₹3000" / "below 2500". */
function parseMaxPrice(message: string): number | undefined {
  const m = message.match(/(?:under|below|less than|within|max|budget)\s*(?:₹|rs\.?|inr|usd|\$)?\s*([\d,]+(?:\.\d+)?)/i)
  if (!m) return undefined
  const v = parseFloat(m[1].replace(/,/g, ''))
  return Number.isFinite(v) ? v : undefined
}

/** Extract a vehicle-type hint if the message mentions car/bike. */
function parseVehicleType(message: string): string | undefined {
  if (/(\bbike\b|\bmotorcycle\b|\bscooter\b|\b2-?wheeler\b)/i.test(message)) return 'bike'
  if (/(\bcar\b|\b4-?wheeler\b|\bsedan\b|\bsuv\b|\bhatchback\b)/i.test(message)) return 'car'
  return undefined
}

/** Lexical retrieval via search-service (/search supports q + minPrice/maxPrice + vehicleType). */
async function lexicalSearch(message: string, maxPrice?: number, vehicleType?: string): Promise<CatalogProduct[]> {
  const base = process.env.SEARCH_SERVICE_URL || `http://search-service:${process.env.SEARCH_SERVICE_PORT || 3003}`
  const params = new URLSearchParams({ q: message, limit: '50' })
  if (maxPrice !== undefined) params.set('maxPrice', String(maxPrice))
  if (vehicleType) params.set('vehicleType', vehicleType)

  try {
    const res = await fetch(`${base}/search?${params}`, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    // search-service returns products (no per-item score) — rank = array position
    const byId = new Map(data.map((p: any) => [String(p.id), p]))
    const all = await getCatalog()
    return data.map((p: any) => String(p.id))
      .map((id) => byId.get(id))
      .filter((p): p is any => !!p)
      .map((p: any) => all.find((c) => c.id === p.id))
      .filter((p): p is CatalogProduct => !!p)
  } catch (err: any) {
    console.warn(`[Assistant] Lexical search unavailable: ${err.message}`)
    return []
  }
}

/** Semantic retrieval via pgvector kNN, enriched + filtered locally. */
async function semanticSearch(message: string, maxPrice?: number, vehicleType?: string): Promise<CatalogProduct[]> {
  try {
    const queryEmbedding = await embedText(message)
    const hits = await pgvectorSemanticSearch(queryEmbedding, 50)
    if (hits.length === 0) return []

    const products = getProductsByIds(hits.map((h) => h.productId))
    return products
      .filter((p) => (maxPrice === undefined || p.price <= maxPrice))
      .filter((p) => (vehicleType === undefined || p.vehicleType === vehicleType || p.vehicleType === 'both'))
  } catch (err: any) {
    console.warn(`[Assistant] Semantic search unavailable: ${err.message}`)
    return []
  }
}

/** Token-overlap boost — rewards products whose name/brand/category literally match query words. */
function tokenOverlapBoost(p: CatalogProduct, tokens: string[]): number {
  let hits = 0
  const haystack = `${p.name} ${p.brand} ${p.category}`.toLowerCase()
  for (const t of tokens) {
    if (t.length >= 3 && haystack.includes(t)) hits++
  }
  return hits > 0 ? hits * 0.05 : 0
}

export interface ChatResult {
  products: CatalogProduct[]
  usedSemantic: boolean
  usedLexical: boolean
}

/**
 * Hybrid search: run both retrievers, RRF-merge by rank, apply a small
 * token-overlap boost, return top-N enriched products.
 */
export async function hybridSearch(message: string): Promise<ChatResult> {
  const maxPrice = parseMaxPrice(message)
  const vehicleType = parseVehicleType(message)

  const [lexical, semantic] = await Promise.all([
    lexicalSearch(message, maxPrice, vehicleType),
    semanticSearch(message, maxPrice, vehicleType),
  ])

  const tokens = message.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2)

  // RRF over ranked lists (rank = position, 1-based)
  const rrf = new Map<string, number>()
  lexical.forEach((p, i) => rrf.set(p.id, (rrf.get(p.id) || 0) + 1 / (RRF_K + i + 1)))
  semantic.forEach((p, i) => rrf.set(p.id, (rrf.get(p.id) || 0) + 1 / (RRF_K + i + 1)))

  const ranked = [...rrf.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N * 2) // keep a buffer for the boost pass

  const enriched = getProductsByIds(ranked.map(([id]) => id))
    .map((p) => ({ p, score: (rrf.get(p.id) || 0) + tokenOverlapBoost(p, tokens) }))
    .sort((a, b) => b.score - a.score)

  return {
    products: enriched.slice(0, TOP_N).map((e) => e.p),
    usedSemantic: semantic.length > 0,
    usedLexical: lexical.length > 0,
  }
}
