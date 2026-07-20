import express from 'express'
import { PrismaClient } from '../src/generated/inventory'
import { z } from 'zod'
import Redis from 'ioredis'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.INVENTORY_SERVICE_PORT || 3005
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

app.use(express.json())

const reserveSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
})

app.get('/inventory/:productId', async (req, res) => {
  const item = await prisma.inventoryItem.findUnique({ where: { productId: req.params.productId } })
  if (!item) return res.status(404).json({ error: 'Product not found in inventory' })
  res.json({
    productId: item.productId,
    available: item.quantity - item.reserved,
    quantity: item.quantity,
    reserved: item.reserved,
  })
})

app.post('/inventory/reserve', async (req, res) => {
  try {
    const { productId, quantity } = reserveSchema.parse(req.body)
    const item = await prisma.inventoryItem.findUnique({ where: { productId } })
    if (!item) return res.status(404).json({ error: 'Product not found' })
    if (item.quantity - item.reserved < quantity) {
      return res.status(409).json({ error: 'Insufficient stock' })
    }
    const updated = await prisma.inventoryItem.update({
      where: { productId },
      data: { reserved: { increment: quantity } },
    })
    res.json({ productId, reserved: updated.reserved, available: updated.quantity - updated.reserved })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    res.status(500).json({ error: 'Reservation failed' })
  }
})

app.post('/inventory/release', async (req, res) => {
  try {
    const { productId, quantity } = reserveSchema.parse(req.body)
    const updated = await prisma.inventoryItem.update({
      where: { productId },
      data: { reserved: { decrement: quantity } },
    })
    res.json({ productId, available: updated.quantity - updated.reserved })
  } catch {
    res.status(500).json({ error: 'Release failed' })
  }
})

app.post('/inventory/confirm', async (req, res) => {
  try {
    const { productId, quantity } = reserveSchema.parse(req.body)
    const updated = await prisma.inventoryItem.update({
      where: { productId },
      data: {
        quantity: { decrement: quantity },
        reserved: { decrement: quantity },
      },
    })
    res.json({ productId, available: updated.quantity - updated.reserved })
  } catch {
    res.status(500).json({ error: 'Confirmation failed' })
  }
})

// Listen for order events to reserve inventory
redis.subscribe('order:created', (err) => {
  if (err) console.error('[Inventory] Redis subscribe error:', err)
})

redis.on('message', async (channel, message) => {
  if (channel === 'order:created') {
    const { items } = JSON.parse(message)
    for (const item of items) {
      await prisma.inventoryItem.update({
        where: { productId: item.id },
        data: { reserved: { increment: item.qty } },
      }).catch(() => {})
    }
  }
})

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'inventory-service' }))

app.listen(PORT, () => {
  console.log(`[Inventory Service] running on port ${PORT}`)
})
