import express from 'express'
import rateLimit from 'express-rate-limit'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { authMiddleware } from './middleware/auth'

const app = express()
const PORT = process.env.API_GATEWAY_PORT || 3000

app.use(express.json())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

const services = {
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
  }))
})

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }))

app.listen(PORT, () => {
  console.log(`[API Gateway] running on port ${PORT}`)
})
