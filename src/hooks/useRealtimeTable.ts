'use client';

import { useEffect } from 'react';
import { subscribeToTable, type RealtimeHandlers, type TableName } from '@/lib/supabase/realtime';
import { useLatestRef } from './useLatestRef';
import { useSupabase } from './useSupabase';

interface UseRealtimeTableOptions<Row extends Record<string, unknown>> {
  channelName: string;
  table: TableName;
  filter?: string;
  handlers: RealtimeHandlers<Row>;
  /** Skip the subscription entirely — e.g. before auth resolves. */
  enabled?: boolean;
}

/**
 * Declarative Postgres-changes subscription with guaranteed teardown.
 *
 * Handlers are held in a ref and read at call time, so passing inline arrow
 * functions does not resubscribe on every render. The effect depends only on
 * values that genuinely define the subscription (channel, table, filter,
 * enabled), and its cleanup closes the channel — on unmount, on navigation,
 * and before any resubscribe.
 */
export function useRealtimeTable<Row extends Record<string, unknown>>({
  channelName,
  table,
  filter,
  handlers,
  enabled = true,
}: UseRealtimeTableOptions<Row>): void {
  const client = useSupabase();
  const handlersRef = useLatestRef(handlers);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToTable<Row>({
      client,
      channelName,
      table,
      filter,
      handlers: {
        onInsert: (row) => handlersRef.current.onInsert?.(row),
        onUpdate: (row) => handlersRef.current.onUpdate?.(row),
        onDelete: (row) => handlersRef.current.onDelete?.(row),
        onStatusChange: (status) => handlersRef.current.onStatusChange?.(status),
      },
    });

    return unsubscribe;
  }, [client, channelName, table, filter, enabled, handlersRef]);
}
