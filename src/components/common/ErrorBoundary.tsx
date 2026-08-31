'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * Class component because `componentDidCatch` has no hook equivalent — this is
 * the one place the class API is still required.
 *
 * Scoped per feature rather than wrapped once at the root: a crash in the
 * vendor table should not blank out the navigation and the verification queue
 * alongside it.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Replace with the real reporter (Sentry, Logflare) in production.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className={styles.wrapper} role="alert">
        <p className={styles.title}>{this.props.fallbackTitle ?? 'Something went wrong.'}</p>
        <p className={styles.message}>{error.message}</p>
        <Button variant="secondary" onClick={this.handleReset}>
          Try again
        </Button>
      </div>
    );
  }
}
