/**
 * pgvector client — persistence + ANN search for product embeddings.
 *
 * Uses the SAME Supabase PostgreSQL connection string as the other services
 * (DATABASE_URL). The `product_embeddings` table is created by running
 * `supabase/migration-product-embeddings.sql` in the Supabase SQL Editor.
 *
 * If the vector extension/table is missing, every function degrades to a
 * no-op/empty result — the assistant-service continues in "lexical-only" mode.
 */
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 5000,
})

export interface SemanticHit {
  productId: string
  score: number
}

let vectorTableReady: boolean | null = null

/**
 * Probe whether the vector table exists (cached). Keeps the service alive when
 * the migration hasn't been run yet.
 */
async function ensureReady(): Promise<boolean> {
  if (vectorTableReady !== null) return vectorTableReady
  try {
    await pool.query(`SELECT 1 FROM product_embeddings LIMIT 1`)
    vectorTableReady = true
  } catch (err: any) {
    if (err?.code === '42P01' || err?.code === 'UndefinedTable') {
      console.warn('[Assistant] product_embeddings table missing — run supabase/migration-product-embeddings.sql. Semantic search disabled.')
    } else {
      console.warn('[Assistant] pgvector unavailable:', err.message)
    }
    vectorTableReady = false
  }
  return vectorTableReady
}

/** Reset the readiness cache (used after reindex). */
export function resetReadyFlag(): void {
  vectorTableReady = null
}

/** Serialize a JS number[] to a pgvector literal. */
function toVectorLiteral(v: number[]): string {
  return '[' + v.join(',') + ']'
}

export async function upsertEmbedding(productId: string, embedding: number[]): Promise<void> {
  if (!(await ensureReady())) return
  await pool.query(
    `INSERT INTO product_embeddings (product_id, model, embedding, updated_at)
     VALUES ($1, 'all-MiniLM-L6-v2', $2::vector, now())
     ON CONFLICT (product_id)
     DO UPDATE SET embedding = EXCLUDED.embedding, model = EXCLUDED.model, updated_at = now()`,
    [productId, toVectorLiteral(embedding)],
  )
}

export async function deleteEmbedding(productId: string): Promise<void> {
  if (!(await ensureReady())) return
  await pool.query(`DELETE FROM product_embeddings WHERE product_id = $1`, [productId])
}

/** Cosine-similarity kNN search. Returns hits ordered best-first. */
export async function semanticSearch(
  queryEmbedding: number[],
  k = 50,
): Promise<SemanticHit[]> {
  if (!(await ensureReady())) return []
  const { rows } = await pool.query(
    `SELECT product_id, 1 - (embedding <=> $1::vector) AS score
     FROM product_embeddings
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [toVectorLiteral(queryEmbedding), k],
  )
  return rows.map((r: any) => ({ productId: r.product_id, score: Number(r.score) }))
}

export async function countEmbeddings(): Promise<number> {
  if (!(await ensureReady())) return 0
  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM product_embeddings`)
  return rows[0]?.n ?? 0
}

export async function listIndexedIds(): Promise<string[]> {
  if (!(await ensureReady())) return []
  const { rows } = await pool.query(`SELECT product_id FROM product_embeddings`)
  return rows.map((r: any) => r.product_id)
}
