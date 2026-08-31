'use client';

import { useMemo } from 'react';
import { REALTIME_CHANNELS, SEARCH_DEBOUNCE_MS } from '@/constants';
import { useAbortableFetch, useDebouncedValue, useRealtimeTable, useSupabase } from '@/hooks';
import { vendorService } from '@/services';
import {
  selectVendorQuery,
  selectVendors,
  selectVendorsStatus,
  useVendorsStore,
} from '@/store/vendors.store';
import { toVendor, type Vendor, type VendorRow } from '@/types/models';
import { matchesQuery } from '@/utils/collections';
import { isAbortError } from '@/utils/errors';

/**
 * Loads vendors, keeps them live, and derives the filtered view.
 *
 * Search is client-side against an already-loaded list — for a vendor
 * directory of this size a round-trip per keystroke would be slower and
 * noisier than filtering in memory. The debounce still applies so the derived
 * `useMemo` is not recomputed on every character.
 */
export function useVendors() {
  const client = useSupabase();
  const vendors = useVendorsStore(selectVendors);
  const query = useVendorsStore(selectVendorQuery);
  const status = useVendorsStore(selectVendorsStatus);
  const error = useVendorsStore((s) => s.error);
  const setVendors = useVendorsStore((s) => s.setVendors);
  const setStatus = useVendorsStore((s) => s.setStatus);
  const setError = useVendorsStore((s) => s.setError);
  const applyUpsert = useVendorsStore((s) => s.applyUpsert);
  const applyDelete = useVendorsStore((s) => s.applyDelete);

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  const { retry } = useAbortableFetch(
    async (signal) => {
      setStatus('loading');
      const result = await vendorService.fetchVendors(client, signal);
      if (signal.aborted) return;
      if (result.ok) setVendors(result.data);
      else if (!isAbortError(result.error.cause)) setError(result.error.message);
    },
    () => setError('Could not reach the server. Check your connection and retry.'),
    [client],
  );

  useRealtimeTable<VendorRow>({
    channelName: REALTIME_CHANNELS.vendors,
    table: 'vendors',
    handlers: {
      onInsert: (row) => applyUpsert(toVendor(row)),
      onUpdate: (row) => applyUpsert(toVendor(row)),
      onDelete: (row) => applyDelete(row.id),
    },
  });

  const visible = useMemo<Vendor[]>(() => {
    const term = debouncedQuery.trim();
    if (!term) return vendors;
    return vendors.filter(
      (vendor) =>
        matchesQuery(vendor.name, term) || matchesQuery(vendor.category ?? '', term),
    );
  }, [vendors, debouncedQuery]);

  return { vendors: visible, totalCount: vendors.length, status, error, retry };
}
