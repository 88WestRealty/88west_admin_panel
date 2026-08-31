'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { ROUTES } from '@/constants';
import { useIsMounted, useSupabase } from '@/hooks';
import { parseForm, loginSchema } from '@/lib/validation';
import { authService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import type { LoginFormValues } from '@/types/common';
import { toAuthMessage } from '@/utils/errors';

/**
 * All login behaviour, so `LoginForm` stays purely presentational.
 *
 * Nothing is persisted. Credentials are held in component state only, so a
 * refresh or a navigation away leaves no trace of them on the machine — which
 * matters on the shared terminals an admin console tends to run on.
 */
export function useLoginForm(redirectTo: Route = ROUTES.members) {
  const client = useSupabase();
  const router = useRouter();
  const isMounted = useIsMounted();
  const setError = useAuthStore((s) => s.setError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(async () => {
    const { values, errors } = parseForm(loginSchema, { email, password });
    setFieldErrors(errors);
    setFormError(null);
    if (!values) return;

    setIsSubmitting(true);
    const result = await authService.signIn(client, values);

    // The router.replace below unmounts this component; without the guard the
    // setState calls after it would target a dead tree.
    if (!isMounted()) return;
    setIsSubmitting(false);

    if (!result.ok) {
      const message = toAuthMessage(result.error);
      setFormError(message);
      setError(message);
      return;
    }

    setPassword('');
    router.replace(redirectTo);
  }, [client, email, isMounted, password, redirectTo, router, setError]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    fieldErrors,
    formError,
    isSubmitting,
    submit,
  };
}
