/**
 * Product Service — manages the product catalog with CRUD operations.
 * Auto-generates URL slugs from product names, supports filtering by
 * category/brand/price/vehicle type, and includes category management.
 */
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

/** Deserializes JSON fields from the DB — handles both string (SQLite) and object (PostgreSQL) formats. */
function parseProduct(p: any) {
  const cv = p.compatibleVehicles
  const specs = p.specifications
  return {
    ...p,
    price: Number(p.price), // Prisma Decimal returns strings — ensure number
    compatibleVehicles: typeof cv === 'string' ? JSON.parse(cv || '[]') : (cv ?? []),
    specifications: typeof specs === 'string' ? JSON.parse(specs || '{}') : (specs ?? null),
  }
}

// ─── GET /products ──────────────────────────────────────────────────────────────
// Lists products with optional filters. Supports category, brand (substring
// match), price range, vehicle type, and text search. Results are newest-first.
app.get('/products', async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, vehicleType, search } = req.query
    const where: any = {}

    if (category) where.categoryId = category
    if (brand) where.brand = { contains: brand as string }
    if (search) where.name = { contains: search as string }
    // When filtering by vehicleType, also include 'both' since those parts fit any vehicle
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
// Creates a new product. Auto-generates a URL-friendly slug from the name
// (e.g. "Brake Pad Set" → "brake-pad-set") and checks for duplicates.
app.post('/products', async (req, res) => {
  try {
    const data = productSchema.parse(req.body)
    // Slug: lowercase, non-alphanumeric → hyphen, trim leading/trailing hyphens
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

// ─── PATCH /products/:id ──────────────────────────────────────────────────────
// Update an existing product. Accepts partial data — only provided fields are updated.
app.patch('/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse(res, 404, 'PRODUCT_NOT_FOUND', `Product with ID "${id}" not found.`)
    }

    const data = req.body
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.brand !== undefined) updateData.brand = data.brand
    if (data.price !== undefined) updateData.price = Number(data.price)
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.vehicleType !== undefined) updateData.vehicleType = data.vehicleType
    if (data.stock !== undefined) updateData.stock = Number(data.stock)
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.compatibleVehicles !== undefined) updateData.compatibleVehicles = JSON.stringify(data.compatibleVehicles)

    // Recalculate slug if name changed
    if (data.name && data.name !== existing.name) {
      updateData.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }

    const product = await prisma.product.update({ where: { id }, data: updateData })
    res.json(parseProduct(product))
  } catch (err) {
    console.error('[Product] Update error:', err)
    return errorResponse(res, 500, 'PRODUCT_UPDATE_FAILED', 'Failed to update product.')
  }
})

// ─── DELETE /products/:id ─────────────────────────────────────────────────────
// Delete a product by ID.
app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse(res, 404, 'PRODUCT_NOT_FOUND', `Product with ID "${id}" not found.`)
    }
    await prisma.product.delete({ where: { id } })
    res.json({ success: true, message: `Product "${existing.name}" deleted.` })
  } catch (err) {
    console.error('[Product] Delete error:', err)
    return errorResponse(res, 500, 'PRODUCT_DELETE_FAILED', 'Failed to delete product.')
  }
})

// ─── GET /categories ───────────────────────────────────────────────────────────
// Returns all categories with a product count for each. The count is
// used by the frontend to show how many parts exist in each category.
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
