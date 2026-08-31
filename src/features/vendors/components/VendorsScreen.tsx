'use client';

import { useCallback, useMemo } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Modal } from '@/components/ui';
import {
  selectEditingId,
  selectIsFormOpen,
  useVendorsStore,
} from '@/store/vendors.store';
import { discardVendorDraft } from '../hooks/useVendorDraft';
import { useVendorShortcuts } from '../hooks/useVendorShortcuts';
import { useVendors } from '../hooks/useVendors';
import { VendorForm } from './VendorForm';
import { VendorSearch } from './VendorSearch';
import { VendorTable } from './VendorTable';
import styles from './VendorsScreen.module.css';

export function VendorsScreen() {
  const { vendors, totalCount, status, error, retry } = useVendors();
  const isFormOpen = useVendorsStore(selectIsFormOpen);
  const editingId = useVendorsStore(selectEditingId);
  const openForm = useVendorsStore((s) => s.openForm);
  const closeForm = useVendorsStore((s) => s.closeForm);

  useVendorShortcuts();

  const editingVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === editingId) ?? null,
    [vendors, editingId],
  );

  const handleAdd = useCallback(() => openForm(null), [openForm]);

  /**
   * Closing the editor abandons the entry, so the draft goes with it.
   *
   * Drafts exist to survive an *accidental* loss — a refresh, a crash, a
   * navigation away. Dismissing the dialog is a deliberate "never mind", and
   * restoring those values next time reads as the form being broken.
   */
  const handleClose = useCallback(() => {
    discardVendorDraft(editingId);
    closeForm();
  }, [closeForm, editingId]);

  return (
    <section className={styles.screen}>
      <PageHeader
        title="Vendors"
        description={`${totalCount} ${totalCount === 1 ? 'vendor' : 'vendors'} on file. Press “n” to add one.`}
        actions={<Button onClick={handleAdd}>Add vendor</Button>}
      />

      <div className={styles.toolbar}>
        <VendorSearch />
      </div>

      <ErrorBoundary fallbackTitle="The vendor list failed to render.">
        <VendorTable vendors={vendors} status={status} error={error} onRetry={retry} />
      </ErrorBoundary>

      <Modal
        isOpen={isFormOpen}
        title={editingVendor ? `Edit ${editingVendor.name}` : 'Add vendor'}
        onClose={handleClose}
      >
        <VendorForm
          // Remounting per record gives each vendor a clean form state and a
          // correctly-keyed draft, instead of leaking the previous row's input.
          key={editingId ?? 'new'}
          vendor={editingVendor}
          onCancel={handleClose}
        />
      </Modal>
    </section>
  );
}
