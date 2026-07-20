import express from 'express'
import { PrismaClient } from '../src/generated/inventory'
import { z } from 'zod'
import Redis from 'ioredis'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.INVENTORY_SERVICE_PORT || 3005
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

app.use(express.json())

function errorResponse(res: express.Response, status: number, code: string, message: string, hint?: string) {
  return res.status(status).json({ code, message, ...(hint ? { hint } : {}) })
}

const reserveSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
})

// ─── GET /inventory/:productId ─────────────────────────────────────────────────
app.get('/inventory/:productId', async (req, res) => {
  try {
    const item = await prisma.inventoryItem.findUnique({ where: { productId: req.params.productId } })
    if (!item) {
      return errorResponse(res, 404, 'INVENTORY_NOT_FOUND',
        `No inventory record found for product "${req.params.productId}".`,
        'The product may not have been added to inventory yet. Create an inventory entry for it first.')
    }
    res.json({
      productId: item.productId,
      available: item.quantity - item.reserved,
      quantity: item.quantity,
      reserved: item.reserved,
    })
  } catch (err) {
    console.error('[Inventory] Lookup error:', err)
    return errorResponse(res, 500, 'INVENTORY_LOOKUP_FAILED',
      `Failed to check inventory for product "${req.params.productId}".`,
      'Check inventory-service logs and verify the database is running.')
  }
})

// ─── POST /inventory/reserve ───────────────────────────────────────────────────
app.post('/inventory/reserve', async (req, res) => {
  try {
    const { productId, quantity } = reserveSchema.parse(req.body)

    const item = await prisma.inventoryItem.findUnique({ where: { productId } })
    if (!item) {
      return errorResponse(res, 404, 'INVENTORY_NOT_FOUND',
        `No inventory record found for product "${productId}".`,
        'The product may not have been added to inventory yet.')
    }

    const available = item.quantity - item.reserved
    if (available < quantity) {
      return errorResponse(res, 409, 'INVENTORY_INSUFFICIENT_STOCK',
        `Not enough stock for product "${productId}". Requested: ${quantity}, available: ${available}.`,
        'Reduce the requested quantity or restock this product before ordering.')
    }

    const updated = await prisma.inventoryItem.update({
      where: { productId },
      data: { reserved: { increment: quantity } },
    })
    res.json({ productId, reserved: updated.reserved, available: updated.quantity - updated.reserved })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      return errorResponse(res, 400, 'INVENTORY_INVALID_INPUT',
        `Reservation validation failed: ${messages}`,
        'Provide a valid productId (string) and quantity (positive integer).')
    }
    console.error('[Inventory] Reserve error:', err)
    return errorResponse(res, 500, 'INVENTORY_RESERVE_FAILED',
      'Failed to reserve inventory. The database may be unavailable.',
      'Check inventory-service logs for details.')
  }
})

// ─── POST /inventory/release ───────────────────────────────────────────────────
app.post('/inventory/release', async (req, res) => {
  try {
    const { productId, quantity } = reserveSchema.parse(req.body)

    const item = await prisma.inventoryItem.findUnique({ where: { productId } })
    if (!item) {
      return errorResponse(res, 404, 'INVENTORY_NOT_FOUND',
        `No inventory record found for product "${productId}".`,
        'Verify the product ID is correct.')
    }

    if (item.reserved < quantity) {
      return errorResponse(res, 400, 'INVENTORY_RELEASE_EXCEEDS_RESERVED',
        `Cannot release ${quantity} units — only ${item.reserved} are reserved for product "${productId}".`,
        'You can only release units that were previously reserved.')
    }

    const updated = await prisma.inventoryItem.update({
      where: { productId },
      data: { reserved: { decrement: quantity } },
    })
    res.json({ productId, available: updated.quantity - updated.reserved })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      return errorResponse(res, 400, 'INVENTORY_INVALID_INPUT',
        `Release validation failed: ${messages}`,
        'Provide a valid productId (string) and quantity (positive integer).')
    }
    console.error('[Inventory] Release error:', err)
    return errorResponse(res, 500, 'INVENTORY_RELEASE_FAILED',
      'Failed to release inventory reservation. The database may be unavailable.',
      'Check inventory-service logs for details.')
  }
})

// ─── POST /inventory/confirm ───────────────────────────────────────────────────
app.post('/inventory/confirm', async (req, res) => {
  try {
    const { productId, quantity } = reserveSchema.parse(req.body)

    const item = await prisma.inventoryItem.findUnique({ where: { productId } })
    if (!item) {
      return errorResponse(res, 404, 'INVENTORY_NOT_FOUND',
        `No inventory record found for product "${productId}".`,
        'Verify the product ID is correct.')
    }

    if (item.reserved < quantity) {
      return errorResponse(res, 400, 'INVENTORY_CONFIRM_EXCEEDS_RESERVED',
        `Cannot confirm ${quantity} units — only ${item.reserved} are reserved for product "${productId}".`,
        'Ensure you have reserved at least this many units before confirming.')
    }

    const updated = await prisma.inventoryItem.update({
      where: { productId },
      data: {
        quantity: { decrement: quantity },
        reserved: { decrement: quantity },
      },
    })
    res.json({ productId, available: updated.quantity - updated.reserved })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      return errorResponse(res, 400, 'INVENTORY_INVALID_INPUT',
        `Confirmation validation failed: ${messages}`,
        'Provide a valid productId (string) and quantity (positive integer).')
    }
    console.error('[Inventory] Confirm error:', err)
    return errorResponse(res, 500, 'INVENTORY_CONFIRM_FAILED',
      'Failed to confirm inventory deduction. The database may be unavailable.',
      'Check inventory-service logs for details.')
  }
})

// ─── Redis event listener ──────────────────────────────────────────────────────
redis.subscribe('order:created', (err) => {
  if (err) console.error('[Inventory] Redis subscribe error:', err)
})

redis.on('message', async (channel, message) => {
  if (channel === 'order:created') {
    try {
      const { items } = JSON.parse(message)
      for (const item of items) {
        await prisma.inventoryItem.update({
          where: { productId: item.id },
          data: { reserved: { increment: item.qty } },
        }).catch(() => {})
      }
    } catch (err) {
      console.error('[Inventory] Failed to process order event:', err)
    }
  }
})

// ─── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'inventory-service' }))

app.listen(PORT, () => {
  console.log(`[Inventory Service] running on port ${PORT}`)
})
