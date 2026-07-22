'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode // Optional custom fallback UI — defaults to a generic error card
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * ErrorBoundary — React class component that catches rendering errors
 * in its child tree. Required because hooks (useEffect, useState) can't
 * catch errors in sibling components. Used by the global error page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  /** Called when a child component throws during rendering.
   *  Sets state to trigger the fallback UI on next render. */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  /** Called after the error has been caught — logs for debugging.
   *  In production, this would send to an error tracking service. */
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-[50vh] px-4">
            <div className="card p-10 text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-warning)]/10 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Something went wrong
              </h2>
              <p className="text-sm text-[var(--color-text-dim)] mb-6">
                {this.state.error?.message || 'An unexpected error occurred.'}
              </p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="glass-button px-6 py-2.5"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
