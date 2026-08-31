'use client';

import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui';
import { parseForm, vendorSchema } from '@/lib/validation';
import type { VendorFormValues } from '@/types/common';
import type { Vendor } from '@/types/models';
import { EMPTY_VENDOR, useVendorDraft } from '../hooks/useVendorDraft';
import { useVendorMutations } from '../hooks/useVendorMutations';
import { VendorFormFields } from './VendorFormFields';
import styles from './VendorForm.module.css';

interface VendorFormProps {
  vendor: Vendor | null;
  onCancel: () => void;
}

const toFormValues = (vendor: Vendor | null): VendorFormValues =>
  vendor
    ? {
        name: vendor.name,
        category: vendor.category ?? '',
        discountPercent: vendor.discountPercent?.toString() ?? '',
        logoPath: vendor.logoPath,
      }
    : EMPTY_VENDOR;

export function VendorForm({ vendor, onCancel }: VendorFormProps) {
  const seed = useMemo(() => toFormValues(vendor), [vendor]);
  const { draft, setField, clearDraft, isHydrated } = useVendorDraft(vendor?.id ?? null, seed);
  const { create, update } = useVendorMutations();

  const [errors, setErrors] = useState<Partial<Record<keyof VendorFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Held outside the draft: a File cannot be JSON-serialised into localStorage,
  // so it lives only for as long as this form is open.
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // A newly-picked file has no path yet, so validate against a shape that
      // reflects what will actually be saved.
      const candidate: VendorFormValues = pendingLogo
        ? { ...draft, logoPath: 'pending' }
        : draft;

      const { values, errors: fieldErrors } = parseForm(vendorSchema, candidate);
      setErrors(fieldErrors as Partial<Record<keyof VendorFormValues, string>>);
      if (!values) return;

      setIsSubmitting(true);
      const saved = vendor
        ? await update(vendor.id, draft, pendingLogo, vendor.logoPath)
        : await create(draft, pendingLogo);
      setIsSubmitting(false);

      // Only drop the draft once the row is safely persisted.
      if (saved) {
        clearDraft();
        setPendingLogo(null);
      }
    },
    [clearDraft, create, draft, pendingLogo, update, vendor],
  );

  const values = isHydrated ? draft : seed;

  return (
    <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
      <div className={styles.body}>
        <VendorFormFields
          values={values}
          errors={errors}
          disabled={isSubmitting}
          setField={setField}
          pendingLogo={pendingLogo}
          onSelectLogo={setPendingLogo}
        />
      </div>

      <footer className={styles.footer}>
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {vendor ? 'Save changes' : 'Add vendor'}
        </Button>
      </footer>
    </form>
  );
}
