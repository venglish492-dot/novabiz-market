'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: '#070910', color: '#f7f7fc', fontFamily: 'system-ui', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: '10px 18px', borderRadius: 999, border: 0, background: '#8b3fd1', color: '#fff' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
