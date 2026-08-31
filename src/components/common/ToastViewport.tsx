'use client';

import { useEffect } from 'react';
import { TOAST_TIMEOUT_MS } from '@/constants';
import { selectToasts, useUiStore } from '@/store/ui.store';
import styles from './ToastViewport.module.css';

/**
 * Renders the toast queue and owns its auto-dismiss timers.
 *
 * One timer per visible toast is created after render and every one of them is
 * cleared in the cleanup — including on unmount mid-flight. Timers live here,
 * not in the Zustand store, precisely because the store outlives the React
 * tree and has no unmount hook to clean up from.
 */
export function ToastViewport() {
  const toasts = useUiStore(selectToasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismissToast(toast.id), TOAST_TIMEOUT_MS),
    );

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.viewport} role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <output key={toast.id} className={`${styles.toast} ${styles[toast.tone]}`}>
          <span>{toast.message}</span>
          <button
            type="button"
            className={styles.dismiss}
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </output>
      ))}
    </div>
  );
}
