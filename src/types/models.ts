import type { MemberRow, MemberStatus, VendorRow } from './database.types';

/**
 * Domain models. The UI speaks these; only the service layer knows about
 * `*Row` database shapes. Renaming a column therefore touches one mapper
 * instead of every component.
 */

export interface Member {
  id: string;
  authUserId: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: MemberStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string | null;
  /** 0-100, or null when the vendor has no standing offer. */
  discountPercent: number | null;
  /** Object path in the `vendor-logos` bucket; resolve with `vendorLogoUrl()`. */
  logoPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
}

export const toMember = (row: MemberRow): Member => ({
  id: row.id,
  authUserId: row.auth_user_id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  status: row.status,
  reviewNote: row.review_note,
  reviewedAt: row.reviewed_at,
  createdAt: row.created_at,
});

export const toVendor = (row: VendorRow): Vendor => ({
  id: row.id,
  name: row.name,
  category: row.category,
  discountPercent: row.discount_percent,
  logoPath: row.logo_path,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export type { MemberStatus, MemberRow, VendorRow };
