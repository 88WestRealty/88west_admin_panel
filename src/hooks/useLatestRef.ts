'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Keeps a ref pointing at the most recent value, updated in an effect.
 *
 * The point is to let an effect read a fresh callback without listing it as a
 * dependency — so passing an inline arrow function does not tear down and
 * recreate a subscription on every render.
 *
 * The assignment happens in an effect rather than during render on purpose:
 * under concurrent rendering React may render a component and throw the result
 * away, and a ref mutated during that discarded render would leak state from a
 * render that never committed.
 */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
