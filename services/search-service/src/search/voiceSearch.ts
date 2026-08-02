/**
 * Voice search query normalization — fixes Web Speech API transcription
 * artifacts and homophone confusion before the query hits the search pipeline.
 *
 * The actual speech-to-text happens client-side (Web Speech API), so this is
 * text preprocessing on the backend. Applied to EVERY query on the /search
 * route — typed queries benefit too ("break pads" finds brake pads just like
 * "brake pads").
 *
 * STT pitfalls it fixes:
 *  - Homophones: "braking"/"barking"/"break" → "brake", "bad" → "pad"
 *  - Filler phrases the API sometimes injects: "i need", "show me", "please"
 *  - Punctuation artifacts: commas, periods, quote marks, apostrophes
 */

/** Multi-word transcription fixes — run BEFORE word-level fixes. */
const PHRASE_FIXES: Array<[RegExp, string]> = [
  // The classic one: "braking bad" / "barking bad" / "breaking bad" / "brake bad" → brake pad
  [/\b(?:braking|barking|breaking|brake)\s+bad\b/g, 'brake pad'],
  [/\b(?:braking|barking|breaking)\s+pads?\b/g, 'brake pads'],
  [/\bbad\s+pads?\b/g, 'brake pad'],
  [/\bhed\s+light\b/g, 'headlight'],
  [/\bhead\s+light\b/g, 'headlight'],
  [/\bspark\s?plugs?\b/g, 'spark plug'],
  [/\boil\s?filters?\b/g, 'oil filter'],
  [/\bair\s?filters?\b/g, 'air filter'],
  [/\btail\s?lights?\b/g, 'tail light'],
  [/\bbreak\s+(disc|rotor|caliper)\b/g, 'brake $1'],
]

/** Single-word homophone/synonym fixes — applied per token (stem-aware). */
const WORD_FIXES: Record<string, string> = {
  braking: 'brake',
  barking: 'brake',
  breaking: 'brake',
  break: 'brake',
  breaks: 'brake',
  brakes: 'brake',
  broke: 'brake',
  bad: 'pad',
  bat: 'pad',
  pat: 'pad',
  tyre: 'tire',
  tiers: 'tire',
  tier: 'tire',
  lite: 'light',
  hed: 'head',
  lights: 'light',
  shockers: 'shock',
  fluids: 'fluid',
  filters: 'filter',
  batterys: 'battery',
  batteries: 'battery',
  sparkplug: 'spark plug',
  sparkplugs: 'spark plug',
  airfilter: 'air filter',
  oilfilter: 'oil filter',
  calliper: 'caliper',
  calipers: 'caliper',
  rotors: 'rotor',
  mufflers: 'muffler',
}

/**
 * Crude English stemmer for search tokens: strips common inflectional
 * suffixes so that "breaking" → "break", "brakes" → "brake", "pads" → "pad",
 * "batteries" → "battery" BEFORE lookup in WORD_FIXES or soundex. Handles
 * the plural rules properly ("brakes" must NOT become "brak") and keeps
 * short legitimate words ("gas", "bus", "air") untouched.
 */
export function stemToken(w: string): string {
  let s = w
  if (s.length >= 4) {
    if (/ies$/.test(s)) s = s.slice(0, -3) + 'y' // batteries → battery
    else if (/(?:sses|shes|ches|xes|zes)$/.test(s)) s = s.slice(0, -2) // classes → class
    else if (/ing$/.test(s)) s = s.slice(0, -3) // breaking → break
    else if (/ed$/.test(s)) s = s.slice(0, -2) // installed → install
    else if (/s$/.test(s) && !/ss$/.test(s)) s = s.slice(0, -1) // brakes → brake, pads → pad
  }
  return s.length >= 3 ? s : w
}

/** Standard American Soundex code (first letter + 3 digit codes). */
export function soundex(word: string): string {
  const w = word.toLowerCase()
  const first = w[0]
  if (!first || !/[a-z]/.test(first)) return ''
  const CODE: Record<string, string> = {
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6',
  }
  let out = first.toUpperCase()
  let prev = CODE[first] || ''
  for (let i = 1; i < w.length && out.length < 4; i++) {
    const ch = w[i]
    // Vowels (a,e,i,o,u,y) and h/w are ignored; h/w do NOT break up
    // adjacent same-code consonants (standard Soundex rule).
    const c = CODE[ch]
    if (!c) continue
    if (c === prev) continue
    out += c
    prev = c
  }
  return (out + '000').slice(0, 4)
}

/**
 * Phonetic fallback: if a query token's soundex matches a known catalog
 * word, swap in the shortest known word for that sound. "bracking" →
 * (stem "brack") → B620 → "brake". Returns null when nothing changes.
 */
export function expandPhonetically(query: string, vocab: Map<string, string[]>): string | null {
  const tokens = query.toLowerCase().split(/\s+/)
  const expanded = tokens.map((t) => {
    if (t.length < 3) return t
    const code = soundex(stemToken(t))
    if (!code) return t
    const cands = vocab.get(code)
    return cands && cands.length ? cands[0] : t
  })
  const alt = expanded.join(' ')
  return alt === query ? null : alt
}

/** Lead-in filler phrases STT sometimes injects — stripped before searching. */
const FILLER_PREFIX =
  /^(?:i\s+need|i\s+want|i\s+would\s+like|can\s+you|could\s+you|please|pls|find\s+me|show\s+me|search\s+for|looking\s+for|im\s+looking\s+for|i\s+am\s+looking\s+for|do\s+you\s+have|do\s+you\s+sell|have\s+you\s+got|give\s+me|get\s+me|tell\s+me|how\s+much|price\s+of|need\s+to\s+find|buy\s+me|need\s+me)\s+/i

/**
 * Normalize a raw (possibly voice-transcribed) query for search.
 * Order: strip punctuation → strip filler → phrase fixes → word fixes.
 */
export function normalizeSearchQuery(raw: string): string {
  if (!raw) return ''
  let q = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, ' ')

  // Strip leading filler ("show me brake pads" → "brake pads")
  for (let i = 0; i < 3; i++) {
    const next = q.replace(FILLER_PREFIX, '')
    if (next === q) break
    q = next
  }

  // Phrase-level fixes first (multi-word transcription errors)
  for (const [re, out] of PHRASE_FIXES) q = q.replace(re, out)

  // Word-level fixes — try the raw word, then its stem ("breaking" → "break" → "brake")
  q = q
    .split(/\s+/)
    .map((w) => {
      if (WORD_FIXES[w]) return WORD_FIXES[w]
      const st = stemToken(w)
      return st !== w && WORD_FIXES[st] ? WORD_FIXES[st] : w
    })
    .join(' ')

  // Strip trailing politeness ("brake pads please" → "brake pads")
  q = q.replace(/\s+(?:please|pls|thank\s+you|thanks)\s*$/i, '')

  return q.replace(/\s+/g, ' ').trim()
}

/** Backward-compatible alias for any existing imports. */
export function processVoiceTranscript(transcript: string): string {
  return normalizeSearchQuery(transcript)
}
