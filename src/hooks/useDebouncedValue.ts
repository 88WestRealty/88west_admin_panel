'use client';

import { useEffect, useState } from 'react';

/**
 * Debounced mirror of a rapidly-changing value (the vendor search box).
 *
 * The cleanup clears the pending timer on every change and on unmount, so a
 * fired timeout can never call setState after the component is gone.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
