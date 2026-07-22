/**
 * API Gateway — single entry point for all client traffic.
 * Routes requests to backend microservices via http-proxy-middleware,
 * applies rate limiting and JWT auth where needed, and returns
 * structured error responses so the frontend always gets JSON.
 */
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { authMiddleware } from './middleware/auth'

const app = express()
const PORT = process.env.API_GATEWAY_PORT || 3000

// NOTE: Do NOT use express.json() here — it consumes the request body
// before http-proxy-middleware can forward it, causing empty bodies on
// proxied POST/PUT/PATCH requests.

// ─── Security headers (SEC-5) ─────────────────────────────────────────────────
// Helmet sets various HTTP headers: X-Content-Type-Options, X-Frame-Options,
// Strict-Transport-Security, Content-Security-Policy, etc.
app.use(helmet({
  contentSecurityPolicy: false, // Allow Next.js inline scripts/styles
  crossOriginEmbedderPolicy: false, // Allow cross-origin images/fonts
}))

// ─── CORS (SEC-1) ─────────────────────────────────────────────────────────────
// Allow frontend origin(s) for cross-origin API calls from the browser.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3080')
  .split(',').map(s => s.trim())

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server, mobile apps)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS blocked: origin "${origin}" is not allowed.`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // Cache preflight for 24 hours
}))

/** Standardised error envelope — every API error follows this shape. */
function errorResponse(res: express.Response, status: number, code: string, message: string, hint?: string) {
  return res.status(status).json({ code, message, ...(hint ? { hint } : {}) })
}

// ─── Global rate limiting ─────────────────────────────────────────────────────
// Prevents abuse by capping each client to 200 requests per 15-minute window.
// Uses standard headers (RateLimit-Remaining, etc.) instead of legacy X- headers.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return errorResponse(res, 429, 'GATEWAY_RATE_LIMITED',
      'Too many requests. You have exceeded the rate limit of 200 requests per 15 minutes.',
      'Wait a few minutes before making more requests.')
  },
})
app.use(globalLimiter)

// ─── Auth-specific rate limiting (SEC-6) ──────────────────────────────────────
// Much stricter limits on login, OTP, and password reset to prevent brute force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return errorResponse(res, 429, 'AUTH_RATE_LIMITED',
      'Too many authentication attempts. You are limited to 10 requests per 15 minutes.',
      'Wait a few minutes before trying again. This protects against brute-force attacks.')
  },
})

// OTP send has its own even stricter limit (prevent SMS bombing)
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                    // 5 OTP sends per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return errorResponse(res, 429, 'OTP_RATE_LIMITED',
      'Too many OTP requests. You are limited to 5 OTP sends per 15 minutes.',
      'Wait before requesting another code. This prevents SMS abuse.')
  },
})

// ─── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }))

// ─── Auth route rate limiting (applied before proxy) ───────────────────────────
// Apply stricter limits on sensitive auth endpoints
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/auth/oauth', authLimiter)
app.use('/api/auth/password/forgot', authLimiter)
app.use('/api/auth/password/reset', authLimiter)
app.use('/api/auth/otp/send', otpSendLimiter)
app.use('/api/auth/otp/resend', otpSendLimiter)
app.use('/api/auth/otp/verify', authLimiter)

// ─── Service routing ─────────────────────────────────────────────────────────
// Maps URL prefixes to internal microservices. Services that handle
// sensitive data (orders, inventory, notifications) require JWT auth.
// Docker Compose DNS resolves service names to container IPs.
const services: Record<string, { target: string; auth: boolean }> = {
  '/api/auth': { target: `http://auth-service:${process.env.AUTH_SERVICE_PORT || 3001}`, auth: false },
  '/api/products': { target: `http://product-service:${process.env.PRODUCT_SERVICE_PORT || 3002}`, auth: false },
  '/api/search': { target: `http://search-service:${process.env.SEARCH_SERVICE_PORT || 3003}`, auth: false },
  '/api/orders': { target: `http://order-service:${process.env.ORDER_SERVICE_PORT || 3004}`, auth: true },
  '/api/inventory': { target: `http://inventory-service:${process.env.INVENTORY_SERVICE_PORT || 3005}`, auth: true },
  '/api/notifications': { target: `http://notification-service:${process.env.NOTIFICATION_SERVICE_PORT || 3006}`, auth: true },
}

// Register a proxy middleware for each service. pathRewrite strips the
// prefix so downstream services receive clean routes (e.g. /api/orders/123 → /orders/123).
Object.entries(services).forEach(([path, config]) => {
  const middlewares = config.auth ? [authMiddleware] : []
  app.use(path, ...middlewares, createProxyMiddleware({
    target: config.target,
    changeOrigin: true,
    pathRewrite: { [`^${path}`]: '' },
    onError: (err: Error, _req: express.Request, res: express.Response) => {
      console.error(`[Gateway] Proxy error for ${path}:`, err.message)
      if (!res.headersSent) {
        return errorResponse(res, 502, 'GATEWAY_SERVICE_UNREACHABLE',
          `The service at "${path}" is not responding (${config.target}).`,
          `Check that the service is running on the expected port. ${err.message}`)
      }
    },
  } as any))
})

// ─── 404 for unmatched routes ──────────────────────────────────────────────────
app.use((_req, res) => {
  return errorResponse(res, 404, 'GATEWAY_NOT_FOUND',
    `No route matched "${_req.method} ${_req.originalUrl}".`,
    'Valid API routes: /api/auth, /api/products, /api/search, /api/orders, /api/inventory, /api/notifications.')
})

// ─── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Gateway] Unhandled error:', err)
  if (!res.headersSent) {
    return errorResponse(res, 500, 'GATEWAY_INTERNAL_ERROR',
      'An unexpected error occurred in the API gateway.',
      'Check api-gateway logs for details.')
  }
})

// ─── Listen ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[API Gateway] running on port ${PORT}`)
})
