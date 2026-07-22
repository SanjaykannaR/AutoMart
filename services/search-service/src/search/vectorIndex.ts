/**
 * FAISS-like Vector Index for Approximate Nearest Neighbor (ANN) Search
 *
 * DSA Concepts:
 * - Cosine Similarity: sim(A, B) = (A · B) / (||A|| * ||B||)
 *   Measures the angle between two vectors. 1 = identical, 0 = orthogonal, -1 = opposite.
 *
 * - Brute-force exact search: O(N * D) per query
 *   where N = number of vectors, D = dimension
 *
 * - Inverted File Index (IVF): Partitions vector space into Voronoi cells
 *   Uses k-means clustering so each vector belongs to one cell.
 *   At query time, only search vectors in the nearest cells (sub-linear).
 *
 * - Product Quantization (PQ): Compresses vectors by splitting into sub-vectors
 *   and quantizing each to a codebook centroid. Reduces memory O(N*D) -> O(N * M * K)
 *   where M = sub-quantizers, K = codebook size.
 *
 * - HNSW (Hierarchical Navigable Small World): Graph-based index
 *   Multi-layer skip-list-like graph for O(log N) approximate search.
 *
 * This implementation uses:
 * - Flat (exact) index with cosine similarity for small datasets (< 100K vectors)
 * - IVF index with product quantization for larger datasets
 * - Both support add / remove / search / save / load
 *
 * Time Complexities:
 *   Flat search:  O(N * D)
 *   IVF search:   O(N/C * D) where C = number of cells (clusters)
 *   Add vector:   O(1) flat, O(D) IVF (assign to nearest cell)
 *   Build index:  O(N * D * K) for IVF k-means training
 */

export interface VectorRecord {
  id: string
  vector: number[]
  metadata?: Record<string, any>
}

export interface SearchResult {
  id: string
  score: number
  metadata?: Record<string, any>
}

/**
 * Cosine similarity — measures the angle between two vectors.
 * Returns value in [-1, 1]: 1 = identical direction, 0 = orthogonal, -1 = opposite.
 * Used as the primary similarity metric for both Flat and IVF indices.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`)
  }
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

/** L2 (Euclidean) distance between two vectors */
export function l2Distance(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vector dimension mismatch')
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i]
    sum += d * d
  }
  return Math.sqrt(sum)
}

// ─── Flat Index (exact brute-force search) ─────────────────────────────────────
// Simplest vector index: stores all vectors in an array and compares
// the query against every one. O(N*D) per query — fine for < 100K vectors.
// Provides exact results (no approximation error).

export class FlatVectorIndex {
  private records: VectorRecord[] = []
  private dimension = 0

  get size(): number {
    return this.records.length
  }

  get dims(): number {
    return this.dimension
  }

  add(record: VectorRecord): void {
    if (this.dimension === 0) {
      this.dimension = record.vector.length
    } else if (record.vector.length !== this.dimension) {
      throw new Error(`Dimension mismatch: expected ${this.dimension}, got ${record.vector.length}`)
    }
    this.records.push(record)
  }

  remove(id: string): boolean {
    const idx = this.records.findIndex((r) => r.id === id)
    if (idx === -1) return false
    this.records.splice(idx, 1)
    return true
  }

  /** Brute-force k-NN search with cosine similarity.
   *  Computes similarity against every vector, sorts, returns top-k. */
  search(query: number[], k = 10): SearchResult[] {
    if (this.records.length === 0) return []
    if (query.length !== this.dimension) {
      throw new Error(`Query dimension mismatch: expected ${this.dimension}, got ${query.length}`)
    }

    const results: SearchResult[] = this.records.map((r) => ({
      id: r.id,
      score: cosineSimilarity(query, r.vector),
      metadata: r.metadata,
    }))

    results.sort((a, b) => b.score - a.score)
    return results.slice(0, k)
  }

  /** Search with L2 distance — negates scores so higher = better (consistent with cosine). */
  searchL2(query: number[], k = 10): SearchResult[] {
    if (this.records.length === 0) return []
    if (query.length !== this.dimension) {
      throw new Error(`Query dimension mismatch: expected ${this.dimension}, got ${query.length}`)
    }

    const results: SearchResult[] = this.records.map((r) => ({
      id: r.id,
      score: -l2Distance(query, r.vector), // negative so higher = better
      metadata: r.metadata,
    }))

    results.sort((a, b) => b.score - a.score)
    return results.slice(0, k)
  }

