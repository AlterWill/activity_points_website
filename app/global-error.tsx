'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '560px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '22px' }}>The app could not start</h1>
          <p style={{ marginTop: '12px', fontSize: '14px', lineHeight: 1.6, color: '#475569' }}>
            Check that <code>DATABASE_URL</code> is set correctly, then run{' '}
            <code>pnpm db:push</code> and <code>pnpm db:seed</code>.
          </p>
          {process.env.NODE_ENV === 'development' ? (
            <p
              style={{
                marginTop: '12px',
                padding: '10px',
                borderRadius: '10px',
                background: '#f8fafc',
                fontSize: '12px',
                color: '#64748b',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
            </p>
          ) : error.digest ? (
            <p style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '20px',
              border: 0,
              borderRadius: '10px',
              padding: '10px 18px',
              background: '#4f46e5',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
