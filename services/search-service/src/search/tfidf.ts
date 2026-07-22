/**
 * TF-IDF (Term Frequency – Inverse Document Frequency) Scoring Engine
 *
 * DSA Concepts:
 * - Term Frequency (TF): How often a term appears in a document
 *   TF(t,d) = count(t in d) / total_terms(d)
 *   With log normalization: 1 + log(count(t in d))  [augmented TF]
 *
 * - Inverse Document Frequency (IDF): How rare a term is across the corpus
 *   IDF(t, D) = log(N / (1 + df(t)))
 *   where N = total documents, df(t) = documents containing term t
 *
 *   IDF penalizes common terms ("the", "and") and boosts rare, discriminative terms
 *   ("brake", "turbocharger")
 *
 * - TF-IDF(t, d, D) = TF(t,d) * IDF(t,D)
 *   High TF-IDF = term appears often in this document but rarely in the corpus
 *
 * Time Complexity:
 *   Tokenize: O(n) where n = text length
 *   Build index: O(N * L) where N = docs, L = avg doc length
 *   Query: O(Q * N) where Q = query terms (fast for small-to-medium corpora)
 *
 * Space Complexity: O(N * V) where V = vocabulary size
 */

/** Tokenize text: lowercase, strip punctuation, remove stopwords, stem lightly */
export function tokenize(text: string): string[] {
  const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'and', 'but', 'or', 'if', 'because', 'about', 'it', 'its', 'this',
    'that', 'these', 'those', 'what', 'which', 'who', 'whom',
  ])

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t))
    .map((t) => simpleStem(t))
}

/** Lightweight stemmer — strips common English suffixes */
function simpleStem(word: string): string {
  if (word.length <= 3) return word
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3)
  if (word.endsWith('tion')) return word.slice(0, -4) + 'te'
  if (word.endsWith('ness')) return word.slice(0, -4)
  if (word.endsWith('ment')) return word.slice(0, -4)
  if (word.endsWith('ible')) return word.slice(0, -4) + 'ble'
  if (word.endsWith('able')) return word.slice(0, -4)
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y'
  if (word.endsWith('ses') || word.endsWith('zes')) return word.slice(0, -2)
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('er') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('ly') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1)
  return word
}

export interface TfidfDocument {
  id: string
  text: string
  /** Optional per-term multipliers — e.g. brand gets 1.5x boost */
  boost?: Record<string, number>
}

/**
 * In-memory TF-IDF index. Maintains document frequencies (df) for IDF
 * calculation and supports add/remove/search with incremental updates.
 * Suitable for small-to-medium corpora (< 100K documents).
 */
export class TfidfEngine {
  private documents: Map<string, TfidfDocument> = new Map()
  private tokenizedDocs: Map<string, string[]> = new Map()
  private df: Map<string, number> = new Map()
  private totalDocs = 0

  /** Add or update a document in the index. If the document already exists,
   *  decrements old DF counts before re-indexing to keep frequencies accurate. */
  addDocument(doc: TfidfDocument): void {
    const tokens = tokenize(doc.text)
    const existing = this.tokenizedDocs.get(doc.id)

    if (existing && this.documents.has(doc.id)) {
      this.decrementDF(existing)
      this.totalDocs--
    }

    this.documents.set(doc.id, doc)
    this.tokenizedDocs.set(doc.id, tokens)
    this.incrementDF(tokens)
    this.totalDocs++
  }

  /** Remove a document from the index */
  removeDocument(id: string): boolean {
    const tokens = this.tokenizedDocs.get(id)
    if (!tokens) return false

    this.decrementDF(tokens)
    this.tokenizedDocs.delete(id)
    this.documents.delete(id)
    this.totalDocs--
    return true
  }

  /** Clear all documents */
  clear(): void {
    this.documents.clear()
    this.tokenizedDocs.clear()
    this.df.clear()
    this.totalDocs = 0
  }

  /** Number of indexed documents */
  size(): number {
    return this.totalDocs
  }

  /** Compute TF-IDF score for a query against a single document.
   *  Uses augmented TF to prevent bias toward longer documents, and
   *  smoothed IDF to handle terms that appear in zero documents. */
  private computeTfIdf(queryTokens: string[], docTokens: string[]): number {
    const tfMap = new Map<string, number>()
    for (const token of docTokens) {
      tfMap.set(token, (tfMap.get(token) || 0) + 1)
    }

    let score = 0
    for (const qt of queryTokens) {
      const tf = tfMap.get(qt) || 0
      if (tf === 0) continue

      // Augmented TF: 0.5 + 0.5 * (tf / max_tf) — prevents bias toward longer docs
      const maxTf = Math.max(...tfMap.values())
      const augmentedTf = maxTf > 0 ? 0.5 + 0.5 * (tf / maxTf) : 0

      // IDF with smoothing
      const dfVal = this.df.get(qt) || 0
      const idf = Math.log((this.totalDocs + 1) / (1 + dfVal)) + 1

      score += augmentedTf * idf
    }

    return score
  }

  /** Score all documents against query, return sorted results.
   *  Applies field boosts from document metadata (e.g. brand match gets 1.5x). */
  search(query: string, limit = 50): Array<{ id: string; score: number }> {
    const queryTokens = tokenize(query)
    if (queryTokens.length === 0) return []

    const results: Array<{ id: string; score: number }> = []

    for (const [id, docTokens] of this.tokenizedDocs) {
      let score = this.computeTfIdf(queryTokens, docTokens)

      // Apply field boosts from document metadata
      const doc = this.documents.get(id)
      if (doc?.boost) {
        for (const qt of queryTokens) {
          if (doc.boost[qt]) {
            score *= doc.boost[qt]
          }
        }
      }

      if (score > 0) {
        results.push({ id, score })
      }
    }

    results.sort((a, b) => b.score - a.score)
    return results.slice(0, limit)
  }

  /** Get IDF score for a term — useful for debugging and analytics */
  getIdf(term: string): number {
    const dfVal = this.df.get(simpleStem(term)) || 0
    if (dfVal === 0) return 0
    return Math.log((this.totalDocs + 1) / (1 + dfVal)) + 1
  }

  /** Get top N discriminative terms in the corpus */
  topTerms(n = 20): Array<{ term: string; idf: number }> {
    const terms: Array<{ term: string; idf: number }> = []
    for (const [term, dfVal] of this.df) {
      if (dfVal > 0 && dfVal < this.totalDocs) {
        const idf = Math.log((this.totalDocs + 1) / (1 + dfVal)) + 1
        terms.push({ term, idf })
      }
    }
    terms.sort((a, b) => b.idf - a.idf)
    return terms.slice(0, n)
  }

  /** Increment document frequency for each unique token in the document.
   *  Uses Set to count each term once per document (not per occurrence). */
  private incrementDF(tokens: string[]): void {
    const unique = new Set(tokens)
    for (const token of unique) {
      this.df.set(token, (this.df.get(token) || 0) + 1)
    }
  }

  /** Decrement document frequency when removing a document.
   *  Deletes the term entirely if it was the last document containing it. */
  private decrementDF(tokens: string[]): void {
    const unique = new Set(tokens)
    for (const token of unique) {
      const count = this.df.get(token) || 0
      if (count <= 1) {
        this.df.delete(token)
      } else {
        this.df.set(token, count - 1)
      }
    }
  }
}
