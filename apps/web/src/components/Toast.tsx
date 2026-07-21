/**
 * Toast — Notification system with context provider
 * 
 * Usage:
 *   const { showToast } = useToast()
 *   showToast('Item added!', 'success')
 *   showToast('Error occurred', 'error')
 *   showToast('FYI', 'info')
 * 
 * Styling:
 *   - Dark surface card with colored left border
 *   - Lime for info, green for success, red for error
 *   - Framer-motion slide-in/slide-out animation
 *   - Fixed bottom-right position
 *   - Auto-dismiss after 3 seconds
 *   - Click to dismiss early
 */
'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

/** Context allows any component to trigger toasts via useToast() */
const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

/** Hook to access the toast system from any component */
export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0 // Monotonic ID — never resets so toast keys are always unique

/**
 * ToastProvider — renders toast notifications in a fixed overlay.
 * Manages a list of toasts, auto-dismisses each after 3 seconds,
 * and provides showToast() via React context to all children.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  /** Add a toast to the queue and schedule auto-dismiss after 3s */
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  /** Remove a toast by ID — called on click or auto-dismiss */
  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  /**
   * Border and icon colors for each toast type.
   * Left border uses the semantic color, text uses matching color.
   */
  const colors: Record<ToastType, string> = {
    success: 'border-l-[var(--color-success)] text-[var(--color-success)]',
    error: 'border-l-[var(--color-danger)] text-[var(--color-danger)]',
    info: 'border-l-[var(--color-accent)] text-[var(--color-accent)]',
  }

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — fixed bottom-right, stacked vertically */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              onClick={() => dismiss(toast.id)}
              className={`bg-[var(--color-surface)] border border-[var(--color-border)] border-l-4 rounded-lg px-5 py-3 cursor-pointer pointer-events-auto flex items-center gap-3 text-sm font-medium shadow-xl ${colors[toast.type]}`}
            >
              <span className="text-base">{icons[toast.type]}</span>
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
