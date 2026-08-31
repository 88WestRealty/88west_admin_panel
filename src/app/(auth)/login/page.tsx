import type { Metadata, Route } from 'next';
import { APP_NAME, ROUTES } from '@/constants';
import { LoginForm } from '@/features/auth';
import styles from './page.module.css';

export const metadata: Metadata = { title: `Sign in · ${APP_NAME}` };

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

/**
 * Server Component. The proxy has already redirected signed-in admins away,
 * so this only ever renders for signed-out visitors.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  // Only accept same-origin paths — a raw `next` value would be an open
  // redirect. The value is user-supplied, so typedRoutes cannot verify it
  // statically; this check is the runtime equivalent of that guarantee.
  const redirectTo: Route =
    next?.startsWith('/') && !next.startsWith('//') ? (next as Route) : ROUTES.members;

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <p className={styles.wordmark}>
          <span className={styles.wordmarkAccent}>88</span>WEST
        </p>
        {/* The wordmark identifies the product and this names the surface;
            a separate "Sign in" heading over a sign-in form said nothing the
            button below it did not already say. */}
        <h1 className={styles.title}>Admin Console</h1>
      </header>

      <LoginForm redirectTo={redirectTo} />

      <p className={styles.footer}>Staff access only</p>
    </div>
  );
}
