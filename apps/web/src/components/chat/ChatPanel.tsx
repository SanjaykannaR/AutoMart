/**
 * ChatPanel — message list + composer for the TORQ assistant drawer.
 * Shows machine status readouts (e.g. "SEARCHING PRODUCTS…") while streaming.
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChatMessage } from './ChatMessage'
import type { ChatMessage as ChatMessageType } from './useChat'

const EASE = [0.16, 1, 0.3, 1] as const

const SUGGESTIONS = [
  'brake pads for swift dzire under 3000',
  'best selling engine oil',
  'bike helmet price',
  'car battery replacement',
]

export function ChatPanel({ messages, status, isStreaming, onSend }: {
  messages: ChatMessageType[]
  status: string | null
  isStreaming: boolean
  onSend: (text: string) => void
}) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to newest message
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, status])

  const submit = () => {
    const text = input.trim()
    if (!text || isStreaming) return
    onSend(text)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages */}
      <div ref={scrollRef} className="chat-panel-scroll flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 px-6">
            <div className="text-[var(--color-accent)] font-mono text-xs tracking-widest">TORQ ONLINE</div>
            <p className="text-sm text-[var(--color-text-dim)]">
              Machine assistant. Ask me about parts, prices and fitment.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="px-2.5 py-1 text-[11px] rounded-full border border-white/10 bg-white/[0.04] text-[var(--color-text-dim)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} onChip={onSend} />
        ))}

        {/* Status readout while streaming */}
        {status && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-mono text-[var(--color-text-muted)] px-1"
          >
            ▸ {status}
          </motion.div>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-white/[0.06] bg-[var(--color-surface)]/80">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            rows={1}
            placeholder={isStreaming ? 'TORQ is responding…' : 'Ask TORQ…'}
            disabled={isStreaming}
            className="flex-1 resize-none bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]/40 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 w-9 h-9 rounded-full bg-[var(--color-accent)] text-black font-bold text-sm flex items-center justify-center disabled:opacity-30 hover:brightness-110 transition-all"
            aria-label="Send message"
          >
            ↵
          </button>
        </div>
        <p className="text-[9px] text-[var(--color-text-muted)] mt-1.5 px-1 font-mono">
          TORQ ▸ MACHINE ASSISTANT · RETRIEVAL-AUGMENTED
        </p>
      </div>
    </div>
  )
}
