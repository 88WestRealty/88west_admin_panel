'use client';

import { TextField } from '@/components/ui';
import { selectVendorQuery, useVendorsStore } from '@/store/vendors.store';

/**
 * Isolated so typing re-renders this input alone — the vendor table subscribes
 * to the debounced result, not to each keystroke.
 */
export function VendorSearch() {
  const query = useVendorsStore(selectVendorQuery);
  const setQuery = useVendorsStore((s) => s.setQuery);

  return (
    <TextField
      label="Search vendors"
      type="search"
      placeholder="Name or category"
      value={query}
      onChange={(event) => setQuery(event.target.value)}
    />
  );
}
