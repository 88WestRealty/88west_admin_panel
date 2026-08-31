'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants';
import { useSupabase } from '@/hooks';
import { useAuthStore } from '@/store/auth.store';
import { useMembersStore } from '@/store/members.store';
import { useVendorsStore } from '@/store/vendors.store';
import type { AdminUser } from '@/types/models';

interface AuthProviderProps {
  /** Session resolved on the server, so the first paint is already correct. */
  initialUser: AdminUser | null;
  children: ReactNode;
}

/**
 * Bridges Supabase's auth stream into the auth store.
 *
 * Deliberately renders no context: Zustand is already globally readable, so a
 * provider that only pushed state into context would add a re-render boundary
 * for nothing. What this component does own is the *subscription lifecycle* —
 * and its cleanup unsubscribes the listener, which would otherwise keep firing
 * (and keep the store alive) across every client-side navigation.
 */
export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  const client = useSupabase();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  // Seed synchronously during the first render so children never observe a
  // signed-out flash before the effect below runs.
  if (useAuthStore.getState().status === 'idle') {
    useAuthStore.setState({ user: initialUser, status: 'ready', error: null });
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      const user = session?.user
        ? ({ id: session.user.id, email: session.user.email ?? '' } satisfies AdminUser)
        : null;

      setUser(user);

      if (event === 'SIGNED_OUT') {
        // Drop every cached row on sign-out. Without this, the next admin to
        // sign in on this machine would briefly see the previous one's queue.
        useMembersStore.getState().reset();
        useVendorsStore.getState().reset();
        router.replace(ROUTES.login);
      }

      if (event === 'SIGNED_IN') router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [client, router, setUser]);

  return <>{children}</>;
}
