import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { ROUTES } from '@/constants';
import { DEV_SESSION_COOKIE, IS_DEV_LOGIN_ENABLED } from '@/lib/dev-auth';
import { getSupabaseServerClient, getServerUser } from '@/lib/supabase/server';

/**
 * Authorisation gate for every dashboard screen.
 *
 * The proxy already checks *authentication*; this layout additionally verifies
 * admin *authorisation* server-side, so a member from the mobile app with a
 * valid session cannot render this UI even for a frame.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Checked first, and short-circuits: the Supabase calls below need env keys
  // that a no-backend dev session deliberately does not have.
  if (IS_DEV_LOGIN_ENABLED) {
    const cookieStore = await cookies();
    if (cookieStore.has(DEV_SESSION_COOKIE)) return <AppShell>{children}</AppShell>;
  }

  const user = await getServerUser();
  if (!user) redirect(ROUTES.login);

  const supabase = await getSupabaseServerClient();
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (isAdmin !== true) redirect(ROUTES.login);

  return <AppShell>{children}</AppShell>;
}
