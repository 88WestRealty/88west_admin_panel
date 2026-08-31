'use client';

import { useCallback } from 'react';
import { useIsMounted, useSupabase } from '@/hooks';
import { storageService, vendorService } from '@/services';
import { selectUser, useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { useVendorsStore } from '@/store/vendors.store';
import type { VendorFormValues } from '@/types/common';
import { humanizeError } from '@/utils/errors';

/**
 * Create / update / delete for vendors.
 *
 * The store is not mutated on success: the realtime channel opened by
 * `useVendors` delivers the authoritative row to every open tab, this one
 * included. Writing locally *and* accepting the broadcast would risk showing a
 * row that the database rejected. Delete is the exception — it applies
 * immediately so the row disappears under the cursor.
 */
export function useVendorMutations() {
  const client = useSupabase();
  const isMounted = useIsMounted();
  const user = useAuthStore(selectUser);
  const pushToast = useUiStore((s) => s.pushToast);
  const markMutating = useVendorsStore((s) => s.markMutating);
  const applyDelete = useVendorsStore((s) => s.applyDelete);
  const closeForm = useVendorsStore((s) => s.closeForm);

  /**
   * Uploads the pending logo, if there is one, and returns the values to save.
   *
   * Runs first so a storage failure aborts before any row is written — better
   * to save nothing than a vendor row pointing at a logo that never landed.
   */
  const withUploadedLogo = useCallback(
    async (
      values: VendorFormValues,
      pendingLogo: File | null,
    ): Promise<VendorFormValues | null> => {
      if (!pendingLogo) return values;

      const upload = await storageService.uploadVendorLogo(client, pendingLogo);
      if (!upload.ok) {
        pushToast('error', humanizeError(upload.error.message));
        return null;
      }
      return { ...values, logoPath: upload.data };
    },
    [client, pushToast],
  );

  const create = useCallback(
    async (values: VendorFormValues, pendingLogo: File | null): Promise<boolean> => {
      if (!user) return false;

      const withLogo = await withUploadedLogo(values, pendingLogo);
      if (!isMounted() || !withLogo) return false;

      const result = await vendorService.createVendor(client, withLogo, user.id);
      if (!isMounted()) return false;

      if (!result.ok) {
        // The row failed after the logo landed — remove the object rather than
        // leaving it in the bucket with nothing referencing it.
        if (withLogo.logoPath && pendingLogo) {
          void storageService.removeVendorLogo(client, withLogo.logoPath);
        }
        pushToast('error', humanizeError(result.error.message));
        return false;
      }
      pushToast('success', `${result.data.name} was added.`);
      closeForm();
      return true;
    },
    [client, closeForm, isMounted, pushToast, user, withUploadedLogo],
  );

  const update = useCallback(
    async (
      id: string,
      values: VendorFormValues,
      pendingLogo: File | null,
      previousLogoPath: string | null,
    ): Promise<boolean> => {
      markMutating(id, true);

      const withLogo = await withUploadedLogo(values, pendingLogo);
      if (!isMounted()) return false;
      if (!withLogo) {
        markMutating(id, false);
        return false;
      }

      const result = await vendorService.updateVendor(client, id, withLogo);
      if (!isMounted()) return false;
      markMutating(id, false);

      if (!result.ok) {
        if (pendingLogo && withLogo.logoPath) {
          void storageService.removeVendorLogo(client, withLogo.logoPath);
        }
        pushToast('error', humanizeError(result.error.message));
        return false;
      }

      // The replaced logo is unreferenced once the row points elsewhere.
      if (previousLogoPath && previousLogoPath !== result.data.logoPath) {
        void storageService.removeVendorLogo(client, previousLogoPath);
      }

      pushToast('success', `${result.data.name} was updated.`);
      closeForm();
      return true;
    },
    [client, closeForm, isMounted, markMutating, pushToast, withUploadedLogo],
  );

  const remove = useCallback(
    async (id: string, name: string): Promise<void> => {
      markMutating(id, true);
      const result = await vendorService.deleteVendor(client, id);
      if (!isMounted()) return;
      markMutating(id, false);

      if (!result.ok) {
        pushToast('error', result.error.message);
        return;
      }
      applyDelete(id);
      pushToast('success', `${name} was deleted.`);
    },
    [applyDelete, client, isMounted, markMutating, pushToast],
  );

  return { create, update, remove, canMutate: user !== null };
}
