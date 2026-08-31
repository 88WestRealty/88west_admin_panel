import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

/** Shape @supabase/ssr hands to `setAll`. */
type CookieBatch = ReadonlyArray<{ name: string; value: string; options: CookieOptions }>;
import { supabaseEnv } from './env';

/**
 * Request-scoped server client for Server Components, Route Handlers and
 * Server Actions. Never cached across requests — it closes over this
 * request's cookie jar.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet: CookieBatch) => {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/** Resolves the signed-in admin, or null. Verified against the auth server. */
export async function getServerUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}
