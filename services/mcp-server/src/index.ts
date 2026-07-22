/**
 * AutoMart MCP Server — exposes platform capabilities as AI-callable tools.
 * MCP (Model Context Protocol) is an open standard (2025-03-26) that lets
 * AI assistants discover and invoke external tools with structured schemas.
 * Each tool delegates to the appropriate internal microservice via HTTP.
 */

import express from 'express'

const app = express()
const PORT = process.env.MCP_SERVER_PORT || 3007

app.use(express.json())

/** Standardised error envelope — consistent across all AutoMart services. */
function errorResponse(res: express.Response, status: number, code: string, message: string, hint?: string) {
  return res.status(status).json({ code, message, ...(hint ? { hint } : {}) })
}

// Tool definitions follow JSON Schema format for parameter validation.
// Each tool maps to a specific AutoMart capability backed by a microservice.
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

// ─── Tool implementations ──────────────────────────────────────────────────────
// Each function calls an internal microservice and normalizes the response.
// Errors are caught and returned as structured objects (not thrown) so the
// MCP caller always gets a result, even if a service is down.

async function searchParts(params: { query: string; category?: string; maxPrice?: number; limit?: number }) {
  const searchParams = new URLSearchParams({ q: params.query })
  if (params.category) searchParams.set('category', params.category)
  if (params.maxPrice) searchParams.set('maxPrice', String(params.maxPrice))
  if (params.limit) searchParams.set('limit', String(params.limit))

  try {
    const res = await fetch(`http://search-service:${process.env.SEARCH_SERVICE_PORT || 3003}/search?${searchParams}`)
    if (!res.ok) {
      return { code: 'MCP_SEARCH_FAILED', error: `Search service returned HTTP ${res.status}`, hint: 'The search service may be down or misconfigured.' }
    }
    const data = (await res.json()) as any[]
    return data.slice(0, params.limit || 10).map((p: any) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      category: p.category,
    }))
  } catch (err: any) {
    return { code: 'MCP_SEARCH_UNREACHABLE', error: 'Search service is unreachable', hint: `Ensure search-service is running. Connection error: ${err.message}` }
  }
}

async function checkStock(params: { productId: string }) {
  if (!params.productId) {
    return { code: 'MCP_MISSING_PARAM', error: 'productId is required', hint: 'Provide a valid product ID to check stock.' }
  }
  try {
    const res = await fetch(`http://inventory-service:${process.env.INVENTORY_SERVICE_PORT || 3005}/inventory/${params.productId}`)
    if (res.status === 404) {
      return { code: 'MCP_PRODUCT_NOT_IN_INVENTORY', error: `No inventory record for product "${params.productId}"`, hint: 'This product has not been added to inventory yet.' }
    }
    if (!res.ok) {
      return { code: 'MCP_INVENTORY_FAILED', error: `Inventory service returned HTTP ${res.status}`, hint: 'The inventory service may be down.' }
    }
    return await res.json()
  } catch (err: any) {
    return { code: 'MCP_INVENTORY_UNREACHABLE', error: 'Inventory service is unreachable', hint: `Ensure inventory-service is running. Connection error: ${err.message}` }
  }
}

async function getOrderStatus(params: { orderId: string }) {
  if (!params.orderId) {
    return { code: 'MCP_MISSING_PARAM', error: 'orderId is required', hint: 'Provide a valid order ID to check its status.' }
  }
  try {
    const res = await fetch(`http://order-service:${process.env.ORDER_SERVICE_PORT || 3004}/orders/${params.orderId}`)
    if (res.status === 404) {
      return { code: 'MCP_ORDER_NOT_FOUND', error: `No order found with ID "${params.orderId}"`, hint: 'Verify the order ID is correct. It may have been deleted or never existed.' }
    }
    if (!res.ok) {
      return { code: 'MCP_ORDER_FAILED', error: `Order service returned HTTP ${res.status}`, hint: 'The order service may be down.' }
    }
    return await res.json()
  } catch (err: any) {
    return { code: 'MCP_ORDER_UNREACHABLE', error: 'Order service is unreachable', hint: `Ensure order-service is running. Connection error: ${err.message}` }
  }
}

