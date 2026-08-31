'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';
import { supabaseEnv } from './env';

/**
 * Derived from the factory's own return type rather than re-declared as
 * `SupabaseClient<Database>`. The client's generic arity has shifted between
 * supabase-js releases; inferring it here means an upgrade never leaves this
 * alias subtly out of step with what `createBrowserClient` actually returns.
 */
export type TypedSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

let client: TypedSupabaseClient | undefined;

/**
 * Browser singleton.
 *
 * One instance per tab matters for correctness, not just cost: each client
 * opens its own realtime websocket and its own auth-refresh timer. Creating a
 * client per component would leak a socket on every mount — the exact class of
 * bug the cleanup discipline elsewhere in this app is designed to avoid.
 *
 * `createBrowserClient` from @supabase/ssr persists the session to cookies, so
 * the middleware and server components see the same session as the browser.
 */
export function getSupabaseBrowserClient(): TypedSupabaseClient {
  if (!client) {
    client = createBrowserClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}
