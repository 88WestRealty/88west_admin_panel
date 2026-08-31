'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { REALTIME_CHANNELS, STORAGE_KEYS } from '@/constants';
import { useAbortableFetch, useLocalStorage, useRealtimeTable, useSupabase } from '@/hooks';
import { memberService } from '@/services';
import {
  selectMembers,
  selectMembersStatus,
  useMembersStore,
  type MemberFilter,
} from '@/store/members.store';
import { useUiStore } from '@/store/ui.store';
import { toMember, type Member, type MemberRow } from '@/types/models';
import { isAbortError } from '@/utils/errors';

/**
 * Owns the verification queue: initial fetch, realtime stream, and the
 * persisted filter. `MembersScreen` renders whatever this returns.
 *
 * The subscription is intentionally unfiltered even when the UI shows only
 * pending rows. A server-side `status=eq.pending` filter would stop delivering
 * a row the moment it was approved, so the card would linger on screen until
 * a refetch. Listening to everything lets the store reconcile the transition.
 */
export function useMemberQueue() {
  const client = useSupabase();
  const pushToast = useUiStore((s) => s.pushToast);

  const members = useMembersStore(selectMembers);
  const status = useMembersStore(selectMembersStatus);
  const error = useMembersStore((s) => s.error);
  const setMembers = useMembersStore((s) => s.setMembers);
  const setStatus = useMembersStore((s) => s.setStatus);
  const setError = useMembersStore((s) => s.setError);
  const applyUpsert = useMembersStore((s) => s.applyUpsert);
  const applyDelete = useMembersStore((s) => s.applyDelete);
  const setLive = useMembersStore((s) => s.setLive);
  const setStoreFilter = useMembersStore((s) => s.setFilter);

  const { value: filter, setValue: persistFilter } = useLocalStorage<MemberFilter>(
    STORAGE_KEYS.memberFilter,
    'pending',
  );

  useEffect(() => setStoreFilter(filter), [filter, setStoreFilter]);

  // Initial load, re-run whenever the filter changes. Cancellation and the
  // timeout both live in the hook.
  const { retry } = useAbortableFetch(
    async (signal) => {
      setStatus('loading');
      const result = await memberService.fetchMembers(client, filter, signal);
      if (signal.aborted) return;
      if (result.ok) setMembers(result.data);
      else if (!isAbortError(result.error.cause)) setError(result.error.message);
    },
    () => setError('Could not reach the server. Check your connection and retry.'),
    [client, filter],
  );

  const handleRow = useCallback(
    (row: MemberRow) => {
      const member = toMember(row);
      // Reconcile against the active filter: a row that no longer matches is
      // removed rather than left stale.
      if (filter !== 'all' && member.status !== filter) applyDelete(member.id);
      else applyUpsert(member);
    },
    [applyDelete, applyUpsert, filter],
  );

  useRealtimeTable<MemberRow>({
    channelName: REALTIME_CHANNELS.members,
    table: 'members',
    handlers: {
      onInsert: (row) => {
        handleRow(row);
        if (row.status === 'pending') pushToast('info', `New signup from ${row.full_name}.`);
      },
      onUpdate: handleRow,
      onDelete: (row) => applyDelete(row.id),
      onStatusChange: (state) => setLive(state === 'subscribed'),
    },
  });

  const visible = useMemo<Member[]>(
    () => (filter === 'all' ? members : members.filter((m) => m.status === filter)),
    [members, filter],
  );

  return { members: visible, status, error, filter, setFilter: persistFilter, retry };
}
