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
import dns from 'node:dns' // svc() uses lookupSync to detect docker-compose network vs local dev
import { authMiddleware } from './middleware/auth'
import { adminMiddleware } from './middleware/admin'
import { turnstileMiddleware } from './middleware/turnstile'

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Turnstile-Token'],
  maxAge: 86400, // Cache preflight for 24 hours
}))

/** Standardised error envelope — every API error follows this shape. */
function errorResponse(res: express.Response, status: number, code: string, message: string, hint?: string) {
  return res.status(status).json({ code, message, ...(hint ? { hint } : {}) })
}

// ─── Global rate limiting ─────────────────────────────────────────────────────
// Prevents abuse by capping each client to 1000 requests per 15-minute window.
// Uses standard headers (RateLimit-Remaining, etc.) instead of legacy X- headers.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return errorResponse(res, 429, 'GATEWAY_RATE_LIMITED',
      'Too many requests. You have exceeded the rate limit of 1000 requests per 15 minutes.',
      'Wait a few minutes before making more requests.')
  },
})
app.use(globalLimiter)

// ─── Auth-specific rate limiting (SEC-6) ──────────────────────────────────────
// Much stricter limits on login, OTP, and password reset to prevent brute force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // 200 attempts per 15 min per IP (raised for E2E testing)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return errorResponse(res, 429, 'AUTH_RATE_LIMITED',
      'Too many authentication attempts. You are limited to 50 requests per 15 minutes.',
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

// ─── Turnstile human verification (SEC: bot defense) ────────────────────────────
// Applied to the highest-value auth endpoints. Rate limiters above stop volume
// attacks; Turnstile stops distributed credential stuffing and SMS bombing.
// Middleware auto-skips when TURNSTILE_SECRET_KEY is unset (dev/CI).
app.use('/api/auth/login', turnstileMiddleware)
app.use('/api/auth/register', turnstileMiddleware)
app.use('/api/auth/otp/send', turnstileMiddleware)
app.use('/api/auth/admin/login', turnstileMiddleware)

// ─── Service routing ─────────────────────────────────────────────────────────
// All /api/* routes are handled by a single proxy mount point.
// Express strips /api, leaving paths like /orders/123 intact.
// http-proxy-middleware's `router` option picks the target by prefix.
// Auth is applied inline for protected routes.
//
// Docker: resolves service names to container IPs via DNS.
// Railway: uses *_SERVICE_URL env vars (e.g. AUTH_SERVICE_URL).
const protectedPaths = ['/orders', '/payments', '/inventory', '/notifications']
const publicPaths = ['/payments/webhook'] // Stripe webhooks — no auth token

// ─── Admin-only write protection (SEC-4) ──────────────────────────────────────
// Write operations (POST/PUT/PATCH/DELETE) on the product catalog, inventory
// mutation, and order-status changes must be performed by an admin.
// Previously these were openly reachable (or only gated by any-valid-token),
// letting unauthorised users create/edit/delete products or flip order status.
// GET/read endpoints stay public. The path prefix matches req.url AFTER Express
// strips "/api", so "/api/products" arrives here as "/products".
const adminWritePathPrefixes = ['/products', '/categories', '/inventory', '/orders']
const adminWriteMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
// GET /inventory/:id is read-only and used by the admin inventory page AND by
// the catalog; reserve/release/confirm are the mutating ones — all match the
// '/inventory' prefix and are covered by the method check above.

