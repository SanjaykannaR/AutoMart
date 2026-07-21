/**
 * Product Detail Page — Full product view with gallery, specs, and CTA
 * 
 * Layout (desktop):
 *   ┌─────────────────────────┬─────────────────────────┐
 *   │  Left: Product Image    │  Right: Details          │
 *   │  (large, floating card) │  - Category badge        │
 *   │                         │  - Name (Outfit bold)    │
 *   │                         │  - Brand                 │
 *   │                         │  - Price (lime)          │
 *   │                         │  - Description           │
 *   │                         │  - Specs (01)            │
 *   │                         │  - Compatibility (02)    │
 *   │                         │  - Delivery (03)         │
 *   │                         │  - Qty selector + CTA    │
 *   └─────────────────────────┴─────────────────────────┘
 * 
 * Layout (mobile):
 *   - Image on top (full width)
 *   - Details below
 *   - Sticky "Add to Cart" bar at bottom when scrolling past CTA
 * 
 * Animation:
 *   - Product image scales in from 0.9 → 1.0
 *   - Details fade in with staggered timing
 *   - Section indices (01, 02, 03) in lime
 * 
 * Cart behavior:
 *   - Adds to localStorage cart
 *   - Dispatches 'cart-updated' event so Navbar updates count
 *   - Redirects to /cart after adding
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { TruckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

/**
 * Fallback product data — used when the API is unreachable.
 * Provides realistic mock data for development/demo purposes.
 */
const mockProduct = {
  id: '1',
  name: 'Ceramic Brake Pads',
  category: 'Brake System',
  brand: 'Bosch',
  price: 45.99,
  description: 'High-performance ceramic brake pads for sedans and SUVs. Low dust, quiet braking, and extended lifespan. Engineered for daily driving and light performance use.',
  specifications: [
    { key: 'Material', value: 'Ceramic Compound' },
    { key: 'Fits', value: 'Sedan, SUV, Crossover' },
    { key: 'Warranty', value: '2 Years' },
    { key: 'OEM', value: 'Yes' },
    { key: 'Position', value: 'Front' },
    { key: 'Weight', value: '1.2 kg' },
  ],
  compatibleVehicles: [
    'Honda Civic 2016-2024',
    'Toyota Corolla 2014-2024',
    'Hyundai Elantra 2017-2024',
    'Kia Forte 2019-2024',
  ],
  imageUrl: 'https://picsum.photos/seed/product-brake/800/800',
  stock: 42,
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<typeof mockProduct | null>(null)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)

  /** Fetch product data from API, fall back to mock data on error */
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`)
      .then((r) => r.json())
      .then(setProduct)
      .catch(() => setProduct(mockProduct))
  }, [id])

  /** Show skeleton while product is loading */
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="h-4 w-24 skeleton" />
            <div className="h-10 w-3/4 skeleton" />
            <div className="h-4 w-20 skeleton" />
            <div className="h-8 w-32 skeleton" />
            <div className="h-24 skeleton" />
          </div>
        </div>
      </div>
    )
  }

  /**
   * Add product to cart (localStorage) and redirect to cart page.
   * Dispatches a custom event so the Navbar updates its cart count.
   */
  const handleAddToCart = () => {
    setAdding(true)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.findIndex((item: any) => item.id === product.id)
    if (existing >= 0) {
      cart[existing].qty += qty
    } else {
      cart.push({ ...product, qty })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    // Notify Navbar about cart update
    window.dispatchEvent(new Event('cart-updated'))
    router.push('/cart')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">

        {/* ═══════════════════════════════════════════════════════
            LEFT: Product Image
            Large image card that "floats" with subtle depth
            ═══════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="card p-3 rounded-2xl overflow-hidden relative">
            {/* Product image — full aspect-square */}
            <img
              src={product.imageUrl || 'https://picsum.photos/seed/placeholder/800/800'}
              alt={product.name}
              className="w-full aspect-square object-cover rounded-xl"
            />

            {/* Stock badge — top-right corner */}
            <div className="absolute top-5 right-5">
              {product.stock > 10 ? (
                <span className="badge">In Stock</span>
              ) : (
                <span className="badge" style={{ background: 'var(--color-warning)', color: '#000' }}>
                  Only {product.stock} left
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            RIGHT: Product Details
            Name, price, specs, compatibility, CTA
            ═══════════════════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* Category badge + Name */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="badge mb-3 inline-block">{product.category}</span>
            <h1
              className="text-3xl sm:text-4xl font-extrabold leading-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {product.name}
            </h1>
            <p className="text-sm text-[var(--color-text-dim)] mt-2">{product.brand}</p>
          </motion.div>

          {/* Price — large lime gradient text */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-3xl sm:text-4xl font-extrabold glow-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
              ${product.price.toFixed(2)}
            </p>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
              {product.description}
            </p>
          </motion.div>

          {/* ═══ 01 — Specifications ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-2xl font-black text-[var(--color-accent)] opacity-30"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  01
                </span>
                <h3 className="font-semibold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Specifications
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {product.specifications.map((spec) => (
                  <div key={spec.key} className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-dim)]">{spec.key}</span>
                    <span className="font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ═══ 02 — Compatible Vehicles ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-2xl font-black text-[var(--color-accent)] opacity-30"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  02
                </span>
                <h3 className="font-semibold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Compatible Vehicles
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.compatibleVehicles.map((v) => (
                  <span
                    key={v}
                    className="text-xs font-medium border border-[var(--color-accent)]/20 text-[var(--color-accent)] rounded-full px-3 py-1.5"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ═══ 03 — Delivery Promise ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center shrink-0">
                <TruckIcon className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold">Delivery in 30 minutes</p>
                <p className="text-xs text-[var(--color-text-dim)]">
                  Order within the next 2 hours for same-day delivery
                </p>
              </div>
            </div>
          </motion.div>

          {/* ═══ Quantity Selector + Add to Cart ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {/* Quantity controls */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--color-text-dim)]">Qty:</span>
              <div className="flex items-center gap-0">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 rounded-l-lg border border-[var(--color-border)] flex items-center justify-center
                             hover:bg-[var(--color-surface-alt)] transition-colors text-lg"
                >
                  −
                </button>
                <span className="w-12 h-10 flex items-center justify-center border-y border-[var(--color-border)] text-sm font-medium">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-10 rounded-r-lg border border-[var(--color-border)] flex items-center justify-center
                             hover:bg-[var(--color-surface-alt)] transition-colors text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart button — coral/orange pill */}
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="glass-button w-full py-3.5 text-base"
            >
              {adding ? 'Adding...' : `Add to Cart — $${(product.price * qty).toFixed(2)}`}
            </button>

            {/* Trust badges below CTA */}
            <div className="flex items-center justify-center gap-4 text-xs text-[var(--color-text-dim)]">
              <div className="flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4 text-[var(--color-accent)]" />
                <span>Secure Checkout</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TruckIcon className="w-4 h-4 text-[var(--color-accent)]" />
                <span>Free Delivery</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
