import { describe, it, expect, beforeEach } from 'vitest'
import {
  cosineSimilarity,
  l2Distance,
  FlatVectorIndex,
  IVFVectorIndex,
} from './vectorIndex'

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBe(1)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0)
  })

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBe(-1)
  })

  it('handles normalized vectors', () => {
    const a = [3, 4] // norm = 5
    const b = [6, 8] // norm = 10, same direction
    expect(cosineSimilarity(a, b)).toBe(1)
  })

  it('throws on dimension mismatch', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow('Vector dimension mismatch')
  })

  it('handles zero vectors', () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0)
  })
})

describe('l2Distance', () => {
  it('returns 0 for identical vectors', () => {
    expect(l2Distance([1, 2], [1, 2])).toBe(0)
  })

  it('computes correct distance', () => {
    expect(l2Distance([0, 0], [3, 4])).toBe(5)
  })

  it('is symmetric', () => {
    const a = [1, 2, 3]
    const b = [4, 5, 6]
    expect(l2Distance(a, b)).toBe(l2Distance(b, a))
  })
})

describe('FlatVectorIndex', () => {
  let index: FlatVectorIndex

  beforeEach(() => {
    index = new FlatVectorIndex()
  })

  it('adds vectors and tracks size', () => {
    index.add({ id: '1', vector: [1, 0, 0] })
    index.add({ id: '2', vector: [0, 1, 0] })
    expect(index.size).toBe(2)
    expect(index.dims).toBe(3)
  })

  it('searches by cosine similarity', () => {
    index.add({ id: 'a', vector: [1, 0, 0] })
    index.add({ id: 'b', vector: [0.9, 0.1, 0] })
    index.add({ id: 'c', vector: [0, 0, 1] })

    const results = index.search([1, 0, 0], 2)
    expect(results.length).toBe(2)
    expect(results[0].id).toBe('a')
    expect(results[0].score).toBe(1) // exact match
    expect(results[1].id).toBe('b')
  })

  it('searches by L2 distance', () => {
    index.add({ id: 'a', vector: [0, 0] })
    index.add({ id: 'b', vector: [3, 4] })
    index.add({ id: 'c', vector: [1, 0] })

    const results = index.searchL2([0, 0], 3)
    expect(results[0].id).toBe('a') // distance 0
    expect(results[1].id).toBe('c') // distance 1
    expect(results[2].id).toBe('b') // distance 5
  })

  it('removes vectors', () => {
    index.add({ id: '1', vector: [1, 0] })
    index.add({ id: '2', vector: [0, 1] })
    expect(index.remove('1')).toBe(true)
    expect(index.size).toBe(1)
    expect(index.remove('nonexistent')).toBe(false)
  })

  it('returns empty for empty index', () => {
    expect(index.search([1, 0, 0])).toEqual([])
  })

  it('respects k parameter', () => {
    for (let i = 0; i < 20; i++) {
      const v = new Array(20).fill(0)
      v[i] = 1
      index.add({ id: `${i}`, vector: v })
    }
    const results = index.search(new Array(20).fill(0.1), 5)
    expect(results.length).toBe(5)
  })

  it('throws on dimension mismatch', () => {
    index.add({ id: '1', vector: [1, 2, 3] })
    expect(() => index.add({ id: '2', vector: [1, 2] })).toThrow('Dimension mismatch')
    expect(() => index.search([1, 2])).toThrow('Query dimension mismatch')
  })

  it('stores and retrieves metadata', () => {
    index.add({ id: '1', vector: [1, 0], metadata: { name: 'brake pad' } })
    const record = index.getRecord('1')
    expect(record?.metadata?.name).toBe('brake pad')
  })

  it('serializes and deserializes', () => {
    index.add({ id: '1', vector: [1, 0, 0] })
    index.add({ id: '2', vector: [0, 1, 0] })

    const data = index.serialize()
    const restored = FlatVectorIndex.deserialize(data)

    expect(restored.size).toBe(2)
    expect(restored.dims).toBe(3)
    const results = restored.search([1, 0, 0], 1)
    expect(results[0].id).toBe('1')
  })

  it('clears all vectors', () => {
    index.add({ id: '1', vector: [1, 0] })
    index.add({ id: '2', vector: [0, 1] })
    index.clear()
    expect(index.size).toBe(0)
  })

  it('returns all records', () => {
    index.add({ id: '1', vector: [1, 0] })
    index.add({ id: '2', vector: [0, 1] })
    expect(index.getAll()).toHaveLength(2)
  })
})

