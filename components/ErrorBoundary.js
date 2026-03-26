'use client'

import React from 'react'
import Link from 'next/link'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring
    console.error('[ErrorBoundary]', error, errorInfo)
    try {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'client_error',
          page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
          metadata: {
            message: error?.message,
            componentStack: errorInfo?.componentStack?.slice(0, 500),
          },
        }),
      }).catch(() => {})
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-display font-bold text-infinity-navy dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              We encountered an unexpected error. Please try refreshing the page or return to the homepage.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="px-4 py-2 bg-infinity-navy text-white rounded-lg text-sm font-semibold hover:bg-infinity-navy-light transition-colors"
              >
                Refresh Page
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-infinity-navy dark:text-white rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Go Home
              </Link>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-left text-[10px] text-red-700 dark:text-red-400 overflow-auto max-h-40">
                {this.state.error.message}\n{this.state.error.stack}
              </pre>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
