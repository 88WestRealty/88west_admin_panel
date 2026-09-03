import type { TypedSupabaseClient } from '@/lib/supabase/client';
import { reviewSchema } from '@/lib/validation';
import { err, ok, type Result } from '@/types/common';
import { toMember, type Member, type MemberStatus } from '@/types/models';
import { toAppError } from '@/utils/errors';

const COLUMNS =
  'id, auth_user_id, full_name, email, phone, status, is_active, review_note, reviewed_by, reviewed_at, created_at, updated_at';

/**
 * The verification queue's data access.
 *
 * Rows arrive here from the mobile app: the app calls `auth.signUp()` and then
 * inserts a `members` row with `status = 'pending'`. This module is the admin
 * side of that same table.
 */
export async function fetchMembers(
  client: TypedSupabaseClient,
  status: MemberStatus | 'all' = 'pending',
  signal?: AbortSignal,
): Promise<Result<Member[]>> {
  let query = client.from('members').select(COLUMNS).order('created_at', { ascending: false });
  if (status !== 'all') query = query.eq('status', status);
  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) return err(toAppError(error, 'Unable to load the verification queue.'));
  return ok(data.map(toMember));
}

export interface ReviewArgs {
  memberId: string;
  decision: Extract<MemberStatus, 'approved' | 'rejected'>;
  note?: string;
  reviewerId: string;
}

/**
 * Accept or reject a signup, or revise an earlier decision. The realtime
 * channel broadcasts the result.
 */
export async function reviewMember(
  client: TypedSupabaseClient,
  { memberId, decision, note, reviewerId }: ReviewArgs,
): Promise<Result<Member>> {
  const parsed = reviewSchema.safeParse({ memberId, decision, note });
  if (!parsed.success) return err({ message: 'Invalid review submission.' });

  const { data, error } = await client
    .from('members')
    .update({
      status: parsed.data.decision,
      review_note: parsed.data.note ?? null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    // A decision may be revised at any time — an admin can reject a member
    // they previously approved, or reinstate one they rejected — so this is
    // deliberately not restricted to still-pending rows. The guard instead
    // rejects a no-op: re-applying the decision a row already carries.
    .eq('id', parsed.data.memberId)
    .neq('status', parsed.data.decision)
    .select(COLUMNS)
    .maybeSingle();

  if (error) return err(toAppError(error, 'Unable to record the decision.'));
  if (!data) {
    return err({ message: 'This member already has that status.', code: 'stale' });
  }
  return ok(toMember(data));
}

export async function countPending(client: TypedSupabaseClient): Promise<number> {
  const { count } = await client
    .from('members')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  return count ?? 0;
}

/**
 * Switches a member's access on or off without touching the review decision.
 *
 * Guarded by `.eq('status', 'approved')`: only an approved member can be
 * active, so a request to activate a pending or rejected row matches nothing
 * rather than fighting the database trigger that would reset it anyway.
 */
export async function setMemberActive(
  client: TypedSupabaseClient,
  memberId: string,
  isActive: boolean,
): Promise<Result<Member>> {
  const { data, error } = await client
    .from('members')
    .update({ is_active: isActive })
    .eq('id', memberId)
    .eq('status', 'approved')
    .select(COLUMNS)
    .maybeSingle();

  if (error) return err(toAppError(error, 'Unable to change access.'));
  if (!data) {
    return err({
      message: 'Only an approved member can be made active.',
      code: 'not_approved',
    });
  }
  return ok(toMember(data));
}