async function getCategories() {
  try {
    const res = await fetch(`http://product-service:${process.env.PRODUCT_SERVICE_PORT || 3002}/categories`)
    if (!res.ok) {
      return { code: 'MCP_CATEGORIES_FAILED', error: `Product service returned HTTP ${res.status}`, hint: 'The product service may be down.' }
    }
    return await res.json()
  } catch (err: any) {
    return { code: 'MCP_PRODUCT_UNREACHABLE', error: 'Product service is unreachable', hint: `Ensure product-service is running. Connection error: ${err.message}` }
  }
}

async function getPopularParts(params: { limit?: number }) {
  try {
    const res = await fetch(`http://product-service:${process.env.PRODUCT_SERVICE_PORT || 3002}/products`)
    if (!res.ok) {
      return { code: 'MCP_PRODUCTS_FAILED', error: `Product service returned HTTP ${res.status}`, hint: 'The product service may be down.' }
    }
    const products = (await res.json()) as any[]
    return products.slice(0, params.limit || 10).map((p: any) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      category: p.category?.name,
    }))
  } catch (err: any) {
    return { code: 'MCP_PRODUCT_UNREACHABLE', error: 'Product service is unreachable', hint: `Ensure product-service is running. Connection error: ${err.message}` }
  }
}

/** Dispatch map — routes tool names to their handler functions. */
const toolHandlers: Record<string, (params: any) => Promise<any>> = {
  search_parts: searchParts,
  check_stock: checkStock,
  get_order_status: getOrderStatus,
  get_categories: getCategories,
  get_popular_parts: getPopularParts,
}

// ─── MCP endpoints ─────────────────────────────────────────────────────────────
// Standard MCP discovery endpoint — AI agents call this first to learn
// what tools are available and their parameter schemas.
app.get('/mcp/tools', (_req, res) => {
  res.json({ protocol: 'model-context-protocol', version: '2025-03-26', server: 'automart', tools })
})

// Tool invocation endpoint — receives tool name + parameters, dispatches
// to the handler, and wraps the result in a standard MCP response envelope.
app.post('/mcp/tools/:name/call', async (req, res) => {
  const handler = toolHandlers[req.params.name]
  if (!handler) {
    const available = Object.keys(toolHandlers).join(', ')
    return errorResponse(res, 404, 'MCP_TOOL_NOT_FOUND',
      `Tool "${req.params.name}" does not exist.`,
      `Available tools: ${available}.`)
  }

  try {
    const result = await handler(req.body.parameters || {})
    res.json({ tool: req.params.name, result, status: 'success' })
  } catch (err: any) {
    console.error(`[MCP] Tool "${req.params.name}" failed:`, err)
    return errorResponse(res, 500, 'MCP_TOOL_FAILED',
      `Tool "${req.params.name}" encountered an unexpected error: ${err.message}`,
      'Check mcp-server logs and verify the underlying service is running.')
  }
})

// Lists available MCP resources (data sources AI agents can query).
// These are metadata pointers — actual data comes from the microservices.
app.get('/mcp/resources', (_req, res) => {
  res.json({
    resources: [
      { uri: 'catalog://popular', description: 'Popular auto parts this week' },
      { uri: 'orders://recent', description: 'Recent orders summary' },
    ],
  })
})

// ─── 404 for unknown MCP routes ────────────────────────────────────────────────
app.use('/mcp', (_req, res) => {
  return errorResponse(res, 404, 'MCP_ROUTE_NOT_FOUND',
    `No MCP route matched "${_req.method} ${_req.originalUrl}".`,
    'Valid MCP routes: GET /mcp/tools, POST /mcp/tools/:name/call, GET /mcp/resources.')
})

// ─── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'mcp-server' }))

app.listen(PORT, () => {
  console.log(`[MCP Server] running on port ${PORT}`)
  tools.forEach((t) => console.log(`  - ${t.name}: ${t.description}`))
})
