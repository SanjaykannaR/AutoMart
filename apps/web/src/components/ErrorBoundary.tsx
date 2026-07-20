'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-[50vh] px-4">
            <div className="glass p-8 text-center max-w-md">
              <p className="text-4xl mb-4">⚠️</p>
              <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">
                {this.state.error?.message || 'An unexpected error occurred.'}
              </p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="glass-button px-6 py-2"
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
