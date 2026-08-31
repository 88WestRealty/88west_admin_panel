'use client';

import { selectIsLive, selectMembersStatus, useMembersStore } from '@/store/members.store';
import styles from './LiveIndicator.module.css';

/**
 * Surfaces realtime connection state. Subscribing to a single boolean means
 * a reconnect repaints this dot and nothing else on the screen.
 */
export function LiveIndicator() {
  const isLive = useMembersStore(selectIsLive);
  const status = useMembersStore(selectMembersStatus);

  // Saying "Reconnecting" before the first connection has been made is a lie,
  // and saying it when the data layer is already known to be down is noise.
  if (!isLive && (status === 'loading' || status === 'error' || status === 'idle')) {
    return null;
  }

  return (
    <span className={styles.wrapper} data-live={isLive || undefined}>
      <span className={styles.dot} aria-hidden />
      <span className={styles.label}>{isLive ? 'Live' : 'Reconnecting…'}</span>
    </span>
  );
}
