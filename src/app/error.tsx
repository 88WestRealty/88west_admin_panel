'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

/** Route-level boundary for errors thrown during render or data fetching. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[route error]', error);
  }, [error]);

  return (
    <main style={{ maxWidth: '32rem', margin: '4rem auto', padding: '0 1.25rem' }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: '0.875rem' }}>{error.message}</p>
      <Button onClick={reset} style={{ marginTop: '1rem' }}>
        Try again
      </Button>
    </main>
  );
}
