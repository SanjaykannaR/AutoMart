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
        <div className="glass p-8 text-center max-w-md">
          <p className="text-4xl mb-4">💥</p>
          <h2 className="text-xl font-bold mb-2">Page Error</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            {error.message || 'Something went wrong loading this page.'}
          </p>
          <button onClick={reset} className="glass-button px-6 py-2">
            Reload Page
          </button>
        </div>
      </div>
    </ErrorBoundary>
  )
}
