/**
 * ChatWidget — floating action button + TORQ assistant drawer.
 *
 * FAB: bottom-right, pulsing accent glow. Opens a spring-animated drawer
 * (AnimatePresence) that holds the ChatPanel. Mounted once in LayoutShell.
 */
'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useChat } from './useChat'
import { ChatPanel } from './ChatPanel'

const EASE = [0.16, 1, 0.3, 1] as const

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const { messages, status, isStreaming, send, stop, reset } = useChat()

  return (
    <>
      {/* ─── Drawer ─── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed bottom-20 right-4 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-6rem))] rounded-2xl overflow-hidden border border-white/10 bg-[var(--color-surface)]/95 backdrop-blur-xl shadow-2xl shadow-black/50 flex flex-col"
            role="dialog"
            aria-label="TORQ machine assistant"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[var(--color-surface-alt)]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text)] tracking-wide">TORQ</div>
                  <div className="text-[10px] font-mono text-[var(--color-accent)]">MACHINE ASSISTANT</div>
                </div>
              </div>
              <button
                onClick={() => { stop(); setOpen(false) }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Panel */}
            <ChatPanel messages={messages} status={status} isStreaming={isStreaming} onSend={send} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FAB ─── */}
      <motion.button
        onClick={() => { reset(); setOpen((o) => !o) }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="fixed bottom-5 right-4 z-50 w-14 h-14 rounded-full bg-[var(--color-accent)] text-black shadow-lg shadow-[var(--color-accent)]/30 flex items-center justify-center hover:brightness-110 transition-all"
        aria-label="Open TORQ assistant"
      >
        {/* Pulsing glow ring */}
        <span className="absolute inset-0 rounded-full bg-[var(--color-accent)]/40 animate-ping" />
        <span className="relative">
          {open
            ? <XMarkIcon className="w-6 h-6" />
            : <ChatBubbleLeftRightIcon className="w-6 h-6" />}
        </span>
      </motion.button>
    </>
  )
}
