import express from 'express'
import rateLimit from 'express-rate-limit'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { authMiddleware } from './middleware/auth'

const app = express()
const PORT = process.env.API_GATEWAY_PORT || 3000

app.use(express.json())

function errorResponse(res: express.Response, status: number, code: string, message: string, hint?: string) {
  return res.status(status).json({ code, message, ...(hint ? { hint } : {}) })
}

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return errorResponse(res, 429, 'GATEWAY_RATE_LIMITED',
      'Too many requests. You have exceeded the rate limit of 100 requests per 15 minutes.',
      'Wait a few minutes before making more requests. The rate limit resets every 15 minutes.')
  },
})
app.use(limiter)

// ─── Service routing ───────────────────────────────────────────────────────────
const services: Record<string, { target: string; auth: boolean }> = {
  '/api/auth': { target: `http://auth-service:${process.env.AUTH_SERVICE_PORT || 3001}`, auth: false },
  '/api/products': { target: `http://product-service:${process.env.PRODUCT_SERVICE_PORT || 3002}`, auth: false },
  '/api/search': { target: `http://search-service:${process.env.SEARCH_SERVICE_PORT || 3003}`, auth: false },
  '/api/orders': { target: `http://order-service:${process.env.ORDER_SERVICE_PORT || 3004}`, auth: true },
  '/api/inventory': { target: `http://inventory-service:${process.env.INVENTORY_SERVICE_PORT || 3005}`, auth: true },
  '/api/notifications': { target: `http://notification-service:${process.env.NOTIFICATION_SERVICE_PORT || 3006}`, auth: true },
}

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

// ─── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }))

app.listen(PORT, () => {
  console.log(`[API Gateway] running on port ${PORT}`)
})