describe('IVFVectorIndex', () => {
  let index: IVFVectorIndex

  beforeEach(() => {
    index = new IVFVectorIndex(4)
  })

  function addClusteredVectors() {
    // Cluster A: around [1, 0, 0]
    index.add({ id: 'a1', vector: [1, 0, 0] })
    index.add({ id: 'a2', vector: [0.9, 0.1, 0] })
    index.add({ id: 'a3', vector: [0.95, 0.05, 0] })

    // Cluster B: around [0, 1, 0]
    index.add({ id: 'b1', vector: [0, 1, 0] })
    index.add({ id: 'b2', vector: [0.1, 0.9, 0] })
    index.add({ id: 'b3', vector: [0.05, 0.95, 0] })

    // Cluster C: around [0, 0, 1]
    index.add({ id: 'c1', vector: [0, 0, 1] })
    index.add({ id: 'c2', vector: [0, 0.1, 0.9] })

    index.train()
  }

  it('trains and searches', () => {
    addClusteredVectors()
    const results = index.search([1, 0, 0], 3)
    expect(results.length).toBe(3)
    expect(results[0].id).toBe('a1')
    expect(results[0].score).toBeCloseTo(1, 1)
  })

  it('finds nearest cluster correctly', () => {
    addClusteredVectors()
    const results = index.search([0, 0, 1], 2)
    expect(results[0].id).toBe('c1')
  })

  it('falls back to brute force when untrained', () => {
    index.add({ id: '1', vector: [1, 0, 0] })
    index.add({ id: '2', vector: [0, 1, 0] })
    // No train() call
    const results = index.search([1, 0, 0], 1)
    expect(results[0].id).toBe('1')
  })

  it('removes vectors and rebuilds', () => {
    addClusteredVectors()
    expect(index.size).toBe(8)
    index.remove('a1')
    expect(index.size).toBe(7)
    // Search should still work
    const results = index.search([0, 1, 0], 1)
    expect(results[0].id).toBe('b1')
  })

  it('handles nProbe parameter', () => {
    addClusteredVectors()
    // nProbe=1 means only search nearest cluster
    const results1 = index.search([0.9, 0.1, 0.5], 10, 1)
    // nProbe=4 means search all clusters
    const results4 = index.search([0.9, 0.1, 0.5], 10, 4)
    expect(results4.length).toBeGreaterThanOrEqual(results1.length)
  })

  it('serializes and deserializes', () => {
    addClusteredVectors()
    const data = index.serialize()
    const restored = IVFVectorIndex.deserialize(data)

    expect(restored.size).toBe(8)
    const results = restored.search([1, 0, 0], 1)
    expect(results[0].id).toBe('a1')
  })

  it('clears the index', () => {
    addClusteredVectors()
    index.clear()
    expect(index.size).toBe(0)
    expect(index.search([1, 0, 0], 5)).toEqual([])
  })

  it('throws on dimension mismatch', () => {
    index.add({ id: '1', vector: [1, 0, 0] })
    expect(() => index.add({ id: '2', vector: [1, 0] })).toThrow('Dimension mismatch')
  })

  it('returns correct getRecord', () => {
    addClusteredVectors()
    const record = index.getRecord('a1')
    expect(record).toBeDefined()
    expect(record!.id).toBe('a1')
    expect(index.getRecord('nonexistent')).toBeUndefined()
  })

  it('handles large datasets', () => {
    const bigIndex = new IVFVectorIndex(8)
    for (let i = 0; i < 200; i++) {
      const v = new Array(50).fill(0).map(() => Math.random() - 0.5)
      bigIndex.add({ id: `${i}`, vector: v })
    }
    bigIndex.train()
    expect(bigIndex.size).toBe(200)

    const query = new Array(50).fill(0).map(() => Math.random() - 0.5)
    const results = bigIndex.search(query, 10)
    expect(results.length).toBe(10)
  })
})
