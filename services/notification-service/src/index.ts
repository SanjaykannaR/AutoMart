import express from 'express'
import Redis from 'ioredis'
import nodemailer from 'nodemailer'

const app = express()
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3006
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

app.use(express.json())

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.RESEND_API_KEY || '',
  },
})

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] Mock send to ${to}: ${subject}`)
    return
  }
  await transporter.sendMail({ from: 'AutoMart <orders@automart.app>', to, subject, html })
}

async function sendSMS(to: string, message: string) {
  console.log(`[SMS] Mock send to ${to}: ${message}`)
}

const statusMessages: Record<string, { subject: string; message: string }> = {
  confirmed: {
    subject: 'Order Confirmed',
    message: 'Your order has been confirmed and we are preparing it.',
  },
  picked: {
    subject: 'Order Picked Up',
    message: 'Your order has been picked from the store and is on its way.',
  },
  shipped: {
    subject: 'Out for Delivery',
    message: 'Your order is out for delivery. Expected in 15-20 minutes.',
  },
  delivered: {
    subject: 'Order Delivered',
    message: 'Your order has been delivered. Thank you for shopping with AutoMart!',
  },
}

async function handleOrderEvent(message: string) {
  try {
    const data = JSON.parse(message)
    const { orderId, status, userId, items, total } = data

    if (status && statusMessages[status]) {
      const info = statusMessages[status]
      const itemList = Array.isArray(items) ? items.map((i: any) => i.name).join(', ') : ''

      await sendEmail(
        'user@example.com',
        `AutoMart - ${info.subject} (#${orderId.slice(0, 8)})`,
        `<p>${info.message}</p><p>Order: ${itemList}</p><p>Total: $${total}</p>`,
      )

      await sendSMS(
        '+1234567890',
        `AutoMart: ${info.subject} for order #${orderId.slice(0, 8)}. ${info.message}`,
      )
    }
  } catch (err) {
    console.error('[Notification] Failed to process event:', err)
  }
}

redis.subscribe('order:created', 'order:status_changed', (err) => {
  if (err) console.error('[Notification] Redis subscribe error:', err)
  else console.log('[Notification] Listening for order events')
})

redis.on('message', async (_channel, message) => {
  await handleOrderEvent(message)
})

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }))

app.listen(PORT, () => {
  console.log(`[Notification Service] running on port ${PORT}`)
})
