/**
 * Global Error Page — catches unhandled rendering errors
 * 
 * Next.js calls this component when a page throws during rendering.
 * The reset function re-renders the page to retry after the error.
 * 
 * Styling:
 *   - Centered card with dark surface
 *   - Error icon + message
 *   - "Reload Page" coral CTA button
 *   - Outfit font for headings
 */
'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorBoundary>
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="card p-10 text-center max-w-md">
          {/* Error icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center">
            <span className="text-3xl">💥</span>
          </div>

          {/* Error heading */}
          <h2
            className="text-xl font-bold mb-2"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Page Error
          </h2>

          {/* Error message */}
          <p className="text-sm text-[var(--color-text-dim)] mb-6">
            {error.message || 'Something went wrong loading this page.'}
          </p>

          {/* Retry button */}
          <button onClick={reset} className="glass-button px-6 py-2.5">
            Reload Page
          </button>
        </div>
      </div>
    </ErrorBoundary>
  )
}
