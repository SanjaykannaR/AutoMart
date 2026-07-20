/**
 * AutoMart MCP Server
 *
 * MCP (Model Context Protocol) is an open standard for connecting AI agents
 * to tools and data. This server exposes AutoMart's capabilities as MCP tools
 * that AI assistants (Claude, Cursor, etc.) can discover and call.
 */

import express from 'express'

const app = express()
const PORT = process.env.MCP_SERVER_PORT || 3007

app.use(express.json())

const tools = [
  {
    name: 'search_parts',
    description: 'Search auto parts by text query. Returns matching products with prices and availability.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (part name, brand, or vehicle)' },
        category: { type: 'string', description: 'Filter by category (optional)' },
        maxPrice: { type: 'number', description: 'Maximum price filter (optional)' },
        limit: { type: 'number', description: 'Max results to return (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'check_stock',
    description: 'Check real-time stock availability for a specific part.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to check stock for' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'get_order_status',
    description: 'Get the current status and tracking info for an order.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID to track' },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'get_categories',
    description: 'List all product categories available on AutoMart.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_popular_parts',
    description: 'Get the most searched/popular auto parts.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of results (default 10)' },
      },
    },
  },
]

async function searchParts(params: { query: string; category?: string; maxPrice?: number; limit?: number }) {
  const searchParams = new URLSearchParams({ q: params.query })
  if (params.category) searchParams.set('category', params.category)
  if (params.maxPrice) searchParams.set('maxPrice', String(params.maxPrice))
  if (params.limit) searchParams.set('limit', String(params.limit))

  try {
    const res = await fetch(`http://search-service:${process.env.SEARCH_SERVICE_PORT || 3003}/search?${searchParams}`)
    const data = (await res.json()) as any[]
    return data.slice(0, params.limit || 10).map((p: any) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      category: p.category,
    }))
  } catch {
    return { error: 'Search service unavailable' }
  }
}

async function checkStock(params: { productId: string }) {
  try {
    const res = await fetch(`http://inventory-service:${process.env.INVENTORY_SERVICE_PORT || 3005}/inventory/${params.productId}`)
    return await res.json()
  } catch {
    return { error: 'Inventory service unavailable' }
  }
}

async function getOrderStatus(params: { orderId: string }) {
  try {
    const res = await fetch(`http://order-service:${process.env.ORDER_SERVICE_PORT || 3004}/orders/${params.orderId}`)
    return await res.json()
  } catch {
    return { error: 'Order service unavailable' }
  }
}

async function getCategories() {
  try {
    const res = await fetch(`http://product-service:${process.env.PRODUCT_SERVICE_PORT || 3002}/categories`)
    return await res.json()
  } catch {
    return { error: 'Product service unavailable' }
  }
}

async function getPopularParts(params: { limit?: number }) {
  try {
    const res = await fetch(`http://product-service:${process.env.PRODUCT_SERVICE_PORT || 3002}/products`)
    const products = (await res.json()) as any[]
    return products.slice(0, params.limit || 10).map((p: any) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      category: p.category?.name,
    }))
  } catch {
    return { error: 'Product service unavailable' }
  }
}

const toolHandlers: Record<string, (params: any) => Promise<any>> = {
  search_parts: searchParts,
  check_stock: checkStock,
  get_order_status: getOrderStatus,
  get_categories: getCategories,
  get_popular_parts: getPopularParts,
}

app.get('/mcp/tools', (_req, res) => {
  res.json({ protocol: 'model-context-protocol', version: '2025-03-26', server: 'automart', tools })
})

app.post('/mcp/tools/:name/call', async (req, res) => {
  const handler = toolHandlers[req.params.name]
  if (!handler) return res.status(404).json({ error: `Tool "${req.params.name}" not found` })

  try {
    const result = await handler(req.body.parameters || {})
    res.json({ tool: req.params.name, result, status: 'success' })
  } catch (err: any) {
    res.status(500).json({ tool: req.params.name, error: err.message, status: 'error' })
  }
})

app.get('/mcp/resources', (_req, res) => {
  res.json({
    resources: [
      { uri: 'catalog://popular', description: 'Popular auto parts this week' },
      { uri: 'orders://recent', description: 'Recent orders summary' },
    ],
  })
})

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'mcp-server' }))

app.listen(PORT, () => {
  console.log(`[MCP Server] running on port ${PORT}`)
  tools.forEach((t) => console.log(`  - ${t.name}: ${t.description}`))
})
