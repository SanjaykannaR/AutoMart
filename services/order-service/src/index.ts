/**
 * Order Service — handles order creation, retrieval, and status updates.
 * Enforces a state machine for order lifecycle: pending → confirmed →
 * picked → shipped → delivered (each step is cancellable except delivered).
 * Publishes events to Redis so inventory and notification services react.
 */
import express from 'express'
import { PrismaClient } from '../src/generated/order'
import { z } from 'zod'
import Redis from 'ioredis'
import paymentsRouter from './payments'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.ORDER_SERVICE_PORT || 3004
// Redis is used as a pub/sub message bus — not for caching. Events are
// published here and consumed by inventory-service and notification-service.
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Stripe webhooks need the raw body for signature verification.
// Mount this BEFORE express.json() so the raw buffer is available at req.body.
app.use('/payments/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({
  verify: (req: any, _res: any, buf: Buffer) => {
    // Preserve raw Buffer for Stripe webhook — express.json() would otherwise overwrite it
    if (Buffer.isBuffer(req.body)) req.rawBody = buf
  },
}))

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

/**
 * Extracts the user ID from the JWT in the Authorization header.
 * Does NOT verify the token — the gateway's auth middleware already does.
 * Falls back to 'anonymous' for unauthenticated requests (e.g. testing).
 */
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

/** Extracts name and email from JWT for notification purposes */
function getUserInfo(req: express.Request): { name: string; email: string } {
  const header = req.headers.authorization
  if (!header) return { name: 'Customer', email: '' }
  try {
    const token = header.split(' ')[1]
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return { name: payload.name || 'Customer', email: payload.email || '' }
  } catch {
    return { name: 'Customer', email: '' }
  }
}

/**
 * Extracts the user role from the JWT. Returns null if not present or unparseable.
 */
function getUserRole(req: express.Request): string | null {
  const header = req.headers.authorization
  if (!header) return null
  try {
    const token = header.split(' ')[1]
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.role || null
  } catch {
    return null
  }
}

// ─── POST /orders ──────────────────────────────────────────────────────────────
// Creates a new order. Validates the total matches the sum of item prices
// to prevent cart tampering. Sets estimated delivery to 30 minutes.
// Publishes 'order:created' event to Redis for inventory and notification services.
app.post('/orders', async (req, res) => {
  try {
    const data = orderSchema.parse(req.body)
    const userId = getUserId(req)
    const userInfo = getUserInfo(req)

    // Server-side total validation — prevents client from sending a lower total
    const itemsTotal = data.items.reduce((sum, item) => sum + item.price * item.qty, 0)
    if (Math.abs(itemsTotal - data.total) > 0.01) {
      return errorResponse(res, 400, 'ORDER_TOTAL_MISMATCH',
        `Order total (₹${data.total}) does not match the sum of item prices (₹${itemsTotal.toFixed(2)}).`,
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
    // Downstream services (inventory, notification) will miss the event but
    // the order itself is still persisted and retrievable.
    redis.publish('order:created', JSON.stringify({
      orderId: order.id,
      userId,
      items: data.items,
      total: data.total,
      address: data.address,
      userName: userInfo.name,
      userEmail: userInfo.email,
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
// Returns orders. Admins see ALL orders; regular users see only their own.
app.get('/orders', async (req, res) => {
  try {
    const role = getUserRole(req)
    const where = role === 'admin' ? {} : { userId: getUserId(req) }
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders.map(o => ({ ...o, items: o.items })))
  } catch (err) {
    console.error('[Order] List error:', err)
    return errorResponse(res, 500, 'ORDER_LIST_FAILED',
      'Failed to retrieve orders from the database.',
      'Check order-service logs and verify the database is running.')
  }
})

// ─── GET /orders/stats ──────────────────────────────────────────────────────
// Admin dashboard: aggregated order statistics (total orders, revenue, status breakdown).
// MUST be defined before /orders/:id to avoid matching "stats" as an order ID.
app.get('/orders/stats', async (req, res) => {
  try {
    const role = getUserRole(req)
    if (role !== 'admin') {
      return errorResponse(res, 403, 'ORDER_STATS_FORBIDDEN',
        'Only admins can view order statistics.',
        'Log in as admin to access dashboard stats.')
    }

    const [totalOrders, totalRevenue, statusCounts] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
    ])

    const byStatus: Record<string, number> = {}
    statusCounts.forEach((s: any) => { byStatus[s.status] = s._count.status })

    res.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      byStatus,
    })
  } catch (err) {
    console.error('[Order] Stats error:', err)
    return errorResponse(res, 500, 'ORDER_STATS_FAILED',
      'Failed to compute order statistics.',
      'Check order-service logs and verify the database is running.')
  }
})

// ─── GET /orders/analytics ─────────────────────────────────────────────────
// Admin analytics: revenue trends, order trends (grouped by day), status breakdown,
// top products by revenue, average order value.
app.get('/orders/analytics', async (req, res) => {
  try {
    const role = getUserRole(req)
    if (role !== 'admin') {
      return errorResponse(res, 403, 'ANALYTICS_FORBIDDEN',
        'Only admins can view analytics.',
        'Log in as admin to access analytics.')
    }

    const days = Math.min(90, Math.max(7, parseInt(req.query.days as string) || 30))
    const since = new Date()
    since.setDate(since.getDate() - days)

    // Fetch all orders since the time window
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    })

    // ─── Revenue & Orders by Day ───
    const revenueByDay: Record<string, { revenue: number; orders: number }> = {}
    // Initialize all days in range with zeros
    for (let d = new Date(since); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10)
      revenueByDay[key] = { revenue: 0, orders: 0 }
    }
    orders.forEach((o: any) => {
      const day = o.createdAt.toISOString().slice(0, 10)
      if (!revenueByDay[day]) revenueByDay[day] = { revenue: 0, orders: 0 }
      revenueByDay[day].revenue += Number(o.total)
      revenueByDay[day].orders += 1
    })

    // ─── Status Breakdown ───
    const byStatus: Record<string, number> = {}
    orders.forEach((o: any) => { byStatus[o.status] = (byStatus[o.status] || 0) + 1 })

    // ─── Top Products by Revenue ───
    const productRevenue: Record<string, { name: string; revenue: number; qty: number }> = {}
    orders.forEach((o: any) => {
      // PostgreSQL stores items as JSON string, must parse
      const items = typeof o.items === 'string' ? JSON.parse(o.items) : (Array.isArray(o.items) ? o.items : [])
      items.forEach((item: any) => {
        const id = item.id || item.name || 'unknown'
        if (!productRevenue[id]) productRevenue[id] = { name: item.name || id, revenue: 0, qty: 0 }
        productRevenue[id].revenue += (item.price || 0) * (item.qty || 1)
        productRevenue[id].qty += item.qty || 1
      })
    })
    const topProducts = Object.values(productRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // ─── Summary Stats ───
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.total), 0)
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

    res.json({
      revenueByDay: Object.entries(revenueByDay).map(([date, data]) => ({ date, ...data })),
      byStatus,
      topProducts,
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue,
      days,
    })
  } catch (err) {
    console.error('[Order] Analytics error:', err)
    return errorResponse(res, 500, 'ANALYTICS_FAILED',
      'Failed to compute analytics.',
      'Check order-service logs and verify the database is running.')
  }
})

