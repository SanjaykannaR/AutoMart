/**
 * Embedding worker — keeps product_embeddings in sync with the product catalog.
 *
 * Runs at startup + every 5 minutes (same cadence as search-service).
 * Idempotent: upserts every fetched product, deletes ids that no longer exist.
 */
import { embedBatch, productToText } from './embedding'
import { upsertEmbedding, deleteEmbedding, listIndexedIds, resetReadyFlag } from './pgvector'
import { getCatalog, refreshCatalog } from './catalog'

let indexing = false

export async function reindexAll(): Promise<{ indexed: number; deleted: number }> {
  if (indexing) return { indexed: 0, deleted: 0 }
  indexing = true
  try {
    await refreshCatalog()
    const products = await getCatalog(true)
    if (products.length === 0) {
      console.warn('[Assistant] Reindex skipped — catalog empty or unreachable')
      return { indexed: 0, deleted: 0 }
    }

    const docs = products.map((p) =>
      productToText({
        name: p.name,
        brand: p.brand,
        description: p.description,
        category: p.category,
        vehicleType: p.vehicleType,
        compatibleVehicles: p.compatibleVehicles,
      }),
    )

    const embeddings = await embedBatch(docs)

    for (let i = 0; i < products.length; i++) {
      try {
        await upsertEmbedding(products[i].id, embeddings[i])
      } catch (err: any) {
        console.warn(`[Assistant] Upsert failed for ${products[i].id}: ${err.message}`)
      }
    }

    // Delete embeddings for products that no longer exist
    let deleted = 0
    try {
      const indexedIds = await listIndexedIds()
      const current = new Set(products.map((p) => p.id))
      for (const id of indexedIds) {
        if (!current.has(id)) {
          await deleteEmbedding(id)
          deleted++
        }
      }
    } catch (err: any) {
      console.warn(`[Assistant] Stale-embedding cleanup skipped: ${err.message}`)
    }

    resetReadyFlag() // re-probe table readiness after writes
    console.log(`[Assistant] Reindexed ${products.length} products (deleted ${deleted})`)
    return { indexed: products.length, deleted }
  } finally {
    indexing = false
  }
}

/** Start the background indexing loop (startup + periodic). */
export function startIndexingLoop(): void {
  reindexAll().catch((err) => console.error('[Assistant] Initial reindex failed:', err))
  setInterval(() => {
    reindexAll().catch((err) => console.error('[Assistant] Periodic reindex failed:', err))
  }, 5 * 60 * 1000)
}
