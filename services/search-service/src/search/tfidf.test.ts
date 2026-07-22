import { describe, it, expect, beforeEach } from 'vitest'
import { TfidfEngine, tokenize } from './tfidf'

describe('tokenize', () => {
  it('lowercases and splits text', () => {
    expect(tokenize('Hello World')).toEqual(expect.arrayContaining(['hello', 'world']))
  })

  it('removes stop words', () => {
    const tokens = tokenize('the quick brown fox is very fast')
    expect(tokens).not.toContain('the')
    expect(tokens).not.toContain('is')
    expect(tokens).not.toContain('very')
  })

  it('strips punctuation', () => {
    expect(tokenize('brake-pad! (ceramic)')).toEqual(
      expect.arrayContaining(['brake-pad', 'ceramic'])
    )
  })

  it('filters short words', () => {
    const tokens = tokenize('a brake pad is used')
    expect(tokens).not.toContain('a')
    expect(tokens).not.toContain('is')
  })

  it('applies light stemming', () => {
    const tokens = tokenize('brakes braking braked')
    expect(tokens).toContain('brake')
  })

  it('handles empty string', () => {
    expect(tokenize('')).toEqual([])
  })

  it('handles numbers', () => {
    const tokens = tokenize('12345 brake pad')
    expect(tokens).toContain('12345')
    expect(tokens).toContain('brake')
  })
})

describe('TfidfEngine', () => {
  let engine: TfidfEngine

  beforeEach(() => {
    engine = new TfidfEngine()
  })

  it('indexes and searches documents', () => {
    engine.addDocument({ id: '1', text: 'brake pad ceramic front' })
    engine.addDocument({ id: '2', text: 'oil filter synthetic' })
    engine.addDocument({ id: '3', text: 'brake disc rear' })

    const results = engine.search('brake')
    expect(results.length).toBe(2)
    expect(results[0].id).toMatch(/^[13]$/)
  })

  it('ranks rarer terms higher (IDF weighting)', () => {
    // "turbocharger" appears in only one doc — should be highly discriminative
    engine.addDocument({ id: '1', text: 'turbocharger kit performance' })
    engine.addDocument({ id: '2', text: 'brake pad ceramic' })
    engine.addDocument({ id: '3', text: 'brake disc steel' })
    engine.addDocument({ id: '4', text: 'oil filter' })

    const results = engine.search('turbocharger')
    expect(results.length).toBe(1)
    expect(results[0].id).toBe('1')
    expect(results[0].score).toBeGreaterThan(0)
  })

  it('returns empty for no matches', () => {
    engine.addDocument({ id: '1', text: 'brake pad' })
    expect(engine.search('turbocharger')).toEqual([])
  })

  it('returns empty for empty query', () => {
    engine.addDocument({ id: '1', text: 'brake pad' })
    expect(engine.search('')).toEqual([])
  })

  it('respects limit parameter', () => {
    for (let i = 0; i < 20; i++) {
      engine.addDocument({ id: `${i}`, text: `product ${i} brake` })
    }
    const results = engine.search('brake', 5)
    expect(results.length).toBe(5)
  })

  it('removes documents', () => {
    engine.addDocument({ id: '1', text: 'brake pad' })
    engine.addDocument({ id: '2', text: 'oil filter' })
    expect(engine.size()).toBe(2)

    engine.removeDocument('1')
    expect(engine.size()).toBe(1)
    expect(engine.search('brake')).toEqual([])
  })

  it('clears all documents', () => {
    engine.addDocument({ id: '1', text: 'brake pad' })
    engine.addDocument({ id: '2', text: 'oil filter' })
    engine.clear()
    expect(engine.size()).toBe(0)
  })

  it('supports document boost weights', () => {
    engine.addDocument({ id: '1', text: 'ceramic brake pad', boost: { ceramic: 2.0 } })
    engine.addDocument({ id: '2', text: 'ceramic bearing' })

    const results = engine.search('ceramic')
    expect(results.length).toBe(2)
    // Doc 1 should score higher due to boost
    expect(results[0].id).toBe('1')
  })

  it('updates existing documents', () => {
    engine.addDocument({ id: '1', text: 'brake pad' })
    engine.addDocument({ id: '1', text: 'turbocharger kit' }) // update
    expect(engine.size()).toBe(1)

    const results = engine.search('turbocharger')
    expect(results.length).toBe(1)
    expect(results[0].id).toBe('1')
  })

  it('computes correct IDF scores', () => {
    engine.addDocument({ id: '1', text: 'brake pad ceramic' })
    engine.addDocument({ id: '2', text: 'brake disc steel' })
    engine.addDocument({ id: '3', text: 'oil filter' })

    // "brake" appears in 2/3 docs — moderate IDF
    const brakeIdf = engine.getIdf('brake')
    // "ceramic" appears in 1/3 docs — higher IDF
    const ceramicIdf = engine.getIdf('ceramic')

    expect(ceramicIdf).toBeGreaterThan(brakeIdf)
  })

  it('returns top discriminative terms', () => {
    engine.addDocument({ id: '1', text: 'ceramic brake pad' })
    engine.addDocument({ id: '2', text: 'ceramic bearing' })
    engine.addDocument({ id: '3', text: 'brake disc' })

    const top = engine.topTerms(5)
    expect(top.length).toBeGreaterThanOrEqual(1)
    // "brake" appears in 2/3 docs (lower IDF)
    // Unique terms like "pad", "disc" appear in only 1/3 (higher IDF)
    const topTerm = top[0].term
    expect(['pad', 'disc', 'ceramic']).toContain(topTerm)
  })

  it('handles multi-word queries', () => {
    engine.addDocument({ id: '1', text: 'front brake pad ceramic' })
    engine.addDocument({ id: '2', text: 'rear brake disc' })
    engine.addDocument({ id: '3', text: 'oil filter' })

    const results = engine.search('front brake')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].id).toBe('1')
  })

  it('handles duplicate inserts by updating', () => {
    engine.addDocument({ id: '1', text: 'brake pad' })
    engine.addDocument({ id: '1', text: 'brake pad updated' })
    expect(engine.size()).toBe(1)
  })

  it('size tracks documents correctly', () => {
    expect(engine.size()).toBe(0)
    engine.addDocument({ id: '1', text: 'a' })
    engine.addDocument({ id: '2', text: 'b' })
    expect(engine.size()).toBe(2)
    engine.removeDocument('1')
    expect(engine.size()).toBe(1)
  })
})
