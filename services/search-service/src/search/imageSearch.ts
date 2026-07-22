/**
 * Image search using CLIP embeddings + FAISS-like vector index
 *
 * HOW IT WORKS:
 * 1. On startup, CLIP model (openai/clip-vit-base-patch32) is loaded via ONNX Runtime
 * 2. For each product with an image, CLIP generates a 512-dim embedding
 * 3. Embeddings are stored in an IVF vector index for fast ANN search
 * 4. When user uploads a search image:
 *    a. CLIP generates a 512-dim embedding for the query image
 *    b. IVF index finds k-nearest neighbors via cosine similarity
 *    c. Results are ranked by similarity score
 *
 * DSA: k-NN (k-Nearest Neighbors), Cosine Similarity, IVF (Inverted File Index),
 *      Product Quantization, K-means clustering
 *
 * CLIP via @xenova/transformers:
 * - Uses ONNX Runtime Web (WASM) — no native dependencies
 * - Model: openai/clip-vit-base-patch32 (350MB, 512-dim embeddings)
 * - Processes images at 224x224 resolution
 * - Embeddings capture semantic meaning (e.g., "red brake caliper" matches image of red caliper)
 */

import { IVFVectorIndex, type SearchResult } from './vectorIndex'

export interface ImageSearchResult {
  productId: string
  similarity: number
  metadata?: Record<string, any>
}

// Module-level state — initialized once at startup, shared across all requests
let clipModel: any = null       // CLIP pipeline from @xenova/transformers
const clipProcessor: any = null   // Not used directly (pipeline handles preprocessing)
let imageIndex: IVFVectorIndex = new IVFVectorIndex(8) // 8 clusters — good for small product catalogs
const embeddingDimension = 512    // CLIP ViT-B/32 outputs 512-dim vectors
let modelReady = false

/**
 * Initialize CLIP model. Called once at startup.
 * Falls back gracefully if model download fails.
 */
export async function initClipModel(): Promise<boolean> {
  try {
    // Dynamic import — only load if available
    const transformers = await import('@xenova/transformers')
    const { pipeline, env } = transformers

    // Disable local model cache warnings
    env.allowLocalModels = false

    console.log('[Image Search] Loading CLIP model (this may take a moment on first run)...')

    // Load CLIP model for image feature extraction
    clipModel = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32')

    modelReady = true
    console.log('[Image Search] CLIP model loaded successfully')
    return true
  } catch (err: any) {
    console.warn('[Image Search] CLIP model unavailable, using mock embeddings:', err.message)
    modelReady = false
    return false
  }
}

/**
 * Generate CLIP embedding for an image buffer.
 * Converts the buffer to a base64 data URI, feeds it through CLIP,
 * and returns a normalized 512-dim vector. Falls back to perceptual
 * hashing if CLIP processing fails.
 */
export async function generateImageEmbedding(imageBuffer: Buffer): Promise<number[]> {
  if (modelReady && clipModel) {
    try {
      // Convert buffer to base64 data URI for CLIP processor
      const base64 = imageBuffer.toString('base64')
      const mimeType = detectMimeType(imageBuffer)
      const dataUri = `data:${mimeType};base64,${base64}`

      // CLIP processes image -> 512-dim embedding
      const output = await clipModel(dataUri, { pooling: 'mean', normalize: true })
      const embedding = Array.from(output.data) as number[]

      if (embedding.length === embeddingDimension) {
        return embedding
      }

      // If dimension mismatch, pad or truncate
      const result = new Array(embeddingDimension).fill(0)
      for (let i = 0; i < Math.min(embedding.length, embeddingDimension); i++) {
        result[i] = embedding[i]
      }
      return result
    } catch (err: any) {
      console.warn('[Image Search] CLIP embedding failed, falling back to perceptual hash:', err.message)
    }
  }

  // Fallback: deterministic perceptual hash-based embedding
  return generatePerceptualEmbedding(imageBuffer)
}

/**
 * Deterministic perceptual hash fallback for when CLIP is unavailable.
 * Creates a 512-dim vector from image pixel statistics using sinusoidal
 * sampling. Not semantically meaningful like CLIP, but consistent and
 * fast — useful for development and testing without GPU/CPU-intensive model.
 */
