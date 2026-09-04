import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/database.types';
import { ROUTES, isPublicRoute, DENIED_PARAM } from '@/constants/routes';
import { DEV_SESSION_COOKIE, IS_DEV_LOGIN_ENABLED } from '@/lib/dev-auth';
import { supabaseEnv } from './env';

/** Shape @supabase/ssr hands to `setAll`. */
type CookieBatch = ReadonlyArray<{ name: string; value: string; options: CookieOptions }>;

/**
 * Refreshes the Supabase session cookie on every request and gates routes.
 *
 * Runs before any page renders, so a signed-out user never sees a flash of
 * the dashboard, and an expired access token is rotated server-side rather
 * than triggering a client-side redirect loop.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Dev bypass is resolved before the Supabase client is constructed, because
  // `supabaseEnv` throws when the keys are absent — and running with no
  // backend configured at all is the entire point of this path.
  if (IS_DEV_LOGIN_ENABLED && request.cookies.has(DEV_SESSION_COOKIE)) {
    if (pathname === ROUTES.login) {
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.members;
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet: CookieBatch) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() — not getSession() — so the token is validated by the auth
  // server rather than trusted from a cookie the client could have forged.
  const { data } = await supabase.auth.getUser();

  if (!data.user && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.login;
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // The `denied` flag means the dashboard layout just rejected this user for
  // lacking admin rights. Bouncing them back would restart that exact cycle,
  // so they are allowed to land on /login and sign out from there.
  const wasDenied = request.nextUrl.searchParams.has(DENIED_PARAM);

  if (data.user && pathname === ROUTES.login && !wasDenied) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.members;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
