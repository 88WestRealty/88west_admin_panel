'use client';

import { memo } from 'react';
import { MEMBER_STATUS_LABELS } from '@/constants';
import type { MemberFilter } from '@/store/members.store';
import styles from './MemberFilterTabs.module.css';

interface MemberFilterTabsProps {
  value: MemberFilter;
  onChange: (next: MemberFilter) => void;
}

const TABS: ReadonlyArray<{ value: MemberFilter; label: string }> = [
  { value: 'pending', label: MEMBER_STATUS_LABELS.pending },
  { value: 'approved', label: MEMBER_STATUS_LABELS.approved },
  { value: 'rejected', label: MEMBER_STATUS_LABELS.rejected },
  { value: 'all', label: 'All' },
];

export const MemberFilterTabs = memo(function MemberFilterTabs({
  value,
  onChange,
}: MemberFilterTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Filter signups">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={tab.value === value}
          className={styles.tab}
          data-active={tab.value === value || undefined}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
});
