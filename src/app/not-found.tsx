import Link from 'next/link';
import { ROUTES } from '@/constants';

export default function NotFound() {
  return (
    <main style={{ maxWidth: '32rem', margin: '4rem auto', padding: '0 1.25rem' }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Page not found</h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: '0.875rem' }}>
        <Link href={ROUTES.members}>Back to the verification queue</Link>
      </p>
    </main>
  );
}
