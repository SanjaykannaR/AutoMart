'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { ProductCard } from '@/components/ProductCard'
import { GlassCard } from '@/components/GlassCard'
import { motion } from 'framer-motion'
import Link from 'next/link'

const categories = [
  { name: 'Brake System', icon: '🛞', count: 142 },
  { name: 'Engine Parts', icon: '⚙️', count: 238 },
  { name: 'Suspension', icon: '🔧', count: 95 },
  { name: 'Electrical', icon: '⚡', count: 187 },
  { name: 'Transmission', icon: '🔩', count: 76 },
  { name: 'Exhaust', icon: '💨', count: 54 },
]

const featuredProducts: any[] = []

export default function HomePage() {
  const [results, setResults] = useState<typeof featuredProducts>([])
  const [searched, setSearched] = useState(false)

  const handleSearch = (query: string) => {
    setSearched(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then(setResults)
      .catch(() => setResults([]))
  }

  return (
    <div>
      <section className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold mb-4"
        >
          <span className="glow-text">Auto Parts</span>
          <br />
          <span className="text-white">in 30 Minutes</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[var(--color-text-secondary)] text-lg mb-8 max-w-lg"
        >
          Find any car or bike spare part. Your mechanic delivers in 30 mins.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-2xl"
        >
          <SearchBar onSearch={handleSearch} />
        </motion.div>

        {searched && results.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-[var(--color-text-muted)]"
          >
            No parts found. Try a different search.
          </motion.p>
        )}

        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
          >
            {results.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold mb-8">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link key={cat.name} href={`/search?category=${encodeURIComponent(cat.name)}`}>
              <GlassCard className="text-center py-8 cursor-pointer">
                <span className="text-3xl block mb-3">{cat.icon}</span>
                <p className="text-sm font-medium">{cat.name}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{cat.count} parts</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="glass p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Need a Part? <span className="glow-text">We Got You.</span>
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
            Search, order, and get your spare parts delivered in 30 minutes — not hours.
          </p>
          <Link href="/search" className="glass-button px-8 py-3 text-base">
            Start Browsing
          </Link>
        </div>
      </section>
    </div>
  )
}
