'use client';

import { useCallback } from 'react';
import { Button, EmptyState, ErrorState, Spinner } from '@/components/ui';
import { useMembersStore } from '@/store/members.store';
import type { Member } from '@/types/models';
import type { AsyncStatus } from '@/types/common';
import { MemberCard } from './MemberCard';
import styles from './MemberList.module.css';

interface MemberListProps {
  members: readonly Member[];
  status: AsyncStatus;
  error: string | null;
  onRetry: () => void;
  onReview: (id: string, decision: 'approved' | 'rejected') => void;
  onSetActive: (id: string, isActive: boolean) => void;
}

export function MemberList({
  members,
  status,
  error,
  onRetry,
  onReview,
  onSetActive,
}: MemberListProps) {
  const pendingIds = useMembersStore((s) => s.pendingIds);

  // Stable identities so `memo` on MemberCard is not defeated on every render.
  const handleApprove = useCallback(
    (id: string) => onReview(id, 'approved'),
    [onReview],
  );
  const handleReject = useCallback((id: string) => onReview(id, 'rejected'), [onReview]);
  const handleSetActive = useCallback(
    (id: string, isActive: boolean) => onSetActive(id, isActive),
    [onSetActive],
  );

  if (status === 'loading' && members.length === 0) {
    return <Spinner label="Loading the verification queue…" />;
  }

  // Only takes over the region when there is nothing to show; a refresh that
  // fails over existing rows keeps the rows and reports via a toast instead.
  if (status === 'error' && members.length === 0) {
    return (
      <ErrorState
        message={error ?? 'The verification queue could not be loaded.'}
        action={
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }

  if (members.length === 0) {
    return (
      <EmptyState
        title="Nothing to review"
        description="New signups from the mobile app appear here the moment they arrive."
      />
    );
  }

  return (
    <ul className={styles.list}>
      {members.map((member) => (
        <li key={member.id}>
          <MemberCard
            member={member}
            isPending={pendingIds.includes(member.id)}
            onApprove={handleApprove}
            onReject={handleReject}
          onSetActive={handleSetActive}
          />
        </li>
      ))}
    </ul>
  );
}