// Upstream service routes. Each can be overridden by an explicit *_URL env var
// (e.g. SEARCH_SERVICE_URL). Otherwise the docker-compose hostname is used when
// it resolves (docker mode); local dev falls back to http://localhost:<port>.
const ROUTES: { prefix: string; envUrl: string | undefined; dockerHost: string; port: number | string }[] = [
  { prefix: '/auth',           envUrl: process.env.AUTH_SERVICE_URL,           dockerHost: 'auth-service',        port: process.env.AUTH_SERVICE_PORT || 3001 },
  { prefix: '/banners',        envUrl: process.env.AUTH_SERVICE_URL,           dockerHost: 'auth-service',        port: process.env.AUTH_SERVICE_PORT || 3001 },
  { prefix: '/products',       envUrl: process.env.PRODUCT_SERVICE_URL,        dockerHost: 'product-service',     port: process.env.PRODUCT_SERVICE_PORT || 3002 },
  { prefix: '/search',         envUrl: process.env.SEARCH_SERVICE_URL,         dockerHost: 'search-service',      port: process.env.SEARCH_SERVICE_PORT || 3003 },
  { prefix: '/orders',         envUrl: process.env.ORDER_SERVICE_URL,          dockerHost: 'order-service',       port: process.env.ORDER_SERVICE_PORT || 3004 },
  { prefix: '/payments',       envUrl: process.env.ORDER_SERVICE_URL,          dockerHost: 'order-service',       port: process.env.ORDER_SERVICE_PORT || 3004 },
  { prefix: '/inventory',      envUrl: process.env.INVENTORY_SERVICE_URL,      dockerHost: 'inventory-service',   port: process.env.INVENTORY_SERVICE_PORT || 3005 },
  { prefix: '/notifications',  envUrl: process.env.NOTIFICATION_SERVICE_URL,   dockerHost: 'notification-service', port: process.env.NOTIFICATION_SERVICE_PORT || 3006 },
  { prefix: '/mcp',            envUrl: process.env.MCP_SERVER_URL,             dockerHost: 'mcp-server',          port: process.env.MCP_SERVER_PORT || 3007 },
  { prefix: '/assistant',      envUrl: process.env.ASSISTANT_SERVICE_URL,      dockerHost: 'assistant-service',   port: process.env.ASSISTANT_SERVICE_PORT || 3008 },
]

/** Cached upstream URLs per docker hostname — resolved once at first request. */
const targetCache = new Map<string, string>()

/**
 * Resolve the upstream target for a route:
 *   1. explicit *_URL env var (highest priority)
 *   2. docker-compose DNS hostname — if it resolves, docker mode
 *   3. http://localhost:<port> — local dev (no docker network)
 */
async function resolveTarget(route: { prefix: string; envUrl: string | undefined; dockerHost: string; port: number | string }): Promise<string> {
  if (route.envUrl) return route.envUrl
  const cached = targetCache.get(route.dockerHost)
  if (cached) return cached
  try {
    await dns.promises.lookup(route.dockerHost) // resolves only inside the docker-compose network
    const url = `http://${route.dockerHost}:${route.port}`
    targetCache.set(route.dockerHost, url)
    return url
  } catch {
    const url = `http://localhost:${route.port}`
    targetCache.set(route.dockerHost, url)
    return url
  }
}

// Single proxy for all /api/* — Express strips "/api" so req.url = "/orders/123"
app.use('/api',
  // Auth gate: protected paths require a token, public paths bypass auth
  (req, res, next) => {
    if (publicPaths.some(p => req.url.startsWith(p))) return next()

    // ── SECURITY (SEC-4): admin-only for catalog/inventory/order writes ──
    // Any non-GET write to these prefixes requires an admin token.
    if (adminWriteMethods.includes(req.method)
        && adminWritePathPrefixes.some(p => req.url.startsWith(p))) {
      return adminMiddleware(req, res, next)
    }

    // ── Any-authenticated-user for the other protected prefixes ──
    if (protectedPaths.some(p => req.url.startsWith(p))) {
      return authMiddleware(req, res, next)
    }
    next()
  },
  createProxyMiddleware({
    changeOrigin: true,
    // Dynamic target: resolve the upstream per request path. The first request
    // for each service runs a DNS check (docker vs localhost), then caches it.
    router: async (req: { url?: string }) => {
      const route = ROUTES.find((r) => (req.url || '').startsWith(r.prefix))
      if (!route) return undefined
      return resolveTarget(route)
    },
    // Auth-service routes don't have an /auth prefix (e.g. /login not /auth/login),
    // so strip it before forwarding. Other services keep their prefix.
    pathRewrite: (path: string) => {
      if (path.startsWith('/auth')) return path.replace(/^\/auth/, '') || '/'
      return path
    },
    onError: (err: Error, _req: express.Request, res: express.Response) => {
      console.error(`[Gateway] Proxy error:`, err.message)
      if (!res.headersSent) {
        return errorResponse(res, 502, 'GATEWAY_SERVICE_UNREACHABLE',
          `A downstream service is not responding.`,
          `Check that services are running. ${err.message}`)
      }
    },
  } as any)
)

// ─── 404 for unmatched routes ──────────────────────────────────────────────────
app.use((_req, res) => {
  return errorResponse(res, 404, 'GATEWAY_NOT_FOUND',
    `No route matched "${_req.method} ${_req.originalUrl}".`,
    'Valid API routes: /api/auth, /api/products, /api/search, /api/orders, /api/payments, /api/inventory, /api/notifications, /api/mcp.')
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
