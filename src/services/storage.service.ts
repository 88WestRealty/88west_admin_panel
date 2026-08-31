import type { TypedSupabaseClient } from '@/lib/supabase/client';
import { err, ok, type Result } from '@/types/common';
import { toAppError } from '@/utils/errors';

export const LOGO_BUCKET = 'vendor-logos';
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_LOGO_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const;

/**
 * Client-side guard mirroring the bucket's own constraints. The server is
 * still the authority — this exists so the user gets an instant, specific
 * message instead of waiting for a 413 with an opaque body.
 */
export function validateLogoFile(file: File): string | null {
  if (!ACCEPTED_LOGO_TYPES.includes(file.type as (typeof ACCEPTED_LOGO_TYPES)[number])) {
    return 'Use a PNG, JPG, WebP or SVG image.';
  }
  if (file.size > MAX_LOGO_BYTES) {
    return `Image must be under ${Math.round(MAX_LOGO_BYTES / 1024 / 1024)} MB.`;
  }
  return null;
}

const extensionFor = (file: File): string => {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,4}$/.test(fromName)) return fromName;
  return file.type === 'image/svg+xml' ? 'svg' : 'png';
};

/**
 * Uploads a logo and returns its object path.
 *
 * The filename is randomised rather than derived from the vendor name: two
 * vendors called "Acme" would otherwise collide, and a renamed vendor would
 * strand its old object. `upsert: false` makes an accidental collision fail
 * loudly instead of silently overwriting another vendor's logo.
 */
export async function uploadVendorLogo(
  client: TypedSupabaseClient,
  file: File,
  signal?: AbortSignal,
): Promise<Result<string>> {
  const validationError = validateLogoFile(file);
  if (validationError) return err({ message: validationError });

  const path = `${crypto.randomUUID()}.${extensionFor(file)}`;

  const { data, error } = await client.storage.from(LOGO_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
    ...(signal ? { signal } : {}),
  });

  if (error) return err(toAppError(error, 'Unable to upload the logo.'));
  return ok(data.path);
}

/**
 * Best-effort removal of an orphaned object.
 *
 * Failure is deliberately not surfaced to the user: this runs after the vendor
 * row has already been saved or deleted successfully, and a leftover file in
 * storage is not something they can act on. It is logged for cleanup instead.
 */
export async function removeVendorLogo(
  client: TypedSupabaseClient,
  path: string,
): Promise<void> {
  const { error } = await client.storage.from(LOGO_BUCKET).remove([path]);
  if (error) console.warn('[storage] orphaned vendor logo:', path, error.message);
}

/** Resolves a stored path to a public URL. Returns null for a missing logo. */
export function vendorLogoUrl(
  client: TypedSupabaseClient,
  path: string | null,
): string | null {
  if (!path) return null;
  return client.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
}
