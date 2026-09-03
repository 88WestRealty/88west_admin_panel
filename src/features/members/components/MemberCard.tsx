'use client';

import { memo } from 'react';
import { Badge, Button } from '@/components/ui';
import { MEMBER_STATUS_LABELS } from '@/constants';
import type { Member } from '@/types/models';
import { formatRelative, initialsOf } from '@/utils/format';
import styles from './MemberCard.module.css';

interface MemberCardProps {
  member: Member;
  isPending: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSetActive: (id: string, isActive: boolean) => void;
}

const TONE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
} as const;

/**
 * Presentational card — props in, callbacks out, no store or service access.
 *
 * `memo` earns its place here specifically because this list re-renders on
 * every realtime event: without it, one INSERT would re-render every card in
 * the queue. The parent passes stable `useCallback` handlers so the comparison
 * actually holds.
 */
export const MemberCard = memo(function MemberCard({
  member,
  isPending,
  onApprove,
  onReject,
  onSetActive,
}: MemberCardProps) {
  // A decision is never final: an approved member can be rejected later and a
  // rejected one reinstated, so only the button matching the current status is
  // suppressed (it would be a no-op the service rejects anyway).
  const canApprove = member.status !== 'approved';
  const canReject = member.status !== 'rejected';

  // Access is meaningful only for an approved member. A rejected or pending
  // row reads non-active and the switch is disabled until they are approved.
  const isApproved = member.status === 'approved';

  return (
    <article className={styles.card}>
      <div className={styles.avatar} aria-hidden>
        {initialsOf(member.fullName)}
      </div>

      <div className={styles.details}>
        <div className={styles.headline}>
          <h3 className={styles.name}>{member.fullName}</h3>
          <Badge tone={TONE[member.status]}>{MEMBER_STATUS_LABELS[member.status]}</Badge>
        </div>
        <p className={styles.email}>{member.email}</p>
        <p className={styles.meta}>
          Signed up {formatRelative(member.createdAt)}
          {member.phone ? ` · ${member.phone}` : ''}
        </p>
        {member.reviewNote ? <p className={styles.note}>“{member.reviewNote}”</p> : null}
      </div>

      <div className={styles.actions}>
        <label
          className={styles.activeToggle}
          data-disabled={!isApproved || undefined}
          title={
            isApproved
              ? 'Switch this member’s access on or off'
              : 'Only an approved member can be made active'
          }
        >
          <input
            type="checkbox"
            checked={member.isActive}
            disabled={!isApproved || isPending}
            onChange={(event) => onSetActive(member.id, event.target.checked)}
          />
          <span>{member.isActive ? 'Active' : 'Non-active'}</span>
        </label>

        <div className={styles.decisions}>
          {canReject ? (
            <Button
              variant="secondary"
              isLoading={isPending}
              onClick={() => onReject(member.id)}
            >
              Reject
            </Button>
          ) : null}
          {canApprove ? (
            <Button isLoading={isPending} onClick={() => onApprove(member.id)}>
              {member.status === 'rejected' ? 'Reinstate' : 'Approve'}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
});
