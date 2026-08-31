'use client';

import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import type { TypedSupabaseClient } from './client';

export type TableName = 'members' | 'vendors';

export interface RealtimeHandlers<Row extends Record<string, unknown>> {
  onInsert?: (row: Row) => void;
  onUpdate?: (row: Row) => void;
  onDelete?: (row: Row) => void;
  onStatusChange?: (status: 'subscribed' | 'reconnecting' | 'closed') => void;
}

export interface SubscribeOptions<Row extends Record<string, unknown>> {
  client: TypedSupabaseClient;
  channelName: string;
  table: TableName;
  /** PostgREST filter, e.g. `status=eq.pending`. Applied server-side. */
  filter?: string;
  handlers: RealtimeHandlers<Row>;
}

/**
 * Opens one Postgres-changes subscription and returns a single idempotent
 * teardown function.
 *
 * The contract deliberately gives the caller exactly one thing to remember:
 * call the returned function. There is no channel object to track, no way to
 * unsubscribe a channel twice, and no path where an in-flight `subscribe()`
 * outlives the caller — if teardown runs before the socket finishes
 * connecting, `disposed` short-circuits the callbacks and the channel is
 * removed anyway.
 */
export function subscribeToTable<Row extends Record<string, unknown>>({
  client,
  channelName,
  table,
  filter,
  handlers,
}: SubscribeOptions<Row>): () => void {
  let disposed = false;

  const channel: RealtimeChannel = client
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
      (payload: RealtimePostgresChangesPayload<Row>) => {
        // A payload can still arrive between teardown and socket close.
        if (disposed) return;
        dispatch(payload, handlers);
      },
    )
    .subscribe((status) => {
      if (disposed) return;
      if (status === 'SUBSCRIBED') handlers.onStatusChange?.('subscribed');
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        handlers.onStatusChange?.('reconnecting');
      } else if (status === 'CLOSED') handlers.onStatusChange?.('closed');
    });

  return () => {
    if (disposed) return;
    disposed = true;
    // removeChannel both unsubscribes and drops the channel from the client's
    // registry — plain `channel.unsubscribe()` leaves the entry behind and the
    // socket open once every channel is gone.
    void client.removeChannel(channel);
  };
}

function dispatch<Row extends Record<string, unknown>>(
  payload: RealtimePostgresChangesPayload<Row>,
  handlers: RealtimeHandlers<Row>,
): void {
  switch (payload.eventType) {
    case 'INSERT':
      handlers.onInsert?.(payload.new);
      break;
    case 'UPDATE':
      handlers.onUpdate?.(payload.new);
      break;
    case 'DELETE':
      // Populated because the table is REPLICA IDENTITY FULL.
      if ('id' in payload.old) handlers.onDelete?.(payload.old as Row);
      break;
  }
}
