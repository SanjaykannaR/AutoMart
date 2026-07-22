#!/usr/bin/env node
/**
 * AutoMart MCP Stdio Server — for Claude Desktop / Cursor integration.
 * 
 * This wraps the HTTP MCP server into a stdio transport that Claude Desktop
 * and Cursor expect. It reads JSON-RPC messages from stdin and writes to stdout.
 * 
 * Setup:
 *   1. Ensure Docker stack is running: docker compose up -d
 *   2. Add this config to Claude Desktop (see claude-desktop-config.json)
 *   3. Or add to Cursor settings (see cursor-mcp-config.json)
 */

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3007'

// ─── Tool definitions (mirrors HTTP server) ───
const tools = [
  {
    name: 'search_parts',
    description: 'Search auto parts by text query. Returns matching products with prices and availability.',
    inputSchema: {
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
    inputSchema: {
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
    inputSchema: {
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
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_popular_parts',
    description: 'Get the most searched/popular auto parts.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of results (default 10)' },
      },
    },
  },
]

// ─── Call tool via HTTP ───
async function callTool(name: string, args: Record<string, unknown>) {
  const res = await fetch(`${MCP_SERVER_URL}/mcp/tools/${name}/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parameters: args }),
  })
  return res.json()
}

// ─── JSON-RPC handler ───
async function handleRequest(request: any) {
  const { id, method, params } = request

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2025-03-26',
          capabilities: { tools: {} },
          serverInfo: { name: 'automart-mcp', version: '1.0.0' },
        },
      }

    case 'notifications/initialized':
      return null // no response needed

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: { tools },
      }

    case 'tools/call': {
      const { name, arguments: args } = params
      try {
        const result = await callTool(name, args || {})
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          },
        }
      } catch (err: any) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
            isError: true,
          },
        }
      }
    }

    case 'ping':
      return { jsonrpc: '2.0', id, result: {} }

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      }
  }
}

// ─── Stdio transport ───
let buffer = ''

process.stdin.setEncoding('utf-8')
process.stdin.on('data', async (chunk) => {
  buffer += chunk
  // Process complete JSON-RPC messages (newline-delimited)
  const lines = buffer.split('\n')
  buffer = lines.pop()! // keep incomplete line in buffer

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const request = JSON.parse(trimmed)
      const response = await handleRequest(request)
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n')
      }
    } catch {
      // Ignore malformed JSON
    }
  }
})

process.stdin.on('end', () => process.exit(0))

// Log to stderr (not stdout — stdout is the MCP transport)
console.error('[AutoMart MCP] Stdio server started. Connecting to', MCP_SERVER_URL)
