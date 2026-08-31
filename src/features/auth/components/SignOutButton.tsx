'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useIsMounted, useSupabase } from '@/hooks';
import { DEV_SESSION_COOKIE, IS_DEV_LOGIN_ENABLED } from '@/lib/dev-auth';
import { authService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { useMembersStore } from '@/store/members.store';
import { useUiStore } from '@/store/ui.store';
import { useVendorsStore } from '@/store/vendors.store';

/**
 * Real sign-out only clears the session — the store reset and redirect are
 * driven by the SIGNED_OUT event in `AuthProvider`, so the same cleanup runs
 * whether the user clicks here or the session expires elsewhere.
 *
 * A dev session has no Supabase session to end and therefore fires no such
 * event, so that path performs the equivalent teardown itself.
 */
interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const client = useSupabase();
  const router = useRouter();
  const isMounted = useIsMounted();
  const pushToast = useUiStore((s) => s.pushToast);
  const [isPending, setIsPending] = useState(false);

  const handleClick = useCallback(async () => {
    // Inline NODE_ENV test so the whole dev branch folds away in production
    // builds, rather than shipping inert.
    if (
      process.env.NODE_ENV !== 'production' &&
      IS_DEV_LOGIN_ENABLED &&
      document.cookie.includes(`${DEV_SESSION_COOKIE}=`)
    ) {
      document.cookie = `${DEV_SESSION_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
      useAuthStore.getState().reset();
      useMembersStore.getState().reset();
      useVendorsStore.getState().reset();
      router.replace(ROUTES.login);
      router.refresh();
      return;
    }

    setIsPending(true);
    const result = await authService.signOut(client);
    if (!isMounted()) return;
    setIsPending(false);
    if (!result.ok) pushToast('error', result.error.message);
  }, [client, isMounted, pushToast, router]);

  return (
    <Button
      variant="ghost"
      className={className}
      isLoading={isPending}
      onClick={() => void handleClick()}
    >
      Sign out
    </Button>
  );
}
