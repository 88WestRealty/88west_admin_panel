'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a getter that reports whether the component is still mounted.
 *
 * Used to guard `setState` after an await in event handlers, where an
 * AbortSignal is not available (a Supabase mutation already in flight cannot
 * be cancelled, but its result can be safely ignored).
 */
export function useIsMounted(): () => boolean {
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return useCallback(() => mounted.current, []);
}
