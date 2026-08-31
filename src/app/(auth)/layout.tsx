import type { ReactNode } from 'react';
import styles from './layout.module.css';

/** Centred, chrome-free layout for unauthenticated screens. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
