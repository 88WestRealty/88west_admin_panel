/**
 * Hand-maintained mirror of the Postgres schema in
 * `supabase/migrations/0001_init.sql`.
 *
 * In CI this file is regenerated with:
 *   supabase gen types typescript --project-id <id> > src/types/database.types.ts
 * Keeping the shape here means every query in the app is type-checked against
 * the real column set instead of `any`.
 */

export type MemberStatus = 'pending' | 'approved' | 'rejected';

/**
 * Rows are declared as type aliases rather than interfaces: supabase-js
 * constrains every table shape to `Record<string, unknown>`, and an interface
 * has no implicit index signature, so an interface here fails to satisfy
 * `GenericTable` and silently degrades every query to `never`.
 */
export type MemberRow = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: MemberStatus;
  is_active: boolean;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorRow = {
  id: string;
  name: string;
  category: string | null;
  discount_percent: number | null;
  logo_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminUserRow = {
  auth_user_id: string;
  created_at: string;
};

type MemberInsert = Pick<MemberRow, 'auth_user_id' | 'full_name' | 'email'> &
  Partial<Pick<MemberRow, 'phone' | 'status'>>;
type MemberUpdate = Partial<
  Pick<MemberRow, 'status' | 'is_active' | 'review_note' | 'reviewed_by' | 'reviewed_at'>
>;

/** Columns an admin may set. Server-managed columns are deliberately absent. */
type VendorWritable = 'name' | 'category' | 'discount_percent' | 'logo_path';

type VendorInsert = Pick<VendorRow, 'name'> &
  Partial<Pick<VendorRow, VendorWritable | 'created_by'>>;
type VendorUpdate = Partial<Pick<VendorRow, VendorWritable>>;

export type Database = {
  /** Pins the PostgREST dialect supabase-js generates queries for. */
  __InternalSupabase: { PostgrestVersion: '12' };
  public: {
    Tables: {
      members: {
        Row: MemberRow;
        Insert: MemberInsert;
        Update: MemberUpdate;
        Relationships: [];
      };
      vendors: {
        Row: VendorRow;
        Insert: VendorInsert;
        Update: VendorUpdate;
        Relationships: [];
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: Pick<AdminUserRow, 'auth_user_id'>;
        Update: Partial<Pick<AdminUserRow, 'auth_user_id'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: { member_status: MemberStatus };
    CompositeTypes: Record<string, never>;
  };
};
