/**
 * Provider-agnostic LLM adapter for the "machine" persona.
 *
 * LLM_PROVIDER:
 *   template (DEFAULT) — no external API. Deterministic machine-style answer
 *                        built from retrieved products. The demo works with ZERO keys.
 *   gemini             — Google AI Studio free tier (Flash). JSON mode + REST.
 *   groq               — Groq free tier (llama-3.1-8b-instant). OpenAI-compatible REST.
 *
 * Every provider returns the same strict JSON contract:
 *   { "text": "2-4 short factual sentences", "followUps": ["chip", "chip", "chip"] }
 * On any API failure → falls back to template mode. Never crashes.
 */
import type { CatalogProduct } from './catalog'

export interface MachineContext {
  message: string
  products: CatalogProduct[]
  conversationId?: string
  history?: Array<{ role: 'user' | 'assistant'; text: string }>
}

export interface MachineOutput {
  text: string
  followUps: string[]
}

const PROVIDER = (process.env.LLM_PROVIDER || 'template').toLowerCase()
const API_KEY = process.env.LLM_API_KEY || ''

const SYSTEM_PROMPT = `You are TORQ, AutoMart's machine assistant. You are fast, factual and precise — never a person.
Rules:
1. Answer ONLY from the products provided in the context JSON. NEVER invent names, prices, stock, or specs.
2. Keep the answer 2-4 short sentences. No markdown, no emojis.
3. If nothing relevant was retrieved, say so plainly and suggest a different query.
4. Respond with strict JSON: {"text": string, "followUps": [3 short suggestion strings]}.`

function productSummary(products: CatalogProduct[]): string {
  return JSON.stringify(products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    inStock: p.stock > 0,
  })))
}

// ─── Template provider (default — no API key) ────────────────────────────────

function templateAnswer(ctx: MachineContext): MachineOutput {
  const { products, message } = ctx
  if (products.length === 0) {
    return {
      text: `NO MATCHES FOR "${message}". REFINE THE QUERY OR BROWSE THE CATALOG.`,
      followUps: ['Show all products', 'Cheapest brake parts', 'Will this fit my vehicle?'],
    }
  }

  const top3 = products.slice(0, 3)
  const lines = top3.map((p, i) =>
    `${i + 1}. ${p.name} — ${p.brand} — ₹${p.price.toFixed(2)}${p.stock > 0 ? '' : ' (OUT OF STOCK)'}`,
  )

  return {
    text: `FOUND ${products.length} MATCH${products.length > 1 ? 'ES' : ''}.\n\n${lines.join('\n')}`,
    followUps: [
      `Cheaper option for "${products[0].name}"`,
      `Will ${products[0].name} fit my vehicle?`,
      'Compare top 2 results',
    ],
  }
}

// ─── Gemini (Google AI Studio free tier) ──────────────────────────────────────

async function geminiGenerate(ctx: MachineContext): Promise<MachineOutput> {
  const userPrompt = `Context products: ${productSummary(ctx.products)}\n\nUser: ${ctx.message}`
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 400 },
      }),
      signal: AbortSignal.timeout(15000),
    },
  )
  if (!res.ok) throw new Error(`gemini ${res.status}`)
  const data: any = await res.json()
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) throw new Error('gemini empty response')
  return JSON.parse(raw)
}

// ─── Groq (free tier, OpenAI-compatible) ──────────────────────────────────────

async function groqGenerate(ctx: MachineContext): Promise<MachineOutput> {
  const userPrompt = `Context products: ${productSummary(ctx.products)}\n\nUser: ${ctx.message}`
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 400,
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`groq ${res.status}`)
  const data: any = await res.json()
  const raw = data?.choices?.[0]?.message?.content
  if (!raw) throw new Error('groq empty response')
  return JSON.parse(raw)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Generate the machine's answer. Falls back to template mode on any failure. */
export async function generateMachineResponse(ctx: MachineContext): Promise<MachineOutput> {
  try {
    if (PROVIDER === 'gemini' && API_KEY) return await geminiGenerate(ctx)
    if (PROVIDER === 'groq' && API_KEY) return await groqGenerate(ctx)
  } catch (err: any) {
    console.warn(`[Assistant] LLM (${PROVIDER}) failed, using template: ${err.message}`)
  }
  return templateAnswer(ctx)
}

export function llmProviderName(): string {
  return PROVIDER
}
