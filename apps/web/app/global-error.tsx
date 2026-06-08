'use client';

// Top-level error boundary. Only fires for errors thrown in the root
// layout itself or in the (dashboard)/error.tsx boundary — i.e., the
// last line of defense before Next.js' default white "Application
// error" overlay. Renders its own <html>/<body> per the framework
// contract.

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({
  error,
  reset,
}: Readonly<GlobalErrorProps>) {
  useEffect(() => {
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html lang='en'>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#FAFAF7',
          color: '#0A0A0A',
        }}
      >
        <div
          style={{
            maxWidth: '32rem',
            padding: '2rem',
            border: '1px solid #E8E6DE',
            borderRadius: '0.75rem',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            Application error
          </h1>
          <p
            style={{
              fontSize: '0.9375rem',
              lineHeight: 1.55,
              color: '#5F6470',
              marginBottom: '1.25rem',
            }}
          >
            {error.message ||
              'Something went wrong while loading the application. Reload the page to try again.'}
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: '0.75rem',
                color: '#5F6470',
                marginBottom: '1.25rem',
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <button
            type='button'
            onClick={reset}
            style={{
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: '#0E3B2E',
              color: '#FAFAF7',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
