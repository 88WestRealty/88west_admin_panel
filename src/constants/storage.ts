/**
 * Every localStorage key the app owns, namespaced so it cannot collide with
 * Supabase's own auth keys (`sb-*`) on the same origin.
 */
const PREFIX = '88west.admin';

/**
 * Bumped whenever a persisted shape changes incompatibly. It is part of every
 * key, so old entries are simply never read again — and the browser evicts
 * them on its own. Without this, a draft written before a field existed is
 * restored into code that assumes the field is there.
 */
export const STORAGE_VERSION = 'v2';

export const STORAGE_KEYS = {
  /** Draft vendor form, preserved across accidental navigation/refresh. */
  vendorDraft: `${PREFIX}.${STORAGE_VERSION}.vendor-draft`,
  /** Last-used filter on the verification queue. */
  memberFilter: `${PREFIX}.${STORAGE_VERSION}.member-filter`,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Cross-tab sync channel for persisted state. */
export const STORAGE_EVENT = 'storage' as const;
