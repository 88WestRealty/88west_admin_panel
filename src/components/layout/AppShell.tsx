import type { ReactNode } from 'react';
import { AppNav } from './AppNav';
import styles from './AppShell.module.css';

interface AppShellProps {
  children: ReactNode;
}

/**
 * Server Component: the chrome around every authenticated screen renders on
 * the server and ships no JavaScript of its own. Only `AppNav` — which needs
 * the pathname and the session — is a client island inside it.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <AppNav />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