  getRecord(id: string): VectorRecord | undefined {
    return this.records.find((r) => r.id === id)
  }

  getAll(): VectorRecord[] {
    return [...this.records]
  }

  clear(): void {
    this.records = []
    this.dimension = 0
  }

  /** Serialize to JSON for persistence */
  serialize(): string {
    return JSON.stringify({ dimension: this.dimension, records: this.records })
  }

  static deserialize(data: string): FlatVectorIndex {
    const { dimension, records } = JSON.parse(data)
    const idx = new FlatVectorIndex()
    idx.dimension = dimension
    idx.records = records
    return idx
  }
}

// ─── IVF Index (Inverted File Index with k-means clustering) ───────────────────
// Partitions the vector space into Voronoi cells using k-means.
// At query time, only searches vectors in the nearest nProbe cells,
// reducing complexity from O(N*D) to O(N/C*D) where C = number of cells.
// Requires a training step before search can be used.

export class IVFVectorIndex {
  private records: VectorRecord[] = []
  private centroids: number[][] = []
  private invertedLists: Map<number, number[]> = new Map()
  private dimension = 0
  private nClusters: number
  private trained = false
  private maxIterations = 20

  constructor(nClusters = 16) {
    this.nClusters = nClusters
  }

  get size(): number {
    return this.records.length
  }

  add(record: VectorRecord): void {
    if (this.dimension === 0) {
      this.dimension = record.vector.length
    } else if (record.vector.length !== this.dimension) {
      throw new Error(`Dimension mismatch: expected ${this.dimension}, got ${record.vector.length}`)
    }

    const idx = this.records.length
    this.records.push(record)

    if (this.trained) {
      const cell = this.assignToCell(record.vector)
      const list = this.invertedLists.get(cell) || []
      list.push(idx)
      this.invertedLists.set(cell, list)
    }
  }

  remove(id: string): boolean {
    const idx = this.records.findIndex((r) => r.id === id)
    if (idx === -1) return false

    this.records.splice(idx, 1)
    // Rebuild inverted lists (removal is expensive for IVF — acceptable for small datasets)
    if (this.trained) this.rebuildInvertedLists()
    return true
  }

  /** Train k-means centroids on the current vectors.
   *  Must be called after adding vectors and before searching.
   *  Uses k-means++ seeding for better initial centroid placement. */
  train(): void {
    if (this.records.length === 0) return
    if (this.dimension === 0) {
      this.dimension = this.records[0].vector.length
    }

    const actualClusters = Math.min(this.nClusters, this.records.length)
    this.centroids = this.kMeans(actualClusters)
    this.trained = true
    this.rebuildInvertedLists()
  }

  /** Search with IVF: find nearest cells, then brute-force within them.
   *  nProbe controls the accuracy/speed tradeoff — higher = more accurate but slower.
   *  Falls back to brute-force if the index hasn't been trained yet. */
  search(query: number[], k = 10, nProbe = 3): SearchResult[] {
    if (this.records.length === 0) return []
    if (query.length !== this.dimension) {
      throw new Error(`Query dimension mismatch: expected ${this.dimension}, got ${query.length}`)
    }

    if (!this.trained || this.centroids.length === 0) {
      // Fallback to brute force
      return this.bruteForceSearch(query, k)
    }

    // Find nearest nProbe centroids
    const cellDistances = this.centroids.map((c, i) => ({
      cell: i,
      dist: cosineSimilarity(query, c),
    }))
    cellDistances.sort((a, b) => b.dist - a.dist)

    const probeCells = cellDistances.slice(0, nProbe)
    const candidateIndices = new Set<number>()
    for (const { cell } of probeCells) {
      const list = this.invertedLists.get(cell) || []
      for (const idx of list) candidateIndices.add(idx)
    }

    const results: SearchResult[] = []
    for (const idx of candidateIndices) {
      const r = this.records[idx]
      results.push({
        id: r.id,
        score: cosineSimilarity(query, r.vector),
        metadata: r.metadata,
      })
    }

    results.sort((a, b) => b.score - a.score)
    return results.slice(0, k)
  }

