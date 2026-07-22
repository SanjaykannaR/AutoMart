/**
 * Notification Service — sends email and SMS notifications for order events.
 * Subscribes to Redis channels for order:created and order:status_changed.
 * Email goes through Resend SMTP; SMS is mocked for now.
 * Falls back to mock mode (log-only) when no RESEND_API_KEY is set.
 */
import express from 'express'
import Redis from 'ioredis'
import nodemailer from 'nodemailer'

const app = express()
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3006
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

app.use(express.json())

function errorResponse(res: express.Response, status: number, code: string, message: string, hint?: string) {
  return res.status(status).json({ code, message, ...(hint ? { hint } : {}) })
}

// Nodemailer transport configured for Resend SMTP. In production this
// sends real emails; in dev without RESEND_API_KEY, sendEmail() logs instead.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.RESEND_API_KEY || '',
  },
})

async function sendEmail(to: string, subject: string, html: string) {
  // In mock mode (no API key), just log the email — no actual SMTP connection
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] Mock send to ${to}: ${subject}`)
    return
  }
  try {
    await transporter.sendMail({ from: 'AutoMart <orders@automart.app>', to, subject, html })
  } catch (err: any) {
    console.error(`[Email] Failed to send to ${to}:`, err.message)
    throw new Error(`Email delivery failed: ${err.message}. Check SMTP configuration (RESEND_API_KEY, SMTP_HOST).`)
  }
}

async function sendSMS(to: string, message: string) {
  // SMS is currently mocked — no real provider configured
  // TODO: integrate Twilio or similar when SMS notifications are needed
  console.log(`[SMS] Mock send to ${to}: ${message}`)
}

// Maps order statuses to human-readable notification content.
// Only known statuses trigger notifications — unknown ones are logged and skipped.
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

/**
 * Processes order events from Redis and dispatches notifications.
 * For 'order:created' events, no notification is sent (only status changes).
 * For status changes, sends both email and SMS to the user.
 */
async function handleOrderEvent(message: string) {
  try {
    const data = JSON.parse(message)
    const { orderId, status, userId, items, total } = data

    if (!orderId) {
      console.warn('[Notification] Received event without orderId — skipping.')
      return
    }

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

      console.log(`[Notification] Sent ${status} notifications for order #${orderId.slice(0, 8)}`)
    } else if (status) {
      console.warn(`[Notification] Unknown order status "${status}" for order #${orderId.slice(0, 8)} — no notification sent.`)
    }
  } catch (err) {
    console.error('[Notification] Failed to process event:', err)
  }
}

// ─── Redis subscription ────────────────────────────────────────────────────────
redis.subscribe('order:created', 'order:status_changed', (err) => {
  if (err) {
    console.error('[Notification] Redis subscribe error:', err.message)
    console.error('[Notification] Notifications will not work without Redis. Set REDIS_URL to a running Redis instance.')
  } else {
    console.log('[Notification] Listening for order events on Redis')
  }
})

redis.on('error', (err) => {
  console.error('[Notification] Redis connection error:', err.message)
})

redis.on('message', async (_channel, message) => {
  await handleOrderEvent(message)
})

// ─── Health ─────────────────────────────────────────────────────────────────────
// Reports 'ok' only if Redis is connected; 'degraded' otherwise.
// Also reports email provider mode so ops can tell if emails are real or mocked.
app.get('/health', (_req, res) => {
  const redisConnected = redis.status === 'ready'
  res.json({
    status: redisConnected ? 'ok' : 'degraded',
    service: 'notification-service',
    redis: redisConnected ? 'connected' : 'disconnected',
    emailProvider: process.env.RESEND_API_KEY ? 'configured' : 'mock-mode',
  })
})

app.listen(PORT, () => {
  console.log(`[Notification Service] running on port ${PORT}`)
  if (!process.env.RESEND_API_KEY) {
    console.log('[Notification] RESEND_API_KEY not set — emails will be logged but not sent.')
  }
})
