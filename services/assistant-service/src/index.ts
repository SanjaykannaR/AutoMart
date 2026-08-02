/**
 * Assistant Service — RAG chatbot backend for AutoMart.
 *
 * POST /assistant/chat      — SSE stream: status → text deltas → products → chips → done
 * POST /assistant/reindex   — manually trigger the embedding worker
 * GET  /assistant/health    — liveness + index stats
 *
 * Hybrid retrieval: search-service lexical (Fuse.js + TF-IDF) ⊕ MiniLM semantic
 * embeddings in pgvector, merged with Reciprocal Rank Fusion. Generation via a
 * provider-agnostic LLM adapter (template | gemini | groq — see llm.ts).
 */
import express from 'express'
import { z } from 'zod'
import { initEmbeddingModel } from './embedding'
import { startIndexingLoop, reindexAll } from './indexing'
import { hybridSearch } from './retrieval'
import { generateMachineResponse, llmProviderName } from './llm'
import { countEmbeddings } from './pgvector'
import { getCatalog } from './catalog'

const app = express()
const PORT = process.env.ASSISTANT_SERVICE_PORT || 3008

app.use(express.json({ limit: '100kb' }))

/** Standardised error envelope — consistent across all AutoMart services. */
function errorResponse(res: express.Response, status: number, code: string, message: string, hint?: string) {
  return res.status(status).json({ code, message, ...(hint ? { hint } : {}) })
}

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(500, 'Message too long (max 500 chars)'),
  conversationId: z.string().max(100).optional(),
  userId: z.string().max(100).optional(),
  vehicleType: z.string().max(50).optional(),
})

// Boot the embedding model + indexing worker in the background — the service
// must serve /health immediately even if these take time or fail.
initEmbeddingModel().then(() => startIndexingLoop())
// Ensure catalog fetch happens early too
getCatalog().catch(() => {})

// ─── POST /assistant/chat — SSE stream ────────────────────────────────────────
// Routes are registered with the /assistant prefix to match the repo pattern
// (api-gateway keeps the prefix for all services except /auth).
// Event sequence (frontend depends on this EXACT order):
//   status → status → text* → products → chips → done
app.post('/assistant/chat', async (req, res) => {
  // Validate BEFORE opening the SSE stream so errors return clean JSON
  const parsed = chatSchema.safeParse(req.body)
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join('; ')
    return errorResponse(res, 400, 'ASSISTANT_INVALID_INPUT', `Validation failed: ${msg}`)
  }
  const { message } = parsed.data

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  let closed = false
  res.on('close', () => { closed = true })

  try {
    send('status', { msg: 'SEARCHING PRODUCTS…' })

    const { products, usedSemantic, usedLexical } = await hybridSearch(message)
    if (closed) return

    send('status', { msg: 'RANKING RESULTS…' })

    const output = await generateMachineResponse({ message, products })
    if (closed) return

    // Emit text in sentence-sized deltas (streaming feel without fake timers)
    const chunks = splitDeltas(output.text)
    for (const chunk of chunks) {
      if (closed) return
      send('text', { delta: chunk })
    }

    // Product rail (exact contract with the frontend ChatWidget)
    send('products', {
      items: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        imageUrl: p.imageUrl || '',
        brand: p.brand,
        category: p.category,
        inStock: p.stock > 0,
      })),
    })

    send('chips', { items: output.followUps.slice(0, 3) })
    send('done', {})

    console.log(`[Assistant] chat: "${message.slice(0, 60)}" → ${products.length} products (lexical=${usedLexical}, semantic=${usedSemantic}, llm=${llmProviderName()})`)
  } catch (err: any) {
    console.error('[Assistant] /chat error:', err)
    if (!closed) {
      try {
        send('status', { msg: 'ERROR — RETRY' })
        send('text', { delta: 'Something went wrong. Please try again.' })
        send('chips', { items: ['Show all products', 'Best sellers', 'Cheapest parts'] })
        send('done', {})
      } catch { /* client already gone */ }
    }
  } finally {
    if (!closed) res.end()
  }
})

// ─── POST /assistant/reindex — manual embedding rebuild ──────────────────────
app.post('/assistant/reindex', async (_req, res) => {
  try {
    const result = await reindexAll()
    res.json({ ok: true, ...result })
  } catch (err: any) {
    console.error('[Assistant] /reindex error:', err)
    return errorResponse(res, 500, 'ASSISTANT_REINDEX_FAILED',
      'Reindex failed. Check assistant-service logs.',
      'Ensure product-service is reachable and the product_embeddings migration has been run.')
  }
})

// ─── GET /assistant/health ────────────────────────────────────────────────────
app.get('/assistant/health', async (_req, res) => {
  let indexed = 0
  try { indexed = await countEmbeddings() } catch { /* best effort */ }
  res.json({
    status: 'ok',
    service: 'assistant-service',
    indexed,
    llmProvider: llmProviderName(),
  })
})

app.listen(PORT, () => {
  console.log(`[Assistant Service] running on port ${PORT} (LLM provider: ${llmProviderName()})`)
})

/** Split a machine answer into sentence-sized chunks for smooth SSE delivery. */
function splitDeltas(text: string): string[] {
  const clean = text.trim()
  if (clean.length <= 120) return [clean]
  const parts = clean.split(/(?<=[.!?])\s+/)
  // Merge tiny chunks so we emit at most ~6 deltas
  const merged: string[] = []
  let buf = ''
  for (const part of parts) {
    if (buf && (buf + part).length > 120) {
      merged.push(buf)
      buf = part
    } else {
      buf = buf ? `${buf} ${part}` : part
    }
  }
  if (buf) merged.push(buf)
  return merged.slice(0, 6)
}
