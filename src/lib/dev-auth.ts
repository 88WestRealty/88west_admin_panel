import type { AdminUser } from '@/types/models';

/**
 * Development-only sign-in bypass.
 *
 * This fabricates an admin session without contacting Supabase, so the panel
 * can be worked on with no backend attached. It exercises none of the real
 * auth path — treat any screen reached this way as unverified against RLS.
 *
 * Two independent conditions must BOTH hold for it to exist:
 *
 *   1. `process.env.NODE_ENV !== 'production'` — statically false in a
 *      production build, so the dead branch is eliminated at compile time and
 *      the button never ships in the bundle.
 *   2. `NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true'` — an explicit per-developer
 *      opt-in, so it stays off by default even locally.
 *
 * The redundancy is the point: either guard alone would be one config mistake
 * away from an authentication bypass in a deployed environment.
 */
export const IS_DEV_LOGIN_ENABLED =
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';

/**
 * Cookie the proxy looks for. Prefixed `dev-` so it is obvious in devtools
 * and cannot be mistaken for one of Supabase's own `sb-*` cookies.
 */
export const DEV_SESSION_COOKIE = 'dev-admin-session';

/** The fake identity. Clearly non-real so it can never be mistaken for data. */
export const DEV_USER: AdminUser = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'dev-admin@localhost',
};
