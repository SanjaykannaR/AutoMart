/**
 * Notification Service — sends email and SMS notifications for order events.
 * Subscribes to Redis channels for order:created and order:status_changed.
 * Email goes through Resend SMTP; SMS is mocked for now.
 * Falls back to mock mode (log-only) when no RESEND_API_KEY is set.
 */
import express from 'express'
import Redis from 'ioredis'
import nodemailer from 'nodemailer'
import {
  orderConfirmationEmail,
  orderStatusEmail,
  welcomeEmail,
  passwordResetEmail,
} from './templates'

const app = express()
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3006
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

app.use(express.json())

// ─── In-memory notification store ────────────────────────────────────────────
// Notifications are kept in memory for listing. For production, use a database.
interface StoredNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'promo' | 'system'
  audience: 'all' | string // 'all' for broadcast, or userId
  createdAt: string
}
const notifications: StoredNotification[] = []

/** Helper: extract userId from JWT in Authorization header (no verification — gateway does that) */
function getUserId(req: express.Request): string | null {
  const header = req.headers.authorization
  if (!header) return null
  try {
    const token = header.split(' ')[1]
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.id
  } catch { return null }
}

/** Helper: extract user role from JWT */
function getUserRole(req: express.Request): string | null {
  const header = req.headers.authorization
  if (!header) return null
  try {
    const token = header.split(' ')[1]
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.role || null
  } catch { return null }
}

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
 * - 'order:created' → sends order confirmation email
 * - 'order:status_changed' → sends status update email + SMS
 */
async function handleOrderEvent(message: string) {
  try {
    const data = JSON.parse(message)
    const { orderId, status, userId, items, total, address, userName, userEmail } = data

    if (!orderId) {
      console.warn('[Notification] Received event without orderId — skipping.')
      return
    }

    const displayName = userName || 'Customer'

    // Order created → send confirmation email
    if (!status && items) {
      const html = orderConfirmationEmail({
        orderId,
        userName: displayName,
        items,
        total: total || 0,
        address: address || 'Not specified',
      })
      await sendEmail(
        userEmail || 'user@example.com',
        `AutoMart — Order Confirmed #${orderId.slice(0, 8)}`,
        html,
      )
      console.log(`[Notification] Sent order confirmation for #${orderId.slice(0, 8)}`)
      return
    }

    // Status change → send status update email
    if (status && statusMessages[status]) {
      const info = statusMessages[status]
      const html = orderStatusEmail({
        orderId,
        status,
        userName: displayName,
        total,
      })

      await sendEmail(
        userEmail || 'user@example.com',
        `AutoMart — ${info.subject} (#${orderId.slice(0, 8)})`,
        html,
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

/**
 * Processes user events from Redis (registration, password reset).
 */
async function handleUserEvent(message: string) {
  try {
    const data = JSON.parse(message)
    const { type, userName, userEmail, code } = data

    if (type === 'registered') {
      const html = welcomeEmail({ userName: userName || 'User', email: userEmail || '' })
      await sendEmail(userEmail, 'Welcome to AutoMart!', html)
      console.log(`[Notification] Sent welcome email to ${userEmail}`)
    } else if (type === 'password_reset') {
      const html = passwordResetEmail({ userName: userName || 'User', code: code || '' })
      await sendEmail(userEmail, 'AutoMart — Password Reset Code', html)
      console.log(`[Notification] Sent password reset email to ${userEmail}`)
    }
  } catch (err) {
    console.error('[Notification] Failed to process user event:', err)
  }
}

// ─── Redis subscription ────────────────────────────────────────────────────────
redis.subscribe('order:created', 'order:status_changed', 'user:registered', 'user:password_reset', (err) => {
  if (err) {
    console.error('[Notification] Redis subscribe error:', err.message)
    console.error('[Notification] Notifications will not work without Redis. Set REDIS_URL to a running Redis instance.')
  } else {
    console.log('[Notification] Listening for order + user events on Redis')
  }
})

redis.on('error', (err) => {
  console.error('[Notification] Redis connection error:', err.message)
})

redis.on('message', async (channel, message) => {
  if (channel.startsWith('user:')) {
    await handleUserEvent(message)
  } else {
    await handleOrderEvent(message)
  }
})

// ─── POST /notifications/broadcast ────────────────────────────────────────────
// Admin-only: sends a notification to all users. Stores it for listing.
app.post('/notifications/broadcast', (req, res) => {
  const role = getUserRole(req)
  if (role !== 'admin') {
    return errorResponse(res, 403, 'NOTIFICATION_FORBIDDEN',
      'Only admins can broadcast notifications.',
      'Log in as admin to send broadcast notifications.')
  }

  const { title, message, type } = req.body
  if (!title || !message) {
    return errorResponse(res, 400, 'NOTIFICATION_MISSING_FIELDS',
      'Both "title" and "message" are required.',
      'Provide title and message in the request body.')
  }

  const validTypes = ['info', 'warning', 'promo', 'system']
  const notifType = validTypes.includes(type) ? type : 'info'

  const notification: StoredNotification = {
    id: crypto.randomUUID(),
    title,
    message,
    type: notifType,
    audience: 'all',
    createdAt: new Date().toISOString(),
  }
  notifications.unshift(notification) // newest first

  // Keep only the last 100 notifications in memory
  if (notifications.length > 100) notifications.length = 100

  // Publish to Redis so notification-service itself logs it
  redis.publish('notification:broadcast', JSON.stringify(notification))
    .catch((err: any) => console.warn('[Notification] Could not publish broadcast to Redis (non-fatal):', err.message))

  console.log(`[Notification] Broadcast sent: "${title}" (type: ${notifType})`)
  res.status(201).json(notification)
})

// ─── GET /notifications ──────────────────────────────────────────────────────
// Returns notifications visible to the current user: broadcasts + their own.
app.get('/notifications', (req, res) => {
  const userId = getUserId(req)
  // Return all broadcast notifications (audience === 'all') + user-specific ones
  const visible = notifications.filter(n => n.audience === 'all' || n.audience === userId)
  res.json(visible)
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
