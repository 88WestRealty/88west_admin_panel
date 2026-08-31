import type { ReactNode } from 'react';
import { humanizeError } from '@/utils/errors';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: ReactNode;
}

/**
 * Inline failure panel for a data region — distinct from `ErrorBoundary`,
 * which catches render-time crashes. This one reports a request that failed
 * while the rest of the page is fine.
 */
export function ErrorState({ title = 'Unable to load', message, action }: ErrorStateProps) {
  return (
    <div className={styles.wrapper} role="alert">
      <svg
        className={styles.icon}
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M12 3.5 2.8 19a1 1 0 0 0 .87 1.5h16.66a1 1 0 0 0 .87-1.5L12 3.5Z" />
        <path d="M12 9.5v4.25M12 17.2v.05" />
      </svg>

      <p className={styles.title}>{title}</p>
      <p className={styles.message}>{humanizeError(message)}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
