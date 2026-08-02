/**
 * ChatMessage — a single message bubble in the TORQ assistant drawer.
 *
 * User messages: right-aligned accent bubble.
 * Machine messages: left-aligned surface bubble + optional ProductCard rail
 * + follow-up chips. Streaming shows a caret while deltas are arriving.
 */
'use client'

import { motion } from 'framer-motion'
import { ProductCard } from '@/components/ProductCard'
import type { ChatMessage as ChatMessageType } from './useChat'

const EASE = [0.16, 1, 0.3, 1] as const

export function ChatMessage({ message, onChip }: {
  message: ChatMessageType
  onChip: (text: string) => void
}) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && (
          <div className="text-[10px] font-mono tracking-widest text-[var(--color-accent)] mb-1 px-1">
            TORQ ▸
          </div>
        )}

        <div
          className={[
            'px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/25 text-[var(--color-text)] rounded-2xl rounded-br-sm'
              : 'bg-[var(--color-surface-alt)] border border-white/[0.07] text-[var(--color-text)] rounded-2xl rounded-bl-sm',
          ].join(' ')}
        >
          {message.text || (message.streaming ? '' : '…')}
          {message.streaming && <span className="caret">▍</span>}
        </div>

        {/* Product rail — reuse the site's existing ProductCard */}
        {!isUser && message.products.length > 0 && (
          <div className="mt-2 w-full grid grid-cols-1 gap-2">
            {message.products.slice(0, 3).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Follow-up chips */}
        {!isUser && !message.streaming && message.chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.chips.map((chip) => (
              <button
                key={chip}
                onClick={() => onChip(chip)}
                className="px-2.5 py-1 text-[11px] rounded-full border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/5 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/15 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
