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
}: MemberCardProps) {
  const isDecided = member.status !== 'pending';

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

      {!isDecided ? (
        <div className={styles.actions}>
          <Button
            variant="secondary"
            isLoading={isPending}
            onClick={() => onReject(member.id)}
          >
            Reject
          </Button>
          <Button isLoading={isPending} onClick={() => onApprove(member.id)}>
            Approve
          </Button>
        </div>
      ) : null}
    </article>
  );
});
