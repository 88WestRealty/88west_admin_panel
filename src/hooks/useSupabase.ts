'use client';

import { useMemo } from 'react';
import { getSupabaseBrowserClient, type TypedSupabaseClient } from '@/lib/supabase/client';

/**
 * Access to the browser Supabase singleton.
 *
 * `useMemo` here is not a micro-optimisation — it guarantees a stable
 * reference across renders, which matters because this client is a dependency
 * of every subscription effect. An unstable client would tear down and
 * re-open every websocket on each render.
 */
export function useSupabase(): TypedSupabaseClient {
  return useMemo(() => getSupabaseBrowserClient(), []);
}
