'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-ZA">
      <body>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f7f8fa',
          padding: '2rem',
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '4rem',
              height: '4rem',
              borderRadius: '1rem',
              backgroundColor: '#0c1e3c',
              marginBottom: '1.5rem',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4M12 17h.01M12 2L2 7l10 5 10-5-10-5z" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#0c1e3c',
              marginBottom: '0.5rem',
            }}>
              Something went wrong
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                backgroundColor: '#c9a84c',
                color: '#0c1e3c',
                padding: '0.625rem 1.5rem',
                borderRadius: '0.75rem',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
