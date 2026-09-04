import type { Metadata, Route } from 'next';
import { APP_NAME, ROUTES, DENIED_PARAM } from '@/constants';
import { LoginForm, SignOutButton } from '@/features/auth';
import styles from './page.module.css';

export const metadata: Metadata = { title: `Sign in · ${APP_NAME}` };

interface LoginPageProps {
  searchParams: Promise<{ next?: string; [DENIED_PARAM]?: string }>;
}

/**
 * Server Component. The proxy redirects signed-in admins away, so this
 * normally renders only for signed-out visitors — the exception being a
 * non-admin who was turned back by the dashboard's authorisation gate. That
 * user holds a valid session, so offering the sign-in form again would be
 * useless; they are shown why they were refused and given a way out instead.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const { next } = params;
  const wasDenied = params[DENIED_PARAM] !== undefined;
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

      {wasDenied ? (
        <div className={styles.denied}>
          <p className={styles.deniedTitle}>This account is not a staff account.</p>
          <p className={styles.deniedBody}>
            You are signed in, but the console is limited to administrators. Sign out to use a
            different account.
          </p>
          <SignOutButton className={styles.deniedAction} />
        </div>
      ) : (
        <LoginForm redirectTo={redirectTo} />
      )}

      <p className={styles.footer}>Staff access only</p>
    </div>
  );
}