function generatePerceptualEmbedding(imageBuffer: Buffer): number[] {
  const embedding = new Array(embeddingDimension).fill(0)

  // Use buffer content to create deterministic features
  const step = Math.max(1, Math.floor(imageBuffer.length / embeddingDimension))
  for (let i = 0; i < embeddingDimension; i++) {
    const offset = i * step
    let sum = 0
    for (let j = 0; j < Math.min(16, imageBuffer.length - offset); j++) {
      sum += (imageBuffer[offset + j] || 0) * Math.sin(i * 0.1 + j * 0.05)
    }
    embedding[i] = sum / 256
  }

  // L2 normalize
  let norm = 0
  for (let i = 0; i < embeddingDimension; i++) {
    norm += embedding[i] * embedding[i]
  }
  norm = Math.sqrt(norm) || 1
  for (let i = 0; i < embeddingDimension; i++) {
    embedding[i] /= norm
  }

  return embedding
}

/** Detect MIME type from file magic bytes — needed to create a proper
 *  data URI for the CLIP processor (it expects a data: URI, not raw bytes). */
function detectMimeType(buffer: Buffer): string {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'image/jpeg'
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png'
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'image/webp'
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif'
  return 'image/jpeg'
}

/**
 * Index a product's image for search.
 * Downloads the image, generates embedding, and adds to the vector index.
 */
export async function indexProductImage(
  productId: string,
  imageUrl: string,
  metadata?: Record<string, any>,
): Promise<void> {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return

    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const embedding = await generateImageEmbedding(buffer)

    imageIndex.add({ id: productId, vector: embedding, metadata })
  } catch (err: any) {
    console.warn(`[Image Search] Failed to index image for product ${productId}: ${err.message}`)
  }
}

/**
 * Add a pre-computed embedding directly to the index.
 */
export function addEmbedding(
  productId: string,
  embedding: number[],
  metadata?: Record<string, any>,
): void {
  imageIndex.add({ id: productId, vector: embedding, metadata })
}

/**
 * Remove a product from the image index.
 */
export function removeEmbedding(productId: string): boolean {
  return imageIndex.remove(productId)
}

/**
 * Build/train the IVF index after adding all vectors.
 * Must be called after bulk indexing and before search.
 */
export function trainIndex(): void {
  if (imageIndex.size > 0) {
    imageIndex.train()
    console.log(`[Image Search] Trained IVF index with ${imageIndex.size} vectors`)
  }
}

/**
 * Search for similar images using cosine similarity.
 * Generates a CLIP embedding for the query image, then searches the
 * IVF vector index for the k-nearest neighbors. Filters out results
 * with similarity below 0.1 to avoid returning irrelevant matches.
 */
export async function searchByImage(
  imageBuffer: Buffer,
  topK = 10,
): Promise<ImageSearchResult[]> {
  const queryEmbedding = await generateImageEmbedding(imageBuffer)

  console.log(`[Image Search] Query embedding dim=${queryEmbedding.length}, index size=${imageIndex.size}`)

  if (imageIndex.size === 0) {
    return []
  }

  // Use nProbe=3 for IVF search (search 3 nearest cells)
  const results: SearchResult[] = imageIndex.search(queryEmbedding, topK, 3)

  return results
    .filter((r) => r.score > 0.1) // minimum similarity threshold
    .map((r) => ({
      productId: r.id,
      similarity: Math.round(r.score * 1000) / 1000,
      metadata: r.metadata,
    }))
}

/**
 * Get index statistics for monitoring.
 */
export function getIndexStats(): {
  totalVectors: number
  dimension: number
  modelReady: boolean
  indexType: string
} {
  return {
    totalVectors: imageIndex.size,
    dimension: embeddingDimension,
    modelReady,
    indexType: 'IVF-8 (cosine)',
  }
}

/**
 * Rebuild index from scratch.
 */
export function resetIndex(): void {
  imageIndex = new IVFVectorIndex(8)
  console.log('[Image Search] Index reset')
}
