'use client';

import { useCallback } from 'react';
import { Button, EmptyState, ErrorState, Spinner } from '@/components/ui';
import type { AsyncStatus } from '@/types/common';
import type { Vendor } from '@/types/models';
import { useVendorsStore } from '@/store/vendors.store';
import { useVendorMutations } from '../hooks/useVendorMutations';
import { VendorRow } from './VendorRow';
import styles from './VendorTable.module.css';

interface VendorTableProps {
  vendors: readonly Vendor[];
  status: AsyncStatus;
  error: string | null;
  onRetry: () => void;
}

const HEADINGS = ['Vendor', 'Category', 'Offer', 'Updated', ''] as const;

export function VendorTable({ vendors, status, error, onRetry }: VendorTableProps) {
  const mutatingIds = useVendorsStore((s) => s.mutatingIds);
  const openForm = useVendorsStore((s) => s.openForm);
  const { remove } = useVendorMutations();

  const handleEdit = useCallback((id: string) => openForm(id), [openForm]);

  const handleDelete = useCallback(
    (vendor: Vendor) => {
      if (window.confirm(`Delete ${vendor.name}? This cannot be undone.`)) {
        void remove(vendor.id, vendor.name);
      }
    },
    [remove],
  );

  if (status === 'loading' && vendors.length === 0) return <Spinner label="Loading vendors…" />;

  if (status === 'error' && vendors.length === 0) {
    return (
      <ErrorState
        message={error ?? 'Vendors could not be loaded.'}
        action={
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }

  if (vendors.length === 0) {
    return (
      <EmptyState
        title="No vendors found"
        description="Add your first vendor, or clear the search to see the full list."
      />
    );
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {HEADINGS.map((heading, index) => (
              <th key={heading || `col-${index}`} scope="col" className={styles.th}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <VendorRow
              key={vendor.id}
              vendor={vendor}
              isMutating={mutatingIds.includes(vendor.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
