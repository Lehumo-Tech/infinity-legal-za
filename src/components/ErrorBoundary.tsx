'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="max-w-md w-full text-center">
            {/* Branding */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-[#0c1e3c]">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="#c9a84c"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#0c1e3c]">
                Infinity Legal
              </h2>
            </div>

            {/* Error message */}
            <div className="rounded-xl border border-amber-400 bg-amber-50 p-6 mb-6">
              <div className="flex items-center justify-center mb-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" />
                  <path
                    d="M12 8v4M12 16h.01"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[#0c1e3c]">
                Something went wrong
              </h3>
              <p className="text-sm text-slate-500">
                An unexpected error occurred. Please try again or return to the home page.
              </p>
              {this.state.error && (
                <p className="text-xs mt-3 p-2 rounded-lg bg-orange-50 text-orange-800 font-mono">
                  {this.state.error.message}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c]"
              >
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-[#0c1e3c] text-[#0c1e3c] bg-transparent transition-all duration-200 hover:shadow-md hover:bg-[#0c1e3c] hover:text-white"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
