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
 * Animation:
 *   - Product image scales in with image animation
 *   - Right-side details stagger in with card/text animations
 *   - Section indices (01, 02, 03) in lime
 *
 * Cart behavior:
 *   - Adds to localStorage cart
 *   - Dispatches 'cart-updated' event so Navbar updates count
 *   - Redirects to /cart after adding
 */
'use client' // Next.js client component directive

import { useState, useEffect } from 'react' // React hooks for state and effects
import { useParams, useRouter } from 'next/navigation' // Next.js routing hooks
import { ScrollReveal } from '@/components/ScrollReveal' // Reusable scroll animation wrapper
import { TruckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline' // Trust/shipping icons
import { addToRecentlyViewed, loadRecentlyViewed, type RecentlyViewedProduct } from '@/lib/lru-cache' // LRU cache for recently viewed
import Link from 'next/link' // Next.js link for recently viewed product cards
import { ProductCard } from '@/components/ProductCard' // Product card for recently viewed

/**
 * Fallback product data — used when the API is unreachable.
 * Provides realistic mock data for development/demo purposes.
 */
const mockProduct = {
  id: '1', // Default product ID
  name: 'Ceramic Brake Pads', // Product name
  category: 'Brake System', // Category for badge
  brand: 'Bosch', // Brand name
  price: 45.99, // Price in dollars
  description: 'High-performance ceramic brake pads for sedans and SUVs. Low dust, quiet braking, and extended lifespan. Engineered for daily driving and light performance use.', // Product description
  specifications: [ // Technical specifications array
    { key: 'Material', value: 'Ceramic Compound' }, // Material type
    { key: 'Fits', value: 'Sedan, SUV, Crossover' }, // Vehicle compatibility
    { key: 'Warranty', value: '2 Years' }, // Warranty period
    { key: 'OEM', value: 'Yes' }, // OEM certification
    { key: 'Position', value: 'Front' }, // Brake position
    { key: 'Weight', value: '1.2 kg' }, // Product weight
  ],
  compatibleVehicles: [ // Compatible vehicle list
    'Honda Civic 2016-2024', // Civic compatibility
    'Toyota Corolla 2014-2024', // Corolla compatibility
    'Hyundai Elantra 2017-2024', // Elantra compatibility
    'Kia Forte 2019-2024', // Forte compatibility
  ],
  imageUrl: 'https://images.unsplash.com/photo-1696494561079-ddabcbb308e8?w=800&h=800&fit=crop&q=80', // Product image URL
  stock: 42, // Available stock count
}

/**
 * ProductDetailPage Component
 * Displays a single product with image, specs, compatibility, and add-to-cart.
 */
export default function ProductDetailPage() {
  const { id } = useParams() // Get product ID from URL
  const router = useRouter() // Next.js router for navigation

  /** Product data — starts as null while loading */
  const [product, setProduct] = useState<typeof mockProduct | null>(null)
  /** Quantity selector — starts at 1 */
  const [qty, setQty] = useState(1)
  /** Add-to-cart loading state */
  const [adding, setAdding] = useState(false)
  /** Recently viewed products (LRU cache) */
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([])

  /** Fetch product data from API, fall back to mock data on error */
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`) // Fetch by ID
      .then((r) => r.json()) // Parse JSON response
      .then(setProduct) // Store product data
      .catch(() => setProduct(mockProduct)) // Fallback to mock on error
  }, [id]) // Re-fetch when ID changes

  /** Add to recently viewed when product loads */
  useEffect(() => {
    if (product) {
      addToRecentlyViewed({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        brand: product.brand,
      })
      setRecentlyViewed(loadRecentlyViewed().filter((p) => p.id !== product.id).slice(0, 6))
    }
  }, [product])

  /** Show skeleton while product is loading */
  if (!product) {
    return (
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square skeleton rounded-2xl" /> {/* Image skeleton */}
          <div className="space-y-4">
            <div className="h-4 w-24 skeleton" /> {/* Badge skeleton */}
            <div className="h-10 w-3/4 skeleton" /> {/* Name skeleton */}
            <div className="h-4 w-20 skeleton" /> {/* Brand skeleton */}
            <div className="h-8 w-32 skeleton" /> {/* Price skeleton */}
            <div className="h-24 skeleton" /> {/* Description skeleton */}
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
    setAdding(true) // Show loading state
    const cart = JSON.parse(localStorage.getItem('cart') || '[]') // Read existing cart
    const existing = cart.findIndex((item: any) => item.id === product.id) // Check if already in cart
    if (existing >= 0) {
      cart[existing].qty += qty // Increase quantity if already in cart
    } else {
      cart.push({ ...product, qty }) // Add new item with quantity
    }
    localStorage.setItem('cart', JSON.stringify(cart)) // Save to localStorage
    window.dispatchEvent(new Event('cart-updated')) // Notify Navbar about cart update
    // Dispatch notification for the navbar bell
    window.dispatchEvent(new CustomEvent('new-notification', {
      detail: {
        type: 'order' as const,
        title: 'Added to Cart',
        message: `${product.name} × ${qty} added to your cart.`,
        link: '/cart',
      },
    }))
    router.push('/cart') // Redirect to cart page
  }

  return (
    <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">

        {/* ═══════════════════════════════════════════════════════
            LEFT: Product Image
            Large image card that "floats" with subtle depth
            ═══════════════════════════════════════════════════════ */}
        <ScrollReveal variant="image">
          <div className="card p-3 rounded-2xl overflow-hidden relative">
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1696494561079-ddabcbb308e8?w=800&h=800&fit=crop&q=80'}
              alt={product.name} // Alt text for accessibility
              className="w-full aspect-square object-cover rounded-xl" // Full width, square aspect
            />
            {/* Stock badge — top-right corner */}
            <div className="absolute top-5 right-5">
              {product.stock > 10 ? (
                <span className="badge">In Stock</span> // Green badge for sufficient stock
              ) : (
                <span className="badge" style={{ background: 'var(--color-warning)', color: '#000' }}>
                  Only {product.stock} left {/* Warning badge for low stock */}
                </span>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════
            RIGHT: Product Details
            Name, price, specs, compatibility, CTA
            All elements stagger in from the right
            ═══════════════════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* Category badge + Name — text animation with delay */}
          <ScrollReveal variant="text" delay={0.1}>
            <span className="badge mb-3 inline-block">{product.category}</span>
            <h1
              className="text-3xl sm:text-4xl font-extrabold leading-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {product.name}
            </h1>
            <p className="text-sm text-[var(--color-text-dim)] mt-2">{product.brand}</p>
          </ScrollReveal>

          {/* Price — large lime gradient text */}
          <ScrollReveal variant="text" delay={0.15}>
            <p className="text-3xl sm:text-4xl font-extrabold glow-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
              ${product.price.toFixed(2)}
            </p>
          </ScrollReveal>

          {/* Description — text animation */}
          <ScrollReveal variant="text" delay={0.2}>
            <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
              {product.description}
            </p>
          </ScrollReveal>

          {/* ═══ 01 — Specifications ═══ */}
          <ScrollReveal variant="card" delay={0.25}>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-2xl font-black text-[var(--color-accent)] opacity-30"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  01 {/* Section number — decorative */}
                </span>
                <h3 className="font-semibold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Specifications
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {product.specifications.map((spec) => (
                  <div key={spec.key} className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-dim)]">{spec.key}</span> {/* Spec label */}
                    <span className="font-medium">{spec.value}</span> {/* Spec value */}
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* ═══ 02 — Compatible Vehicles ═══ */}
          <ScrollReveal variant="card" delay={0.3}>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-2xl font-black text-[var(--color-accent)] opacity-30"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  02 {/* Section number */}
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
                    {v} {/* Vehicle name as pill badge */}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* ═══ 03 — Delivery Promise ═══ */}
          <ScrollReveal variant="card" delay={0.35}>
            <div className="card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center shrink-0">
                <TruckIcon className="w-5 h-5 text-[var(--color-accent)]" /> {/* Truck icon */}
              </div>
              <div>
                <p className="text-sm font-semibold">Delivery in 30 minutes</p>
                <p className="text-xs text-[var(--color-text-dim)]">
                  Order within the next 2 hours for same-day delivery
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* ═══ Quantity Selector + Add to Cart ═══ */}
          <ScrollReveal variant="text" delay={0.4}>
            <div className="space-y-4">
              {/* Quantity controls */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-[var(--color-text-dim)]">Qty:</span>
                <div className="flex items-center gap-0">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))} // Decrease qty, min 1
                    className="w-10 h-10 rounded-l-lg border border-[var(--color-border)] flex items-center justify-center
                               hover:bg-[var(--color-surface-alt)] transition-colors text-lg"
                  >
                    &minus; {/* Minus sign */}
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center border-y border-[var(--color-border)] text-sm font-medium">
                    {qty} {/* Current quantity */}
                  </span>
                  <button
                    onClick={() => setQty(qty + 1)} // Increase qty
                    className="w-10 h-10 rounded-r-lg border border-[var(--color-border)] flex items-center justify-center
                               hover:bg-[var(--color-surface-alt)] transition-colors text-lg"
                  >
                    + {/* Plus sign */}
                  </button>
                </div>
              </div>

              {/* Add to Cart button — coral/orange pill */}
              <button
                onClick={handleAddToCart} // Add to cart handler
                disabled={adding} // Disable during loading
                className="glass-button w-full py-3.5 text-base"
              >
                {adding ? 'Adding...' : `Add to Cart — $${(product.price * qty).toFixed(2)}`} {/* Dynamic label */}
              </button>

              {/* Trust badges below CTA */}
              <div className="flex items-center justify-center gap-4 text-xs text-[var(--color-text-dim)]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-4 h-4 text-[var(--color-accent)]" /> {/* Shield icon */}
                  <span>Secure Checkout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TruckIcon className="w-4 h-4 text-[var(--color-accent)]" /> {/* Truck icon */}
                  <span>Free Delivery</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ═══ RECENTLY VIEWED (LRU Cache) ═══ */}
      {recentlyViewed.length > 0 && (
        <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <ScrollReveal variant="fade">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-accent)] block mb-2">
              Continue Browsing
            </span>
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Recently Viewed
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentlyViewed.map((item, index) => (
              <ScrollReveal key={item.id} variant="card" delay={index * 0.05}>
                <Link href={`/products/${item.id}`}>
                  <div className="card p-0 overflow-hidden group cursor-pointer">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{item.brand}</p>
                      <p className="text-sm font-medium truncate mt-0.5">{item.name}</p>
                      <p className="text-sm font-bold mt-1" style={{ color: 'var(--color-accent)' }}>
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
