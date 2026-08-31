import type { TypedSupabaseClient } from '@/lib/supabase/client';
import { loginSchema, type LoginInput } from '@/lib/validation';
import { err, ok, type Result } from '@/types/common';
import type { AdminUser } from '@/types/models';
import { toAppError } from '@/utils/errors';

/**
 * Every auth call the app makes. Components never touch `supabase.auth`
 * directly, so session handling stays in one testable place.
 */

export async function signIn(
  client: TypedSupabaseClient,
  input: LoginInput,
): Promise<Result<AdminUser>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return err({ message: 'Check the form and try again.' });

  const { data, error } = await client.auth.signInWithPassword(parsed.data);
  if (error) return err(toAppError(error, 'Unable to sign in.'));
  if (!data.user) return err({ message: 'Sign-in returned no user.' });

  // Authentication is not authorisation: a member from the mobile app has
  // valid credentials but no business in the admin panel.
  const admin = await isAdmin(client);
  if (!admin) {
    await client.auth.signOut();
    return err({ message: 'This account does not have admin access.', code: 'not_admin' });
  }

  return ok({ id: data.user.id, email: data.user.email ?? parsed.data.email });
}

export async function signOut(client: TypedSupabaseClient): Promise<Result<null>> {
  const { error } = await client.auth.signOut();
  return error ? err(toAppError(error, 'Unable to sign out.')) : ok(null);
}

export async function isAdmin(client: TypedSupabaseClient): Promise<boolean> {
  const { data, error } = await client.rpc('is_admin');
  return !error && data === true;
}

export async function getCurrentUser(
  client: TypedSupabaseClient,
): Promise<AdminUser | null> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? '' };
}