// ─── GET /orders/:id ───────────────────────────────────────────────────────────
// SECURITY (SEC-AUTHZ-3): returns an order ONLY if the caller is an admin OR
// the order's owner. Previously any authenticated user could read ANY order by
// iterating IDs (IDOR). The gateway also gates /orders behind auth, but we never
// trust the caller's claims here — we enforce ownership server-side too.
app.get('/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) {
      return errorResponse(res, 404, 'ORDER_NOT_FOUND',
        `No order found with ID "${req.params.id}".`,
        'Verify the order ID is correct. It may have been deleted or never existed.')
    }

    // Ownership / privilege check — deny access unless admin or the order owner.
    const role = getUserRole(req)
    const userId = getUserId(req)
    const isAdmin = role === 'admin'
    const isOwner = order.userId === userId
    if (!isAdmin && !isOwner) {
      return errorResponse(res, 403, 'ORDER_FORBIDDEN',
        'You do not have permission to view this order.',
        'Orders are only visible to the account that placed them, or to admins.')
    }

    res.json({ ...order, items: order.items })
  } catch (err) {
    console.error('[Order] Get by ID error:', err)
    return errorResponse(res, 500, 'ORDER_FETCH_FAILED',
      `Failed to fetch order "${req.params.id}". The database may be unavailable.`,
      'Check order-service logs for details.')
  }
})

// ─── PATCH /orders/:id/status ──────────────────────────────────────────────────
// SECURITY (SEC-AUTHZ-4): only admins may change order status. Previously ANY
// authenticated user could flip any order to delivered/cancelled. The gateway
// enforces admin for this path, and we re-check the role here (defense in depth)
// in case the service is ever reached outside the gateway (e.g. docker network).
app.patch('/orders/:id/status', async (req, res) => {
  try {
    // Role gate — only admins can mutate order state.
    const role = getUserRole(req)
    if (role !== 'admin') {
      return errorResponse(res, 403, 'ORDER_STATUS_FORBIDDEN',
        'Only admins can update order status.',
        'Log in as an admin to change order status.')
    }

    const { status } = req.body
    // All valid order statuses — used for both validation and the error hint
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

    // State machine: only certain transitions are allowed.
    // Once delivered or cancelled, no further changes are possible.
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

    // Publish event (non-blocking) — triggers notification emails/SMS
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

// ─── Stripe Payments ────────────────────────────────────────────────────────
app.use('/payments', paymentsRouter)

// ─── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'order-service' }))

app.listen(PORT, () => {
  console.log(`[Order Service] running on port ${PORT}`)
})
