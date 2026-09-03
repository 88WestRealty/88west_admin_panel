'use client';

import { useCallback } from 'react';
import { useIsMounted, useSupabase } from '@/hooks';
import { memberService } from '@/services';
import { useMembersStore } from '@/store/members.store';
import { useUiStore } from '@/store/ui.store';

/**
 * Toggles a member's access on or off, independent of the review decision.
 *
 * Same optimistic-with-rollback shape as `useMemberReview`: the switch moves
 * immediately and the realtime UPDATE that follows is idempotent against the
 * same row, so the local write and the broadcast converge rather than fight.
 *
 * Only meaningful for an approved member — the service and the database both
 * refuse to activate a pending or rejected row, and the UI disables the
 * control for them.
 */
export function useMemberActive() {
  const client = useSupabase();
  const isMounted = useIsMounted();
  const pushToast = useUiStore((s) => s.pushToast);
  const applyUpsert = useMembersStore((s) => s.applyUpsert);
  const markPending = useMembersStore((s) => s.markPending);

  const setActive = useCallback(
    async (memberId: string, isActive: boolean) => {
      const previous = useMembersStore
        .getState()
        .members.find((member) => member.id === memberId);
      if (!previous) return;

      markPending(memberId, true);
      applyUpsert({ ...previous, isActive });

      const result = await memberService.setMemberActive(client, memberId, isActive);

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
        `${result.data.fullName} is now ${isActive ? 'active' : 'non-active'}.`,
      );
    },
    [applyUpsert, client, isMounted, markPending, pushToast],
  );

  return { setActive };
}
