import { describe, it, expect } from 'vitest'
import { Trie } from './trie'

describe('Trie', () => {
  it('inserts and searches words', () => {
    const trie = new Trie()
    trie.insert('brake')
    trie.insert('battery')
    trie.insert('bearing')

    expect(trie.search('brake')).toBe(true)
    expect(trie.search('battery')).toBe(true)
    expect(trie.search('brak')).toBe(false)
    expect(trie.search('brakes')).toBe(false)
    expect(trie.size()).toBe(3)
  })

  it('returns autocomplete suggestions by prefix', () => {
    const trie = new Trie()
    trie.insert('brake pad')
    trie.insert('brake disc')
    trie.insert('brake fluid')
    trie.insert('battery')

    expect(trie.autocomplete('bra')).toEqual(
      expect.arrayContaining(['brake pad', 'brake disc', 'brake fluid'])
    )
    expect(trie.autocomplete('bra')).toHaveLength(3)
    expect(trie.autocomplete('batt')).toEqual(['battery'])
    expect(trie.autocomplete('xyz')).toEqual([])
  })

  it('is case-insensitive', () => {
    const trie = new Trie()
    trie.insert('Brake Pad')
    trie.insert('BRAKE DISC')

    expect(trie.search('brake pad')).toBe(true)
    expect(trie.search('BRAKE PAD')).toBe(true)
    expect(trie.search('Brake')).toBe(false)
    expect(trie.autocomplete('brake')).toHaveLength(2)
  })

  it('indexes multi-word phrases', () => {
    const trie = new Trie()
    trie.insertPhrase('front brake pads ceramic')

    expect(trie.search('front')).toBe(true)
    expect(trie.search('brake')).toBe(true)
    expect(trie.search('ceramic')).toBe(true)
    expect(trie.search('front brake pads ceramic')).toBe(true)
  })

  it('sorts autocomplete by frequency', () => {
    const trie = new Trie()
    trie.insert('brake pad', 5)
    trie.insert('brake disc', 10)
    trie.insert('brake fluid', 1)

    const results = trie.autocomplete('brake')
    expect(results[0]).toBe('brake disc') // highest frequency
    expect(results[1]).toBe('brake pad')
    expect(results[2]).toBe('brake fluid')
  })

  it('respects limit parameter', () => {
    const trie = new Trie()
    trie.insert('filter air')
    trie.insert('filter oil')
    trie.insert('filter cabin')
    trie.insert('filter fuel')

    expect(trie.autocomplete('filter', 2)).toHaveLength(2)
  })

  it('removes words', () => {
    const trie = new Trie()
    trie.insert('brake pad')
    trie.insert('brake disc')
    expect(trie.size()).toBe(2)

    expect(trie.remove('brake pad')).toBe(true)
    expect(trie.search('brake pad')).toBe(false)
    expect(trie.search('brake disc')).toBe(true)
    expect(trie.size()).toBe(1)
  })

  it('returns false when removing nonexistent word', () => {
    const trie = new Trie()
    trie.insert('brake')
    expect(trie.remove('brakes')).toBe(false)
    expect(trie.size()).toBe(1)
  })

  it('handles empty strings', () => {
    const trie = new Trie()
    trie.insert('')
    trie.insert('  ')
    expect(trie.size()).toBe(0)
    expect(trie.search('')).toBe(false)
    expect(trie.autocomplete('')).toEqual([])
  })

  it('handles duplicate inserts (increments frequency)', () => {
    const trie = new Trie()
    trie.insert('brake pad')
    trie.insert('brake pad')
    trie.insert('brake pad')
    expect(trie.size()).toBe(1) // only one unique word
    const results = trie.autocomplete('brake', 1)
    expect(results).toEqual(['brake pad'])
  })
})
