'use client';

import { memo } from 'react';
import { Button } from '@/components/ui';
import { useSupabase } from '@/hooks';
import { storageService } from '@/services';
import type { Vendor } from '@/types/models';
import { formatDateTime, initialsOf } from '@/utils/format';
import styles from './VendorRow.module.css';

interface VendorRowProps {
  vendor: Vendor;
  isMutating: boolean;
  onEdit: (id: string) => void;
  onDelete: (vendor: Vendor) => void;
}

/**
 * One vendor row. Memoised for the same reason as MemberCard: realtime
 * updates repaint the list, and only the changed row should re-render.
 */
export const VendorRow = memo(function VendorRow({
  vendor,
  isMutating,
  onEdit,
  onDelete,
}: VendorRowProps) {
  const client = useSupabase();
  const logoUrl = storageService.vendorLogoUrl(client, vendor.logoPath);

  return (
    <tr className={styles.row}>
      <td className={styles.primary}>
        <div className={styles.identity}>
          <span className={styles.logo} data-empty={!logoUrl || undefined}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className={styles.logoImage} />
            ) : (
              initialsOf(vendor.name)
            )}
          </span>
          <span className={styles.name}>{vendor.name}</span>
        </div>
      </td>
      <td className={styles.cell}>{vendor.category ?? '—'}</td>
      <td className={styles.cell}>
        {vendor.discountPercent === null ? (
          <span className={styles.noOffer}>—</span>
        ) : (
          <span className={styles.discount}>{vendor.discountPercent}% off</span>
        )}
      </td>
      <td className={styles.cell}>{formatDateTime(vendor.updatedAt)}</td>
      <td className={styles.actions}>
        <Button variant="ghost" onClick={() => onEdit(vendor.id)} disabled={isMutating}>
          Edit
        </Button>
        <Button variant="danger" isLoading={isMutating} onClick={() => onDelete(vendor)}>
          Delete
        </Button>
      </td>
    </tr>
  );
});