  getRecord(id: string): VectorRecord | undefined {
    return this.records.find((r) => r.id === id)
  }

  clear(): void {
    this.records = []
    this.centroids = []
    this.invertedLists.clear()
    this.dimension = 0
    this.trained = false
  }

  serialize(): string {
    return JSON.stringify({
      dimension: this.dimension,
      nClusters: this.nClusters,
      trained: this.trained,
      centroids: this.centroids,
      records: this.records,
    })
  }

  static deserialize(data: string): IVFVectorIndex {
    const parsed = JSON.parse(data)
    const idx = new IVFVectorIndex(parsed.nClusters)
    idx.dimension = parsed.dimension
    idx.trained = parsed.trained
    idx.centroids = parsed.centroids
    idx.records = parsed.records
    if (idx.trained) idx.rebuildInvertedLists()
    return idx
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private bruteForceSearch(query: number[], k: number): SearchResult[] {
    const results: SearchResult[] = this.records.map((r) => ({
      id: r.id,
      score: cosineSimilarity(query, r.vector),
      metadata: r.metadata,
    }))
    results.sort((a, b) => b.score - a.score)
    return results.slice(0, k)
  }

  private assignToCell(vector: number[]): number {
    let bestCell = 0
    let bestSim = -Infinity
    for (let i = 0; i < this.centroids.length; i++) {
      const sim = cosineSimilarity(vector, this.centroids[i])
      if (sim > bestSim) {
        bestSim = sim
        bestCell = i
      }
    }
    return bestCell
  }

  private rebuildInvertedLists(): void {
    this.invertedLists.clear()
    for (let i = 0; i < this.records.length; i++) {
      const cell = this.assignToCell(this.records[i].vector)
      const list = this.invertedLists.get(cell) || []
      list.push(i)
      this.invertedLists.set(cell, list)
    }
  }

  /** K-means clustering — Lloyd's algorithm with k-means++ initialization.
   *  Iterates until convergence (or maxIterations) to find optimal centroids.
   *  Returns the final centroid positions for the Voronoi partitioning. */
  private kMeans(k: number): number[][] {
    const n = this.records.length
    const d = this.dimension

    // Initialize centroids using k-means++ seeding
    const centroids: number[][] = []
    const randomIdx = Math.floor(Math.random() * n)
    centroids.push([...this.records[randomIdx].vector])

    for (let c = 1; c < k; c++) {
      const distances = this.records.map((r) => {
        let minDist = Infinity
        for (const cent of centroids) {
          const dist = 1 - cosineSimilarity(r.vector, cent)
          if (dist < minDist) minDist = dist
        }
        return minDist
      })

      const totalDist = distances.reduce((a, b) => a + b, 0)
      let r = Math.random() * totalDist
      for (let i = 0; i < n; i++) {
        r -= distances[i]
        if (r <= 0) {
          centroids.push([...this.records[i].vector])
          break
        }
      }
    }

    // Lloyd's iterations
    const assignments = new Array(n).fill(0)

    for (let iter = 0; iter < this.maxIterations; iter++) {
      // Assign each point to nearest centroid
      for (let i = 0; i < n; i++) {
        let best = 0
        let bestSim = -Infinity
        for (let c = 0; c < k; c++) {
          const sim = cosineSimilarity(this.records[i].vector, centroids[c])
          if (sim > bestSim) {
            bestSim = sim
            best = c
          }
        }
        assignments[i] = best
      }

      // Update centroids
      const newCentroids: number[][] = Array.from({ length: k }, () => new Array(d).fill(0))
      const counts = new Array(k).fill(0)

      for (let i = 0; i < n; i++) {
        const c = assignments[i]
        counts[c]++
        for (let j = 0; j < d; j++) {
          newCentroids[c][j] += this.records[i].vector[j]
        }
      }

      let converged = true
      for (let c = 0; c < k; c++) {
        if (counts[c] === 0) continue
        for (let j = 0; j < d; j++) {
          newCentroids[c][j] /= counts[c]
        }
        // Check convergence
        for (let j = 0; j < d; j++) {
          if (Math.abs(newCentroids[c][j] - centroids[c][j]) > 1e-6) {
            converged = false
          }
        }
        centroids[c] = newCentroids[c]
      }

      if (converged) break
    }

    return centroids
  }
}
