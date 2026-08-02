import { describe, it, expect } from 'vitest'
import { normalizeSearchQuery, soundex, stemToken, expandPhonetically } from './voiceSearch'

describe('normalizeSearchQuery', () => {
  it('trims and lowercases', () => {
    expect(normalizeSearchQuery('  LED Fog Light  ')).toBe('led fog light')
  })

  it('fixes homophone confusion: braking/barking/breaking/bad → brake pad', () => {
    expect(normalizeSearchQuery('barking bad')).toBe('brake pad')
    expect(normalizeSearchQuery('braking bad')).toBe('brake pad')
    expect(normalizeSearchQuery('breaking bad')).toBe('brake pad')
    expect(normalizeSearchQuery('brake bad')).toBe('brake pad')
    expect(normalizeSearchQuery('Barking Bad')).toBe('brake pad')
  })

  it('keeps already-correct queries intact', () => {
    expect(normalizeSearchQuery('brake pads')).toBe('brake pads')
    expect(normalizeSearchQuery('led fog light pair')).toBe('led fog light pair')
    expect(normalizeSearchQuery('all weather floor mats')).toBe('all weather floor mats')
  })

  it('strips leading filler phrases', () => {
    expect(normalizeSearchQuery('i need brake pads please')).toBe('brake pads')
    expect(normalizeSearchQuery('can you find me oil filter')).toBe('oil filter')
    expect(normalizeSearchQuery('please show me brake pads')).toBe('brake pads')
    expect(normalizeSearchQuery('show me LED head light')).toBe('led headlight')
  })

  it('fixes word-level synonyms and contractions', () => {
    expect(normalizeSearchQuery('tyre pressure gauge')).toBe('tire pressure gauge')
    expect(normalizeSearchQuery('calliper')).toBe('caliper')
    expect(normalizeSearchQuery('sparkplug set')).toBe('spark plug set')
    expect(normalizeSearchQuery('hed light bulb')).toBe('headlight bulb')
    expect(normalizeSearchQuery('break disc rotor')).toBe('brake disc rotor')
    expect(normalizeSearchQuery('break caliper')).toBe('brake caliper')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeSearchQuery('')).toBe('')
    expect(normalizeSearchQuery('   ')).toBe('')
  })

  it('strips punctuation artifacts', () => {
    expect(normalizeSearchQuery('brake, pads.')).toBe('brake pads')
    expect(normalizeSearchQuery('"led headlight"')).toBe('led headlight')
  })
})

describe('stemToken', () => {
  it('strips inflectional suffixes', () => {
    expect(stemToken('breaking')).toBe('break')
    expect(stemToken('brakes')).toBe('brake')
    expect(stemToken('pads')).toBe('pad')
    expect(stemToken('filters')).toBe('filter')
  })

  it('never mangles short words', () => {
    expect(stemToken('gas')).toBe('gas')
    expect(stemToken('air')).toBe('air')
  })
})

describe('soundex', () => {
  it('collapses brake variants to one code', () => {
    for (const w of ['brake', 'break', 'brack', 'bracking', 'breaking', 'braking', 'barking']) {
      expect(soundex(stemToken(w))).toBe('B620')
    }
  })

  it('collapses headlight variants to one code', () => {
    expect(soundex(stemToken('headlight'))).toBe('H342')
    expect(soundex(stemToken('hedlight'))).toBe('H342')
  })

  it('keeps distinct codes for pad vs bad (different first letter)', () => {
    expect(soundex(stemToken('pad'))).toBe('P300')
    expect(soundex(stemToken('bad'))).toBe('B300')
  })
})

describe('expandPhonetically', () => {
  it('swaps unknown homophones for known catalog words', () => {
    const vocab = new Map<string, string[]>([
      ['B620', ['brake']],
      ['H342', ['headlight']],
    ])
    expect(expandPhonetically('bracking bad', vocab)).toBe('brake bad')
    expect(expandPhonetically('hedlight bulb', vocab)).toBe('headlight bulb')
  })

  it('returns null when nothing changes', () => {
    const vocab = new Map<string, string[]>([['B620', ['brake']]])
    expect(expandPhonetically('brake pad', vocab)).toBeNull()
  })
})
