/**
 * Text search using Fuse.js (fuzzy matching) + TF-IDF (discriminative scoring)
 *
 * HOW IT WORKS:
 * 1. Products are fetched from product-service and indexed in memory
 * 2. Dual scoring pipeline:
 *    a. Fuse.js: Levenshtein-based fuzzy matching — handles typos and misspellings
 *    b. TF-IDF: Term frequency weighting — boosts rare, discriminative terms
 * 3. Final score: weighted combination of both signals
 *    score = 0.5 * fuseScore + 0.5 * tfidfScore
 * 4. Trie provides instant prefix-based autocomplete (O(k) lookup)
 *
 * DSA: Levenshtein distance (Bitap), TF-IDF, Trie, Tokenization, Cosine similarity
 */

import Fuse from 'fuse.js'
import { Trie } from './trie'
import { TfidfEngine } from './tfidf'
import { initClipModel, indexProductImage, trainIndex, resetIndex } from './imageSearch'
import { soundex, stemToken, expandPhonetically } from './voiceSearch'

export interface Product {
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

// In-memory search indexes — rebuilt from product-service every 5 minutes.
// All three structures serve different purposes:
// - Fuse.js: fuzzy matching (handles typos via Levenshtein distance)
// - TF-IDF: discriminative scoring (boosts rare, relevant terms)
// - Trie: instant prefix autocomplete (O(k) lookup by prefix length)
let fuse: Fuse<Product> | null = null
let productCache: Product[] = []
let trie: Trie | null = null
let tfidf: TfidfEngine | null = null

// Soundex code → shortest known catalog word with that sound.
// Used as a LAST-RESORT fallback when a query returns zero results:
// "bracking bad" → stem "brack" → code B620 → swap in "brake".
let phoneticVocab = new Map<string, string[]>()

/**
 * Initialize all search indexes from the product-service catalog.
 * Called at startup and every 5 minutes to pick up new/updated products.
 * Builds Fuse.js, TF-IDF, Trie, and optionally CLIP image embeddings.
 */
export async function initSearchEngine() {
  try {
    const port = process.env.PRODUCT_SERVICE_PORT || 3002
    // Try, in order: explicit URL → Docker DNS (compose) → localhost (local dev).
    const urls = [
      process.env.PRODUCT_SERVICE_URL,
      `http://product-service:${port}/products`,
      `http://localhost:${port}/products`,
    ].filter(Boolean) as string[]
    let res: Response | null = null
    for (const url of urls) {
      try {
        res = await fetch(url)
        if (res.ok) break
      } catch {
        /* try next candidate */
      }
      res = null
    }
    if (!res) throw new Error('product-service unreachable (docker DNS + localhost both failed)')
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

    // ─── Fuse.js index (fuzzy matching) ─────────────────────────────────────
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

    // ─── TF-IDF index (discriminative scoring) ──────────────────────────────
    tfidf = new TfidfEngine()
    for (const p of productCache) {
      const text = [
        p.name,
        p.brand,
        p.description,
        p.category,
        p.vehicleType,
        ...p.compatibleVehicles,
      ].join(' ')

      // Boost exact brand and category matches
      const boost: Record<string, number> = {}
      boost[p.brand.toLowerCase()] = 1.5
      boost[p.category.toLowerCase()] = 1.3

      tfidf.addDocument({ id: p.id, text, boost })
    }

    // ─── Trie for autocomplete ───────────────────────────────────────────────
    trie = new Trie()
    for (const p of productCache) {
      trie.insertPhrase(p.name, 1)
      trie.insert(p.brand.toLowerCase(), 1)
    }

    // ─── Phonetic vocabulary (Soundex) for zero-result fallback ─────────────
    phoneticVocab = new Map()
    for (const p of productCache) {
      const text = `${p.name} ${p.brand} ${p.category} ${p.vehicleType} ${p.compatibleVehicles.join(' ')}`.toLowerCase()
      for (const rawTok of text.split(/[^a-z]+/)) {
        if (rawTok.length < 3) continue
        const tok = stemToken(rawTok)
        const code = soundex(tok)
        if (!code) continue
        const list = phoneticVocab.get(code)
        if (!list) {
          phoneticVocab.set(code, [tok])
        } else if (!list.includes(tok)) {
          list.push(tok)
          list.sort((a, b) => a.length - b.length) // shortest first = best canonical
        }
      }
    }

    // ─── CLIP model + image embeddings ───────────────────────────────────────
    const clipReady = await initClipModel()
    if (clipReady) {
      resetIndex()
      let indexed = 0
      for (const p of productCache) {
        if (p.imageUrl) {
          await indexProductImage(p.id, p.imageUrl, { name: p.name, brand: p.brand })
          indexed++
        }
      }
      if (indexed > 0) {
        trainIndex()
        console.log(`[Search] Indexed ${indexed} product images for CLIP search`)
      }
    }

    console.log(`[Search] Indexed ${productCache.length} products (Fuse.js + TF-IDF + Trie)`)
  } catch (err) {
    console.error('[Search] Failed to initialize search engine:', err)
  }
}

/**
 * Score a query through Fuse.js + TF-IDF and return ranked products.
 * Shared by fuzzySearch and its phonetic-retry fallback.
 */
function scoreQuery(query: string): Product[] {
  if (!fuse) return []

  // ─── Fuse.js results with scores ──────────────────────────────────────
  const fuseResults = fuse.search(query)
  const fuseScoreMap = new Map<string, number>()

  for (const r of fuseResults) {
    // Normalize Fuse score: 0 = best match, 1 = worst → invert to 0-1 where 1 = best
    fuseScoreMap.set(r.item.id, 1 - (r.score || 0))
  }

  // ─── TF-IDF results with scores ───────────────────────────────────────
  const tfidfScoreMap = new Map<string, number>()
  if (tfidf) {
    const tfidfResults = tfidf.search(query)
    const maxTfidfScore = tfidfResults.length > 0 ? tfidfResults[0].score : 1

    for (const r of tfidfResults) {
      // Normalize to 0-1
      tfidfScoreMap.set(r.id, maxTfidfScore > 0 ? r.score / maxTfidfScore : 0)
    }
  }

  // ─── Combine scores ────────────────────────────────────────────────────
  // Product must appear in at least one ranking to be included
  const allIds = new Set([...fuseScoreMap.keys(), ...tfidfScoreMap.keys()])
  const scored: Array<{ product: Product; score: number }> = []

  for (const id of allIds) {
    const product = productCache.find((p) => p.id === id)
    if (!product) continue

    const fuseScore = fuseScoreMap.get(id) || 0
    const tfidfScore = tfidfScoreMap.get(id) || 0

    // Hybrid score: 50% fuzzy + 50% TF-IDF
    const score = 0.5 * fuseScore + 0.5 * tfidfScore

    scored.push({ product, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.map((s) => s.product)
}

/**
 * Combined fuzzy + TF-IDF search. Runs the query through both pipelines,
 * normalizes scores to [0, 1], and combines them with equal weight (50/50).
 * If zero results, retries once with a Soundex-phonetic expansion of the
 * query (catches speech-to-text homophones like "bracking" → "brake").
 * Post-filters by category, brand, price range, and vehicle type.
 */
export function fuzzySearch(opts: SearchOptions): { results: Product[]; query: string } {
  if (!fuse) return { results: [], query: opts.query || '' }

  let results: Product[]
  let effectiveQuery = opts.query || ''

  if (opts.query) {
    results = scoreQuery(opts.query)

    // ─── Phonetic fallback: zero results + unknown-word query → retry with
    //     Soundex-matched catalog words. "bracking bad" → "brake pad". ─────
    if (results.length === 0 && phoneticVocab.size > 0) {
      const alt = expandPhonetically(opts.query, phoneticVocab)
      if (alt && alt !== opts.query) {
        const phoneticResults = scoreQuery(alt)
        if (phoneticResults.length > 0) {
          results = phoneticResults
          effectiveQuery = alt // report the query that actually matched
        }
      }
    }
  } else {
    results = [...productCache]
  }

  // ─── Apply filters ────────────────────────────────────────────────────────
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

  return { results: results.slice(0, opts.limit || 50), query: effectiveQuery }
}

/**
 * Autocomplete suggestions using the Trie for prefix matching.
 * Falls back to Fuse.js fuzzy search if no Trie results (handles mid-word queries).
 * Returns unique product names, deduplicated via Set.
 */
export function autoComplete(query: string, limit = 8): string[] {
  if (!query) return []

  // Use Trie for fast prefix-based autocomplete
  if (trie) {
    const trieResults = trie.autocomplete(query, limit)
    if (trieResults.length > 0) return trieResults
  }

  // Fallback to Fuse.js fuzzy search
  if (!fuse) return []
  const results = fuse.search(query, { limit })
  return [...new Set(results.map((r) => r.item.name))]
}
