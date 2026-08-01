/**
 * Text embedding using a local ONNX sentence-transformer model.
 *
 * HOW IT WORKS:
 * 1. `Xenova/all-MiniLM-L6-v2` (~25MB) is loaded lazily via @xenova/transformers
 *    (ONNX Runtime Web — no native dependencies, same pattern as CLIP in search-service).
 * 2. `embedText()` produces a 384-dim L2-normalized vector.
 * 3. If the model cannot be loaded, a deterministic sinusoidal fallback keeps
 *    the pipeline alive (lower quality, but consistent) — the service never crashes.
 */

const MODEL = 'Xenova/all-MiniLM-L6-v2'
export const EMBEDDING_DIM = 384

// Module-level state — initialized once, shared across all requests
let extractor: any = null
let modelReady = false

/**
 * Load the MiniLM text encoder once. Graceful fallback if download/init fails.
 */
export async function initEmbeddingModel(): Promise<boolean> {
  try {
    // Dynamic import — only load if available (mirrors search-service CLIP pattern)
    const transformers = await import('@xenova/transformers')
    const { pipeline, env } = transformers
    env.allowLocalModels = false

    console.log('[Assistant] Loading text embedding model (all-MiniLM-L6-v2)...')
    extractor = await pipeline('feature-extraction', MODEL)
    modelReady = true
    console.log('[Assistant] Text embedding model ready (384-dim)')
    return true
  } catch (err: any) {
    console.warn('[Assistant] Embedding model unavailable, using deterministic fallback:', err.message)
    modelReady = false
    return false
  }
}

/**
 * Embed a single text string → 384-dim normalized vector.
 * Falls back to a deterministic sinusoidal hash embedding if the model is down,
 * so semantic search degrades gracefully instead of crashing.
 */
export async function embedText(text: string): Promise<number[]> {
  if (modelReady && extractor) {
    try {
      const output = await extractor(text.slice(0, 2000), { pooling: 'mean', normalize: true })
      const vec = Array.from(output.data) as number[]
      if (vec.length === EMBEDDING_DIM) return vec
      return padOrTruncate(vec)
    } catch (err: any) {
      console.warn('[Assistant] Embedding failed, using fallback:', err.message)
    }
  }
  return deterministicEmbedding(text)
}

/**
 * Embed many texts in one batch (used by the indexing worker).
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  // Batch through the model per-item is fine for demo-scale catalogs;
  // model `feature-extraction` pipeline accepts arrays but per-item keeps it simple.
  const out: number[][] = []
  for (const t of texts) out.push(await embedText(t))
  return out
}

/** Build the searchable text document for a product (same fields TF-IDF uses). */
export function productToText(p: {
  name: string
  brand: string
  description: string
  category?: string
  vehicleType?: string
  compatibleVehicles?: string[]
}): string {
  return [
    p.name,
    p.brand,
    p.description,
    p.category || '',
    p.vehicleType || '',
    ...(p.compatibleVehicles || []),
  ].filter(Boolean).join(' ')
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function padOrTruncate(vec: number[]): number[] {
  const result = new Array(EMBEDDING_DIM).fill(0)
  for (let i = 0; i < Math.min(vec.length, EMBEDDING_DIM); i++) result[i] = vec[i]
  return normalize(result)
}

/** Deterministic sinusoidal fallback embedding — stable across calls for the same text. */
function deterministicEmbedding(text: string): number[] {
  const embedding = new Array(EMBEDDING_DIM).fill(0)
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    // Mix char codes + position into sine components
    let sum = 0
    const step = Math.max(1, Math.floor(text.length / 24))
    for (let j = 0; j < text.length; j += step) {
      sum += (text.charCodeAt(j) || 0) * Math.sin(i * 0.01 + j * 0.05 + hash * 0.001)
    }
    embedding[i] = sum / Math.max(1, text.length)
  }
  return normalize(embedding)
}

function normalize(v: number[]): number[] {
  let norm = 0
  for (const x of v) norm += x * x
  norm = Math.sqrt(norm) || 1
  return v.map((x) => x / norm)
}
