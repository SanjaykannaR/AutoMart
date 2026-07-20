import express from 'express'
import { PrismaClient } from '../src/generated/product'
import { z } from 'zod'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PRODUCT_SERVICE_PORT || 3002

app.use(express.json())

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  brand: z.string().min(1),
  price: z.number().positive(),
  categoryId: z.string().min(1),
  vehicleType: z.enum(['car', 'bike', 'both']).default('both'),
  compatibleVehicles: z.array(z.string()).default([]),
  specifications: z.any().optional(),
  stock: z.number().int().min(0).default(0),
  imageUrl: z.string().optional(),
})

app.get('/products', async (req, res) => {
  const { category, brand, minPrice, maxPrice, vehicleType, search } = req.query
  const where: any = {}

  if (category) where.categoryId = category
  if (brand) where.brand = { contains: brand as string, mode: 'insensitive' }
  if (search) where.name = { contains: search as string, mode: 'insensitive' }
  if (vehicleType) where.vehicleType = { in: [vehicleType as string, 'both'] }
  if (minPrice || maxPrice) {
    where.price = {}
    if (minPrice) where.price.gte = parseFloat(minPrice as string)
    if (maxPrice) where.price.lte = parseFloat(maxPrice as string)
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(products.map(p => ({ ...p, compatibleVehicles: JSON.parse(p.compatibleVehicles || '[]') })))
})

app.get('/products/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  })
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.json({ ...product, compatibleVehicles: JSON.parse(product.compatibleVehicles || '[]') }), async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { category: true },
  })
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.json({ ...product, compatibleVehicles: JSON.parse(product.compatibleVehicles || '[]') }), async (req, res) => {
  try {
    const data = productSchema.parse(req.body)
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const product = await prisma.product.create({ data: { ...data, compatibleVehicles: JSON.stringify(data.compatibleVehicles), slug } })
    res.status(201).json(product)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    res.status(500).json({ error: 'Failed to create product' })
  }
})

app.get('/categories', async (_req, res) => {
  const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } } })
  res.json(categories)
})

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'product-service' }))

app.listen(PORT, () => {
  console.log(`[Product Service] running on port ${PORT}`)
})
