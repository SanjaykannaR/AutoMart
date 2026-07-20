import express from 'express'
import { PrismaClient } from '../src/generated/order'
import { z } from 'zod'
import Redis from 'ioredis'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.ORDER_SERVICE_PORT || 3004
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

app.use(express.json())

const orderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    qty: z.number().int().positive(),
  })),
  total: z.number().positive(),
  address: z.string().min(5),
  phone: z.string().min(5),
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

app.post('/orders', async (req, res) => {
  try {
    const data = orderSchema.parse(req.body)
    const userId = getUserId(req)

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

    // Publish order event for notification/inventory services
    await redis.publish('order:created', JSON.stringify({
      orderId: order.id,
      userId,
      items: data.items,
      total: data.total,
    }))

    res.status(201).json(order)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    res.status(500).json({ error: 'Failed to create order' })
  }
})

app.get('/orders', async (req, res) => {
  const userId = getUserId(req)
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items) }))), async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ ...order, items: JSON.parse(order.items) })

app.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body
  const validStatuses = ['pending', 'confirmed', 'picked', 'shipped', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  const data: any = { status }
  if (status === 'delivered') data.deliveredAt = new Date()

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data,
  })

  await redis.publish('order:status_changed', JSON.stringify({
    orderId: order.id,
    status: order.status,
  }))

  res.json(order)
})

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'order-service' }))

app.listen(PORT, () => {
  console.log(`[Order Service] running on port ${PORT}`)
})
