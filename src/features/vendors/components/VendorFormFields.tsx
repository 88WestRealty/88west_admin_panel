'use client';

import { TextField } from '@/components/ui';
import type { VendorFormValues } from '@/types/common';
import { LogoUpload } from './LogoUpload';

type Errors = Partial<Record<keyof VendorFormValues, string>>;

interface VendorFormFieldsProps {
  values: VendorFormValues;
  errors: Errors;
  disabled: boolean;
  setField: <K extends keyof VendorFormValues>(field: K, value: VendorFormValues[K]) => void;
  /** Logo chosen but not yet uploaded — uploaded on submit. */
  pendingLogo: File | null;
  onSelectLogo: (file: File | null) => void;
}

/**
 * The four fields the member directory card renders, in the order they appear
 * on it: name, category, discount, then the logo.
 *
 * The logo goes last deliberately — it is the only control that opens a file
 * picker, so leaving it until the text entry is done avoids interrupting
 * keyboard flow partway through the form.
 */
export function VendorFormFields({
  values,
  errors,
  disabled,
  setField,
  pendingLogo,
  onSelectLogo,
}: VendorFormFieldsProps) {
  return (
    <>
      <TextField
        label="Vendor name"
        placeholder="Lonsdale Coffee Co."
        value={values.name}
        onChange={(e) => setField('name', e.target.value)}
        error={errors.name}
        disabled={disabled}
        required
      />

      <TextField
        label="Category"
        placeholder="Coffee shop"
        hint="Shown under the vendor name in the directory."
        value={values.category}
        onChange={(e) => setField('category', e.target.value)}
        error={errors.category}
        disabled={disabled}
        required
      />

      <TextField
        label="Discount"
        type="number"
        inputMode="numeric"
        min={0}
        max={100}
        step={1}
        placeholder="15"
        hint="Percentage off, between 0 and 100."
        value={values.discountPercent}
        onChange={(e) => setField('discountPercent', e.target.value)}
        error={errors.discountPercent}
        disabled={disabled}
        required
      />

      <LogoUpload
        value={values.logoPath}
        pendingFile={pendingLogo}
        onSelect={onSelectLogo}
        onClear={() => setField('logoPath', null)}
        error={errors.logoPath}
        disabled={disabled}
      />
    </>
  );
}
