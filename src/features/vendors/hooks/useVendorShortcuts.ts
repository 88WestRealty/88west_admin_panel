'use client';

import { useEffect } from 'react';
import { useVendorsStore } from '@/store/vendors.store';

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * "n" opens the new-vendor editor.
 *
 * A window-level listener is the kind of side effect that leaks silently: with
 * client-side navigation the module stays loaded, so a listener registered
 * without cleanup keeps firing on every other screen and keeps this component's
 * closure — and the store handle it captured — alive for the session. The
 * cleanup below removes it on unmount, which happens on every route change
 * away from the vendors screen.
 */
export function useVendorShortcuts(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === 'n') {
        event.preventDefault();
        useVendorsStore.getState().openForm(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
