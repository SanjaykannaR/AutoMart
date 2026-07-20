import express from 'express'
import { PrismaClient } from '../src/generated/order'
import { z } from 'zod'
import Redis from 'ioredis'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.ORDER_SERVICE_PORT || 3004
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

app.use(express.json())

function errorResponse(res: express.Response, status: number, code: string, message: string, hint?: string) {
  return res.status(status).json({ code, message, ...(hint ? { hint } : {}) })
}

const orderSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1, 'Each item must have a product ID'),
    name: z.string().min(1, 'Each item must have a name'),
    price: z.number().positive('Each item price must be positive'),
    qty: z.number().int().positive('Each item quantity must be at least 1'),
  })).min(1, 'Order must contain at least one item'),
  total: z.number().positive('Order total must be greater than zero'),
  address: z.string().min(5, 'Delivery address must be at least 5 characters'),
  phone: z.string().min(5, 'Phone number must be at least 5 characters'),
  note: z.string().optional(),
})

function getUserId(req: express.Request): string {
  const header = req.headers.authorization
  if (!header) return 'anonymous'
  try {
    const token = header.split(' ')[1]
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.id
  } catch {
    return 'anonymous'
  }
}

// ─── POST /orders ──────────────────────────────────────────────────────────────
app.post('/orders', async (req, res) => {
  try {
    const data = orderSchema.parse(req.body)
    const userId = getUserId(req)

    // Validate total matches items sum
    const itemsTotal = data.items.reduce((sum, item) => sum + item.price * item.qty, 0)
    if (Math.abs(itemsTotal - data.total) > 0.01) {
      return errorResponse(res, 400, 'ORDER_TOTAL_MISMATCH',
        `Order total ($${data.total}) does not match the sum of item prices ($${itemsTotal.toFixed(2)}).`,
        'Recalculate the total to equal the sum of (price × quantity) for all items.')
    }

    const estimatedDelivery = new Date(Date.now() + 30 * 60 * 1000)

    const order = await prisma.order.create({
      data: {
        userId,
        items: JSON.stringify(data.items),
        total: data.total,
        address: data.address,
        phone: data.phone,
        note: data.note,
        status: 'pending',
        estimatedDelivery,
      },
    })

    // Publish event (non-blocking — don't fail the order if Redis is down)
    redis.publish('order:created', JSON.stringify({
      orderId: order.id,
      userId,
      items: data.items,
      total: data.total,
    })).catch((err) => console.warn('[Order] Could not publish to Redis (non-fatal):', err.message))

    res.status(201).json(order)
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      return errorResponse(res, 400, 'ORDER_INVALID_INPUT',
        `Order validation failed: ${messages}`,
        'Ensure items array is non-empty, each has id/name/price/qty, total > 0, address >= 5 chars, phone >= 5 chars.')
    }
    console.error('[Order] Create error:', err)
    return errorResponse(res, 500, 'ORDER_CREATE_FAILED',
      'Failed to create order. The database may be unavailable.',
      'Check order-service logs and verify the database is running.')
  }
})

// ─── GET /orders ────────────────────────────────────────────────────────────────
app.get('/orders', async (req, res) => {
  try {
    const userId = getUserId(req)
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items) })))
  } catch (err) {
    console.error('[Order] List error:', err)
    return errorResponse(res, 500, 'ORDER_LIST_FAILED',
      'Failed to retrieve orders from the database.',
      'Check order-service logs and verify the database is running.')
  }
})

// ─── GET /orders/:id ───────────────────────────────────────────────────────────
app.get('/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) {
      return errorResponse(res, 404, 'ORDER_NOT_FOUND',
        `No order found with ID "${req.params.id}".`,
        'Verify the order ID is correct. It may have been deleted or never existed.')
    }
    res.json({ ...order, items: JSON.parse(order.items) })
  } catch (err) {
    console.error('[Order] Get by ID error:', err)
    return errorResponse(res, 500, 'ORDER_FETCH_FAILED',
      `Failed to fetch order "${req.params.id}". The database may be unavailable.`,
      'Check order-service logs for details.')
  }
})

// ─── PATCH /orders/:id/status ──────────────────────────────────────────────────
app.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'confirmed', 'picked', 'shipped', 'delivered', 'cancelled']
    if (!status) {
      return errorResponse(res, 400, 'ORDER_MISSING_STATUS',
        'No "status" field provided in the request body.',
        `Include a status value. Valid options: ${validStatuses.join(', ')}.`)
    }
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 400, 'ORDER_INVALID_STATUS',
        `"${status}" is not a valid order status.`,
        `Valid statuses are: ${validStatuses.join(', ')}.`)
    }

    // Check order exists
    const existing = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return errorResponse(res, 404, 'ORDER_NOT_FOUND',
        `No order found with ID "${req.params.id}".`,
        'Verify the order ID is correct.')
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['picked', 'cancelled'],
      picked: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    }
    if (!validTransitions[existing.status]?.includes(status)) {
      return errorResponse(res, 400, 'ORDER_INVALID_TRANSITION',
        `Cannot transition from "${existing.status}" to "${status}".`,
        `Valid transitions from "${existing.status}": ${validTransitions[existing.status]?.join(', ') || 'none'}.`)
    }

    const data: any = { status }
    if (status === 'delivered') data.deliveredAt = new Date()

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data,
    })

    // Publish event (non-blocking)
    redis.publish('order:status_changed', JSON.stringify({
      orderId: order.id,
      status: order.status,
    })).catch((err) => console.warn('[Order] Could not publish status change to Redis (non-fatal):', err.message))

    res.json(order)
  } catch (err) {
    console.error('[Order] Status update error:', err)
    return errorResponse(res, 500, 'ORDER_STATUS_UPDATE_FAILED',
      `Failed to update status for order "${req.params.id}".`,
      'Check order-service logs for details.')
  }
})

// ─── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'order-service' }))

app.listen(PORT, () => {
  console.log(`[Order Service] running on port ${PORT}`)
})
