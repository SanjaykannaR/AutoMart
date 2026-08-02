/**
 * useChat — SSE consumer hook for the TORQ machine assistant.
 *
 * POST /api/assistant/chat → text/event-stream:
 *   event: status   data: { "msg": "SEARCHING PRODUCTS…" }
 *   event: text     data: { "delta": "..." }        (repeat)
 *   event: products data: { "items": [...] }
 *   event: chips    data: { "items": ["…"] }
 *   event: done
 */
'use client'

import { useCallback, useRef, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export interface ChatProduct {
  id: string
  name: string
  slug: string
  price: number
  imageUrl: string
  brand: string
  category: string
  inStock: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  products: ChatProduct[]
  chips: string[]
  streaming: boolean
}

const EMPTY_MSG = (role: 'user' | 'assistant'): ChatMessage => ({
  id: Math.random().toString(36).slice(2),
  role,
  text: '',
  products: [],
  chips: [],
  streaming: false,
})

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  /** Patch the in-progress assistant message by id. */
  const patch = useCallback((id: string, fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)))
  }, [])

  const send = useCallback(async (message: string) => {
    const trimmed = message.trim()
    if (!trimmed || isStreaming) return

    const assistantMsg = EMPTY_MSG('assistant')
    const targetId = assistantMsg.id
    setMessages((prev) => [...prev, EMPTY_MSG('user'), assistantMsg])
    setIsStreaming(true)
    setStatus('CONNECTING…')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // SSE events are separated by a blank line
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const raw of events) {
          let event = 'message'
          let data = ''
          for (const line of raw.split('\n')) {
            if (line.startsWith('event:')) event = line.slice(6).trim()
            else if (line.startsWith('data:')) data += line.slice(5).trim()
          }
          if (!data) continue

          let payload: any
          try { payload = JSON.parse(data) } catch { continue }

          if (event === 'status' && payload.msg) {
            setStatus(String(payload.msg))
          } else if (event === 'text' && payload.delta) {
            patch(targetId, (m) => ({ ...m, text: m.text + payload.delta }))
          } else if (event === 'products' && Array.isArray(payload.items)) {
            patch(targetId, (m) => ({ ...m, products: payload.items }))
          } else if (event === 'chips' && Array.isArray(payload.items)) {
            patch(targetId, (m) => ({ ...m, chips: payload.items.slice(0, 3) }))
          } else if (event === 'done') {
            patch(targetId, (m) => ({ ...m, streaming: false }))
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('[Chat] stream error:', err)
        patch(targetId, (m) => ({
          ...m,
          streaming: false,
          text: m.text || 'CONNECTION LOST. TRY AGAIN.',
        }))
      }
    } finally {
      // Ensure the assistant bubble is no longer flagged as streaming
      patch(targetId, (m) => ({ ...m, streaming: false }))
      setIsStreaming(false)
      setStatus(null)
      abortRef.current = null
    }
  }, [isStreaming, patch])

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setStatus(null)
    setIsStreaming(false)
  }, [])

  return { messages, status, isStreaming, send, stop, reset }
}
