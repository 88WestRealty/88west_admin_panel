import type { TypedSupabaseClient } from '@/lib/supabase/client';
import { vendorSchema } from '@/lib/validation';
import { err, ok, type Result } from '@/types/common';
import { toVendor, type Vendor } from '@/types/models';
import type { VendorFormValues } from '@/types/common';
import { toAppError } from '@/utils/errors';

const COLUMNS = `
  id, name, category, discount_percent, logo_path,
  created_by, created_at, updated_at
`;

/** Maps validated form values onto the row shape. One place, two callers. */
function toRow(values: ReturnType<typeof vendorSchema.parse>) {
  return {
    name: values.name,
    category: values.category,
    discount_percent: values.discountPercent,
    logo_path: values.logoPath,
  };
}

export async function fetchVendors(
  client: TypedSupabaseClient,
  signal?: AbortSignal,
): Promise<Result<Vendor[]>> {
  let query = client.from('vendors').select(COLUMNS).order('name', { ascending: true });
  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) return err(toAppError(error, 'Unable to load vendors.'));
  return ok(data.map(toVendor));
}

export async function createVendor(
  client: TypedSupabaseClient,
  values: VendorFormValues,
  createdBy: string,
): Promise<Result<Vendor>> {
  const parsed = vendorSchema.safeParse(values);
  if (!parsed.success) return err({ message: 'Check the vendor details and try again.' });

  const { data, error } = await client
    .from('vendors')
    .insert({ ...toRow(parsed.data), created_by: createdBy })
    .select(COLUMNS)
    .single();

  if (error) return err(toAppError(error, 'Unable to create the vendor.'));
  return ok(toVendor(data));
}

export async function updateVendor(
  client: TypedSupabaseClient,
  id: string,
  values: VendorFormValues,
): Promise<Result<Vendor>> {
  const parsed = vendorSchema.safeParse(values);
  if (!parsed.success) return err({ message: 'Check the vendor details and try again.' });

  const { data, error } = await client
    .from('vendors')
    .update(toRow(parsed.data))
    .eq('id', id)
    .select(COLUMNS)
    .single();

  if (error) return err(toAppError(error, 'Unable to update the vendor.'));
  return ok(toVendor(data));
}

export async function deleteVendor(
  client: TypedSupabaseClient,
  id: string,
): Promise<Result<string>> {
  const { error } = await client.from('vendors').delete().eq('id', id);
  if (error) return err(toAppError(error, 'Unable to delete the vendor.'));
  return ok(id);
}
