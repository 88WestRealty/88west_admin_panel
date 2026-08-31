export const APP_NAME = '88West Admin';

export const REALTIME_CHANNELS = {
  members: 'admin:members',
  vendors: 'admin:vendors',
} as const;

/** Debounce for the vendor search box, in ms. */
export const SEARCH_DEBOUNCE_MS = 250;

/**
 * Ceiling on a data fetch before it is treated as failed.
 * Without it an unreachable backend leaves the screen on a spinner forever —
 * an error the user can act on beats an animation that never resolves.
 */
export const FETCH_TIMEOUT_MS = 8_000;

/** How long a toast stays on screen, in ms. */
export const TOAST_TIMEOUT_MS = 4_000;

export const MEMBER_STATUS_LABELS = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
} as const;
