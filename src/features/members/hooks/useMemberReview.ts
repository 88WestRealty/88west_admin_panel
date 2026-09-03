'use client';

import { useCallback } from 'react';
import { useIsMounted, useSupabase } from '@/hooks';
import { memberService } from '@/services';
import { useAuthStore, selectUser } from '@/store/auth.store';
import { useMembersStore } from '@/store/members.store';
import { useUiStore } from '@/store/ui.store';
import type { MemberStatus } from '@/types/models';

type Decision = Extract<MemberStatus, 'approved' | 'rejected'>;

/**
 * Approve/reject with optimistic UI and rollback.
 *
 * The card updates immediately, and the realtime UPDATE that follows is
 * idempotent against the same row — so the optimistic write and the broadcast
 * converge instead of fighting. On failure the previous row is restored.
 */
export function useMemberReview() {
  const client = useSupabase();
  const isMounted = useIsMounted();
  const user = useAuthStore(selectUser);
  const pushToast = useUiStore((s) => s.pushToast);
  const applyUpsert = useMembersStore((s) => s.applyUpsert);
  const markPending = useMembersStore((s) => s.markPending);

  const review = useCallback(
    async (memberId: string, decision: Decision, note?: string) => {
      if (!user) return;

      const previous = useMembersStore
        .getState()
        .members.find((member) => member.id === memberId);
      if (!previous) return;

      markPending(memberId, true);
      // Mirror the database trigger optimistically: rejecting deactivates,
      // approving reactivates, so the card does not flash the wrong access
      // state before the realtime UPDATE lands.
      applyUpsert({
        ...previous,
        status: decision,
        isActive: decision === 'approved',
        reviewNote: note ?? null,
      });

      const result = await memberService.reviewMember(client, {
        memberId,
        decision,
        note,
        reviewerId: user.id,
      });

      if (!isMounted()) return;
      markPending(memberId, false);

      if (!result.ok) {
        applyUpsert(previous);
        pushToast('error', result.error.message);
        return;
      }

      applyUpsert(result.data);
      pushToast(
        'success',
        `${result.data.fullName} was ${decision === 'approved' ? 'approved' : 'rejected'}.`,
      );
    },
    [applyUpsert, client, isMounted, markPending, pushToast, user],
  );

  return { review, canReview: user !== null };
}
