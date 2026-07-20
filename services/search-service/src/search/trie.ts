/**
 * Trie (Prefix Tree) — efficient data structure for autocomplete and prefix search.
 *
 * DSA Concepts:
 * - Each node contains a Map of child characters → child nodes
 * - A terminal flag marks end-of-word
 * - Frequency count enables ranked autocomplete (most-searched words first)
 * - Search complexity: O(k) where k = prefix length (independent of dictionary size)
 * - Autocomplete: O(k + m) where m = number of matching suffixes
 *
 * Time Complexities:
 * - Insert:   O(k) — k = word length
 * - Search:   O(k)
 * - Remove:   O(k)
 * - AutoComplete: O(k + m log m) — m = matches, sorted by frequency
 */

interface TrieNode {
  children: Map<string, TrieNode>
  isEnd: boolean
  frequency: number
  word: string | null
}

function createNode(): TrieNode {
  return { children: new Map(), isEnd: false, frequency: 0, word: null }
}

export class Trie {
  private root: TrieNode
  private _size: number

  constructor() {
    this.root = createNode()
    this._size = 0
  }

  /** Insert a word (case-insensitive). Optionally associate data via frequency. */
  insert(word: string, freq = 1): void {
    const key = word.toLowerCase().trim()
    if (!key) return

    let node = this.root
    for (const char of key) {
      if (!node.children.has(char)) {
        node.children.set(char, createNode())
      }
      node = node.children.get(char)!
    }
    if (!node.isEnd) {
      this._size++
      node.word = key
    }
    node.isEnd = true
    node.frequency += freq
  }

  /** Insert a phrase — splits on spaces and indexes each word. */
  insertPhrase(phrase: string, freq = 1): void {
    const words = phrase.toLowerCase().split(/\s+/).filter(Boolean)
    for (const word of words) {
      this.insert(word, freq)
    }
    // Also insert the full phrase as one entry (useful for exact matches)
    this.insert(phrase.toLowerCase().trim(), freq)
  }

  /** Exact search — returns true if the word exists in the trie. */
  search(word: string): boolean {
    const key = word.toLowerCase().trim()
    let node = this.root
    for (const char of key) {
      if (!node.children.has(char)) return false
      node = node.children.get(char)!
    }
    return node.isEnd
  }

  /** Return all words starting with the given prefix, sorted by frequency (descending). */
  autocomplete(prefix: string, limit = 10): string[] {
    const key = prefix.toLowerCase().trim()
    let node = this.root

    // Navigate to prefix node
    for (const char of key) {
      if (!node.children.has(char)) return []
      node = node.children.get(char)!
    }

    // Collect all words under this node
    const results: Array<{ word: string; frequency: number }> = []
    this.collectWords(node, results)

    // Sort by frequency descending
    results.sort((a, b) => b.frequency - a.frequency)

    return results.slice(0, limit).map((r) => r.word)
  }

  /** Remove a word from the trie. */
  remove(word: string): boolean {
    const key = word.toLowerCase()
    const found = this.exists(this.root, key, 0)
    if (!found) return false
    this.removeHelper(this.root, key, 0)
    this._size--
    return true
  }

  /** Check if a word exists in the trie (private helper for remove). */
  private exists(node: TrieNode, word: string, depth: number): boolean {
    if (depth === word.length) return node.isEnd
    const char = word[depth]
    const child = node.children.get(char)
    if (!child) return false
    return this.exists(child, word, depth + 1)
  }

  /** Number of unique words in the trie. */
  size(): number {
    return this._size
  }

  // --- Private helpers ---

  private collectWords(node: TrieNode, results: Array<{ word: string; frequency: number }>): void {
    if (node.isEnd && node.word) {
      results.push({ word: node.word, frequency: node.frequency })
    }
    for (const child of node.children.values()) {
      this.collectWords(child, results)
    }
  }

  private removeHelper(node: TrieNode, word: string, depth: number): boolean {
    if (depth === word.length) {
      if (!node.isEnd) return false
      node.isEnd = false
      node.frequency = 0
      node.word = null
      return node.children.size === 0
    }

    const char = word[depth]
    const child = node.children.get(char)
    if (!child) return false

    const shouldDeleteChild = this.removeHelper(child, word, depth + 1)

    if (shouldDeleteChild) {
      node.children.delete(char)
      return !node.isEnd && node.children.size === 0
    }

    return false
  }
}
