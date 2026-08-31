'use client';

import { create } from 'zustand';
import type { AsyncStatus } from '@/types/common';
import type { Member, MemberStatus } from '@/types/models';
import { removeById, upsertById } from '@/utils/collections';

export type MemberFilter = MemberStatus | 'all';

interface MembersState {
  members: Member[];
  filter: MemberFilter;
  status: AsyncStatus;
  error: string | null;
  /** Ids with a decision in flight — drives per-card button state. */
  pendingIds: string[];
  isLive: boolean;
}

interface MembersActions {
  setMembers: (members: Member[]) => void;
  applyUpsert: (member: Member) => void;
  applyDelete: (id: string) => void;
  setFilter: (filter: MemberFilter) => void;
  setStatus: (status: AsyncStatus) => void;
  setError: (error: string | null) => void;
  markPending: (id: string, pending: boolean) => void;
  setLive: (isLive: boolean) => void;
  reset: () => void;
}

const initialState: MembersState = {
  members: [],
  filter: 'pending',
  status: 'idle',
  error: null,
  pendingIds: [],
  isLive: false,
};

/**
 * The verification queue. Realtime payloads land here through
 * `applyUpsert`/`applyDelete`, so an approval made by another admin appears
 * on this screen without a refetch.
 */
export const useMembersStore = create<MembersState & MembersActions>()((set) => ({
  ...initialState,
  setMembers: (members) => set({ members, status: 'ready', error: null }),
  applyUpsert: (member) => set((s) => ({ members: upsertById(s.members, member) })),
  applyDelete: (id) => set((s) => ({ members: removeById(s.members, id) })),
  setFilter: (filter) => set({ filter }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: error ? 'error' : 'ready' }),
  markPending: (id, pending) =>
    set((s) => ({
      pendingIds: pending
        ? s.pendingIds.includes(id)
          ? s.pendingIds
          : [...s.pendingIds, id]
        : s.pendingIds.filter((value) => value !== id),
    })),
  setLive: (isLive) => set({ isLive }),
  reset: () => set(initialState),
}));

export const selectMembers = (s: MembersState) => s.members;
export const selectMemberFilter = (s: MembersState) => s.filter;
export const selectMembersStatus = (s: MembersState) => s.status;
export const selectIsLive = (s: MembersState) => s.isLive;
