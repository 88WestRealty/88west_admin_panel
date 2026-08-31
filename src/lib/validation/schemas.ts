import { z } from 'zod';

/**
 * One source of truth for every form shape. Used by the client for inline
 * validation and re-applied in the service layer before any write, so a
 * bypassed UI cannot push a malformed row past RLS.
 */

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

/**
 * Percentage discount. Held as a string in the form so a half-typed value is
 * never coerced to 0 or NaN mid-keystroke; parsed and range-checked here.
 */
const discountPercent = z
  .string()
  .trim()
  .min(1, 'Discount is required.')
  .transform((value) => Number(value))
  .refine(
    (value) => Number.isInteger(value) && value >= 0 && value <= 100,
    'Enter a whole number between 0 and 100.',
  );

export const vendorSchema = z.object({
  name: z.string().trim().min(1, 'Vendor name is required.').max(160, 'Name is too long.'),
  category: z.string().trim().min(1, 'Category is required.').max(80, 'Category is too long.'),
  discountPercent,
  logoPath: z
    .string({ invalid_type_error: 'A logo is required.' })
    .trim()
    .min(1, 'A logo is required.'),
});

export const reviewSchema = z.object({
  memberId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  note: z.string().trim().max(500, 'Note is too long.').optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type VendorInput = z.infer<typeof vendorSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
