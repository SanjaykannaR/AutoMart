import express from 'express'
import { PrismaClient } from '../src/generated/product'
import { z } from 'zod'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PRODUCT_SERVICE_PORT || 3002

app.use(express.json())

function errorResponse(res: express.Response, status: number, code: string, message: string, hint?: string) {
  return res.status(status).json({ code, message, ...(hint ? { hint } : {}) })
}

const productSchema = z.object({
  name: z.string().min(1, 'Product name cannot be empty'),
  description: z.string().min(1, 'Product description cannot be empty'),
  brand: z.string().min(1, 'Brand name cannot be empty'),
  price: z.number().positive('Price must be greater than zero'),
  categoryId: z.string().min(1, 'Category ID is required'),
  vehicleType: z.enum(['car', 'bike', 'both']).default('both'),
  compatibleVehicles: z.array(z.string()).default([]),
  specifications: z.any().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  imageUrl: z.string().optional(),
})

function parseProduct(p: any) {
  return { ...p, compatibleVehicles: JSON.parse(p.compatibleVehicles || '[]') }
}

// ─── GET /products ──────────────────────────────────────────────────────────────
app.get('/products', async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, vehicleType, search } = req.query
    const where: any = {}

    if (category) where.categoryId = category
    if (brand) where.brand = { contains: brand as string }
    if (search) where.name = { contains: search as string }
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
    res.json(products.map(parseProduct))
  } catch (err) {
    console.error('[Product] List error:', err)
    return errorResponse(res, 500, 'PRODUCT_LIST_FAILED',
      'Failed to retrieve products from the database.',
      'Check product-service logs and verify the database is running.')
  }
})

// ─── GET /products/:id ─────────────────────────────────────────────────────────
app.get('/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    })
    if (!product) {
      return errorResponse(res, 404, 'PRODUCT_NOT_FOUND',
        `No product found with ID "${req.params.id}".`,
        'Verify the product ID is correct. It may have been deleted or never existed.')
    }
    res.json(parseProduct(product))
  } catch (err) {
    console.error('[Product] Get by ID error:', err)
    return errorResponse(res, 500, 'PRODUCT_FETCH_FAILED',
      `Failed to fetch product "${req.params.id}". The database may be unavailable.`,
      'Check product-service logs for details.')
  }
})

// ─── GET /products/slug/:slug ──────────────────────────────────────────────────
app.get('/products/slug/:slug', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { category: true },
    })
    if (!product) {
      return errorResponse(res, 404, 'PRODUCT_NOT_FOUND',
        `No product found with slug "${req.params.slug}".`,
        'Verify the slug is correct — it is the URL-friendly name, not the display name.')
    }
    res.json(parseProduct(product))
  } catch (err) {
    console.error('[Product] Get by slug error:', err)
    return errorResponse(res, 500, 'PRODUCT_FETCH_FAILED',
      `Failed to fetch product with slug "${req.params.slug}".`,
      'Check product-service logs for details.')
  }
})

// ─── POST /products ────────────────────────────────────────────────────────────
app.post('/products', async (req, res) => {
  try {
    const data = productSchema.parse(req.body)
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Check for duplicate slug
    const existing = await prisma.product.findUnique({ where: { slug } })
    if (existing) {
      return errorResponse(res, 409, 'PRODUCT_DUPLICATE_SLUG',
        `A product with a similar name already exists (slug: "${slug}").`,
        'Use a more unique product name, or update the existing product instead.')
    }

    const product = await prisma.product.create({
      data: { ...data, compatibleVehicles: JSON.stringify(data.compatibleVehicles), slug },
    })
    res.status(201).json(product)
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      return errorResponse(res, 400, 'PRODUCT_INVALID_INPUT',
        `Product validation failed: ${messages}`,
        'Ensure all required fields are provided with correct types (name, description, brand, price > 0, categoryId).')
    }
    console.error('[Product] Create error:', err)
    return errorResponse(res, 500, 'PRODUCT_CREATE_FAILED',
      'Failed to create product. The database may be unavailable or a constraint was violated.',
      'Check product-service logs and verify the categoryId exists.')
  }
})

// ─── GET /categories ───────────────────────────────────────────────────────────
app.get('/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } } })
    res.json(categories)
  } catch (err) {
    console.error('[Product] Categories error:', err)
    return errorResponse(res, 500, 'CATEGORY_LIST_FAILED',
      'Failed to retrieve product categories.',
      'Check product-service logs and verify the database is running.')
  }
})

// ─── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'product-service' }))

app.listen(PORT, () => {
  console.log(`[Product Service] running on port ${PORT}`)
})
