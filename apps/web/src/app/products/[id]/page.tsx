'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { GlassCard } from '@/components/GlassCard'

const mockProduct = {
  id: '1',
  name: 'Ceramic Brake Pads',
  category: 'Brake System',
  brand: 'Bosch',
  price: 45.99,
  description: 'High-performance ceramic brake pads for sedans and SUVs. Low dust, quiet braking, and extended lifespan.',
  specifications: [
    { key: 'Material', value: 'Ceramic' },
    { key: 'Fits', value: 'Sedan, SUV, Crossover' },
    { key: 'Warranty', value: '2 Years' },
    { key: 'OEM', value: 'Yes' },
  ],
  compatibleVehicles: [
    'Honda Civic 2016-2024',
    'Toyota Corolla 2014-2024',
    'Hyundai Elantra 2017-2024',
    'Kia Forte 2019-2024',
  ],
  imageUrl: '',
  stock: 42,
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<typeof mockProduct | null>(null)
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`)
      .then((r) => r.json())
      .then(setProduct)
      .catch(() => setProduct(mockProduct))
  }, [id])

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 w-24 skeleton" />
            <div className="h-8 w-3/4 skeleton" />
            <div className="h-5 w-20 skeleton" />
            <div className="h-24 skeleton" />
          </div>
        </div>
      </div>
    )
  }

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.findIndex((item: any) => item.id === product.id)
    if (existing >= 0) {
      cart[existing].qty += qty
    } else {
      cart.push({ ...product, qty })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    router.push('/cart')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <GlassCard className="p-0 overflow-hidden">
            <div className="aspect-square bg-[var(--color-surface-light)] flex items-center justify-center">
              <span className="text-6xl">🛞</span>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              {product.category}
            </p>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{product.brand}</p>
          </div>

          <p className="text-3xl font-bold glow-text">${product.price.toFixed(2)}</p>

          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {product.description}
          </p>

          <div>
            <h3 className="font-semibold text-sm mb-3">Specifications</h3>
            <div className="space-y-2">
              {product.specifications.map((spec) => (
                <div key={spec.key} className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">{spec.key}</span>
                  <span>{spec.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Compatible Vehicles</h3>
            <div className="flex flex-wrap gap-2">
              {product.compatibleVehicles.map((v) => (
                <span
                  key={v}
                  className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5"
              >
                -
              </button>
              <span className="w-10 text-center">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5"
              >
                +
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-muted)]">
              {product.stock > 10 ? '✓ In Stock' : `Only ${product.stock} left`}
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleAddToCart} className="glass-button flex-1">
              Add to Cart — ${(product.price * qty).toFixed(2)}
            </button>
          </div>

          <div className="glass p-4 flex items-center gap-3 text-sm">
            <span className="text-2xl">🚚</span>
            <div>
              <p className="font-medium">Delivery in 30 minutes</p>
              <p className="text-[var(--color-text-muted)] text-xs">
                Order within the next 2 hours for delivery by 6 PM
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
