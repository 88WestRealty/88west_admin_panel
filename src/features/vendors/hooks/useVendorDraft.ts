'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { STORAGE_KEYS } from '@/constants';
import { useLocalStorage } from '@/hooks';
import type { VendorFormValues } from '@/types/common';

export const EMPTY_VENDOR: VendorFormValues = {
  name: '',
  category: '',
  discountPercent: '',
  logoPath: null,
};

/** Drafts are keyed per vendor so editing two records never crosses wires. */
export const draftKey = (vendorId: string | null): string =>
  `${STORAGE_KEYS.vendorDraft}.${vendorId ?? 'new'}`;

/**
 * Discards a stored draft without needing the hook mounted.
 *
 * Closing the editor unmounts the form, so the cleanup has to be callable
 * from the parent — by which point the hook's own `clearDraft` is gone.
 */
export function discardVendorDraft(vendorId: string | null): void {
  try {
    window.localStorage.removeItem(draftKey(vendorId));
  } catch {
    // Storage disabled or full — nothing to discard, and nothing to report.
  }
}

/**
 * Reconciles whatever was in storage with the shape the form expects today.
 *
 * localStorage is untrusted input: it can hold a draft written by an older
 * build (missing fields added since), a partial write, or something a user
 * edited by hand. Spreading over `seed` guarantees every key is present and
 * correctly typed, so the form can never render `undefined.length`.
 */
function reconcileDraft(stored: unknown, seed: VendorFormValues): VendorFormValues {
  if (typeof stored !== 'object' || stored === null) return seed;
  const raw = stored as Partial<Record<keyof VendorFormValues, unknown>>;

  const text = (key: keyof VendorFormValues, fallback: string): string =>
    typeof raw[key] === 'string' ? (raw[key] as string) : fallback;

  return {
    name: text('name', seed.name),
    category: text('category', seed.category),
    discountPercent: text('discountPercent', seed.discountPercent),
    logoPath: typeof raw.logoPath === 'string' ? raw.logoPath : seed.logoPath,
  };
}

/**
 * Persists unsaved vendor edits to localStorage.
 *
 * Closing the modal by accident — or reloading the tab — no longer discards
 * typing. The draft is cleared explicitly on a successful save, so a stale
 * draft cannot resurrect over a newer server value.
 *
 * `isHydrated` is surfaced rather than swallowed: the form renders the seed
 * values on the server and adopts the draft only once storage has been read,
 * which is what keeps the markup identical across hydration.
 */
export function useVendorDraft(vendorId: string | null, seed: VendorFormValues) {
  // Parsing through `reconcileDraft` means a malformed entry degrades to the
  // seed rather than reaching the render tree.
  const serializer = useMemo(
    () => ({
      parse: (rawText: string): VendorFormValues =>
        reconcileDraft(JSON.parse(rawText), seed),
      stringify: (value: VendorFormValues) => JSON.stringify(value),
    }),
    [seed],
  );

  const { value, setValue, remove, isHydrated } = useLocalStorage<VendorFormValues>(
    draftKey(vendorId),
    seed,
    serializer,
  );

  // When the editor switches to a different vendor and no draft was stored for
  // it, adopt that vendor's saved values rather than the previous row's.
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (window.localStorage.getItem(draftKey(vendorId)) === null) setValue(seed);
    } catch {
      setValue(seed);
    }
    // `seed` is derived from the vendor row; keying on the id avoids re-running
    // this whenever the parent re-creates an equal object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, isHydrated]);

  const setField = useCallback(
    <K extends keyof VendorFormValues>(field: K, fieldValue: VendorFormValues[K]) => {
      setValue((current) => ({ ...current, [field]: fieldValue }));
    },
    [setValue],
  );

  return { draft: value, setField, clearDraft: remove, isHydrated };
}
