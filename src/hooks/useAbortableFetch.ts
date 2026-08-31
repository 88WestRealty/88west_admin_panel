'use client';

import { useCallback, useEffect, useState } from 'react';
import { FETCH_TIMEOUT_MS } from '@/constants';
import { useLatestRef } from './useLatestRef';

/**
 * Runs a request on mount (and whenever `deps` change) with both cancellation
 * and a timeout attached.
 *
 * Two failure modes are handled that a bare `useEffect` + fetch misses:
 *
 *  - **Stale responses.** The AbortController cancels the in-flight request
 *    when deps change, so a slow reply cannot overwrite newer data.
 *  - **Hung backends.** A timer aborts the request after `FETCH_TIMEOUT_MS`,
 *    turning an infinite spinner into an error the user can act on.
 *
 * Both the timer and the controller are released in the cleanup, so nothing
 * outlives the component.
 */
export function useAbortableFetch(
  run: (signal: AbortSignal) => Promise<void>,
  onTimeout: () => void,
  deps: readonly unknown[],
): { retry: () => void } {
  const runRef = useLatestRef(run);
  const onTimeoutRef = useLatestRef(onTimeout);

  // Bumping this re-runs the effect, reusing its cancellation and timeout
  // rather than duplicating that logic in a second code path.
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;

    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
      onTimeoutRef.current();
    }, FETCH_TIMEOUT_MS);

    void runRef.current(controller.signal).finally(() => {
      if (!timedOut) window.clearTimeout(timer);
    });

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  return { retry };
}
