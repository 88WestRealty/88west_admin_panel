'use client';

import { useCallback } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PageHeader } from '@/components/layout/PageHeader';
import { useMemberQueue } from '../hooks/useMemberQueue';
import { useMemberActive } from '../hooks/useMemberActive';
import { useMemberReview } from '../hooks/useMemberReview';
import { LiveIndicator } from './LiveIndicator';
import { MemberFilterTabs } from './MemberFilterTabs';
import { MemberList } from './MemberList';
import styles from './MembersScreen.module.css';

/**
 * Container for the verification screen. It composes the two feature hooks and
 * hands plain data down; every child below it is presentational.
 */
export function MembersScreen() {
  const { members, status, error, filter, setFilter, retry } = useMemberQueue();
  const { review } = useMemberReview();
  const { setActive } = useMemberActive();

  const handleReview = useCallback(
    (id: string, decision: 'approved' | 'rejected') => void review(id, decision),
    [review],
  );

  const handleSetActive = useCallback(
    (id: string, isActive: boolean) => void setActive(id, isActive),
    [setActive],
  );

  return (
    <section className={styles.screen}>
      <PageHeader
        title="Verify members"
        description="Signups submitted from the mobile app, newest first."
        actions={<LiveIndicator />}
      />

      <div className={styles.toolbar}>
        <MemberFilterTabs value={filter} onChange={setFilter} />
        <span className={styles.count}>
          {members.length} {members.length === 1 ? 'signup' : 'signups'}
        </span>
      </div>

      <ErrorBoundary fallbackTitle="The verification queue failed to render.">
        <MemberList
          members={members}
          status={status}
          error={error}
          onRetry={retry}
          onReview={handleReview}
          onSetActive={handleSetActive}
        />
      </ErrorBoundary>
    </section>
  );
}
