'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { ROUTES } from '@/constants';
import { DEV_SESSION_COOKIE, DEV_USER, IS_DEV_LOGIN_ENABLED } from '@/lib/dev-auth';
import { useAuthStore } from '@/store/auth.store';

/**
 * Fabricates an admin session locally, with no Supabase round-trip.
 *
 * Two pieces of state have to agree for the app to work:
 *
 *  - the **store**, so client components render as signed in, and
 *  - a **cookie**, because `proxy.ts` re-checks auth on the server for every
 *    navigation and would otherwise bounce straight back to /login.
 *
 * `SameSite=Lax` and a session lifetime (no `Max-Age`) keep the cookie as
 * short-lived and un-shareable as a cookie can be.
 */
export function useDevLogin(redirectTo: Route = ROUTES.members) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const signInAsDev = useCallback(() => {
    // The `process.env.NODE_ENV` test is inline, not read from the imported
    // flag, because Next substitutes a literal here at build time — so this
    // whole body, cookie write included, is dead code the minifier removes.
    // Behind only the imported constant it would ship as live (if unreachable)
    // code in the production bundle.
    if (process.env.NODE_ENV === 'production' || !IS_DEV_LOGIN_ENABLED) return;

    document.cookie = `${DEV_SESSION_COOKIE}=1; path=/; SameSite=Lax`;
    setUser(DEV_USER);

    // refresh() re-runs the server layouts so the dashboard shell reads the
    // cookie that was just set; without it the first render still 401s.
    router.replace(redirectTo);
    router.refresh();
  }, [redirectTo, router, setUser]);

  return {
    signInAsDev,
    isEnabled: process.env.NODE_ENV !== 'production' && IS_DEV_LOGIN_ENABLED,
  };
}
